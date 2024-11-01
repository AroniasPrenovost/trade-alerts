require('dotenv').config();
const axios = require('axios');
const Mailjet = require('node-mailjet');

// Your CoinMarketCap API key stored in .env file
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;

// crypto symbols we want to watch
const assets_to_watch = [
  // {
  //   symbol: 'BTC',
  //   high: 80_000,
  //   low: 55_000,
  // },
  {
    symbol: 'AVAX',
    high: 29,
    low: 22,
},
{
  symbol: 'DOT',
  high: 10,
  low: 3,
}];

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

    const price = response.data.data[symbol].quote.USD.price ?? 0;
    return Number(price);
  } catch (error) {
    console.error('Error fetching latest data:', error);
    return null;
  }
}

async function checkAssetPrices() {
  const date = new Date();
  console.log(date)
  for (const asset of assets_to_watch) {
    console.log(asset);
    const price = await fetchCurrentPriceData(asset.symbol);
    if (price !== null) {
      // console.log(`${asset.symbol} price (USD): ${price}`);
      if (price > asset.high) {
        console.log('price is above supprt', price)
        sendTradeNotification(asset, price, 'sell');
      } else if (price < asset.low) {
        console.log('price is below support', price)
        sendTradeNotification(asset, price, 'buy');
      } else {
        console.log('price is between high and low', price)
      }
    }
  }
}

// Check every X time frame (ran via cron job)
// setInterval(checkAssetPrices, 60 * 60 * 1000); // 60 minutes

// Initial check
checkAssetPrices();
console.log(' ');
