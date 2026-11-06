import { defineConfig } from "prisma/config";

const rawUrl =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_i7Eou0AUebmj@ep-flat-dawn-b9bio6n2-pooler.c-7.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: rawUrl,
  },
});
