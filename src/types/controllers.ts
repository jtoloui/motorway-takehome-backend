import { newLoggerType } from '../config/logger';

export type ControllerConfig = {
	logLevel: string;
	loggerInstance: newLoggerType;
};
