import request from 'supertest';
import app from '../../../server';

describe('Vehicles Controller', () => {
	afterAll(async () => {
		await global.dbClient.end();
		global.cacheClient.close();
	});

	beforeEach(async () => {
		await global.cacheClient.flush();
		jest.clearAllMocks();
	});

	test('GET /vehicle/:id/state/:timestamp', async () => {
		const response = await request(app).get(
			'/api/v1/vehicles/3/state/2024-09-11T17:21:37+00:00',
		);
		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			id: 3,
			make: 'VW',
			model: 'GOLF',
			state: 'sold',
		});
	});

	test('GET /vehicle/:id/state/:timestamp - not found', async () => {
		const response = await request(app).get(
			'/api/v1/vehicles/9999/state/2024-09-11T17:21:37+00:00',
		);
		expect(response.status).toBe(404);
		expect(response.body).toEqual({ error: 'Vehicle not found' });
	});

	test('GET /vehicle/:id/state/:timestamp - invalid timestamp', async () => {
		const response = await request(app).get(
			'/api/v1/vehicles/3/state/2024-09-11T17:21:37',
		);
		expect(response.status).toBe(400);
		expect(response.body).toEqual({ error: 'timestamp Invalid datetime' });
	});

	test('GET /vehicle/:id/state/:timestamp - invalid id', async () => {
		const response = await request(app).get(
			'/api/v1/vehicles/abc/state/2024-09-11T17:21:37+00:00',
		);
		expect(response.status).toBe(400);
		expect(response.body).toEqual({ error: 'id Invalid input' });
	});

	test('GET /vehicle/:id/state/:timestamp - before seller record existed', async () => {
		const response = await request(app).get(
			'/api/v1/vehicles/3/state/2020-09-11T17:21:37+00:00',
		);
		expect(response.status).toBe(404);
		expect(response.body).toEqual({ error: 'Seller information not found' });
	});

	test('GET /unknown', async () => {
		const response = await request(app).get('/anything');
		expect(response.status).toBe(404);
		expect(response.body).toEqual({ error: 'Not Found' });
	});
});
