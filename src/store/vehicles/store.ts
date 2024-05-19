import { Logger } from 'winston';
import { ControllerConfig } from '../../types/controllers';
import { Pool, PoolClient } from 'pg';
import pool from '../../config/database';
import { ServiceError } from '../../utils/Errors/Error';
import Vehicles from '../../generated/types/public/Vehicles';
import { tracerWrapper } from '../../tracing/utils/utils';

/**
 * Gone for a CTE approach to get the state of the vehicle at a given time.
 * The query will look at the time and what is less or equal while also ordering
 * the seller logs in descending order of the timestamp
 * if the timestamp given is much less that the first seller log no records are returned
 * 								|--------------|------------------|------------------
 * <not found>		|quoted				 |selling						|sold and beyond
 */
const GET_VEHICLE_STATE_BY_TIME_QUERY = `
WITH StateLogsCTE AS (
	SELECT
		sl. "vehicleId",
		sl. "state",
		sl. "timestamp"
	FROM
		"stateLogs" sl
	WHERE
		sl. "vehicleId" = $2
		AND sl. "timestamp" <= $1::TIMESTAMP
	ORDER BY
		sl. "timestamp" DESC
	LIMIT 1
)
SELECT
	v.id,
	v.make,
	v.model,
	sl. "state",
	sl. "timestamp"
FROM
	vehicles v
	JOIN StateLogsCTE sl ON v.id = sl. "vehicleId"
WHERE
	v.id = $2;
`;

export type VehicleStateByTimeQueryResult = {
	id: number;
	make: string;
	model: string;
	state: string;
	timestamp: string;
};

/**
 * The store service interface
 *
 * This store class is responsible for all the database operations and holds no business logic
 * The store layer doesn't use any ORM or query builder to keep the code simple and easy to understand
 * This also means it can be more extensible and easier to maintain
 */

interface StoreService {
	getVehicleStateByTime: (
		client: PoolClient,
		{
			id,
			timestamp,
		}: {
			id: number;
			timestamp: string;
		},
	) => Promise<VehicleStateByTimeQueryResult>;
	getVehicleById: (client: PoolClient, id: number) => Promise<Vehicles>;
	withTransaction: <T>(
		callback: (client: PoolClient) => Promise<T>,
	) => Promise<T>;
}

export class Store implements StoreService {
	private static instance: Store;
	private log: Logger;
	private pool: Pool;

	constructor(config: ControllerConfig) {
		this.log = config.loggerInstance(config.logLevel, 'VehicleStore');
		this.pool = pool;
	}

	public static getInstance(config: ControllerConfig): Store {
		if (!Store.instance) {
			Store.instance = new Store(config);
		}
		return Store.instance;
	}

	public getVehicleStateByTime = async (
		client: PoolClient,
		{
			id,
			timestamp,
		}: {
			id: number;
			timestamp: string;
		},
	): Promise<VehicleStateByTimeQueryResult> => {
		return tracerWrapper<VehicleStateByTimeQueryResult>(
			'Store - getVehicleStateByTime',
			async () => {
				try {
					this.log.info(
						`Vehicle ID: ${id} - Timestamp: ${timestamp} - Get Vehicle State By Time`,
					);

					const { rows } = await client.query<VehicleStateByTimeQueryResult>(
						GET_VEHICLE_STATE_BY_TIME_QUERY,
						[timestamp, id],
					);

					return rows[0];
				} catch (error) {
					this.log.error(`Error: ${error}`);

					if (error instanceof ServiceError) {
						throw error;
					}

					throw new Error('Internal Server Error');
				}
			},
		);
	};

	public getVehicleById = async (
		client: PoolClient,
		id: number,
	): Promise<Vehicles> => {
		return tracerWrapper<Vehicles>('Store - getVehicleById', async () => {
			try {
				this.log.info(`Vehicle ID: ${id} - Get Vehicle By ID`);

				const { rows } = await client.query<Vehicles>(
					'SELECT * FROM vehicles WHERE id = $1 LIMIT 1',
					[id],
				);

				return rows[0];
			} catch (error) {
				this.log.error(`Error: ${error}`);

				if (error instanceof ServiceError) {
					throw error;
				}

				throw new Error('Internal Server Error');
			}
		});
	};

	public withTransaction = async <T>(
		callback: (client: PoolClient) => Promise<T>,
	): Promise<T> => {
		return tracerWrapper<T>('Store - withTransaction', async () => {
			const client = await this.getClient();
			try {
				this.log.info('Starting transaction');
				const result = await callback(client);
				await this.commit(client);
				this.log.info('Transaction committed');
				return result;
			} catch (error) {
				await this.rollback(client);
				this.log.error(`Transaction rolled back - Error: ${error}`);
				throw error;
			}
		});
	};

	public async closePool() {
		await this.pool.end();
	}

	private async getClient(): Promise<PoolClient> {
		const client = await this.pool.connect();
		await client.query('BEGIN');
		return client;
	}

	private async commit(client: PoolClient): Promise<void> {
		await client.query('COMMIT');
		client.release();
	}

	private async rollback(client: PoolClient): Promise<void> {
		await client.query('ROLLBACK');
		client.release();
	}
}
