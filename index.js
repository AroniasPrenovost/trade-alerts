// REMOVED_DURING_BUILD
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Mailjet = require('node-mailjet');
const configPath = path.join(__dirname, 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const ASSET_LIST = config.assets;
// REMOVED_DURING_BUILD

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

const sendEmailNotification = (action, dataOutputObj) => {
  const actionToTake = action.toUpperCase();
  const symbol = dataOutputObj.symbol;
  const price = (dataOutputObj.quote.price).toFixed(2);

  const subject = `~~ ${symbol} - ${actionToTake} - $${price}`;
  const textPart = `Trade Recommendation: ${actionToTake} ${symbol} at ${price}.`;
  const htmlPart = `<h3>${symbol} - Price Report</h3>
    <p><strong>suggestion<strong>: ${actionToTake}</p>
    <pre>
      ${JSON.stringify(dataOutputObj, undefined, 2)}
    </pre>
  `;

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
// data processing utils
//

const FEDERAL_TAX_RATE = Number(process.env.FEDERAL_TAX_RATE);
const SPOT_MAKER_FEE = Number(process.env.SPOT_MAKER_FEE);
const SPOT_TAKER_FEE = Number(process.env.SPOT_TAKER_FEE);

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
    return response.data.data[symbol];
  } catch (error) {
    console.error(`Error fetching latest data for ${symbol}:`, error);
    return null;
  }
};

const getAndProcessAssetPriceData = async (symbol) => {
  const data = await fetchCurrentAssetData(symbol);
  if (data !== null) {
    delete data.id;
    delete data.name;
    delete data.slug;
    delete data.tags;
    delete data.isActive;
    delete data.platform;
    delete data.date_added;
    delete data.is_fiat;
    delete data.infinite_supply;
    delete data.self_reported_circulating_supply;
    delete data.self_reported_market_cap;
    delete data.tvl_ratio;
    delete data.is_active;
    delete data.max_supply;
    delete data.circulating_supply;
    delete data.total_supply;
    delete data.last_updated;
    delete data.quote.USD.last_updated;
    delete data.quote.USD.tvl;
    delete data.quote.USD.fully_diluted_market_cap;
    delete data.num_market_pairs;
    data.quote = {...data.quote.USD};
    data.date = Date.now();
    return data;
  }
};

function calculateExchangeFee(price, numberOfShares, feeType) {
  const feeRate = (feeType.toLowerCase() === 'maker') ? SPOT_MAKER_FEE : SPOT_TAKER_FEE;
  const fee = (feeRate / 100) * price * numberOfShares;
  return fee;
}

function calculateTradeProfit(entryPrice, sellPrice, numberOfShares, feeType) {
  const profit = (sellPrice - entryPrice) * numberOfShares;
  const exchange_fee = calculateExchangeFee(sellPrice, numberOfShares, feeType);
  const tax_owed = (FEDERAL_TAX_RATE / 100) * profit;
  const gross_profit = profit - exchange_fee - tax_owed;
  const investment = entryPrice * numberOfShares;
  const gross_profit_percentage = (gross_profit / investment) * 100;

  return {
    sellPrice,
    profit,
    exchange_fee,
    tax_owed,
    gross_profit,
    gross_profit_percentage
  };
}

