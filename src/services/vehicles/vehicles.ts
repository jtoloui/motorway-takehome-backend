import { Logger } from 'winston';
import { ControllerConfig } from '../../types/controllers';
import { ServiceError } from '../../utils/Errors/Error';

export class Vehicles {
	private static instance: Vehicles;
	private log: Logger;

	constructor(config: ControllerConfig) {
		this.log = config.loggerInstance(config.logLevel, 'VehiclesService');
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
	}): Promise<string> => {
		try {
			this.log.info(
				`Vehicle ID: ${id} - Timestamp: ${timestamp} - Get Vehicle State By Time`,
			);

			return 'Hello World';
		} catch (error) {
			this.log.error(`Error: ${error}`);

			if (error instanceof ServiceError) {
				throw error;
			}

			return 'Internal Server Error';
		}
	};
}
