import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { LangfuseExporter } from 'langfuse-vercel';

let sdk: NodeSDK | null = null;
let started = false;

export const initObservability = () => {
  if (started) return;

  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const baseUrl = process.env.LANGFUSE_BASEURL;

  if (!secretKey || !publicKey) {
    return;
  }

  console.log('LANGFUSE_PUBLIC_KEY', publicKey);
  console.log('LANGFUSE_BASEURL', baseUrl);

  const exporter = new LangfuseExporter({
    secretKey,
    publicKey,
    baseUrl: baseUrl || 'https://cloud.langfuse.com',
  });

  sdk = new NodeSDK({
    traceExporter: exporter,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();

  started = true;
};
