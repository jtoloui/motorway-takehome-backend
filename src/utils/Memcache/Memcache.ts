import { Logger } from 'winston';
import memjs from 'memjs';
import { ControllerConfig } from '../../types/controllers';
import { newConfig } from '../../config/config';

const envConfig = newConfig.getInstance().getConfig();

export class Memcache {
	private static instance: Memcache;
	private log: Logger;
	private memcacheClient: memjs.Client;

	constructor(config: ControllerConfig) {
		this.log = config.loggerInstance(config.logLevel, 'CacheService');
		this.memcacheClient = memjs.Client.create(envConfig.MEMCACHE_SERVERS, {
			conntimeout: 0.5,
			retries: 2,
		});
	}

	public static getInstance(config: ControllerConfig): Memcache {
		if (!Memcache.instance) {
			Memcache.instance = new Memcache(config);
		}
		return Memcache.instance;
	}

	public set = async (
		key: string,
		value: string,
		ttl = 600,
	): Promise<boolean> => {
		try {
			this.log.info(`Setting key: ${key}`);
			await this.memcacheClient.set(key, value, { expires: ttl });
			return true;
		} catch (error) {
			this.log.error(`Error setting key: ${key} - ${error}`);
			return false;
		}
	};

	public get = async <T>(key: string): Promise<T | null> => {
		const start = Date.now();
		try {
			this.log.info(`Getting key: ${key}`);
			const { value } = await this.memcacheClient.get(key);
			this.memcacheClient.close();
			this.log.info(`Got key: ${key} in ${Date.now() - start}ms`);
			if (!value) {
				this.log.info(`Key: ${key} not found`);
				// close the connection after each fetch
				return null;
			}
			this.log.debug(`Key: ${key} - Value: ${value.toString()}`);
			const jsonObject: T = JSON.parse(value.toString());

			return jsonObject;
		} catch (error) {
			this.log.error(`Error getting key: ${key} - ${error}`);
			return null;
		}
	};

	public async flush(): Promise<void> {
		await this.memcacheClient.flush();
	}

	public close(): void {
		this.memcacheClient.close();
	}
}
