import { NextFunction, Request, Response } from 'express';
import { Logger } from 'winston';

export function InboundOutboundMiddleware(logger: Logger) {
	const middleware = function InboundOutboundTimingMiddleware(
		req: Request,
		res: Response,
		next: NextFunction,
	) {
		const start = process.hrtime();
		const calculateResponseTime = () => {
			const diff = process.hrtime(start);
			const responseTime = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(3);
			logger.info(
				`Request ID: ${req.requestId} - HTTP (Outbound) ${req.method} ${req.url} - Status: ${res.statusCode} - ${res.statusMessage} - ${responseTime}ms`,
			);
		};

		logger.info(
			`Request ID: ${req.requestId} - HTTP (Inbound) ${req.method} ${req.url}`,
		);

		res.on('finish', calculateResponseTime);

		next();
	};

	return middleware;
}
