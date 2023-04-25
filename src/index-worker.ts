import { bootstrapWorker } from "@vendure/core";
import { getConfig } from "./vendure-config";

getConfig().then((config) => {
  bootstrapWorker(config)
    .then((worker) => worker.startJobQueue())
    .catch((err) => {
      console.log(err);
    });
});
