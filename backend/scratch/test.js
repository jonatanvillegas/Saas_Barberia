require('dotenv').config();
const connectDB = require('../src/config/db');
const axios = require('axios');

async function test() {
  await connectDB();
  console.log('Testing...');
}
test();
