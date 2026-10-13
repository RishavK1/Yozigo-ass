import { createApp } from "./app";
import { env } from "./config/env";
import { startHoldExpiryJob } from "./jobs/holdExpiry.job";

const app = createApp();

app.listen(env.port, () => {
  console.log(`Yozigo backend listening on port ${env.port} (${env.nodeEnv})`);
  startHoldExpiryJob();
});
