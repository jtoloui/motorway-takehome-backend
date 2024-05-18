import { Response, Router } from 'express';
import { traceWithDeferRouter } from '../tracing/utils/utils';
import { ServiceError } from '../utils/Errors/Error';
import { DefaultRequest } from '../types/controllers';

export const defaultRouter = (): Router => {
	const routes = Router();

	routes.use(
		'*',
		traceWithDeferRouter<DefaultRequest, Response>(async (req, res) => {
			try {
				throw new ServiceError('Not Found', {
					status: 404,
					message: 'Not Found',
				});
			} catch (error) {
				if (error instanceof ServiceError) {
					return res.status(error.cause.status).json({
						error: error.cause.message,
					});
				}
				return res.status(500).json({
					message: 'Internal Server Error',
				});
			}
		}, 'Unknown Routes'),
	);

	return routes;
};
