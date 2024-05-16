import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { newConfig } from './config/config';
import requestIdMiddleware from './middleware/requestIdMiddleware';
import { router } from './routes';

const config = newConfig.getInstance().validate().getConfig();

const app = express();

app.use(
	express.json(),
	express.urlencoded({ extended: true }),
	cors(),
	helmet(),
);
app.use(requestIdMiddleware);

// Middleware to log HTTP Inbound requests
app.use((req: Request, res: Response, next: NextFunction) => {
	const logger = config.newLogger(config.LOG_LEVEL, 'Routes');
	const start = process.hrtime();
	const calculateResponseTime = () => {
		const diff = process.hrtime(start);
		return (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(3);
	};

	logger.info(
		`Request ID: ${req.requestId}- HTTP (Inbound) ${req.method} ${req.url}`,
	);

	res.on('finish', () => {
		logger.info(
			`Request ID: ${req.requestId} - HTTP (Outbound) ${req.method} ${req.url} - Status: ${res.statusCode} - ${res.statusMessage} - ${calculateResponseTime()}ms`,
		);
	});
	next();
});

app.use(
	router({
		loggerInstance: config.newLogger,
		logLevel: config.LOG_LEVEL,
	}),
);

export default app;
