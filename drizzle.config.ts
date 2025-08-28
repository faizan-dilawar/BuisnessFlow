import { defineConfig } from "drizzle-kit";

export default defineConfig({
  
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "mysql",
  dbCredentials: {
    host: "localhost",
    user: "root",
    database: "invoiceflow",
    port: 3306,
  },
});
    // password: "",
