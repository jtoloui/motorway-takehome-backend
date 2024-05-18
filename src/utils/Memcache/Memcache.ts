import { Logger } from 'winston';
import memjs from 'memjs';
import { ControllerConfig } from '../../types/controllers';
import { newConfig } from '../../config/config';
import { tracer } from '../../tracing/tracer';
import { SpanKind, SpanStatusCode, context } from '@opentelemetry/api';

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
		const span = tracer.startSpan(
			'memcache.set',
			{
				kind: SpanKind.CLIENT,
				attributes: { 'memcache.key': key },
			},
			context.active(),
		);

		try {
			this.log.info(`Setting key: ${key}`);
			span.setStatus({ code: SpanStatusCode.OK });
			await this.memcacheClient.set(key, value, { expires: ttl });
			return true;
		} catch (error) {
			const err = new Error(`Error setting key: ${key} - ${error}`);
			span.recordException(err);
			span.setStatus({ code: SpanStatusCode.ERROR, message: err.message }); // Set status to ERROR
			this.log.error(`Error setting key: ${key} - ${error}`);
			return false;
		} finally {
			span.end();
		}
	};

	public get = async <T>(key: string): Promise<T | null> => {
		const span = tracer.startSpan(
			'memcache.get',
			{
				kind: SpanKind.CLIENT,
				attributes: { 'memcache.key': key },
			},
			context.active(),
		);
		try {
			this.log.info(`Getting key: ${key}`);
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
		} finally {
			span.end();
		}
	};

	public async flush(): Promise<void> {
		await this.memcacheClient.flush();
	}

	public close(): void {
		this.memcacheClient.close();
	}
}
