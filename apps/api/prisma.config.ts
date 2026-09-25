import { defineConfig } from 'prisma/config';

const localDatabaseUrl = 'postgresql://workpulse:workpulse@localhost:5432/workpulse?schema=public';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL ?? localDatabaseUrl,
  },
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
});
