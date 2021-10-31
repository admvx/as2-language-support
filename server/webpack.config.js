'use strict';

const extendBaseConfig = require('../base.webpack.config');
const path = require('path');

module.exports = extendBaseConfig({
  context: __dirname,
  entry: { extension: './src/server.ts' },
  output: {
    filename: 'server.js',
    path: path.join(__dirname, 'out')
  }
});
