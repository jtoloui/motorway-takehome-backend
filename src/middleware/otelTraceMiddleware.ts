import { Request, Response, NextFunction } from 'express';
import { context, trace } from '@opentelemetry/api';

export function tracingMiddleware(
	req: Request,
	res: Response,
	next: NextFunction,
): void {
	const tracer = trace.getTracer('http-server');
	const span = tracer.startSpan(`${req.method} ${req.url}`, {
		kind: 1,
		attributes: {
			'http.method': req.method,
			'http.url': req.url,
			'http.target': req.originalUrl,
		},
	});

	context.with(trace.setSpan(context.active(), span), () => {
		res.on('finish', () => {
			span.setAttribute('http.status_code', res.statusCode);
			span.end();
		});

		next();
	});
}
