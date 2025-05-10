const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: {
    main: './src/index.js',
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  devtool: 'source-map',
  devServer: {
    static: './dist',
    hot: true,
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
      inject: true
    }),
    new FaviconsWebpackPlugin({
      logo: './favicon.svg',
      mode: 'webapp',  // 관련 파비콘 파일들 생성
      // 가장 기본적인 파비콘만 생성
      favicons: {
        appName: '후원 분석 대시보드',
        appDescription: '별풍선 CSV 분석기',
        developerName: 'soopatree',
        developerURL: 'https://github.com/soopatree',
        icons: {
          android: false,
          appleIcon: false,
          appleStartup: false,
          coast: false,
          windows: false,
          yandex: false
        }
      }
    }),
    new MiniCssExtractPlugin({
      filename: 'style.css',
    }),
    new CopyPlugin({
      patterns: [
        { 
          from: "assets", 
          to: "assets" 
        },
      ],
    }),
  ],
};
