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

3. Create a `.env` file in the root directory and configure your environment variables. Use `.env.sample` as a reference.

4. Create a `config.json` file in the root directory and configure your watchlist. Use `example-config.json` as a reference.

## Running the Application

You can run the application in two different ways:

1. **Run for all assets:**

   ```bash
   node index.js
   ```

2. **Run for a specific asset by symbol:**

   ```bash
   node index.js SYMBOL
   ```

   Replace `SYMBOL` with the cryptocurrency symbol you want to monitor.

## Running as a Cron Job on Google Cloud Functions

To run this application as a scheduled task using Google Cloud Functions, you can set up a Cloud Scheduler job that triggers a Cloud Function.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.

## 3rd Party APIs

- [CoinMarketCap API](https://coinmarketcap.com/api/)
- [Mailjet](https://www.mailjet.com/)
- [Google Cloud Functions documentation](https://cloud.google.com/functions/docs)
- [Cloud Scheduler documentation](https://cloud.google.com/scheduler/docs)
