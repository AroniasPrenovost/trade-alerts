# Crypto Price Alert System

Node.js application that monitors cryptocurrency prices using the CoinMarketCap API and sends trade setup notifications via email using Mailjet.

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
   node index
   ```

2. **Run for a specific asset by symbol:**

   ```bash
   node index SYMBOL
   ```

   Replace `SYMBOL` with the cryptocurrency symbol you want to monitor.

## Running as a Cron Job on Google Cloud Functions

To run this application as a scheduled task using Google Cloud Functions, you can set up a Cloud Scheduler job that triggers a Cloud Function.

**Build for Google Cloud Function:**

This command copies the contents of `index.js` and modifies them to be copy+pasted into a Google Cloud Function, and places it in a `gcf-index.js` file.

   ```bash
   node index build
   ```

## Philosophy

For success, it is imperative to follow and continually manifest a `Process` > `Outcome` mindset. That means you follow a specific system and be patient to avoid negative trading psychology practices (overtrading, FOMO, etc.).
1. Check/set support and resistance levels weekly (Sunday evening)
- avoid trading more than 2-3 instruments. Spreading out positions leads to longer wait times and lower gains.
2. Patiently wait for alerts, and adjust `support` and `resistance` as ranges change.
3. Take profits often.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.

## 3rd Party APIs

- [CoinMarketCap API](https://coinmarketcap.com/api/)
- [Mailjet](https://www.mailjet.com/)
- [Google Cloud Functions documentation](https://cloud.google.com/functions/docs)
- [Cloud Scheduler documentation](https://cloud.google.com/scheduler/docs)
