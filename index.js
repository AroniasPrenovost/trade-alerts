require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

//
// config override
//

const assets = null;
/*

const assets = [
    {
      ...
    },
    {
      ...
    },
];

*/

//
// email
//

const Mailjet = require('node-mailjet');

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
    <p>LOW: ${asset.support}</p>`;

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

let ASSET_LIST = null;
if (assets) {
  ASSET_LIST = assets;
} else {
  const configPath = path.join(__dirname, 'config.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  ASSET_LIST = config.assets;
}

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

  const currentPrice = assetData.price;

  const position = asset.shares > 0 ? {
    entry_price: asset.entry,
    shares: asset.shares,
    federal_tax_rate: FEDERAL_TAX_RATE,
    total_transaction_cost: calculateTransactionCost(asset.entry, asset.shares, 'taker'),
    sell_now: calculateTradeProfit(asset.entry, currentPrice, asset.shares, 'taker'),
    sell_at_limit: calculateTradeProfit(asset.entry, asset.sell_limit, asset.shares, 'taker'),
  } : null;

  const dummy_position =
    asset.__dummy_shares !== 0 && asset.__dummy_entry !== 0
    ?
    {
      entry_price: asset.__dummy_entry,
      shares: asset.__dummy_shares,
      federal_tax_rate: FEDERAL_TAX_RATE,
      total_transaction_cost: calculateTransactionCost(asset.__dummy_entry, asset.__dummy_shares, 'taker'),
      sell_now: calculateTradeProfit(asset.__dummy_entry, currentPrice, asset.__dummy_shares, 'taker'),
      sell_at_limit: calculateTradeProfit(asset.__dummy_entry, asset.__dummy_sell_limit, asset.__dummy_shares, 'taker'),
  } : null;

  console.log({
    symbol: asset.symbol,
    price: currentPrice,
    support: asset.support,
    resistance: asset.resistance,
    trade_range_percentage: calculateTradeRangePercentage(asset.support, asset.resistance),
    position,
    dummy_position,
  });

  const SELL_SIGNAL = asset.shares > 0 && currentPrice >= asset.resistance;
  const BUY_SIGNAL = asset.shares === 0 && currentPrice <= asset.support;

  if (SELL_SIGNAL) sendTradeNotification(asset, currentPrice, 'sell');
  if (BUY_SIGNAL) sendTradeNotification(asset, currentPrice, 'buy');
};

//
// mail loop
//

const main = async () => {
  const args = process.argv.slice(2);
  const symbol = args[0] ? args[0].toUpperCase() : args[0];

  if (symbol) {
    const asset = ASSET_LIST.find(asset => asset.symbol === symbol);
    if (asset) {
      await processAsset(asset);
    } else {
      console.log(`Asset with symbol ${symbol} not found.`);
    }
  } else {
    for (const asset of ASSET_LIST) {
      await processAsset(asset);
    }
  }
};

main();
