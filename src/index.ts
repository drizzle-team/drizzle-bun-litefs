import { SQLiteBunConnector } from "drizzle-orm-sqlite/bun";
import { Database } from "bun:sqlite";
import minimist from "minimist";
import { users } from "./schema";

const argv = minimist(process.argv.slice(2));

const SQLITE_PATH = argv["sqlite-path"] ?? "db.sqlite3";
const PORT = 8787;

const client = new Database(SQLITE_PATH);
const connector = new SQLiteBunConnector(client);
const db = connector.connect();

// run migrations from ./drizzle folder
connector.migrate({ migrationsFolder: "drizzle" });

Bun.serve<any>({
  port: PORT,
  async fetch(req: Request) {
    const url = new URL(req.url);

    if (url.pathname === "/users" && req.method === "GET") {
      const start = process.hrtime();
      const list = db.select(users).all();
      const end = process.hrtime(start);
      const duration = `${(end[0] * 1000000000 + end[1]) / 1000000}ms`;
      return new Response(
        JSON.stringify({
          users: list,
          region: process.env["FLY_REGION"],
          duration,
        }),
        {
          headers: [["content-type", "application/json"]],
        }
      );
    }

    if (url.pathname === "/users" && req.method === "POST") {
      const newUser = (await req.json()) as {name:string, email:string};
      const start = process.hrtime();
      const user = db.insert(users).values(newUser).returning().get()!;
      const end = process.hrtime(start);
      const duration = `${(end[0] * 1000000000 + end[1]) / 1000000}ms`;

      return new Response(
        JSON.stringify({
          user,
          region: process.env["FLY_REGION"],
          duration,
        }),
        {
          headers: [["content-type", "application/json"]],
        }
      );
    }

    return new Response("Expected a websocket connection", { status: 400 });
  },
});