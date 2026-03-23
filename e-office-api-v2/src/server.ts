import { cors } from "@elysiajs/cors";
import { serverTiming } from "@elysiajs/server-timing";
import { swagger } from "@elysiajs/swagger";
import { auth } from "@backend/lib/auth.ts";
import { Elysia } from "elysia";
import { autoload } from "elysia-autoload";
import env from "env-var";


console.log("--- SERVER INITIALIZED ---");

export const app = new Elysia()
	.use(swagger())
	.use(
		cors({

			origin: ["http://localhost:3000", "http://localhost:3001", "http://10.137.58.124:20051"],
			methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
			credentials: true,
			allowedHeaders: ["Content-Type", "Authorization"],
		}),
	)
	.use(serverTiming())
	.all("/api/auth/*", ({ request }) => auth.handler(request))
	.use(
		await autoload({
			types: {
				output: "./autogen.routes.ts",
				typeName: "App",
				useExport: true,
			},
		}),
	)

export type App = typeof app;
