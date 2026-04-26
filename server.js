const express = require('express');
const { WebSocketServer } = require('ws');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.send('BullX Ultra Relay is LIVE! 🚀 (100% Perfect Match Edition)');
});

const server = app.listen(port, () => {
    console.log(`🚀 BullX Ultra Server running on port ${port}`);
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
// 🚀 ENGINE 1: BINANCE (Crypto - 100% Match, Superfast)
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
    } catch (e) { console.log("⚠️ Binance Sync Delayed"); }
}

// ============================================================================
// 🌟 ENGINE 2: FINNHUB (50 Premium US Stocks - 100% Match)
// ============================================================================
const FINNHUB_KEY = "d7n3sspr01qppri3f170d7n3sspr01qppri3f17g";
const stocks = ["AAPL","MSFT","NVDA","TSLA","AMZN","META","GOOGL","NFLX","AMD","INTC","PLTR","COIN","MSTR","ARM","SMCI","QCOM","AVGO","CRM","ADBE","ORCL","IBM","CSCO","UBER","ABNB","V","MA","PYPL","SQ","JPM","BAC","GS","WMT","COST","HD","NKE","KO","PEP","MCD","SBUX","DIS","BA","CAT","GE","F","GM","XOM","CVX","JNJ","PFE","LLY"];
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
// 🔥 ENGINE 3: TWELVE DATA (Pure Forex, Major Metals, Global Indices)
// ============================================================================
const tdKeys = [
    "4889b07c8f1b4b53813b93584de81302", "ec68e93899bb498fabc8d50ab43ffb6a",
    "574d5d034591482e9b244670fbf2fb8a", "a60313621cd34e3db6ee2f81ef6f8044",
    "3b7656b7aa5a41e88ac386fd66e0031b", "e242a4be64404336a644dca4386f35ea",
    "500fb6eeb4a94e9a8d92be7b2f1b4872", "ffdf5fe164c446318e975387c354d295"
];
let tdKIdx = 0;
let tdAIdx = 0;

// 🧹 Cleaned & Filtered List: Sirf 100% Reliable Data!
const tdAssets = [
    // All 50 Forex (Very Reliable)
    { s: "EURUSD", a: "EUR/USD" }, { s: "GBPUSD", a: "GBP/USD" }, { s: "USDJPY", a: "USD/JPY" }, { s: "AUDUSD", a: "AUD/USD" }, { s: "USDCAD", a: "USD/CAD" }, { s: "USDCHF", a: "USD/CHF" }, { s: "NZDUSD", a: "NZD/USD" }, { s: "EURJPY", a: "EUR/JPY" }, { s: "EURGBP", a: "EUR/GBP" }, { s: "EURAUD", a: "EUR/AUD" }, { s: "EURCAD", a: "EUR/CAD" }, { s: "EURCHF", a: "EUR/CHF" }, { s: "EURNZD", a: "EUR/NZD" }, { s: "GBPJPY", a: "GBP/JPY" }, { s: "GBPAUD", a: "GBP/AUD" }, { s: "GBPCAD", a: "GBP/CAD" }, { s: "GBPCHF", a: "GBP/CHF" }, { s: "GBPNZD", a: "GBP/NZD" }, { s: "AUDJPY", a: "AUD/JPY" }, { s: "AUDCAD", a: "AUD/CAD" }, { s: "AUDCHF", a: "AUD/CHF" }, { s: "AUDNZD", a: "AUD/NZD" }, { s: "CADJPY", a: "CAD/JPY" }, { s: "CADCHF", a: "CAD/CHF" }, { s: "CHFJPY", a: "CHF/JPY" }, { s: "NZDJPY", a: "NZD/JPY" }, { s: "NZDCAD", a: "NZD/CAD" }, { s: "NZDCHF", a: "NZD/CHF" }, { s: "USDZAR", a: "USD/ZAR" }, { s: "USDMXN", a: "USD/MXN" }, { s: "USDTRY", a: "USD/TRY" }, { s: "USDSEK", a: "USD/SEK" }, { s: "USDNOK", a: "USD/NOK" }, { s: "USDDKK", a: "USD/DKK" }, { s: "USDHKD", a: "USD/HKD" }, { s: "USDSGD", a: "USD/SGD" }, { s: "USDCNH", a: "USD/CNH" }, { s: "USDINR", a: "USD/INR" }, { s: "USDKRW", a: "USD/KRW" }, { s: "USDTHB", a: "USD/THB" }, { s: "USDIDR", a: "USD/IDR" }, { s: "USDPLN", a: "USD/PLN" }, { s: "USDBRL", a: "USD/BRL" }, { s: "USDHUF", a: "USD/HUF" }, { s: "USDCZK", a: "USD/CZK" }, { s: "USDCLP", a: "USD/CLP" }, { s: "USDILS", a: "USD/ILS" }, { s: "USDCOP", a: "USD/COP" }, { s: "USDPEN", a: "USD/PEN" }, { s: "USDTWD", a: "USD/TWD" },

    // Core Premium Metals & Energy (Reliable)
    { s: "XAUUSD", a: "XAU/USD" }, { s: "XAGUSD", a: "XAG/USD" }, { s: "XPTUSD", a: "XPT/USD" }, { s: "XPDUSD", a: "XPD/USD" }, { s: "COPPER", a: "HG" }, { s: "USOIL", a: "CL" }, { s: "UKOIL", a: "LCO" }, { s: "NATGAS", a: "NG" },

    // Major Global Indices (Reliable)
    { s: "SPX500", a: "SPX" }, { s: "NDX100", a: "NDX" }, { s: "US30", a: "DJI" }, { s: "VIX", a: "VIX" }, { s: "RUT2000", a: "RUT" }, { s: "UK100", a: "FTSE" }, { s: "GER40", a: "DAX" }, { s: "JPN225", a: "NI225" }, { s: "HK50", a: "HSI" }
];

async function fetchTwelveData() {
    const asset = tdAssets[tdAIdx];
    try {
        const res = await axios.get(`https://api.twelvedata.com/quote?symbol=${asset.a}&apikey=${tdKeys[tdKIdx]}`);
        if (res.data.close) {
            globalCache[asset.s] = { price: parseFloat(res.data.close), change: parseFloat(res.data.percent_change || 0) };
            broadcast();
            console.log(`💎 Premium Sync [Key ${tdKIdx + 1}]: ${asset.s}`);
        }
    } catch (e) {}
    finally {
        tdAIdx = (tdAIdx + 1) % tdAssets.length;
        tdKIdx = (tdKIdx + 1) % tdKeys.length;
    }
}

// 🚀 RUN ALL ENGINES
setInterval(fetchCrypto, 1500);
setInterval(fetchStocks, 1200);
setInterval(fetchTwelveData, 1800);

fetchCrypto();
setTimeout(fetchStocks, 1000);
setTimeout(fetchTwelveData, 2000);