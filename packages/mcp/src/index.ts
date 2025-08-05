import { PolkadotMCPServer } from "../src/server";
import { createDefaultConfig } from "../src/utils/config";
import { sleep } from "./utils";

async function runServer() {
  const config = createDefaultConfig();

  const server = new PolkadotMCPServer(config);
  await sleep(3000);
  server.start();
  
}

runServer().catch(console.error);







