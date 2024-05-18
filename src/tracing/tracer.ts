import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import {
	AlwaysOnSampler,
	SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import opentelemetry, {
	DiagConsoleLogger,
	DiagLogLevel,
} from '@opentelemetry/api';
import { newConfig } from '../config/config';

const config = newConfig.getInstance().getConfig();
const logger = config.newLogger(config.LOG_LEVEL, 'Tracing');
// used for debugging tracing issues
// opentelemetry.diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

const serviceName = process.env.OTEL_SERVICE_NAME || 'default-service';
const traceExporterUrl =
	process.env.OTEL_TRACE_EXPORTER_URL || 'http://localhost:4318/v1/traces';

const traceExporter = new OTLPTraceExporter({
	url: traceExporterUrl,
});

const provider = new NodeTracerProvider({
	resource: new Resource({
		[SEMRESATTRS_SERVICE_NAME]: serviceName,
	}),
	sampler: new AlwaysOnSampler(),
});

provider.addSpanProcessor(new SimpleSpanProcessor(traceExporter));
provider.register();

registerInstrumentations({
	instrumentations: [getNodeAutoInstrumentations()],
});

opentelemetry.trace.getTracer(serviceName);

logger.info(`Tracing initialized for service: ${serviceName}`);

export const tracer = opentelemetry.trace.getTracer(serviceName);
