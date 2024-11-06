# Crypto Price Alert System

This project is a Node.js application that monitors cryptocurrency prices using the CoinMarketCap API and sends trade notifications via email using Mailjet. The application checks the current price of specified cryptocurrencies and sends an alert if the price crosses predefined high or low thresholds.

## Features

- Monitor cryptocurrency prices in real-time.
- Send email notifications for buy/sell recommendations.
- Configurable support levels for each cryptocurrency.
- Uses CoinMarketCap API for price data.
- Uses Mailjet for sending email notifications.

## Prerequisites

- Node.js (v14 or later)
- npm (Node Package Manager)
- CoinMarketCap API key
- Mailjet API key and secret

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/AroniasPrenovost/trade-alerts.git
   cd trade-alerts
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and configure your environment variables. Use `.env.sample` as a reference:

   ```plaintext
   MAILJET_API_KEY=your-mailjet-api-key
   MAILJET_SECRET_KEY=your-mailjet-secret-key
   MAILJET_FROM_EMAIL=your-email@example.com
   MAILJET_FROM_NAME=Your Name
   MAILJET_TO_EMAIL=recipient-email@example.com
   MAILJET_TO_NAME=Recipient Name
   COINMARKETCAP_API_KEY=your-coinmarketcap-api-key
   ```

## Usage

1. Start the application:

   ```bash
   node index.js
   ```

2. The application will check the prices of the specified cryptocurrencies and send email notifications if the price crosses the defined thresholds.

3. To run the price check at regular intervals, you can set up a `cron` job. A `cron` job allows you to schedule scripts or commands to run automatically at specified intervals. Here's how you can set up a `cron` job to run the price check script at regular intervals:

### Setting Up a Cron Job

1. **Open the Crontab File:**

   To edit the cron jobs, open the crontab file in the terminal:

   ```bash
   crontab -e
   ```

2. **Add a New Cron Job:**

   To run the price check script at regular intervals, add a new line to the crontab file. For example, to run the script every hour, you can add:

   ```bash
   0 * * * * /usr/bin/node /path/to/your/project/index.js
   ```

   This cron expression `0 * * * *` means the script will run at the start of every hour. Make sure to replace `/path/to/your/project/index.js` with the actual path to your script.

3. **Save and Exit:**

   After adding the cron job, save the file and exit the editor. The cron job will now be scheduled to run at the specified intervals.

## Configuration

- The cryptocurrencies to monitor and their respective high/low thresholds are defined in the `assets_to_watch` array within the code. You can modify this array to add or remove cryptocurrencies or adjust the thresholds.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.

## Acknowledgments

- [CoinMarketCap API](https://coinmarketcap.com/api/)
- [Mailjet](https://www.mailjet.com/)



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
