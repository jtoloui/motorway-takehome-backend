import { Logger } from 'winston';
import { ControllerConfig } from '../../types/controllers';
import { Request, Response } from 'express';
import { ParseGetVehicleStateByTimeRequest } from './validators';
import { ServiceError } from '../../utils/Errors/Error';
import { Vehicles as VehicleService } from '../../services/vehicles/service';
import { VehicleStateByTimeQueryResult } from '../../store/vehicles/store';

interface GetVehicleStateByTimeRequest {
	id: string;
	timestamp: string;
}

type GetVehicleStateByTimeResponse = {
	id: number;
	make: string;
	model: string;
	state: string;
};

export class Vehicles {
	private static instance: Vehicles;
	private log: Logger;
	private service: VehicleService;

	constructor(config: ControllerConfig) {
		this.log = config.loggerInstance(config.logLevel, 'VehiclesController');
		this.service = VehicleService.getInstance(config);
	}

	public static getInstance(config: ControllerConfig): Vehicles {
		if (!Vehicles.instance) {
			Vehicles.instance = new Vehicles(config);
		}
		return Vehicles.instance;
	}

	public getVehicleStateByTime = async (
		req: Request<GetVehicleStateByTimeRequest>,
		res: Response,
	): Promise<Response> => {
		try {
			const { id, timestamp } = req.params;
			this.log.info(
				`Request ID: ${req.requestId} - Vehicle ID: ${id} - Timestamp: ${timestamp} - Get Vehicle State By Time`,
			);
			// Validate the request and clean the payload
			const cleanPayload = ParseGetVehicleStateByTimeRequest({
				id,
				timestamp,
			});

			const vehicleData =
				await this.service.getVehicleStateByTime(cleanPayload);

			return res.status(200).json({
				...this.getVehicleStateByTimeResponseMapper(vehicleData),
			});
		} catch (error) {
			this.log.error(`Request ID: ${req.requestId} - Error: ${error}`);

			// custom error handling using ServiceError
			if (error instanceof ServiceError) {
				return res.status(error.cause.status).json({
					error: error.cause.message,
				});
			}
			return res.status(500).json({
				message: 'Internal Server Error',
			});
		}
	};

	private getVehicleStateByTimeResponseMapper = (
		vehicleData: VehicleStateByTimeQueryResult,
	): GetVehicleStateByTimeResponse => {
		return {
			id: vehicleData.id,
			make: vehicleData.make,
			model: vehicleData.model,
			state: vehicleData.state,
		};
	};
}
