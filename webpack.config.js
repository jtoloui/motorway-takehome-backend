/* eslint-disable */
const path = require('path')
const nodeExternals = require('webpack-node-externals')
const dotenv = require('dotenv')

dotenv.config()

const isDev = process.env.NODE_ENV === 'development'

module.exports = {
	entry: './src/index.ts',
	target: 'node',
	externals: [nodeExternals()],
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: ['.ts', '.js'],
	},
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'dist'),
	},
	mode: isDev ? 'development' : 'production',
	watch: isDev,
}
