// App env var/API keys

// check environment, if not production
// load keys from root-level .env file (DO NOT COMMIT FILE)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// export env vars and other non-secret keys
module.exports = {
  bithompApiKey: process.env.BITHOMP_API_KEY,
  dbUri: process.env.MONGODB_URI,
  defaultEndDate: process.env.DEFAULT_END_DATE,
  useDefaultEndDate: process.env.USE_DEFAULT_END_DATE,
  updatingPaused: process.env.UPDATING_PAUSED,
  appBaseUrl: require('./app-config').appBaseUrl,
  appWalletAddress: require('./app-config').appWalletAddress
};
