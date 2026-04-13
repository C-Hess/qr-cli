#!/usr/bin/env node

import { runQrCli } from "./index.js";

const exitCode = runQrCli(process.argv.slice(2));
process.exit(exitCode);
