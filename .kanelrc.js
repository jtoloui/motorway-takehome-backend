/* eslint-disable */
const { generateZodSchemas } = require("kanel-zod");
const dotenv = require('dotenv');

dotenv.config()

module.exports = {
	connection: {
		user: process.env.DB_USER,
		host: process.env.DB_HOST,
		database: process.env.DB_NAME,
		password: process.env.DB_PASSWORD,
		port: parseInt(process.env.DB_PORT || '5432', 10),
	},
	outputPath: './src/generated/types',
	preDeleteOutputFolder: true,
	preRenderHooks: [generateZodSchemas],
}
