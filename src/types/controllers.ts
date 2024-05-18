import { Request } from 'express';
import { newLoggerType } from '../config/logger';

export type ControllerConfig = {
	logLevel: string;
	loggerInstance: newLoggerType;
};

export interface ParamsDictionary {
	[key: string]: string;
}

interface DefaultRequestParams extends ParamsDictionary {}

export interface DefaultRequest extends Request<DefaultRequestParams> {}

export interface GetVehicleStateByTimeParams extends ParamsDictionary {
	id: string;
	timestamp: string;
}

export interface GetVehicleStateByTimeRequest
	extends Request<GetVehicleStateByTimeParams> {}

export type GetVehicleStateByTimeResponse = {
	id: number;
	make: string;
	model: string;
	state: string;
};
