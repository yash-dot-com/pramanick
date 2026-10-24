import { configureAgent } from "../lib/voice/bolna";

try {
  const result = await configureAgent();
  console.log(`Configured Pramanik: ${result.model} / ${result.voice}, ${result.tools.length} complaint tools. Original agent saved under data/private/.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Agent configuration failed");
  process.exitCode = 1;
}
