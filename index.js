require('dotenv').config();
const axios = require('axios');
const Mailjet = require('node-mailjet');
const fs = require('fs');
const path = require('path');

const TAX_RATE = Number(process.env.TAX_RATE); // 24

const ASSET_LIST = [
  { symbol: 'AVAX', high: 29, low: 22, entry: 25.49, sellLimit: 29, shares: 3.99870057 },
  { symbol: 'DOT', high: 5.50, low: 3, entry: 3.873, sellLimit: 4.8, shares: 12.99331849 },
  { symbol: 'UNI', high: 10.0, low: 8, entry: 0, sellLimit: 0, shares: 0 },
  { symbol: 'ADA', high: .35, low: .33, entry: .33, sellLimit: .36, shares: 1 },
];

const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;

const mailjet = Mailjet.apiConnect(
  process.env.MAILJET_API_KEY,
  process.env.MAILJET_SECRET_KEY
);

const MAILJET_FROM_EMAIL = process.env.MAILJET_FROM_EMAIL;
const MAILJET_FROM_NAME = process.env.MAILJET_FROM_NAME;
const MAILJET_TO_EMAIL = process.env.MAILJET_TO_EMAIL;
const MAILJET_TO_NAME = process.env.MAILJET_TO_NAME;

const sendTradeNotification = (asset, price, action) => {
  const subject = `Trade Recommendation: ${action.toUpperCase()} ${asset.symbol}`;
  const textPart = `Trade Recommendation: ${action.toUpperCase()} ${asset.symbol} at ${price}.`;
  const htmlPart = `<h3>${asset.symbol} - ${action.toUpperCase()}</h3>
    <h4>current price: ${price}</h4>
    <p>LOW: ${asset.low}</p>
    <p>HIGH: ${asset.high}.</p>`;

  mailjet
    .post('send', { version: 'v3.1' })
    .request({
      Messages: [
        {
          From: { Email: MAILJET_FROM_EMAIL, Name: MAILJET_FROM_NAME },
          To: [{ Email: MAILJET_TO_EMAIL, Name: MAILJET_TO_NAME }],
          Subject: subject,
          TextPart: textPart,
          HTMLPart: htmlPart,
        },
      ],
    })
    .then((result) => console.log(`ALERT SENT: ${result.body.Messages[0].To[0].Email} - ${new Date()}`))
    .catch((err) => console.log(err.statusCode));
};

const fetchCurrentAssetData = async (symbol) => {
  const LATEST_PRICE_API_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';
  try {
    const response = await axios.get(LATEST_PRICE_API_URL, {
      headers: {
        'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY,
        'Accept': 'application/json',
      },
      params: { symbol },
    });
    // return Number(response.data.data[symbol].quote.USD.price ?? 0);
    return response.data.data[symbol]; // Return the entire data object for the symbol
    /*

    {
     id: 5805,
     name: 'Avalanche',
     symbol: 'AVAX',
     slug: 'avalanche',
     num_market_pairs: 796,
     date_added: '2020-07-13T00:00:00.000Z',
     tags: [
       'defi',
       'smart-contracts',
       'three-arrows-capital-portfolio',
       'polychain-capital-portfolio',
       'avalanche-ecosystem',
       'cms-holdings-portfolio',
       'dragonfly-capital-portfolio',
       'real-world-assets',
       'layer-1'
     ],
     max_supply: 715748719,
     circulating_supply: 407095358.7405858,
     total_supply: 447098458.7405858,
     is_active: 1,
     infinite_supply: false,
     platform: null,
     cmc_rank: 13,
     is_fiat: 0,
     self_reported_circulating_supply: null,
     self_reported_market_cap: null,
     tvl_ratio: null,
     last_updated: '2024-10-30T21:37:00.000Z',
     quote: {
       USD: {
         price: 26.261409930816203,
         volume_24h: 245819804.54966748,
         volume_change_24h: -15.8572,
         percent_change_1h: -0.00456268,
         percent_change_24h: -1.38814989,
         percent_change_7d: -1.34416107,
         percent_change_30d: -6.86169753,
         percent_change_60d: 15.41194715,
         percent_change_90d: 3.12103704,
         market_cap: 10690898096.819204,
         market_cap_dominance: 0.4399,
         fully_diluted_market_cap: 18796570517.12,
         tvl: null,
         last_updated: '2024-10-30T21:37:00.000Z'
       }
     }

    */
  } catch (error) {
    console.error('Error fetching latest data:', error);
    console.log('symbol: ', symbol);
    return null;
  }
};

