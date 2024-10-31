const dotenv = require("dotenv");
dotenv.config();

const CB_API_KEY = process.env.COINBASE_API_KEY;
const CB_SECRET = process.env.COINBASE_SECRET;
const CB_PASSPHRASE = process.env.COINBASE_PASSPHRASE;

console.log({
  CB_API_KEY,
  CB_SECRET,
  CB_PASSPHRASE,
});

return;


const CoinbasePro = require('coinbase-pro');
const publicClient = new CoinbasePro.PublicClient();
const authedClient = new CoinbasePro.AuthenticatedClient(
  'YOUR_API_KEY',
  'YOUR_API_SECRET',
  'YOUR_PASSPHRASE',
  'https://api.pro.coinbase.com'
);

const product = 'BTC-USD'; // Example trading pair
const supportLevel = 30000; // Example support level
const resistanceLevel = 35000; // Example resistance level
const stopLossPercentage = 0.02; // 2% stop loss

async function getHistoricRates() {
  try {
    const historicRates = await publicClient.getProductHistoricRates(product, {
      granularity: 3600 // 1-hour candles
    });
    return historicRates;
  } catch (error) {
    console.error('Error fetching historic rates:', error);
  }
}

async function checkMarketConditions() {
  const historicRates = await getHistoricRates();
  const latestCandle = historicRates[0];
  const [time, low, high, open, close] = latestCandle;

  if (close > supportLevel && close < resistanceLevel) {
    if (close < open && low <= supportLevel) {
      console.log('Strong price rejection at support level, considering going long.');
      await placeBuyOrder();
    }
  }
}

async function placeBuyOrder() {
  try {
    const buyParams = {
      side: 'buy',
      price: supportLevel.toString(),
      size: '0.01', // Example size
      product_id: product
    };

    const buyOrder = await authedClient.placeOrder(buyParams);
    console.log('Buy order placed:', buyOrder);

    // Set a stop loss
    const stopLossPrice = (supportLevel * (1 - stopLossPercentage)).toFixed(2);
    console.log(`Setting stop loss at: $${stopLossPrice}`);
  } catch (error) {
    console.error('Error placing buy order:', error);
  }
}

async function main() {
  setInterval(checkMarketConditions, 3600000); // Check every hour
}

main();