function calculateTransactionCost(entryPrice, numberOfShares, feeType) {
  if (numberOfShares === 0) return 0;
  const base_cost = entryPrice * numberOfShares;
  const exchange_fee = calculateExchangeFee(entryPrice, numberOfShares, feeType);
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
// data processing
//

const processAsset = async (asset) => {
  const assetData = await getAndProcessAssetPriceData(asset.symbol);
  const currentPrice = assetData.quote.price;

  //
  // put together data output
  //

  const position = asset.shares > 0 ? {
    entry_price: asset.entry,
    shares: asset.shares,
    // federal_tax_rate: FEDERAL_TAX_RATE,
    entry_transaction_cost: calculateTransactionCost(asset.entry, asset.shares, 'taker'),
    sell_now: calculateTradeProfit(asset.entry, currentPrice, asset.shares, 'taker'),
    sell_at_limit_1: calculateTradeProfit(asset.entry, asset.sell_limit_1, asset.shares, 'taker'),
    sell_at_limit_2: calculateTradeProfit(asset.entry, asset.sell_limit_2, asset.shares, 'taker'),
    sell_at_limit_3: calculateTradeProfit(asset.entry, asset.sell_limit_3, asset.shares, 'taker'),
  } : null;

  const dummy_position =
    asset.__dummy_shares !== 0 && asset.__dummy_entry !== 0
    ?
    {
      entry_price: asset.__dummy_entry,
      shares: asset.__dummy_shares,
      federal_tax_rate: FEDERAL_TAX_RATE,
      entry_transaction_cost: calculateTransactionCost(asset.__dummy_entry, asset.__dummy_shares, 'taker'),
      sell_now: calculateTradeProfit(asset.__dummy_entry, currentPrice, asset.__dummy_shares, 'taker'),
      sell_at_limit: calculateTradeProfit(asset.__dummy_entry, asset.__dummy_sell_limit, asset.__dummy_shares, 'taker'),
  } : null;

  const LOGGED_DATA_OBJ = {
    // symbol: asset.symbol,
    // price: currentPrice,
    ...assetData,
    support: asset.support,
    resistance: asset.resistance,
    trade_range_percentage: calculateTradeRangePercentage(asset.support, asset.resistance),
    position,
    dummy_position,
  };

  // log findings
  console.log(LOGGED_DATA_OBJ);

  //
  // BUY alert triggers
  //

  let BUY_SIGNAL = false;
  // limit indicators
  let buy_limit_level = '';
  if (asset.shares === 0) {
    if (asset.buy_limit_3 > 0 && (currentPrice <= asset.buy_limit_3)) {
      buy_limit_level = 'limit_3 (lowest low)'
      BUY_SIGNAL = true;
    } else if (asset.buy_limit_2 > 0 && (currentPrice <= asset.buy_limit_2)) {
      buy_limit_level = 'limit_2 (medium low)'
      BUY_SIGNAL = true;
    } else if (asset.buy_limit_1 > 0 && (currentPrice <= asset.buy_limit_1)) {
      buy_limit_level = 'limit_1 (highest low)'
      BUY_SIGNAL = true;
    } else {/* do nothing */}
  }

  // technical indicators
  // todo...

  if (BUY_SIGNAL) {
    sendEmailNotification(`buy - ${buy_limit_level}`, LOGGED_DATA_OBJ);
  }

  //
  // SELL alert triggers
  //

  let SELL_SIGNAL = false;
  // limit indicators
  let sell_limit_level = '';
  if (asset.shares > 0) {
    if (asset.sell_limit_3 > 0 && (currentPrice >= asset.sell_limit_3)) {
      sell_limit_level = 'limit_3 (highest high)'
      SELL_SIGNAL = true;
    } else if (asset.sell_limit_2 > 0 && (currentPrice >= asset.sell_limit_2)) {
      sell_limit_level = 'limit_2 (medium high)'
      SELL_SIGNAL = true;
    } else if (asset.sell_limit_1 > 0 && (currentPrice >= asset.sell_limit_1)) {
      sell_limit_level = 'limit_1 (lowest high)'
      SELL_SIGNAL = true;
    } else {/* do nothing */}
  }

  // technical indicators
  // todo...

  if (SELL_SIGNAL) {
    sendEmailNotification(`sell - ${sell_limit_level}`, LOGGED_DATA_OBJ);
  }
};

//
// main loop
//

const main = async () => {

  const args = process.argv.slice(2);
  const symbolArg = args[0] ? args[0].toUpperCase() : args[0];

  // REMOVED_DURING_BUILD
  if (symbolArg === 'BUILD') {
    generateIndexJsForGoogleCloudFunction();
    return;
  }
  // REMOVED_DURING_BUILD

  if (symbolArg) {
    const asset = ASSET_LIST.find(asset => asset.symbol === symbolArg);
    if (asset) {
      await processAsset(asset);
    } else {
      console.log(`Asset with symbol ${symbolArg} not found or disabled.`);
    }
  } else {
    for (const asset of ASSET_LIST) {
      if (asset.enabled) {
        await processAsset(asset);
      }
    }
  }
};

main();

// REMOVED_DURING_BUILD
function generateIndexJsForGoogleCloudFunction() {
  const sourceFilePath = __filename;
  const destinationFilePath = path.join(__dirname, 'gcf-index.js');
  // get asset data from config.json
  const configPath = path.join(__dirname, 'config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const ASSET_LIST = JSON.stringify(config.assets, null, 2);
  // copy contents of 'index.js'
  const fileContent = fs.readFileSync(sourceFilePath, 'utf8');
  // insert config
  let modifiedContent = fileContent.replace(
    /\/\/ REMOVED_DURING_BUILD[\s\S]*?\/\/ REMOVED_DURING_BUILD/,
    `
    //
    // copy + paste below
    //

    const ASSET_LIST = ${ASSET_LIST}`
  );
  // remove unused code
  modifiedContent = modifiedContent.replace(/\/\/ REMOVED_DURING_BUILD[\s\S]*?\/\/ REMOVED_DURING_BUILD/, '');
  modifiedContent = modifiedContent.replace(/\/\/ REMOVED_DURING_BUILD[\s\S]*?\/\/ REMOVED_DURING_BUILD/, '');
  // write to new 'gcf-index.js' file
  fs.writeFileSync(destinationFilePath, modifiedContent, 'utf8');
  console.log('Successfully generated gcf-index.js')
}
// REMOVED_DURING_BUILD
