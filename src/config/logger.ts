import winston, { Logger } from 'winston';
import { z } from 'zod';

export const LoggerSchema = z
	.function()
	.args(z.string(), z.string())
	.returns(z.instanceof(Logger));

export type newLoggerType = z.infer<typeof LoggerSchema>;

// Create a Winston logger instance
export const logger: newLoggerType = (logLvl, label) =>
	winston.createLogger({
		level: logLvl,
		defaultMeta: {
			service: label,
		},
		format: winston.format.combine(
			winston.format.colorize(), // Add this line to enable colorization
			winston.format.timestamp(),
			winston.format.label({ label }),
			winston.format.prettyPrint(),
			winston.format.splat(),
			winston.format.printf(
				({ timestamp, level, message, label, ...props }) => {
					return `${timestamp} [${label}] ${level}: ${message}`;
				},
			),
		),
		transports: [new winston.transports.Console({})],
	});

export default logger;
