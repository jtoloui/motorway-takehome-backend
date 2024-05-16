import { Logger } from 'winston';
import { ControllerConfig } from '../../types/controllers';
import { Pool } from 'pg';
import pool from '../../config/database';
import { ServiceError } from '../../utils/Errors/Error';
import Vehicles from '../../generated/types/public/Vehicles';

const GET_VEHICLE_STATE_BY_TIME_QUERY = `
WITH StateLogsCTE AS (
	SELECT
		sl. "vehicleId",
		sl. "state",
		sl. "timestamp",
		ABS(EXTRACT(EPOCH FROM (sl.timestamp - $1::timestamp))) AS time_diff
	FROM
		"stateLogs" sl
	WHERE
		sl. "vehicleId" = $2
)
SELECT
	v.id, v.make, v.model, sl. "state", sl. "timestamp"
FROM
	vehicles v
	JOIN (
		SELECT
			state,
			timestamp
		FROM
			StateLogsCTE
		ORDER BY
			time_diff
		LIMIT 1) sl ON v.id = $2;
`;

export type VehicleStateByTimeQueryResult = {
	id: number;
	make: string;
	model: string;
	state: string;
	timestamp: string;
};

export class Store {
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

	public getVehicleStateByTime = async ({
		id,
		timestamp,
	}: {
		id: number;
		timestamp: string;
	}): Promise<VehicleStateByTimeQueryResult | string> => {
		try {
			this.log.info(
				`Vehicle ID: ${id} - Timestamp: ${timestamp} - Get Vehicle State By Time`,
			);

			const { rows } = await this.pool.query<VehicleStateByTimeQueryResult>(
				GET_VEHICLE_STATE_BY_TIME_QUERY,
				[timestamp, id],
			);

			if (rows.length === 0) {
				throw new ServiceError('Seller information not found', {
					status: 404,
					message: 'Seller information not found',
				});
			}

			return rows[0];
		} catch (error) {
			this.log.error(`Error: ${error}`);

			if (error instanceof ServiceError) {
				throw error;
			}

			return 'Internal Server Error';
		}
	};

	public getVehicleById = async (id: number): Promise<Vehicles | string> => {
		try {
			this.log.info(`Vehicle ID: ${id} - Get Vehicle By ID`);

			const { rows } = await this.pool.query<Vehicles>(
				'SELECT * FROM vehicles WHERE id = $1',
				[id],
			);

			if (rows.length === 0) {
				throw new ServiceError('Vehicle not found', {
					status: 404,
					message: 'Vehicle not found',
				});
			}

			return rows[0];
		} catch (error) {
			this.log.error(`Error: ${error}`);

			if (error instanceof ServiceError) {
				throw error;
			}

			return 'Internal Server Error';
		}
	};
}
