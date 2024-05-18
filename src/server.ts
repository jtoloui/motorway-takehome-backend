import './tracing/tracer';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { newConfig } from './config/config';
import requestIdMiddleware from './middleware/requestIdMiddleware';
import { router } from './routes';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from '../docs/swagger_output.json';
import { SpanStatusCode } from '@opentelemetry/api';

import { addDetailsToCurrentSpan, setSpanStatus } from './tracing/utils/utils';
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

app.use(
	'/api/v1',
	router({
		loggerInstance: config.newLogger,
		logLevel: config.LOG_LEVEL,
	}),
);

if (process.env.NODE_ENV === 'development') {
	app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}

// 404 for any unknown routes
app.use('*', (req: Request, res: Response) => {
	setSpanStatus(SpanStatusCode.ERROR, 'Invalid Route');
	addDetailsToCurrentSpan({
		message: `Route not found: ${req.originalUrl}`,
		path: req.originalUrl,
	});
	return res.status(404).json({ message: 'Not Found' });
});
export default app;
