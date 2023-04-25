import {
  generateMigration,
  revertLastMigration,
  runMigrations,
} from "@vendure/core";
import program from "commander";

import { baseConfig } from "./src/vendure-config";

program
  .command("generate <name>")
  .description("Generate a new migration file with the given name")
  .action((name) => {
    return generateMigration(baseConfig, {
      name,
      outputDir: "./src/migrations",
    });
  });

program
  .command("run")
  .description("Run all pending migrations")
  .action(() => {
    return runMigrations(baseConfig);
  });

program
  .command("revert")
  .description("Revert the last applied migration")
  .action(() => {
    return revertLastMigration(baseConfig);
  });

program.parse(process.argv);
