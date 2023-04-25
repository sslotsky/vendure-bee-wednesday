import { bootstrap, runMigrations } from "@vendure/core";
import { getConfig } from "./vendure-config";

getConfig().then((config) => {
  runMigrations(config)
    .then(() => bootstrap(config))
    .catch((err) => {
      console.log(err);
    });
});
