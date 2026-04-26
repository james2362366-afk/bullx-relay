const express = require('express');
const { WebSocketServer } = require('ws');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.send('BullX Quad-Engine Server is LIVE! 🚀 (Zero Delay Edition)');
});

const server = app.listen(port, () => {
    console.log(`🚀 BullX Master Server running on port ${port}`);
});

const wss = new WebSocketServer({ server });

let globalCache = {};
let connectedClients = 0;

wss.on('connection', (ws) => {
    connectedClients++;
    // कनेक्ट होते ही तुरंत सारा डेटा भेज दो
    if (Object.keys(globalCache).length > 0) ws.send(JSON.stringify(globalCache));
    ws.on('close', () => { connectedClients--; });
});

function broadcast() {
    if (Object.keys(globalCache).length > 0 && connectedClients > 0) {
        const payload = JSON.stringify(globalCache);
        wss.clients.forEach((client) => { if (client.readyState === 1) client.send(payload); });
    }
}

// ============================================================================
// 🟢 ENGINE 1: BINANCE (CRYPTO - 1.5 Seconds)
// ============================================================================
async function fetchCrypto() {
    try {
        const res = await axios.get('https://api.binance.com/api/v3/ticker/24hr');
        res.data.forEach(coin => {
            globalCache[coin.symbol] = {
                price: parseFloat(coin.lastPrice),
                change: parseFloat(coin.priceChangePercent)
            };
        });
        broadcast();
    } catch (e) { console.log("⚠️ Binance Sync Error"); }
}

// ============================================================================
// 🌟 ENGINE 2: FINNHUB (US STOCKS - 1.2 Seconds)
// ============================================================================
const FINNHUB_KEY = "d7n3sspr01qppri3f170d7n3sspr01qppri3f17g";
const stocks = ["AAPL","MSFT","NVDA","TSLA","AMZN","META","GOOGL","NFLX","AMD","INTC","COIN","MSTR"];
let stockIdx = 0;

async function fetchStocks() {
    const symbol = stocks[stockIdx];
    try {
        const res = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`);
        if (res.data.c) {
            globalCache[symbol] = { price: parseFloat(res.data.c), change: parseFloat(res.data.dp || 0) };
            broadcast();
        }
    } catch (e) {}
    finally { stockIdx = (stockIdx + 1) % stocks.length; }
}

// ============================================================================
// 🔥 ENGINE 3: TWELVE DATA (FOREX & GOLD - 8 KEYS ROTATION)
// ============================================================================
const tdKeys = [
    "4889b07c8f1b4b53813b93584de81302", "ec68e93899bb498fabc8d50ab43ffb6a",
    "574d5d034591482e9b244670fbf2fb8a", "a60313621cd34e3db6ee2f81ef6f8044",
    "3b7656b7aa5a41e88ac386fd66e0031b", "e242a4be64404336a644dca4386f35ea",
    "500fb6eeb4a94e9a8d92be7b2f1b4872", "ffdf5fe164c446318e975387c354d295"
];
let tdKIdx = 0; let tdAIdx = 0;
const tdAssets = [
    { s: "EURUSD", a: "EUR/USD" }, { s: "GBPUSD", a: "GBP/USD" }, { s: "USDJPY", a: "USD/JPY" },
    { s: "AUDUSD", a: "AUD/USD" }, { s: "USDCAD", a: "USD/CAD" }, { s: "USDCHF", a: "USD/CHF" },
    { s: "NZDUSD", a: "NZD/USD" }, { s: "XAUUSD", a: "XAU/USD" }
];

async function fetchTwelveData() {
    const asset = tdAssets[tdAIdx];
    try {
        const res = await axios.get(`https://api.twelvedata.com/quote?symbol=${asset.a}&apikey=${tdKeys[tdKIdx]}`);
        if (res.data.close) {
            globalCache[asset.s] = { price: parseFloat(res.data.close), change: parseFloat(res.data.percent_change || 0) };
            broadcast();
        }
    } catch (e) {}
    finally {
        tdAIdx = (tdAIdx + 1) % tdAssets.length;
        tdKIdx = (tdKIdx + 1) % tdKeys.length;
    }
}

// ============================================================================
// 🎯 ENGINE 4: YAHOO FINANCE (SILVER, OIL, INDICES - 3 Seconds Batch Fetch)
// ============================================================================
const yahooMap = [
    { s: "XAGUSD", y: "SI=F" },     // Silver
    { s: "USOIL", y: "CL=F" },      // WTI Oil
    { s: "UKOIL", y: "BZ=F" },      // Brent Oil
    { s: "SPX500", y: "^GSPC" },    // S&P 500
    { s: "NDX100", y: "^IXIC" },    // NASDAQ
    { s: "US30", y: "^DJI" },       // Dow Jones
    { s: "VIX", y: "^VIX" },        // Volatility Index
    { s: "UK100", y: "^FTSE" },     // FTSE
    { s: "GER40", y: "^GDAXI" }     // DAX
];

async function fetchYahoo() {
    const symbolsStr = yahooMap.map(x => x.y).join(',');
    try {
        const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsStr}`;
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const data = res.data.quoteResponse.result;

        data.forEach(item => {
            const match = yahooMap.find(x => x.y === item.symbol);
            if (match) {
                globalCache[match.s] = {
                    price: parseFloat(item.regularMarketPrice || 0),
                    change: parseFloat(item.regularMarketChangePercent || 0)
                };
            }
        });
        broadcast();
    } catch (e) {}
}

// 🚀 RUN ALL 4 ENGINES AT FULL SPEED
setInterval(fetchCrypto, 1500);
setInterval(fetchStocks, 1200);
setInterval(fetchTwelveData, 1800);
setInterval(fetchYahoo, 3000); // Yahoo batched every 3 seconds

// 🚀 ANTI-SLEEP PING (ताकि Render कभी सोए ना)
setInterval(() => {
    axios.get('https://bullx-relay.onrender.com').catch(() => {});
}, 240000);

fetchCrypto();
setTimeout(fetchStocks, 500);
setTimeout(fetchTwelveData, 1000);
setTimeout(fetchYahoo, 1500);