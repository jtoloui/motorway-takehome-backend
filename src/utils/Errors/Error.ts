import { SpanStatusCode } from '@opentelemetry/api';
import {
	addDetailsToCurrentSpan,
	setSpanStatus,
} from '../../tracing/utils/utils';

type cause = {
	status: number;
	message: unknown;
};

export class ServiceError extends Error {
	public cause: cause;

	constructor(message: string, cause: cause) {
		super(message);
		this.name = 'ServiceError';
		this.cause = cause;

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}

		console.log(this.stack);
		addDetailsToCurrentSpan({
			stack: this.stack,
		});

		// built in tracing for all service errors that we set
		setSpanStatus(SpanStatusCode.ERROR, this.cause.message as string);
	}
}
