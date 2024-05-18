import { Router } from 'express';
import { Vehicles } from '../controllers/vehicles/vehicles';
import { ControllerConfig } from '../types/controllers';
import { traceWithDefer } from '../tracing/utils/utils';

export const router = (config: ControllerConfig): Router => {
	const VehiclesController = Vehicles.getInstance(config);

	const routes = Router();

	routes.get(
		'/vehicles/:id/state/:timestamp',
		traceWithDefer(
			VehiclesController.getVehicleStateByTime,
			'Router - getVehicleStateByTime',
		),
	);

	return routes;
};
