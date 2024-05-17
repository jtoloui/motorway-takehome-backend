import 'express';
import { Pool } from 'pg';
import Memcached from 'memjs';

declare module 'express' {
	export interface Request {
		requestId?: string;
	}
}

declare global {
	var dbClient: Pool;
	var cacheClient: Memcached.Client;
}
