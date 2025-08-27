import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import * as schema from "../shared/schema";
import path from "path";

let dbInstance: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (dbInstance) return dbInstance;

  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "invoiceflow",
  });

  const db = drizzle(connection, { schema, mode: "default" });

  // ✅ Run migrations once on startup
  // await migrate(db, {
  //   migrationsFolder: path.join(process.cwd(), "migrations"),
  // });

  dbInstance = db;
  return dbInstance;
}
