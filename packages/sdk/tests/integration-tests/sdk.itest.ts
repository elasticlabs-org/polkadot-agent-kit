import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PolkadotAgentKit } from '../../src/api';
import { RECIPIENT, AGENT_PRIVATE_KEY, sleep } from './utils';
import { OllamaAgent } from './ollamaAgent';

let agentKit: PolkadotAgentKit;
let ollamaAgent: OllamaAgent;

beforeAll(async () => {
  agentKit = new PolkadotAgentKit(AGENT_PRIVATE_KEY, { keyType: 'Sr25519', chains: ['polkadot','west', 'west_asset_hub'] });
  await agentKit.initializeApi();
  ollamaAgent = new OllamaAgent(agentKit);
  await ollamaAgent.init();
});

afterAll(async () => {
  await agentKit.disconnect();
});

/// Note: 
/// We are using Ollama for testing purposes, but you can use any other model you want
/// We are using Westend and Westend Asset Hub for integrations tests 
describe('PolkadotAgentKit Integration with OllamaAgent', () => {
  it('should get native balance on Westend using Ollama agent', async () => {
    const result = await ollamaAgent.ask('check balance on Westend');
    console.log('OllamaAgent Balance Query Result:', result);
    await sleep(20000);
    expect(result.output).toBeDefined();
  });
  it('should transfer 0.001 WND to recipient on Westend using natural language', async () => {
    const userQuery = `transfer 0.001 WND to ${RECIPIENT} on Westend`;
    
    const result = await ollamaAgent.ask(userQuery);
    console.log('Transfer Query Result:', result);
    await sleep(20000);
    expect(result.output).toBeDefined();
  });
  it('should xcm transfer 0.001 WND from Westend to Westend Asset Hub using natural language', async () => {
    const userQuery = `transfer 0.001 WND to ${RECIPIENT} from Westend to Westend Asset Hub`;
    const result = await ollamaAgent.ask(userQuery);
    console.log('XCM Transfer Query Result (Westend → Asset Hub):', result);
    await sleep(20000);
    expect(result.output).toBeDefined();
  });
  it('should xcm transfer 0.001 WND from Westend Asset Hub to Westend using natural language', async () => {
    const userQuery = `transfer 0.001 WND to ${RECIPIENT} from Westend Asset Hub to Westend`;
    const result = await ollamaAgent.ask(userQuery);
    console.log('XCM Transfer Query Result (Asset Hub → Westend):', result);
    await sleep(20000);
    expect(result.output).toBeDefined();
  });

  it('should initialize a chain API if it is not initialized when user asks for any onchain interaction on it', async () => {
    const result = await ollamaAgent.ask('check balance on Polkadot');
    console.log('Polkadot Balance Query Result:', result);
    await sleep(20000);
    expect(result.output).toBeDefined();
  });

  it('should swap tokens across different chains using the Hydration DEX', async () => {
    const result = await ollamaAgent.ask('swap 0.1 DOT from Polkadot to USDT on Asset Hub');
    console.log('Swap Tokens Query Result:', result);
    await sleep(20000);
    expect(result.output).toBeDefined();
  });

});
