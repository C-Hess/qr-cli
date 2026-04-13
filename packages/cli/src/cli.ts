#!/usr/bin/env node

import { runQrCli } from "./index.js";

try {
	const exitCode = await runQrCli(process.argv.slice(2));
	process.exit(exitCode);
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	console.error(`qrcl: ${message}`);
	process.exit(1);
}
