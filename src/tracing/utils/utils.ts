import {
	context,
	trace,
	Attributes,
	SpanStatusCode,
	Span,
} from '@opentelemetry/api';
import { tracer } from '../tracer';
import { NextFunction, Request, Response } from 'express';
import { ServiceError } from '../../utils/Errors/Error';

interface Event {
	name: string;
	attributes?: Attributes;
}

type RouteHandler<T extends Request, U> = (
	req: T,
	res: Response,
	next: NextFunction,
) => Promise<U>;

// Add attributes and events to the current span
export function addDetailsToCurrentSpan(
	attributes?: Attributes,
	events?: Event[],
): void {
	const span = trace.getSpan(context.active());
	if (span) {
		if (attributes) {
			for (const [key, value] of Object.entries(attributes)) {
				if (value !== undefined) span.setAttribute(key, value);
			}
		}
		if (events) {
			for (const event of events) {
				span.addEvent(event.name, event.attributes);
			}
		}
	}
}

// Router middleware to mimic similar go patterns for a defer trace log
export function traceWithDeferRouter<T extends Request, U extends Response>(
	func: RouteHandler<T, U>,
	spanName: string,
): RouteHandler<T, U> {
	return async function (
		req: T,
		res: Response,
		next: NextFunction,
	): Promise<U> {
		const span = tracer.startSpan(spanName, undefined, context.active());

		try {
			const routerResult = await context.with(
				trace.setSpan(context.active(), span),
				() => func(req, res, next),
			);

			if (routerResult.statusCode >= 400) {
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: res.statusMessage,
				});
			}
			return routerResult;
		} catch (error) {
			if (error instanceof Error || error instanceof ServiceError) {
				span.setStatus({
					code: SpanStatusCode.ERROR,
					message: error.message,
				});
				span.recordException(error);
			}
			next(error);
			throw error;
		} finally {
			span.end();
		}
	};
}

export function setSpanStatus(status: SpanStatusCode, message: string): void {
	const span = tracer.startSpan(message, undefined, context.active());
	span.setStatus({
		code: status,
		message,
	});

	span.end();
}

/**
 * Unlike the `traceWithDefer` function, this function is used to wrap a function
 * with a span and trace the function's execution.
 */
export async function tracerWrapper<T>(
	spanName: string,
	fn: (span: Span) => Promise<T>,
): Promise<T> {
	const span = tracer.startSpan(spanName, undefined, context.active());

	try {
		return await context.with(trace.setSpan(context.active(), span), () =>
			fn(span),
		);
	} catch (error) {
		if (error instanceof Error || error instanceof ServiceError) {
			span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
			span.recordException(error);
			throw error;
		}

		const err = new Error(`Error: ${error}`);
		span.recordException(err);
		span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
		throw error;
	} finally {
		span.end();
	}
}
