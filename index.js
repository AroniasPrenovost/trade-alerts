require('dotenv').config();
const axios = require('axios');
const Mailjet = require('node-mailjet');
const fs = require('fs');
const path = require('path');

// Your CoinMarketCap API key stored in .env file
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;

// crypto symbols we want to watch
const ASSET_LIST = [
  {
    symbol: 'AVAX',
    high: 29,
    low: 22,
  },
  {
    symbol: 'DOT',
    high: 10,
    low: 3,
  }
];

const mailjet = Mailjet.apiConnect(
  process.env.MAILJET_API_KEY,
  process.env.MAILJET_SECRET_KEY,
);

const MAILJET_FROM_EMAIL = process.env.MAILJET_FROM_EMAIL;
const MAILJET_FROM_NAME = process.env.MAILJET_FROM_NAME;
const MAILJET_TO_EMAIL = process.env.MAILJET_TO_EMAIL;
const MAILJET_TO_NAME = process.env.MAILJET_TO_NAME;

function sendTradeNotification(asset, price, buy_or_sell) {
  const subject = `Trade Recommendation: ${buy_or_sell.toUpperCase()} ${asset.symbol}`;
  const textPart = `Trade Recommendation: ${buy_or_sell.toUpperCase()} ${asset.symbol} at ${price}.`;
  const htmlPart = `<h3>${asset.symbol} - ${buy_or_sell.toUpperCase()}</h3>
  <h4>current price: ${price}</h4>
  <p>LOW: ${asset.low}</p>
  <p>HIGH: ${asset.high}.</p>`;

  mailjet
    .post('send', { version: 'v3.1' })
    .request({
      Messages: [
        {
          From: {
            Email: MAILJET_FROM_EMAIL,
            Name: MAILJET_FROM_NAME,
          },
          To: [
            {
              Email: MAILJET_TO_EMAIL,
              Name: MAILJET_TO_NAME,
            }
          ],
          Subject: subject,
          TextPart: textPart,
          HTMLPart: htmlPart
        }
      ]
    })
    .then((result) => {
      console.log(`ALERT SENT: ${result.body.Messages[0].To[0].Email} - ${new Date()}`);
    })
    .catch((err) => {
      console.log(err.statusCode);
    });
}

async function fetchCurrentPriceData(symbol) {
  const LATEST_PRICE_API_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';
  try {
    const response = await axios.get(LATEST_PRICE_API_URL, {
      headers: {
        'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY,
        'Accept': 'application/json',
      },
      params: {
        symbol: symbol,
      },
    });

    const price = response.data.data[symbol].quote.USD.price ?? 0;
    return Number(price);
  } catch (error) {
    console.error('Error fetching latest data:', error);
    return null;
  }
}

async function getAssetPrice(list) {
  const date = new Date();
  console.log(date)
  for (const asset of list) {
    console.log(asset);
    const price = await fetchCurrentPriceData(asset.symbol);
    if (price !== null) {
      if (price > asset.high) {
        console.log('price is above support', price)
        sendTradeNotification(asset, price, 'sell');
      } else if (price < asset.low) {
        console.log('price is below support', price)
        sendTradeNotification(asset, price, 'buy');
      } else {
        // sendTradeNotification(asset, price, 'hold');
        console.log('price is between high and low', price)
      }
      appendToFile(asset.symbol, { symbol: asset.symbol, price, date: Date.now() });
    }
  }
}

// Append JSON data to a file
function appendToFile(symbol, data) {
  const filePath = path.join(__dirname, `${symbol}_price_history.json`);
  let fileData = [];

  if (fs.existsSync(filePath)) {
    fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  fileData.push(data);
  fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2));
}

// Delete old price entries
function deleteOldEntries() {
  const files = fs.readdirSync(__dirname).filter(file => file.endsWith('_price_history.json'));
  const fourteenDaysAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
  files.forEach(file => {
    const filePath = path.join(__dirname, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const filteredData = data.filter(entry => entry.date >= fourteenDaysAgo);
    fs.writeFileSync(filePath, JSON.stringify(filteredData, null, 2));
    console.log(`deleted 14 day-old entries from ${filePath}`);
  });
}

// Calculate RSI
function calculateRSI(symbol) {
  const filePath = path.join(__dirname, `${symbol}_price_history.json`);
  if (!fs.existsSync(filePath)) {
    console.log(`No data available for ${symbol}`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const fourteenDaysAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
  const recentData = data.filter(entry => entry.date >= fourteenDaysAgo);

  if (recentData.length < 2) {
    console.log(`Not enough data to calculate RSI for ${symbol}`);
    return;
  }

  let gains = 0;
  let losses = 0;

  for (let i = 1; i < recentData.length; i++) {
    const change = recentData[i].price - recentData[i - 1].price;
    if (change > 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }

  const averageGain = gains / recentData.length;
  const averageLoss = losses / recentData.length;
  const rs = averageGain / averageLoss;
  const rsi = 100 - (100 / (1 + rs));

  let overboughtOrOversold = null;
  if (rsi > 70) {
    overboughtOrOversold = 'overbought';
  } else if (rsi < 55 && rsi > 45) {
    overboughtOrOversold = 'neutral';
  } else if (rsi < 30) {
    overboughtOrOversold = 'oversold';
  }

  const result = {
    rsi: rsi.toFixed(2),
    overbought_or_oversold: overboughtOrOversold
  };

  console.log(`RSI for ${symbol}: ${result.rsi}, Status: ${result.overbought_or_oversold}`);
  return result;
}

//
// Check every X timeframe (ran via cron job)
//
deleteOldEntries();

getAssetPrice(ASSET_LIST);

ASSET_LIST.forEach(asset => calculateRSI(asset.symbol));

console.log(' ');
