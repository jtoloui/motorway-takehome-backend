import './tracing/tracer';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { newConfig } from './config/config';
import requestIdMiddleware from './middleware/requestIdMiddleware';
import { defaultRouter, vehiclesRouter } from './routes';
import { InboundOutboundMiddleware } from './middleware/InboundOutboundMiddleware';
import { tracingMiddleware } from './middleware/otelTraceMiddleware';

const config = newConfig.getInstance().validate().getConfig();

const app = express();

const logger = config.newLogger(config.LOG_LEVEL, 'Routes');
app.use(
	tracingMiddleware,
	requestIdMiddleware,
	InboundOutboundMiddleware(logger),
	express.json(),
	express.urlencoded({ extended: true }),
	cors(),
	helmet(),
);

// v1 routes for vehicles + swagger
app.use(
	'/api/v1',
	vehiclesRouter({
		loggerInstance: config.newLogger,
		logLevel: config.LOG_LEVEL,
	}),
);

// catch all
app.use('*', defaultRouter());

export default app;