const appendToFile = (symbol, data) => {
  const filePath = path.join(__dirname, `${symbol}_price_history.json`);
  const fileData = getFileContents(symbol);
  fileData.push(data);
  fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2));
};

const getFileContents = (symbol) => {
  const filePath = path.join(__dirname, `${symbol}_price_history.json`);
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : [];
};

const deleteOldEntries = (symbol) => {
  const DAYS_TO_DELETE = 30; // Set this to '14' or '30' as needed
  const filePath = path.join(__dirname, `${symbol}_price_history.json`);
  if (fs.existsSync(filePath)) {
    const daysAgo = Date.now() - (DAYS_TO_DELETE * 24 * 60 * 60 * 1000);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const filteredData = data.filter(entry => entry.date >= daysAgo);
    fs.writeFileSync(filePath, JSON.stringify(filteredData, null, 2));
    console.log(`deleted old entries from ${symbol} (${DAYS_TO_DELETE} days)`);
  }
};

const getAndProcessAssetPriceData = async (symbol) => {
  const currentData = await fetchCurrentAssetData(symbol);
  if (currentData !== null) {

    const price = Number(currentData.quote.USD.price ?? 0);
    const volume_24h = Number(currentData.quote.USD.volume_24h ?? 0);
    const volume_change_24h = Number(currentData.quote.USD.volume_change_24h ?? 0);
    const percent_change_1h = Number(currentData.quote.USD.percent_change_1h ?? 0);
    const percent_change_24h = Number(currentData.quote.USD.percent_change_24h ?? 0);
    const percent_change_7d = Number(currentData.quote.USD.percent_change_7d ?? 0);
    const percent_change_30d = Number(currentData.quote.USD.percent_change_30d ?? 0);
    const percent_change_60d = Number(currentData.quote.USD.percent_change_60d ?? 0);
    const percent_change_90d = Number(currentData.quote.USD.percent_change_90d ?? 0);
    const market_cap = Number(currentData.quote.USD.market_cap ?? 0);
    // console.log({currentData, price})

    return {
      symbol,
      price,
      volume_24h,
      volume_change_24h,
      percent_change_1h,
      percent_change_24h,
      percent_change_7d,
      percent_change_30d,
      percent_change_60d,
      percent_change_90d,
      market_cap,
      date: Date.now(),
    };
  }
};

const calculateRSI = (symbol) => {
  const data = getFileContents(symbol);
  const fourteenDaysAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
  const recentData = data.filter(entry => entry.date >= fourteenDaysAgo);

  if (recentData.length < 2) {
    console.log(`Not enough data to calculate RSI for ${symbol}`);
    return;
  }

  const { gains, losses } = recentData.slice(1).reduce((acc, entry, i) => {
    const change = entry.price - recentData[i].price;
    if (change > 0) {
      acc.gains += change;
    } else {
      acc.losses -= change;
    }
    return acc;
  }, { gains: 0, losses: 0 });

  const averageGain = gains / recentData.length;
  const averageLoss = losses / recentData.length;
  const rs = averageGain / averageLoss;
  const rsi = 100 - (100 / (1 + rs));

  const overboughtOrOversold = rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : 'neutral';

  // console.log(`RSI for ${symbol}: ${rsi.toFixed(2)}, Status: ${overboughtOrOversold}`);
  return { rsi: rsi.toFixed(2), overbought_or_oversold: overboughtOrOversold };
};

// simple moving average
const calculateSMA = (symbol, period = 14) => {
  const data = getFileContents(symbol);
  if (data.length < period) {
    console.log(`Not enough data to calculate SMA for ${symbol}`);
    return;
  }

  const recentData = data.slice(-period);
  const sum = recentData.reduce((acc, entry) => acc + entry.price, 0);
  const sma = sum / period;
  // console.log(`SMA for ${symbol} over ${period} days: ${sma.toFixed(2)}`);
  return sma.toFixed(2);
};

