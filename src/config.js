'use strict';
const dotenv = require('dotenv');

dotenv.config();

const {MONGODB_URI_DEV} = process.env
module.exports = { mongodbdev: MONGODB_URI_DEV}