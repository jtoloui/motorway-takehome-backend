import express, { type Application } from 'express';
import cors from 'cors';
import pool from './config/database';
import Vehicles from './types/public/Vehicles';
import helmet from 'helmet';

const app: Application = express();

app.use(
	express.json(),
	express.urlencoded({ extended: true }),
	cors(),
	helmet(),
);

app.get('/', async (req, res) => {
	try {
		const query = await pool.query<Vehicles>('select * from vehicles');
		res.status(200).json({
			message: 'Success',
			data: query.rows,
		});
	} catch (error) {
		console.log(error);
	}
});

export default app;
