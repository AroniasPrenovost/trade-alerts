require('dotenv').config();
const axios = require('axios');
const Mailjet = require('node-mailjet');

// Your CoinMarketCap API key stored in .env file
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;

// crypto symbols we want to watch
const assets_to_watch = [
  {
    symbol: 'BTC',
    high: 80,
    low: 55
  },
  {
    symbol: 'AVAX',
    high: 29,
    low: 22
}];

const mailjet = Mailjet.apiConnect(
    process.env.MAILJET_API_KEY,
    process.env.MAILJET_SECRET_KEY,
);

const MAILJET_FROM_EMAIL = process.env.MAILJET_FROM_EMAIL;
const MAILJET_FROM_NAME = process.env.MAILJET_FROM_NAME;
const MAILJET_TO_EMAIL = process.env.MAILJET_TO_EMAIL;
const MAILJET_TO_NAME = process.env.MAILJET_TO_NAME;

function sendTradeNotification(asset_symbol, price, buy_or_sell) {
    const subject = `Trade Recommendation: ${buy_or_sell.toUpperCase()} ${asset_symbol}`;
    const textPart = `Trade Recommendation: ${buy_or_sell.toUpperCase()} ${asset_symbol} at ${price}.`;
    const htmlPart = `<h3>${buy_or_sell.toUpperCase()}</h3><p> ${asset_symbol} at ${price}.</p>`;

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

async function checkAssets() {
  const date = new Date();
  console.log(date)
  for (const asset of assets_to_watch) {
    console.log(asset);
    const price = await fetchCurrentPriceData(asset.symbol);
    if (price !== null) {
      // console.log(`${asset.symbol} price (USD): ${price}`);
      if (price > asset.high) {
        console.log('price is above supprt', price)
        // sendTradeNotification(asset.symbol, price, 'sell');
      } else if (price < asset.low) {
        console.log('price is below support', price)
        // sendTradeNotification(asset.symbol, price, 'buy');
      } else {
        console.log('price is between high and low', price)
      }
    }
  }
  console.log(' ');
}

// Check assets every 10 minutes
setInterval(checkAssets, 10 * 60 * 1000);

// Initial check
checkAssets();
