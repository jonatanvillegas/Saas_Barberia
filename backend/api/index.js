// Vercel Serverless Function entrypoint
// Reutiliza el Express app definido en backend/src/app.js

const app = require('../src/app');

module.exports = (req, res) => {
  return app(req, res);
};
