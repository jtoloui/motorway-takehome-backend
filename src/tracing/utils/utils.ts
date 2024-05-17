import { context, trace, Attributes, SpanStatusCode } from '@opentelemetry/api';

interface Event {
	name: string;
	attributes?: Attributes;
}

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

// wrap all routes in a tracing span to capture the request/response + record any errors
export function traceWithDefer<T>(
	func: (...args: any[]) => Promise<T>,
): (...args: any[]) => Promise<T> {
	return async function (...args: any[]): Promise<T> {
		const span = trace.getSpan(context.active());
		try {
			const result = await func(...args);
			return result;
		} catch (error) {
			if (error instanceof Error) {
				if (span) {
					span.setStatus({
						code: SpanStatusCode.ERROR,
						message: error.message,
					});
					span.recordException(error as Error);
				}
			}
			throw error;
		} finally {
			if (span) {
				span.end();
			}
		}
	};
}

export function setSpanStatus(status: SpanStatusCode, message: string): void {
	const span = trace.getSpan(context.active());
	if (span) {
		span.setStatus({
			code: status,
			message,
		});
	}
}
