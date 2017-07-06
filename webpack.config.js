const webpack = require('webpack');
const path = require('path');

let baseDir = path.resolve(__dirname, './src');
let distDir = path.resolve(__dirname, './bin/assets');

module.exports = {
  entry: {
    popup: path.join(baseDir, 'popup/scripts/main.js'),
    settings: path.join(baseDir, 'settingsPage/scripts/main.js'),
    background: path.join(baseDir, 'background/background.js'),
    content: path.join(baseDir, 'content/content.js')
  },
  output: {
    path: distDir,
    filename: '[name].bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.(eot|ttf|woff|woff2)$/,
        loader: 'file-loader?name=public/fonts/[name].[ext]'
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        loader: "file-loader?name=public/images/[name].[ext]"
      },
    ]
  }
};