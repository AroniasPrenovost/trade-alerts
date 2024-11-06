require('dotenv').config();
const axios = require('axios');
const Mailjet = require('node-mailjet');
const fs = require('fs');
const path = require('path');

const ASSET_LIST = [
  { symbol: 'AVAX', high: 29, low: 22 },
  { symbol: 'DOT', high: 5.50, low: 3 },
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

const fetchCurrentPriceData = async (symbol) => {
  const LATEST_PRICE_API_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';
  try {
    const response = await axios.get(LATEST_PRICE_API_URL, {
      headers: {
        'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY,
        'Accept': 'application/json',
      },
      params: { symbol },
    });
    return Number(response.data.data[symbol].quote.USD.price ?? 0);
  } catch (error) {
    console.error('Error fetching latest data:', error);
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

const processAssetPrice = async (asset) => {
  const price = await fetchCurrentPriceData(asset.symbol);
  if (price !== null) {
    if (price > asset.high) {
      sendTradeNotification(asset, price, 'sell');
    } else if (price < asset.low) {
      sendTradeNotification(asset, price, 'buy');
    } else {
      console.log('price is between high and low', price);
    }
    appendToFile(asset.symbol, { symbol: asset.symbol, price, date: Date.now() });
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

  console.log(`RSI for ${symbol}: ${rsi.toFixed(2)}, Status: ${overboughtOrOversold}`);
  return { rsi: rsi.toFixed(2), overbought_or_oversold: overboughtOrOversold };
};

const processAsset = async (asset) => {
  deleteOldEntries(asset.symbol);
  await processAssetPrice(asset);
  calculateRSI(asset.symbol);
};

// run w/ cron job
ASSET_LIST.forEach(processAsset);
