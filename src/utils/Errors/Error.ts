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
	}
}
