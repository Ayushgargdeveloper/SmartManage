export const productConfig = {
  name: process.env.PRODUCT_NAME ?? process.env.NEXT_PUBLIC_APP_NAME ?? 'WorkPulse AI',
  supportEmail: 'support@example.com',
} as const;

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  webPort: Number(process.env.WEB_PORT ?? 3000),
  apiPort: Number(process.env.API_PORT ?? 4000),
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000',
  corsOrigin: process.env.API_CORS_ORIGIN ?? 'http://localhost:3000',
} as const;
