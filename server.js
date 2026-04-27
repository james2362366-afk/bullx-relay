const express = require('express');
const { WebSocketServer } = require('ws');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 8080;

// 🔥 CORS ERROR BYPASS (तेरा सर्वर खुद वेब ऐप को अलाउ करेगा)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.get('/', (req, res) => {
    res.send('BullX Quad-Engine Server is LIVE! 🚀 (Zero Delay Edition)');
});

// 🚀 NEW: DIRECT API FOR FLUTTER FRONTEND (No corsproxy needed anymore!)
app.get('/api/data', (req, res) => {
    res.json(globalCache);
});

const server = app.listen(port, () => {
    console.log(`🚀 BullX Master Server running on port ${port}`);
});

const wss = new WebSocketServer({ server });

let globalCache = {};
let connectedClients = 0;

wss.on('connection', (ws) => {
    connectedClients++;
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
// 🟢 ENGINE 1: BINANCE VISION (Bypasses Render IP Blocks)
// ============================================================================
async function fetchCrypto() {
    try {
        // 🔥 Binance Vision API (Never Blocks Cloud IPs)
        const res = await axios.get('https://data-api.binance.vision/api/v3/ticker/24hr');
        res.data.forEach(coin => {
            globalCache[coin.symbol] = {
                price: parseFloat(coin.lastPrice),
                change: parseFloat(coin.priceChangePercent)
            };
        });
        broadcast();
    } catch (e) {
        console.log("⚠️ Vision API Error, Trying Fallback...");
        try {
            const fallback = await axios.get('https://api1.binance.com/api/v3/ticker/24hr');
            fallback.data.forEach(coin => {
                globalCache[coin.symbol] = { price: parseFloat(coin.lastPrice), change: parseFloat(coin.priceChangePercent) };
            });
            broadcast();
        } catch(e2) { console.log("❌ All Crypto APIs Failed"); }
    }
}

// ============================================================================
// 🌟 ENGINE 2: FINNHUB (US STOCKS)
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
// 🔥 ENGINE 3: TWELVE DATA (FOREX & GOLD)
// ============================================================================
const tdKeys = ["4889b07c8f1b4b53813b93584de81302", "ec68e93899bb498fabc8d50ab43ffb6a", "574d5d034591482e9b244670fbf2fb8a", "a60313621cd34e3db6ee2f81ef6f8044"];
let tdKIdx = 0; let tdAIdx = 0;
const tdAssets = [{ s: "EURUSD", a: "EUR/USD" }, { s: "GBPUSD", a: "GBP/USD" }, { s: "USDJPY", a: "USD/JPY" }, { s: "AUDUSD", a: "AUD/USD" }, { s: "XAUUSD", a: "XAU/USD" }];

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
// 🎯 ENGINE 4: YAHOO FINANCE (SILVER, OIL, INDICES)
// ============================================================================
const yahooMap = [{ s: "XAGUSD", y: "SI=F" }, { s: "USOIL", y: "CL=F" }, { s: "UKOIL", y: "BZ=F" }, { s: "SPX500", y: "^GSPC" }, { s: "NDX100", y: "^IXIC" }, { s: "US30", y: "^DJI" }, { s: "VIX", y: "^VIX" }];

async function fetchYahoo() {
    const symbolsStr = yahooMap.map(x => x.y).join(',');
    try {
        const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsStr}`;
        const res = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
        res.data.quoteResponse.result.forEach(item => {
            const match = yahooMap.find(x => x.y === item.symbol);
            if (match) globalCache[match.s] = { price: parseFloat(item.regularMarketPrice || 0), change: parseFloat(item.regularMarketChangePercent || 0) };
        });
        broadcast();
    } catch (e) {}
}

setInterval(fetchCrypto, 1500);
setInterval(fetchStocks, 1200);
setInterval(fetchTwelveData, 1800);
setInterval(fetchYahoo, 3000);

setInterval(() => { axios.get('https://bullx-relay.onrender.com').catch(() => {}); }, 240000);

fetchCrypto(); setTimeout(fetchStocks, 500); setTimeout(fetchTwelveData, 1000); setTimeout(fetchYahoo, 1500);