#!/usr/bin/env node
import { run } from "./cli.js";

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
