import { Logger } from 'winston';
import {
	ControllerConfig,
	GetVehicleStateByTimeRequest,
	GetVehicleStateByTimeResponse,
} from '../../types/controllers';
import { Response } from 'express';
import { ParseGetVehicleStateByTimeRequest } from './validators';
import { ServiceError } from '../../utils/Errors/Error';
import { Vehicles as VehicleService } from '../../services/vehicles/service';
import { VehicleStateByTimeQueryResult } from '../../store/vehicles/store';
import { tracer } from '../../tracing/tracer';
import { context } from '@opentelemetry/api';

interface VehiclesController {
	getVehicleStateByTime: (
		req: GetVehicleStateByTimeRequest,
		res: Response,
	) => Promise<Response>;
}

export class Vehicles implements VehiclesController {
	private static instance: Vehicles;
	private log: Logger;
	private service: VehicleService;

	constructor(config: ControllerConfig) {
		this.log = config.loggerInstance(config.logLevel, 'VehiclesController');
		this.service = VehicleService.getInstance(config);
	}

	// Prevents the creation of multiple instances of the Vehicles class
	public static getInstance(config: ControllerConfig): Vehicles {
		if (!Vehicles.instance) {
			Vehicles.instance = new Vehicles(config);
		}
		return Vehicles.instance;
	}

	/**
	 * Get Vehicle State By Time frame
	 */
	public getVehicleStateByTime = async (
		req: GetVehicleStateByTimeRequest,
		res: Response,
	): Promise<Response> => {
		const span = tracer.startSpan(
			'getVehicleStateByTime',
			undefined,
			context.active(),
		);
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

			const response =
				await this.getVehicleStateByTimeResponseMapper(vehicleData);

			return res.status(200).json({
				...response,
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
		} finally {
			span.end();
		}
	};

	/**
	 * Mapper for the GetVehicleStateByTimeResponse
	 * Allows more control over the response object
	 */
	private getVehicleStateByTimeResponseMapper = async (
		vehicleData: VehicleStateByTimeQueryResult,
	): Promise<GetVehicleStateByTimeResponse> => {
		const span = tracer.startSpan(
			'getVehicleStateByTimeResponseMapper',
			undefined,
			context.active(),
		);
		try {
			span.end();
			return {
				id: vehicleData.id,
				make: vehicleData.make,
				model: vehicleData.model,
				state: vehicleData.state,
			};
		} finally {
			span.end();
		}
	};
}
