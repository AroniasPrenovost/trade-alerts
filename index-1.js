require('dotenv').config();
const axios = require('axios');
const Mailjet = require('node-mailjet');

const mailjet = Mailjet.apiConnect(
    process.env.MAILJET_API_KEY,
    process.env.MAILJET_SECRET_KEY,
);

//
const MAILJET_FROM_EMAIL = process.env.MAILJET_FROM_EMAIL;
const MAILJET_FROM_NAME = process.env.MAILJET_FROM_NAME;
const MAILJET_TO_EMAIL = process.env.MAILJET_TO_EMAIL;
const MAILJET_TO_NAME = process.env.MAILJET_TO_NAME;
function sendTradeNotification(asset_symbol, price, buy_or_sell) {
    const subject = `Trade Recommendation: ${buy_or_sell.toUpperCase()} ${asset_symbol}`;
    const textPart = `Trade Recommendation: ${buy_or_sell.toUpperCase()} ${asset_symbol} at ${price}.`;
    const htmlPart = `<h3>${buy_or_sell.toUpperCase()}</h3><p> ${asset_symbol} at ${price}.</p>`;

    const request = mailjet
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
        });

    request
        .then((result) => {
            // console.log(result.body.Messages[0]);
            console.log(`ALERT SENT: ${result.body.Messages[0].To[0].Email} - ${new Date()}`);
        })
        .catch((err) => {
            console.log(err.statusCode);
        });
}
// sendTradeNotification('BTC', '50000', 'buy');

    return;


// Your CoinMarketCap API key stored in .env file
const API_KEY = process.env.COINMARKETCAP_API_KEY;
const LATEST_API_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';
// requires Hobbyist -$29/month: https://coinmarketcap.com/api/pricing/
// const HISTORICAL_API_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/historical';
const SYMBOL = 'AVAX';

// Function to fetch AVAX latest data
async function fetchAvaxLatestData() {
  try {
    const response = await axios.get(LATEST_API_URL, {
      headers: {
        'X-CMC_PRO_API_KEY': API_KEY,
        'Accept': 'application/json',
      },
      params: {
        symbol: SYMBOL,
      },
    });

    //  console.log(`AVAX Data:`, response.data);
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

    console.log(`AVAX price (USD):`, response.data.data.AVAX.quote.USD.price);
    // return SOMETHING?
  } catch (error) {
    console.error('Error fetching latest data:', error);
  }
}

// Function to fetch AVAX historical data
// async function fetchAvaxHistoricalData(timePeriod) {
//   try {
//     const response = await axios.get(HISTORICAL_API_URL, {
//       headers: {
//         'X-CMC_PRO_API_KEY': API_KEY,
//         'Accept': 'application/json',
//       },
//       params: {
//         symbol: SYMBOL,
//         time_start: new Date(Date.now() - timePeriod).toISOString(),
//         time_end: new Date().toISOString(),
//         interval: 'daily',
//       },
//     });
//     console.log(`AVAX Historical Data:`, response.data);
//   } catch (error) {
//     console.error('Error fetching historical data:', error);
//   }
// }

// Fetch AVAX data every 10 minutes
setInterval(() => {
  const data = fetchAvaxLatestData();
  // fetchAvaxHistoricalData(7 * 24 * 60 * 60 * 1000); // Fetch historical data for the last 7 days
}, 10 * 60 * 1000);

// Initial fetch
fetchAvaxLatestData();
// fetchAvaxHistoricalData(7 * 24 * 60 * 60 * 1000); // Fetch historical data for the last 7 days
