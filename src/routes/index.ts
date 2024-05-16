import { Router } from 'express';
import { Vehicles } from '../controllers/vehicles/vehicles';
import { ControllerConfig } from '../types/controllers';

export const router = (config: ControllerConfig): Router => {
	const VehiclesController = Vehicles.getInstance(config);

	const routes = Router();

	routes.get(
		'/vehicles/:id/state/:timestamp',
		VehiclesController.getVehicleStateByTime,
	);

	return routes;
};
