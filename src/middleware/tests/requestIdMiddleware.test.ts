import request from 'supertest';
import express, { Request } from 'express';
import requestIdMiddleware from '../requestIdMiddleware';
import * as uuid from 'uuid';

const app = express();

app.use(requestIdMiddleware);

app.get('/test', (req: Request, res) => {
	res.json({ requestId: req.requestId });
});

describe('Request ID Middleware', () => {
	test('should add a request ID to the request', async () => {
		const response = await request(app).get('/test');
		expect(response.body).toHaveProperty('requestId');
		expect(uuid.validate(response.body.requestId)).toBe(true);
	});
});