// exponentional moving average
const calculateEMA = (symbol, period = 14) => {
  const data = getFileContents(symbol);
  if (data.length < period) {
    console.log(`Not enough data to calculate EMA for ${symbol}`);
    return;
  }

  const k = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((acc, entry) => acc + entry.price, 0) / period;

  for (let i = period; i < data.length; i++) {
    ema = data[i].price * k + ema * (1 - k);
  }
  // console.log(`EMA for ${symbol} over ${period} days: ${ema.toFixed(2)}`);
  return ema.toFixed(2);
};

const calculateCurrentProfit = (entryPrice, currentPrice, taxRate, shares) => {
  const grossProfitPerShare = currentPrice - entryPrice;
  const totalGrossProfit = grossProfitPerShare * shares;
  const currentTaxOwed = totalGrossProfit * (taxRate / 100);
  const currentNetProfit = totalGrossProfit - currentTaxOwed;
  const currentRealizedProfitsPercentage = (grossProfitPerShare / entryPrice) * 100;
  return { currentNetProfit, currentTaxOwed, currentRealizedProfitsPercentage };
};

const calculateProfitAtSellLimit = (entryPrice, sellLimitPrice, taxRate, shares) => {
  const grossProfitPerShare = sellLimitPrice - entryPrice;
  const totalGrossProfit = grossProfitPerShare * shares;
  const sellLimitTaxOwed = totalGrossProfit * (taxRate / 100);
  const sellLimitNetProfit = totalGrossProfit - sellLimitTaxOwed;
  const sellLimitRealizedProfitsPercentage = (grossProfitPerShare / entryPrice) * 100;
  return { sellLimitNetProfit, sellLimitTaxOwed, sellLimitRealizedProfitsPercentage };
};


console.log(' ');
console.log(' ');
console.log(' ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **');
console.log(' ** ** ** ** swing trader * ** ** ** ** ** ** **');
console.log(' ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **');
console.log(' ');
console.log(' ');

// main loop
const processAsset = async (asset) => {

  deleteOldEntries(asset.symbol);

  const newAssetData = await getAndProcessAssetPriceData(asset.symbol);
  /*
      {
        symbol: asset.symbol,
        price,
        volume_24h,
        volume_change_24h,
        percent_change_1h,
        percent_change_24h,
        percent_change_7d,
        percent_change_30d,
        percent_change_60d,
        percent_change_90d,
        market_cap,
        date: Date.now(),
      }
  */
  const currentPrice = newAssetData.price;
  appendToFile(asset.symbol, newAssetData);

  const { currentNetProfit, currentTaxOwed, currentRealizedProfitsPercentage } = calculateCurrentProfit(asset.entry, newAssetData.price, TAX_RATE, asset.shares);
  const { sellLimitNetProfit, sellLimitTaxOwed, sellLimitRealizedProfitsPercentage } = calculateProfitAtSellLimit(asset.entry, asset.sellLimit, TAX_RATE, asset.shares);

  console.log({
    symbol: asset.symbol,
    price: currentPrice,
    // custom indicators
    rsi: calculateRSI(asset.symbol),
    sma: calculateSMA(asset.symbol),
    ema: calculateEMA(asset.symbol),
    portfolio: {
      entryPrice: asset.entry,
      sharesHeld: asset.shares,
      taxRatePercentage: TAX_RATE,
      current: {
        netProfit: `$${currentNetProfit.toFixed(2)}`,
        taxOwed: `$${currentTaxOwed}`,
        realizedProfitsPercentage: `${Number(currentRealizedProfitsPercentage.toFixed(2))}%`,
      },
      sellLimit: {
        netProfit: `$${sellLimitNetProfit.toFixed(2)}`,
        taxOwed: `$${sellLimitTaxOwed}`,
        realizedProfitsPercentage: `${Number(sellLimitRealizedProfitsPercentage.toFixed(2))}%`,
      },
    },
  });

  // send alerts
  if (currentPrice > asset.high) {
    sendTradeNotification(asset, currentPrice, 'sell');
  } else if (currentPrice < asset.low) {
    sendTradeNotification(asset, currentPrice, 'buy');
  } else {
    // console.log('price is between high and low', price);
  }
  console.log('__________________________');
  console.log(' ');
};

ASSET_LIST.forEach(processAsset);
