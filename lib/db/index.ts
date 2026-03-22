import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client/sqlite3";
import * as schema from "./schema";

const client = createClient({ url: "file:sqlite.db" });
export const db = drizzle(client, { schema });
