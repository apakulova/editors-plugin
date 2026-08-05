const { QueueClient } = require("@vercel/queue");
const { deliverQueuedAnalyticsPayload } = require("../../scripts/lib/analytics-capture");

const queue = new QueueClient();

module.exports = queue.handleNodeCallback(async (message, metadata) => {
  await deliverQueuedAnalyticsPayload(message, metadata);
});
