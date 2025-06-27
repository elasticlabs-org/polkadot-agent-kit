import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PolkadotAgentKit } from '../../src/api';
import { RECIPIENT, AGENT_PRIVATE_KEY, sleep } from './utils';
import { parseUnits} from '@polkadot-agent-kit/common';
import { ChatOllama } from "@langchain/ollama";



let agent: PolkadotAgentKit;

beforeAll(async () => {
  agent = new PolkadotAgentKit(AGENT_PRIVATE_KEY, { keyType: 'Sr25519' });
  await agent.initializeApi();
  // make sure the API is ready
  await sleep(5000);
});

afterAll(async () => {
  await agent.disconnect();
});


/// Note: 
/// We are using Ollama for testing purposes, but you can use any other model you want
/// We are using Westend and Westend Asset Hub for integrations tests 
describe('PolkadotAgentKit Integration', () => {
  it('should get native balance on Westend', async () => {
    const tool = agent.getNativeBalanceTool();
    const result = await tool.call({ chain: 'west' });
    // make sure the transaction is confirmed
    await sleep(10000);
    const { success, data } = JSON.parse(result.content);
    expect(success).toBe(true);
    expect(data).toBeDefined();
  });

  it('should transfer 0.001 WND to recipient on Westend', async () => {
    const tool = agent.transferNativeTool();
    const result = await tool.call({
      to: RECIPIENT,
      amount: '0.01',
      chain: 'west',
    });
    // make sure the transaction is confirmed
    await sleep(15000);
    const { success, data } = JSON.parse(result.content);
    expect(success).toBe(true);
    expect(data).toBeDefined();


  });

  it('should xcm transfer 0.001 WND from Westend to Westend Asset Hub', async () => {
    const tool = agent.xcmTransferNativeTool();
    const result = await tool.call({
      to: RECIPIENT,
      amount: '0.01',
      sourceChain: 'west',
      destChain: 'west_asset_hub',
    });
    // make sure the transaction is confirmed
    await sleep(15000);
    const { success, data } = JSON.parse(result.content);
    expect(success).toBe(true);
    expect(data).toBeDefined();
  });

  it('should xcm transfer 0.001 WND from Westend Asset Hub to Westend', async () => {
    const tool = agent.xcmTransferNativeTool();
    const result = await tool.call({
      to: RECIPIENT,
      amount: '0.01',
      sourceChain: 'west_asset_hub',
      destChain: 'west',
    });
    // make sure the transaction is confirmed
    await sleep(10000);
    const { success, data } = JSON.parse(result.content);
    expect(success).toBe(true);
    expect(data).toBeDefined();
  });
});
