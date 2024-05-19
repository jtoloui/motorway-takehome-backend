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
import opentelemetry from '@opentelemetry/api';
import { newConfig } from '../config/config';

/**
 * Tracing configuration
 *
 * This file is responsible for setting up the tracing configuration for the application.
 * It uses the OpenTelemetry SDK to create a new tracer provider and register it.
 *
 * You will also notice I'm using `getNodeAutoInstrumentations` to automatically instrument all the supported libraries.
 * you can use the env OTEL_NODE_ENABLED_INSTRUMENTATIONS to enable specific instrumentations.
 * e.g. OTEL_NODE_ENABLED_INSTRUMENTATIONS=pg,http,express,winston
 */
const config = newConfig.getInstance().getConfig();
const logger = config.newLogger(config.LOG_LEVEL, 'Tracing');
// used for debugging tracing issues
// opentelemetry.diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

const serviceName = config.OTEL_SERVICE_NAME || 'default-service';
const traceExporterUrl =
	config.OTEL_TRACE_EXPORTER_URL || 'http://localhost:4318/v1/traces';

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
