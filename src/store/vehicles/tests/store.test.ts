import logger from '../../../config/logger';
import { ControllerConfig } from '../../../types/controllers';
import { Store } from '../store';

const config: ControllerConfig = {
	loggerInstance: (level, name) => logger(level, name),
	logLevel: '',
};

const store = Store.getInstance(config);

describe('Vehicles Store', () => {
	afterAll(async () => {
		await global.dbClient.end();
		store.closePool();
	});

	beforeEach(async () => {
		jest.clearAllMocks();
	});

	test('look up vehicle by ID - success', async () => {
		const result = await store.withTransaction(async (client) => {
			return store.getVehicleById(client, 1);
		});

		expect(result).toMatchObject({
			id: 1,
			make: 'BMW',
			model: 'X1',
			state: 'quoted',
		});
	});

	test('look up vehicle by ID - failure', async () => {
		await expect(
			store.withTransaction(async (client) => {
				return store.getVehicleById(client, 100);
			}),
		).rejects.toThrow('Vehicle not found');
	});

	test('look up vehicle state by time - time above the last seller record', async () => {
		const result = await store.withTransaction(async (client) => {
			return store.getVehicleStateByTime(client, {
				id: 3,
				timestamp: '2024-09-12 10:00:00+00',
			});
		});

		expect(result).toMatchObject({
			id: 3,
			make: 'VW',
			model: 'GOLF',
			state: 'sold',
			timestamp: expect.any(Object),
		});
	});

	test('look up vehicle state by time - time below the last selling record', async () => {
		/**
		 * setting the second 1 below the selling record to validate it's still within
		 * the quoted state
		 */
		const result = await store.withTransaction(async (client) => {
			return store.getVehicleStateByTime(client, {
				id: 3,
				timestamp: '2022-09-11 23:21:37+00',
			});
		});

		expect(result).toMatchObject({
			id: 3,
			make: 'VW',
			model: 'GOLF',
			state: 'quoted',
			timestamp: expect.any(Object),
		});
	});

	test('look up a seller record before it was quoted', async () => {
		await expect(
			store.withTransaction(async (client) => {
				return store.getVehicleStateByTime(client, {
					id: 3,
					timestamp: '1970-09-11 23:21:37+00',
				});
			}),
		).rejects.toThrow('Seller information not found');
	});
});
