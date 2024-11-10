require('dotenv').config();
const axios = require('axios');
const Mailjet = require('node-mailjet');
const fs = require('fs');
const path = require('path');
var cron = require('node-cron');

//
// file management
//

// const dataDirectory = path.join(__dirname, 'data');
//
// if (!fs.existsSync(dataDirectory)) { // Ensure the data directory exists
//   fs.mkdirSync(dataDirectory);
// }
//
// const appendToFile = (data) => {
//   const symbol = data.symbol;
//   const filePath = path.join(dataDirectory, `${symbol}_price_history.json`);
//   const fileData = getFileContents(symbol);
//   fileData.push(data);
//   fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2));
// };
//
// const getFileContents = (symbol) => {
//   const filePath = path.join(dataDirectory, `${symbol}_price_history.json`);
//   return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : [];
// };
//
// const deleteOldEntries = () => {
//   const DAYS_TO_DELETE = 30; // Set this to '14' or '30' as needed
//   const dataDirectory = path.join(__dirname, 'data');
//   const daysAgo = Date.now() - (DAYS_TO_DELETE * 24 * 60 * 60 * 1000);
//   fs.readdir(dataDirectory, (err, files) => {
//     if (err) {
//       console.error('Error reading directory:', err);
//       return;
//     }
//     files.forEach(file => {
//       if (file.endsWith('_price_history.json')) {
//         const filePath = path.join(dataDirectory, file);
//         const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
//         const filteredData = data.filter(entry => entry.date >= daysAgo);
//         fs.writeFileSync(filePath, JSON.stringify(filteredData, null, 2));
//         console.log(`Deleted old entries from ${file} (${DAYS_TO_DELETE} days)`);
//       }
//     });
//     console.log(' ');
//   });
// };

//
// email notifications
//

