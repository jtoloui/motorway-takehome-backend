import { ParseGetVehicleStateByTimeRequest } from '../validators';

describe('ParseGetVehicleStateByTimeRequest', () => {
	test('should return parsed request - valid', () => {
		const payload = {
			id: '3',
			timestamp: '2024-09-11T17:21:37+00:00',
		};

		const result = ParseGetVehicleStateByTimeRequest(payload);

		expect(result).toEqual({
			id: 3,
			timestamp: '2024-09-11T17:21:37+00:00',
		});
	});

	test('should return parsed request - invalid id', () => {
		const payload = {
			id: 'abc',
			timestamp: '2024-09-11T17:21:37+00:00',
		};

		expect(() => ParseGetVehicleStateByTimeRequest(payload)).toThrow(
			'Bad Request',
		);
	});

	test('should return parsed request - invalid timestamp ISO 8601', () => {
		const payload = {
			id: '3',
			timestamp: '2024-09-11T17:21:37',
		};

		expect(() => ParseGetVehicleStateByTimeRequest(payload)).toThrow(
			'Bad Request',
		);
	});
});
