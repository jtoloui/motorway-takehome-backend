import { Pool } from 'pg';
import { newConfig } from './config';

const env = newConfig.getInstance().getConfig();

const pool = new Pool({
	user: env.DB_USER,
	host: env.DB_HOST,
	database: env.DB_NAME,
	password: env.DB_PASSWORD,
	port: parseInt(env.DB_PORT || '5432', 10),
	max: 10, // Maximum number of clients in the pool
	idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
	connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

export default pool;
