import { Router } from 'express';
import { Vehicles } from '../controllers/vehicles/vehicles';
import { ControllerConfig } from '../types/controllers';
import { traceWithDeferRouter } from '../tracing/utils/utils';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../../docs/swagger_output.json';

export const vehiclesRouter = (config: ControllerConfig): Router => {
	const VehiclesController = Vehicles.getInstance(config);

	const routes = Router();

	routes.get(
		'/vehicles/:id/state/:timestamp',
		traceWithDeferRouter(
			VehiclesController.getVehicleStateByTime,
			'Controller - getVehicleStateByTime',
		),
	);

	if (process.env.NODE_ENV === 'development') {
		routes.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
	}

	return routes;
};
