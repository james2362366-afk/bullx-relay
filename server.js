const express = require('express');
const { WebSocketServer } = require('ws');
const WebSocket = require('ws'); // 🔥 Binance के लाइव सॉकेट के लिए
const axios = require('axios');

const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => res.send('BullX Master Server is LIVE! 🚀'));

const server = app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
const wss = new WebSocketServer({ server });

let globalCache = {};

// जब भी कोई ऐप खुले, उसे तुरंत कैशे भेज दो
wss.on('connection', (ws) => {
    if (Object.keys(globalCache).length > 0) ws.send(JSON.stringify(globalCache));
});

// 🚀 BROADCAST ENGINE: ऐप को क्रैश होने से बचाने के लिए हर 1 सेकंड में सारा भाव एक साथ भेजेंगे
setInterval(() => {
    if (Object.keys(globalCache).length > 0 && wss.clients.size > 0) {
        const payload = JSON.stringify(globalCache);
        wss.clients.forEach(client => {
            if (client.readyState === 1) client.send(payload);
        });
    }
}, 1000);

// ============================================================================
// 🟢 ENGINE 1: BINANCE DIRECT WEBSOCKET (0% Delay, 0% IP Block)
// ============================================================================
function startBinanceWS() {
    const binanceWs = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');

    binanceWs.on('message', (data) => {
        try {
            const tickers = JSON.parse(data);
            tickers.forEach(t => {
                // t.s = symbol, t.c = last price, t.P = price change percent
                globalCache[t.s] = { price: parseFloat(t.c), change: parseFloat(t.P) };
            });
        } catch (e) {}
    });

    binanceWs.on('close', () => setTimeout(startBinanceWS, 2000));
    binanceWs.on('error', () => {});
}
startBinanceWS();

// ============================================================================
// 🎯 ENGINE 2: TRADINGVIEW (FOREX, METALS, INDICES) - अलग-अलग स्कैनर
// ============================================================================
const forexMap = {
    "FX:EURUSD": "EURUSD", "FX:GBPUSD": "GBPUSD", "FX:USDJPY": "USDJPY",
    "FX:AUDUSD": "AUDUSD", "FX:USDCAD": "USDCAD", "FX:USDCHF": "USDCHF", "FX:NZDUSD": "NZDUSD"
};

const cfdMap = {
    "OANDA:XAUUSD": "XAUUSD", "OANDA:XAGUSD": "XAGUSD", "TVC:USOIL": "USOIL", "TVC:UKOIL": "UKOIL",
    "CAPITALCOM:US500": "SPX500", "CAPITALCOM:US100": "NDX100", "CAPITALCOM:US30": "US30",
    "TVC:VIX": "VIX", "CAPITALCOM:UK100": "UK100", "CAPITALCOM:DE40": "GER40"
};

async function fetchTradingView() {
    try {
        const [resForex, resCfd] = await Promise.all([
            axios.post('https://scanner.tradingview.com/forex/scan', { symbols: { tickers: Object.keys(forexMap) }, columns: ["close", "change"] }),
            axios.post('https://scanner.tradingview.com/cfd/scan', { symbols: { tickers: Object.keys(cfdMap) }, columns: ["close", "change"] })
        ]);

        if (resForex.data && resForex.data.data) {
            resForex.data.data.forEach(item => {
                const sym = forexMap[item.s];
                if (sym && item.d) globalCache[sym] = { price: parseFloat(item.d[0]), change: parseFloat(item.d[1]) };
            });
        }
        if (resCfd.data && resCfd.data.data) {
            resCfd.data.data.forEach(item => {
                const sym = cfdMap[item.s];
                if (sym && item.d) globalCache[sym] = { price: parseFloat(item.d[0]), change: parseFloat(item.d[1]) };
            });
        }
    } catch (e) {}
}
setInterval(fetchTradingView, 2000);

// ============================================================================
// 🌟 ENGINE 3: FINNHUB (US STOCKS)
// ============================================================================
const FINNHUB_KEY = "d7n3sspr01qppri3f170d7n3sspr01qppri3f17g";
const stocks = ["AAPL","MSFT","NVDA","TSLA","AMZN","META","GOOGL","NFLX","AMD","INTC","COIN","MSTR"];
let stockIdx = 0;

async function fetchStocks() {
    try {
        const symbol = stocks[stockIdx];
        const res = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`);
        if (res.data.c) globalCache[symbol] = { price: parseFloat(res.data.c), change: parseFloat(res.data.dp || 0) };
    } catch (e) {}
    finally { stockIdx = (stockIdx + 1) % stocks.length; }
}
setInterval(fetchStocks, 1200);

// 🚀 ANTI-SLEEP PING
setInterval(() => { axios.get('https://bullx-relay.onrender.com').catch(() => {}); }, 240000);