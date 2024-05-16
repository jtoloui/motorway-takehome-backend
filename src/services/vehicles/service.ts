import { Logger } from 'winston';
import { ControllerConfig } from '../../types/controllers';
import { ServiceError } from '../../utils/Errors/Error';
import {
	Store,
	VehicleStateByTimeQueryResult,
} from '../../store/vehicles/store';

export class Vehicles {
	private static instance: Vehicles;
	private log: Logger;
	private store: Store;

	constructor(config: ControllerConfig) {
		this.log = config.loggerInstance(config.logLevel, 'VehiclesService');
		this.store = Store.getInstance(config);
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
	}): Promise<VehicleStateByTimeQueryResult | string> => {
		try {
			this.log.info(
				`Vehicle ID: ${id} - Timestamp: ${timestamp} - Get Vehicle State By Time`,
			);
			await this.store.getVehicleById(id);
			const vehicleState = await this.store.getVehicleStateByTime({
				id,
				timestamp,
			});

			return vehicleState;
		} catch (error) {
			this.log.error(`Error: ${error}`);

			if (error instanceof ServiceError) {
				throw error;
			}

			return 'Internal Server Error';
		}
	};
}
