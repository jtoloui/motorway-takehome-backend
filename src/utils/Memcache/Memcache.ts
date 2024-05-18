import { Logger } from 'winston';
import memjs from 'memjs';
import { ControllerConfig } from '../../types/controllers';
import { newConfig } from '../../config/config';
import { SpanStatusCode } from '@opentelemetry/api';
import { tracerWrapper } from '../../tracing/utils/utils';

const envConfig = newConfig.getInstance().getConfig();

/**
 * Memcache class to interact with memcache
 * This class also has tracing implemented manually
 * this is due to the fact that memjs doesn't have a supported instrumentation library
 */

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
		return tracerWrapper<boolean>('Setting Memcache Key', async (span) => {
			try {
				this.log.info(`Setting key: ${key}`);
				span.setAttribute('memcache.key', key);
				await this.memcacheClient.set(key, value, { expires: ttl });
				return true;
			} catch (error) {
				const err = new Error(`Error setting key: ${key} - ${error}`);
				this.log.error(`Error setting key: ${key} - ${error}`);
				span.recordException(err);
				span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
				return false;
			}
		});
	};

	public get = async <T>(key: string): Promise<T | null> => {
		return tracerWrapper<T | null>('Getting Memcache Key', async (span) => {
			try {
				this.log.info(`Getting key: ${key}`);
				span.setAttribute('memcache.key', key);
				const { value } = await this.memcacheClient.get(key);
				this.memcacheClient.close();
				if (!value) {
					this.log.info(`Key: ${key} not found`);
					span.setStatus({ code: SpanStatusCode.OK });
					return null;
				}

				const jsonObject: T = JSON.parse(value.toString());
				span.setStatus({ code: SpanStatusCode.OK });
				span.setAttribute('memcache.value', value.toString());
				return jsonObject;
			} catch (error) {
				const err = new Error(`Error getting key: ${key} - ${error}`);
				span.recordException(err);
				span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
				this.log.error(`Error getting key: ${key} - ${error}`);
				return null;
			}
		});
	};

	public async flush(): Promise<void> {
		await this.memcacheClient.flush();
	}

	public close(): void {
		this.memcacheClient.close();
	}
}
