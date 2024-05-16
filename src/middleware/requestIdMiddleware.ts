import { NextFunction, Request, Response } from 'express';
import * as uuid from 'uuid';

function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
	const id = uuid.v4();

	req.requestId = id;
	next();
}

export default requestIdMiddleware;
