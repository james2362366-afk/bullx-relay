const express = require('express');
const { WebSocketServer } = require('ws');
const WebSocket = require('ws');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => res.send('BullX Master Server is LIVE! 🚀'));

const server = app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
const wss = new WebSocketServer({ server });

let globalCache = {};

// ===============================
// 🔥 SEND CACHE ON CONNECT
// ===============================
wss.on('connection', (ws) => {
    if (Object.keys(globalCache).length > 0) {
        ws.send(JSON.stringify(globalCache));
    }
});

// ===============================
// 🚀 BROADCAST ENGINE
// ===============================
setInterval(() => {
    if (Object.keys(globalCache).length > 0 && wss.clients.size > 0) {
        const payload = JSON.stringify(globalCache);
        wss.clients.forEach(client => {
            if (client.readyState === 1) client.send(payload);
        });
    }
}, 1000);

// ===============================
// 🟢 BINANCE (CRYPTO - PERFECT)
// ===============================
function startBinanceWS() {
    const binanceWs = new WebSocket('wss://stream.binance.com:9443/ws/!ticker@arr');

    binanceWs.on('message', (data) => {
        try {
            const tickers = JSON.parse(data);
            tickers.forEach(t => {
                const price = Number(t.c);
                const change = Number(t.P);

                if (!isNaN(price)) {
                    globalCache[t.s] = {
                        price: price,
                        change: isNaN(change) ? 0 : change
                    };
                }
            });
        } catch (e) {
            console.log("Binance Parse Error:", e.message);
        }
    });

    binanceWs.on('close', () => setTimeout(startBinanceWS, 2000));
    binanceWs.on('error', (e) => console.log("Binance WS Error:", e.message));
}
startBinanceWS();

// ===============================
// 🎯 TRADINGVIEW (FIXED)
// ===============================
const forexMap = {
    "FX:EURUSD": "EURUSD",
    "FX:GBPUSD": "GBPUSD",
    "FX:USDJPY": "USDJPY",
    "FX:AUDUSD": "AUDUSD",
    "FX:USDCAD": "USDCAD",
    "FX:USDCHF": "USDCHF",
    "FX:NZDUSD": "NZDUSD"
};

const cfdMap = {
    "OANDA:XAUUSD": "XAUUSD",
    "OANDA:XAGUSD": "XAGUSD",
    "TVC:USOIL": "USOIL",
    "TVC:UKOIL": "UKOIL",
    "CAPITALCOM:US500": "SPX500",
    "CAPITALCOM:US100": "NDX100",
    "CAPITALCOM:US30": "US30",
    "TVC:VIX": "VIX",
    "CAPITALCOM:UK100": "UK100",
    "CAPITALCOM:DE40": "GER40"
};

async function fetchTradingView() {
    try {
        const [resForex, resCfd] = await Promise.all([
            axios.post('https://scanner.tradingview.com/forex/scan', {
                symbols: { tickers: Object.keys(forexMap) },
                columns: ["close", "change"]
            }),
            axios.post('https://scanner.tradingview.com/cfd/scan', {
                symbols: { tickers: Object.keys(cfdMap) },
                columns: ["close", "change"]
            })
        ]);

        // FOREX
        if (resForex.data?.data) {
            resForex.data.data.forEach(item => {
                const sym = forexMap[item.s];
                if (sym && item.d && item.d[0] != null) {
                    const price = Number(item.d[0]);
                    const change = Number(item.d[1]);

                    if (!isNaN(price)) {
                        globalCache[sym] = {
                            price: price,
                            change: isNaN(change) ? 0 : change
                        };
                    }
                }
            });
        }

        // CFD
        if (resCfd.data?.data) {
            resCfd.data.data.forEach(item => {
                const sym = cfdMap[item.s];
                if (sym && item.d && item.d[0] != null) {
                    const price = Number(item.d[0]);
                    const change = Number(item.d[1]);

                    if (!isNaN(price)) {
                        globalCache[sym] = {
                            price: price,
                            change: isNaN(change) ? 0 : change
                        };
                    }
                }
            });
        }

    } catch (e) {
        console.log("TradingView Error:", e.message);
    }
}

// 🔥 interval slow kiya (block avoid)
setInterval(fetchTradingView, 5000);

// ===============================
// 🌟 FINNHUB (STOCKS - FIXED)
// ===============================
const FINNHUB_KEY = "YOUR_API_KEY"; // 🔥 apna key daal
const stocks = ["AAPL","MSFT","NVDA","TSLA","AMZN","META","GOOGL","NFLX","AMD","INTC","COIN","MSTR"];
let stockIdx = 0;

async function fetchStocks() {
    try {
        const symbol = stocks[stockIdx];
        const res = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`);

        if (res.data && res.data.c != null) {
            const price = Number(res.data.c);
            const change = Number(res.data.dp);

            if (!isNaN(price)) {
                globalCache[symbol] = {
                    price: price,
                    change: isNaN(change) ? 0 : change
                };
            }
        }

    } catch (e) {
        console.log("Finnhub Error:", e.message);
    } finally {
        stockIdx = (stockIdx + 1) % stocks.length;
    }
}

// 🔥 rate safe
setInterval(fetchStocks, 2000);

// ===============================
// 🛑 ANTI-SLEEP (Render)
// ===============================
setInterval(() => {
    axios.get('https://bullx-relay.onrender.com').catch(() => {});
}, 240000);