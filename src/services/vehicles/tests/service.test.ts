import { ControllerConfig } from '../../../types/controllers';
import { Vehicles } from '../service';
import logger from '../../../config/logger';
import { VehicleStateByTimeQueryResult } from '../../../store/vehicles/store';

const config: ControllerConfig = {
	loggerInstance: (level, name) => logger(level, name),
	logLevel: '',
};

const vehicleService = Vehicles.getInstance(config);

describe('Vehicles Service', () => {
	afterAll(async () => {
		await global.dbClient.end();
		global.cacheClient.close();
	});

	beforeEach(async () => {
		await global.cacheClient.flush();
		jest.clearAllMocks();
	});

	test('should return vehicle state from cache', async () => {
		const cacheKey = 'vehicle-state-1-2022-09-12 10:00:00+00';
		const cachedResult: VehicleStateByTimeQueryResult = {
			id: 1,
			make: 'Audi',
			model: 'A3',
			state: 'selling',
			timestamp: '2022-09-12 10:00:00+00',
		};

		await global.cacheClient.set(cacheKey, JSON.stringify(cachedResult));

		const result = await vehicleService.getVehicleStateByTime({
			id: 1,
			timestamp: '2022-09-12 10:00:00+00',
		});

		expect(result).toEqual(cachedResult);
	});

	test('should return vehicle state from database if not in cache', async () => {
		const result = await vehicleService.getVehicleStateByTime({
			id: 1,
			timestamp: '2022-09-12 10:00:00+00',
		});

		/**
		 * not ideal as the timestamp is coming back as an type of object but
		 * but as the test focus isn't on the data itself at this point
		 * it is acceptable
		 */
		expect(result).toMatchObject({
			id: 1,
			make: 'BMW',
			model: 'X1',
			state: 'quoted',
			timestamp: expect.any(Object),
		});

		const cacheKey = 'vehicle-state-1-2022-09-12 10:00:00+00';
		const cachedValue = await global.cacheClient.get(cacheKey);
		expect(cachedValue).not.toBeNull();
		if (!cachedValue.value) return;
		const cachedResult = JSON.parse(cachedValue.value.toString() || '');

		expect(cachedResult).toMatchObject({
			...result,
			timestamp: new Date(result.timestamp).toISOString(),
		});
	});

	test('should handle vehicle not found error', async () => {
		await expect(
			vehicleService.getVehicleStateByTime({
				id: 999,
				timestamp: '2022-09-12 10:00:00+00',
			}),
		).rejects.toThrow('Vehicle not found');
	});
});
