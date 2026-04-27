const express = require('express');
const { WebSocketServer } = require('ws');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 8080;

// 🔥 CORS ERROR BYPASS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.get('/', (req, res) => {
    res.send('BullX Quad-Engine Server is LIVE! 🚀 (Zero Delay Edition)');
});

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
// 🟢 ENGINE 1: MEXC CRYPTO (Superfast, No Blocks)
// ============================================================================
async function fetchCrypto() {
    try {
        const res = await axios.get('https://api.mexc.com/api/v3/ticker/24hr');
        res.data.forEach(coin => {
            globalCache[coin.symbol] = {
                price: parseFloat(coin.lastPrice),
                change: parseFloat(coin.priceChangePercent) * 100
            };
        });
        broadcast();
    } catch (e) {}
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
// 🎯 ENGINE 3: TRADINGVIEW SCANNER (FOREX, METALS, INDICES) - NO BLOCKS! 🚀
// ============================================================================
const tvMap = {
    // Forex
    "OANDA:EURUSD": "EURUSD", "OANDA:GBPUSD": "GBPUSD", "OANDA:USDJPY": "USDJPY",
    "OANDA:AUDUSD": "AUDUSD", "OANDA:USDCAD": "USDCAD", "OANDA:USDCHF": "USDCHF", "OANDA:NZDUSD": "NZDUSD",
    // Metals & Oil
    "OANDA:XAUUSD": "XAUUSD", "OANDA:XAGUSD": "XAGUSD", "TVC:USOIL": "USOIL", "TVC:UKOIL": "UKOIL",
    // Indices
    "CAPITALCOM:US500": "SPX500", "CAPITALCOM:US100": "NDX100", "CAPITALCOM:US30": "US30",
    "TVC:VIX": "VIX", "CAPITALCOM:UK100": "UK100", "CAPITALCOM:DE40": "GER40"
};

async function fetchTradingView() {
    try {
        const res = await axios.post('https://scanner.tradingview.com/global/scan', {
            "symbols": { "tickers": Object.keys(tvMap) },
            "columns": ["close", "change"]
        });

        if (res.data && res.data.data) {
            res.data.data.forEach(item => {
                const symbol = tvMap[item.s];
                if (symbol && item.d && item.d.length >= 2) {
                    globalCache[symbol] = {
                        price: parseFloat(item.d[0] || 0),
                        change: parseFloat(item.d[1] || 0)
                    };
                }
            });
            broadcast();
        }
    } catch (e) { console.log("⚠️ TV Sync Error"); }
}

// 🚀 RUN ENGINES
setInterval(fetchCrypto, 1500);
setInterval(fetchStocks, 1200);
setInterval(fetchTradingView, 2000); // 🚀 TV Engine fetches everything every 2 seconds

// 🚀 ANTI-SLEEP PING
setInterval(() => {
    axios.get('https://bullx-relay.onrender.com').catch(() => {});
}, 240000);

fetchCrypto(); setTimeout(fetchStocks, 500); setTimeout(fetchTradingView, 1000);