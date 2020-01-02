'use strict';

const withDefaults = require('../base.webpack.config');
const path = require('path');

module.exports = withDefaults({
  context: path.join(__dirname),
  entry: {
    extension: './src/extension.ts',
  },
  output: {
    filename: 'extension.js',
    path: path.join(__dirname, 'out')
  }
});