const mailjet = Mailjet.apiConnect(
 process.env.MAILJET_API_KEY,
 process.env.MAILJET_SECRET_KEY,
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
    <p>High Resistance: ${asset.resistance}.</p>
    <p>LOW: ${asset.support}</p>`
    ;

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
    .then((result) => console.log(`ALERT: ${result.body.Messages[0].To[0].Email} - ${new Date()}`))
    .catch((err) => console.log(err.statusCode));
};

//
// stock/crypto data
//

const FEDERAL_TAX_RATE = Number(process.env.FEDERAL_TAX_RATE);
const SPOT_MAKER_FEE = Number(process.env.SPOT_MAKER_FEE);
const SPOT_TAKER_FEE = Number(process.env.SPOT_TAKER_FEE);

// Load asset list from config.json
// const configPath = path.join(__dirname, 'config.json');
// const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
//
//
//
const config = {
  "assets": [
    {
      "symbol": "AVAX",
      "support": 27,
      "resistance": 29,
      "entry": 0,
      "sell_limit": 29,
      "shares": 0,
      "__dummy_entry": 27,
      "__dummy_shares": 10,
      "__dummy_sell_limit": 29
    },
    {
      "symbol": "DOT",
      "support": 4.00,
      "resistance": 4.5,
      "entry": 0,
      "sell_limit": 4.35,
      "shares": 0,
      "__dummy_entry": 4.00,
      "__dummy_shares": 20,
      "__dummy_sell_limit": 4.30
    },
    {
      "symbol": "UNI",
      "support": 7.40,
      "resistance": 9.0,
      "entry": 0,
      "sell_limit": 0,
      "shares": 0,
      "__dummy_entry": 0,
      "__dummy_shares": 0,
      "__dummy_sell_limit": 0
    },
    {
      "symbol": "CRO",
      "support": 0.086,
      "resistance": 0.1,
      "entry": 0.085,
      "sell_limit": 0.1,
      "shares": 0,
      "__dummy_entry": 0,
      "__dummy_shares": 0,
      "__dummy_sell_limit": 0
    },
    {
      "symbol": "ADA",
      "support": 0.4,
      "resistance": 0.45,
      "entry": 0.4,
      "sell_limit": 0.44,
      "shares": 0,
      "__dummy_entry": 0,
      "__dummy_shares": 0,
      "__dummy_sell_limit": 0
    }
  ]
};

//
//
//
const ASSET_LIST = config.assets;

const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;

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

//
//
//

function calculateExchangeFee(price, numberOfShares, feeType) {
    // Determine the exchange fee rate based on the fee type
    const feeRate = (feeType.toLowerCase() === 'maker') ? SPOT_MAKER_FEE : SPOT_TAKER_FEE;
    const fee = (feeRate / 100) * price * numberOfShares;
    return fee;
}

function calculateTradeProfit(entryPrice, sellPrice, numberOfShares, feeType) {
    // Calculate the gross profit
    const profit = (sellPrice - entryPrice) * numberOfShares;

    // Determine the exchange fee based on the fee type
    const exchange_fee = calculateExchangeFee(sellPrice, numberOfShares, feeType);

    // Calculate the tax owed
    const tax_owed = (FEDERAL_TAX_RATE / 100) * profit;

    // Calculate profit after tax and fees
    const gross_profit = profit - exchange_fee - tax_owed;

    // Calculate the net profit percentage after tax and fees
    const investment = entryPrice * numberOfShares;
    const gross_profit_percentage = (gross_profit / investment) * 100;

    // Return the calculated values in an object
    return {
        profit,
        exchange_fee,
        tax_owed,
        gross_profit,
        gross_profit_percentage
    };
}

function calculateTransactionCost(entryPrice, numberOfShares, feeType) {
  if (numberOfShares === 0) return 0;
  // Calculate the total cost without fees
  const base_cost = entryPrice * numberOfShares;
  // Calculate the exchange fee
  const exchange_fee = calculateExchangeFee(entryPrice, numberOfShares, feeType);
  // Calculate the final purchase price including fee
  const cost = base_cost + exchange_fee;
  return cost;
}

function calculateTradeRangePercentage(num1, num2) {
  if (num1 === 0 && num2 === 0) return 0;
  const difference = Math.abs(num1 - num2);
  const average = (num1 + num2) / 2;
  const percentageDifference = (difference / average) * 100;
  return `${percentageDifference.toFixed(2)}%`;
}

//
// random utils
//

function createHumanReadableDateNow() {
  const date = new Date();
  const timeOptions = {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    timeZone: 'America/Los_Angeles' // PST timezone
  };

  const dateOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Los_Angeles' // PST timezone
  };

  const formattedTime = new Intl.DateTimeFormat('en-US', timeOptions).format(date);
  const formattedDate = new Intl.DateTimeFormat('en-US', dateOptions).format(date);
  return `${formattedDate} ${formattedTime}`;
}

function showAppTitle() {
  console.log(' ');
  console.log(' ');
  console.log(' ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **');
  console.log(' ** ** ** ** SWING TRADER * ** ** ** ** ** ** **');
  console.log(' ');
  console.log(createHumanReadableDateNow());
  console.log(' ');
  console.log(' ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **');
  console.log(' ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **');
  console.log(' ');
}

//
// main loop
//

const processAsset = async (asset) => {

  //
  // get and save the data
  //

  const assetData = await getAndProcessAssetPriceData(asset.symbol);
    /* {
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
    } */

  // appendToFile(assetData);

  //
  // log the data
  //

  const currentPrice = assetData.price;

  const position = asset.shares > 0 ? {
    entry_price: asset.entry,
    shares: asset.shares,
    federal_tax_rate: FEDERAL_TAX_RATE,
    total_transaction_cost: calculateTransactionCost(asset.entry, asset.shares, 'taker'),
    sell_now: calculateTradeProfit(asset.entry, currentPrice, asset.shares, 'taker'),
    sell_at_limit: calculateTradeProfit(asset.entry, asset.sell_limit, asset.shares, 'taker'),
  } : null;


  const possible_position =
    asset.__dummy_shares !== 0 && asset.__dummy_entry !== 0
    ?
    {
      entry_price: asset.__dummy_entry,
      shares: asset.__dummy_shares,
      federal_tax_rate: FEDERAL_TAX_RATE,
      total_transaction_cost: calculateTransactionCost(asset.dummy_entry, asset.__dummy_shares, 'taker'),
      sell_now: calculateTradeProfit(asset.__dummy_entry, currentPrice, asset.__dummy_shares, 'taker'),
      sell_at_limit: calculateTradeProfit(asset.__dummy_entry, asset.__dummy_sell_limit, asset.__dummy_shares, 'taker'),
  } : null;


  console.log({
    symbol: asset.symbol,
    price: currentPrice,
    support: asset.support,
    resistance: asset.resistance,
    trade_range_percentage: calculateTradeRangePercentage(asset.support, asset.resistance),
    // custom indicators
    rsi: 'todo',
    sma: 'todo',
    ema: 'todo',
    position,
    possible_position,
  });

  //
  // alerts
  //

  const SELL_SIGNAL = asset.shares > 0
    && currentPrice >= asset.resistance;

  const BUY_SIGNAL = asset.shares === 0
    && currentPrice <= asset.support;

  if (SELL_SIGNAL) sendTradeNotification(asset, currentPrice, 'sell');
  if (BUY_SIGNAL) sendTradeNotification(asset, currentPrice, 'buy');

  // if (!SELL_SIGNAL && !BUY_SIGNAL) {
    // console.log('price is between high and low', currentPrice);
  // }

  console.log('------------------------------------\n');
};

//
// initial run
//

showAppTitle();
// deleteOldEntries();
ASSET_LIST.forEach(processAsset);

//
// repeat every X interval
//

/*

  To determine if you'll hit the 10,000 API calls limit in a month, let's break down the scenario:

  1. **Number of assets**: 5
  2. **Frequency of Checks**: Every 3 hours
  3. **Number of Days in a Month**: Approximately 30 (for calculation purposes)

  First, calculate the number of checks per day:

  - There are 24 hours in a day.
  - If you run a check every 3 hours, you'll have \( \frac{24}{3} = 8 \) checks per day.

  Next, calculate the total number of checks for all cryptos per day:

  - 5 cryptos * 8 checks per day = 40 checks per day

  Now, calculate the total number of API calls in a month:

  - 40 checks per day * 30 days = 1,200 API calls per month

  Since 1,200 API calls per month is well below the 10,000 API calls limit, you will not hit the maximum limit with the current setup.


*/

// cron.schedule('0 * * * *', () => { // every 1 hour
cron.schedule('0 */3 * * *', () => { // every 3 hours
  showAppTitle();
  deleteOldEntries();
  ASSET_LIST.forEach(processAsset);
});
