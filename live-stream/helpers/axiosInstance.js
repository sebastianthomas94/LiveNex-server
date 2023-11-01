// axiosInstance.js

const axios = require('axios');

const apiKey = 'YOUR_API_KEY';
const accessToken = 'YOUR_ACCESS_TOKEN';

const baseURL = 'https://youtube.googleapis.com/youtube/v3';

const instance = axios.create({
  baseURL: baseURL,
  headers: {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
  },
  params: {
    key: apiKey,
  },
});

module.exports = instance;
