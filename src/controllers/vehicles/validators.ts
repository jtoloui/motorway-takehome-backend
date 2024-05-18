import { tracer } from '../../tracing/tracer';
import { ServiceError } from '../../utils/Errors/Error';
import { z } from 'zod';

const GetVehicleStateByTimeRequest = z.object({
	id: z
		.string()
		.min(1)
		.refine((val) => /^\d+$/.test(val), {
			message: 'Invalid input',
		})
		.refine((id) => {
			return !isNaN(parseInt(id, 10));
		}),
	timestamp: z.string().datetime({ offset: true }),
});

export const ParseGetVehicleStateByTimeRequest = (request: {
	id: string;
	timestamp: string;
}) => {
	const span = tracer.startSpan('ParseGetVehicleStateByTimeRequest');
	const { id, timestamp } = request;
	const cleanId = id.trim();

	const parsedValues = GetVehicleStateByTimeRequest.safeParse({
		id: cleanId,
		timestamp,
	});

	if (!parsedValues.success) {
		const reason = parsedValues.error.errors?.[0].message;
		const field = parsedValues.error.errors?.[0].path[0];

		throw new ServiceError('Bad Request', {
			status: 400,
			message: `${field} ${reason}`,
		});
	}

	span.end();
	return {
		id: parseInt(cleanId, 10),
		timestamp,
	};
};
