const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {

    mode: 'development',

    entry: './src/main.js',
    output: {
        path: __dirname + '/public',
        filename: 'main.js'
    },

    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader"
                }
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    MiniCssExtractPlugin.loader,
                    'css-loader'
                ]
            }
        ]
    },

    plugins: [ 
        new HtmlWebpackPlugin({
          template: './src/index.html',
          filename: 'index.html'
        }),
        new MiniCssExtractPlugin({
            filename: 'styles/style.css'
        })
    ]

}