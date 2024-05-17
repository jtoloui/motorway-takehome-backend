import { Logger } from 'winston';
import { ControllerConfig } from '../../types/controllers';
import { ServiceError } from '../../utils/Errors/Error';
import {
	Store,
	VehicleStateByTimeQueryResult,
} from '../../store/vehicles/store';
import { Memcache } from '../../utils/Memcache/Memcache';
import { addDetailsToCurrentSpan } from '../../tracing/utils/utils';

export class Vehicles {
	private static instance: Vehicles;
	private log: Logger;
	private store: Store;
	private cacheStore: Memcache;

	constructor(config: ControllerConfig) {
		this.log = config.loggerInstance(config.logLevel, 'VehiclesService');
		this.store = Store.getInstance(config);
		this.cacheStore = Memcache.getInstance(config);
	}

	public static getInstance(config: ControllerConfig): Vehicles {
		if (!Vehicles.instance) {
			Vehicles.instance = new Vehicles(config);
		}
		return Vehicles.instance;
	}

	public getVehicleStateByTime = async ({
		id,
		timestamp,
	}: {
		id: number;
		timestamp: string;
	}): Promise<VehicleStateByTimeQueryResult> => {
		try {
			this.log.info(
				`Vehicle ID: ${id} - Timestamp: ${timestamp} - Get Vehicle State By Time`,
			);
			const cacheKey = `vehicle-state-${id}-${timestamp}`;
			const cachedValue =
				await this.cacheStore.get<VehicleStateByTimeQueryResult>(cacheKey);

			if (cachedValue) {
				/**
				 * Caching layer and check
				 * this is just a simple example of how to extend the tracing further
				 * manually if there isn't a supported instrumentation library
				 */
				addDetailsToCurrentSpan(
					{
						'cache-lookup': true,
					},
					[
						{
							name: 'cache-lookup',
							attributes: {
								'cache-key': `vehicle-state-${id}-${timestamp}`,
							},
						},
					],
				);
				this.log.info(
					`Vehicle ID: ${id} - Timestamp: ${timestamp} - Cache Hit`,
				);
				return cachedValue;
			}
			addDetailsToCurrentSpan({
				'cache-lookup': false,
			});
			const vehicleState = await this.store.withTransaction(async (client) => {
				await this.store.getVehicleById(client, id);
				const vehicleStateResult = await this.store.getVehicleStateByTime(
					client,
					{
						id,
						timestamp,
					},
				);
				return vehicleStateResult;
			});

			this.log.info(`Vehicle ID: ${id} - Timestamp: ${timestamp} - Cache Miss`);
			await this.cacheStore.set(cacheKey, JSON.stringify(vehicleState));

			return vehicleState;
		} catch (error) {
			this.log.error(`Error: ${error}`);
			if (error instanceof ServiceError) {
				throw error;
			}

			throw error;
		}
	};
}
