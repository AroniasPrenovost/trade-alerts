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

5. Start the application:

   ```bash
   node index.js
   ```

6. Or run locally at intervals (1 hour shown below) with:

  ```bash
  while sleep 3600; do node index; done;
  ```

## Configuration

- The cryptocurrencies to monitor and their respective high/low thresholds are defined in the `assets_to_watch` array within the code. You can modify this array to add or remove cryptocurrencies or adjust the thresholds.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue.

## Acknowledgments

- [CoinMarketCap API](https://coinmarketcap.com/api/)
- [Mailjet](https://www.mailjet.com/)
