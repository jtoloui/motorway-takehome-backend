import { z } from 'zod';
import logger, { LoggerSchema } from './logger';
import { Logger } from 'winston';
import dotenv from 'dotenv';

dotenv.config();

export const ConfigSchema = z.object({
	DB_USER: z.string(),
	DB_HOST: z.string(),
	DB_NAME: z.string(),
	DB_PASSWORD: z.string(),
	DB_PORT: z.string(),
	LOG_LEVEL: z.string(),
	PORT: z.number(),
	log: z.instanceof(Logger),
	newLogger: LoggerSchema,
	MEMCACHE_SERVERS: z.string(),
	OTEL_NODE_ENABLED_INSTRUMENTATIONS: z.string(),
	OTEL_NODE_RESOURCE_DETECTORS: z.string().optional(),
	OTEL_TRACE_EXPORTER_URL: z.string(),
	OTEL_LOG_LEVEL: z.string().optional(),
	OTEL_SERVICE_NAME: z.string(),
	OTEL_TRACES_EXPORTER: z.string(),
	NODE_ENV: z.string(),
});

export type ConfigType = z.infer<typeof ConfigSchema>;

/**
 * Config class to load in the config from the env and validate the schema
 * inspired by coding style in go to allow users to easily validate the config
 * and return an instance of the config for further dep injection
 */

export class newConfig {
	private static instance: newConfig;
	private config: ConfigType;
	private log: Logger;
	private logLevel: string;

	constructor() {
		this.logLevel = process.env.LOG_LEVEL || 'info';
		this.log = logger(this.logLevel, 'Config');
		this.config = this.loadConfig();
	}
	public static getInstance(): newConfig {
		if (!newConfig.instance) {
			newConfig.instance = new newConfig();
		}
		return newConfig.instance;
	}
	// Validate the config schema using zod
	public validate(): this {
		const parsedConfig = ConfigSchema.safeParse(this.config);

		if (!parsedConfig.success) {
			this.log.error('Config validation failed');
			this.log.debug(`validating config failed:`, parsedConfig.error);
			process.exit(1);
		}

		this.validateDBCreds();

		this.log.info('Config validated');
		return this;
	}

	public getConfig() {
		return this.loadConfig();
	}

	// Simple mapping method to load in the config from the env
	private loadConfig() {
		return {
			DB_USER: process.env.DB_USER || '',
			DB_HOST: process.env.DB_HOST || '',
			DB_NAME: process.env.DB_NAME || '',
			DB_PASSWORD: process.env.DB_PASSWORD || '',
			DB_PORT: process.env.DB_PORT || '',
			LOG_LEVEL: this.logLevel,
			PORT: Number(process.env.PORT) || 3000,
			log: this.log,
			newLogger: logger,
			MEMCACHE_SERVERS: process.env.MEMCACHE_SERVERS || '',
			OTEL_NODE_ENABLED_INSTRUMENTATIONS:
				process.env.OTEL_NODE_ENABLED_INSTRUMENTATIONS || '',
			OTEL_NODE_RESOURCE_DETECTORS:
				process.env.OTEL_NODE_RESOURCE_DETECTORS || '',
			OTEL_TRACE_EXPORTER_URL:
				process.env.OTEL_TRACE_EXPORTER_URL ||
				'http://localhost:4318/v1/traces',
			OTEL_LOG_LEVEL: process.env.OTEL_LOG_LEVEL || 'info',
			OTEL_SERVICE_NAME: process.env.OTEL_SERVICE_NAME || 'default-service',
			OTEL_TRACES_EXPORTER: process.env.OTEL_TRACES_EXPORTER || 'otlp',
			NODE_ENV: process.env.NODE_ENV || 'development',
		};
	}

	// Validate mandatory database credentials
	private validateDBCreds(): this {
		const { DB_USER, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT } = this.config;

		if (!DB_USER || !DB_HOST || !DB_NAME || !DB_PASSWORD || !DB_PORT) {
			this.log.error('Database credentials are missing');
			process.exit(1);
		}

		this.log.info('Database credentials validated');
		return this;
	}
}
