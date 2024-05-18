import { Request, Response, NextFunction } from 'express';
import { context, trace, SpanStatusCode } from '@opentelemetry/api';
import { tracer } from '../tracing/tracer';

export function tracingMiddleware(
	req: Request,
	res: Response,
	next: NextFunction,
): void {
	// const tracer = trace.getTracer('http-server');
	const span = tracer.startSpan(`${req.method} ${req.originalUrl}`, {
		kind: 1,
		attributes: {
			'http.method': req.method,
			'http.url': req.url,
			'http.target': req.originalUrl,
		},
	});

	const finishSpan = () => {
		if (res.statusCode >= 400) {
			span.setStatus({ code: SpanStatusCode.ERROR });
		}
		span.setAttribute('http.status_code', res.statusCode);
		span.end();
	};

	res.once('finish', finishSpan);
	res.once('close', finishSpan);

	context.with(trace.setSpan(context.active(), span), () => {
		next();
	});
}
