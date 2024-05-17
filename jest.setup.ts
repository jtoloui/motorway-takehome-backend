import { Pool } from 'pg';
import Memcached from 'memjs';
import dotenv from 'dotenv';

declare global {
	var dbClient: Pool;
	var cacheClient: Memcached.Client;
}

dotenv.config();

global.dbClient = new Pool({
	user: process.env.TEST_DB_USER,
	host: process.env.TEST_DB_HOST,
	database: process.env.TEST_DB_NAME,
	password: process.env.TEST_DB_PASSWORD,
	port: parseInt(process.env.TEST_DB_PORT || '5432', 10),
});

global.cacheClient = Memcached.Client.create(
	process.env.TEST_MEMCACHE_SERVERS,
	{
		conntimeout: 0.5,
		retries: 2,
	},
);

// Handle process exit and flush the cache
process.on('exit', async () => {
	await global.dbClient.end();
	await global.cacheClient.flush();
	global.cacheClient.close();
});
