import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PolkadotAgentKit } from '../../src/api';
import { RECIPIENT, AGENT_PRIVATE_KEY, sleep } from './utils';
import { OllamaAgent } from './ollamaAgent';

let agentKit: PolkadotAgentKit;
let ollamaAgent: OllamaAgent;

beforeAll(async () => {
  agentKit = new PolkadotAgentKit( { privateKey: AGENT_PRIVATE_KEY,  keyType: 'Sr25519', chains: ['paseo','west', 'west_asset_hub'] });
  await agentKit.initializeApi();
  ollamaAgent = new OllamaAgent(agentKit);
  await ollamaAgent.init();
}, 300000);

afterAll(async () => {
  await agentKit.disconnect();
});

/// Note: 
/// We are using Ollama for testing purposes, but you can use any other model you want
/// We are using Westend and Westend Asset Hub for integrations tests 
describe('PolkadotAgentKit Integration with OllamaAgent', () => {
  it('should call check_balance tool with correct chain parameter', async () => {
    const result = await ollamaAgent.ask('check balance on Paseo');
    
    expect(result.output).toBeDefined();
    expect(result.intermediateSteps).toBeDefined();
    expect(result.intermediateSteps.length).toBeGreaterThan(0);
    
    const balanceCall = result.intermediateSteps.find((step: any) => 
      step.action?.tool === 'check_balance'
    );
    
    expect(balanceCall).toBeDefined();
    expect(balanceCall.action.toolInput).toEqual({
      chain: 'paseo'  
    });
    
    await sleep(30000);
  }, 300000); 

  it('should call transfer_native tool with correct parameters', async () => {
    const userQuery = `transfer 0.001 WND to ${RECIPIENT} on Westend`;
    
    const result = await ollamaAgent.ask(userQuery);
    console.log('Transfer Query Result:', result);
    
    expect(result.output).toBeDefined();
    expect(result.intermediateSteps).toBeDefined();
    expect(result.intermediateSteps.length).toBeGreaterThan(0);
    
    const transferCall = result.intermediateSteps.find((step: any) => 
      step.action?.tool === 'transfer_native'
    );
    
    expect(transferCall).toBeDefined();
    expect(transferCall.action.toolInput).toMatchObject({
      amount: '0.001',
      chain: 'west',
      to: RECIPIENT,
    });
    
    await sleep(30000);
  }, 300000); 

  it('should call xcm_transfer_native_asset tool for Westend to Asset Hub transfer', async () => {
    const userQuery = `transfer 0.001 WND to ${RECIPIENT} from Westend to Westend Asset Hub`;
    
    const result = await ollamaAgent.ask(userQuery);
    console.log('XCM Transfer Query Result (Westend → Asset Hub):', result);
    
    expect(result.output).toBeDefined();
    expect(result.intermediateSteps).toBeDefined();
    expect(result.intermediateSteps.length).toBeGreaterThan(0);
    
    const xcmTransferCall = result.intermediateSteps.find((step: any) => 
      step.action?.tool === 'xcm_transfer_native_asset'
    );
    
    expect(xcmTransferCall).toBeDefined();
    expect(xcmTransferCall.action.toolInput).toMatchObject({
      amount: '0.001',
      to: RECIPIENT,
      sourceChain: 'west',
      destChain: 'west_asset_hub'
    });
    
    await sleep(30000);
  }, 300000); 

  it('should call xcm_transfer_native_asset tool for Asset Hub to Westend transfer', async () => {
    const userQuery = `transfer 0.001 WND to ${RECIPIENT} from Westend Asset Hub to Westend`;
    
    const result = await ollamaAgent.ask(userQuery);
    console.log('XCM Transfer Query Result (Asset Hub → Westend):', result);
    
    expect(result.output).toBeDefined();
    expect(result.intermediateSteps).toBeDefined();
    expect(result.intermediateSteps.length).toBeGreaterThan(0);
    
    const xcmTransferCall = result.intermediateSteps.find((step: any) => 
      step.action?.tool === 'xcm_transfer_native_asset'
    );
    
    expect(xcmTransferCall).toBeDefined();
    expect(xcmTransferCall.action.toolInput).toMatchObject({
      amount: '0.001',
      to: RECIPIENT,
      sourceChain: 'west_asset_hub',
      destChain: 'west'
    });
    
    await sleep(30000);
  }, 300000); 

  it('should call xcm_transfer_native_asset tool for Paseo Asset Hub to Paseo People Chain transfer', async () => {
    const userQuery = `transfer 0.5 PAS to ${RECIPIENT} from Paseo Asset Hub to Paseo People Chain`;
    
    const result = await ollamaAgent.ask(userQuery);
    console.log('XCM Transfer Query Result (Paseo Asset Hub → Paseo People Chain):', result);
    
    expect(result.output).toBeDefined();
    expect(result.intermediateSteps).toBeDefined();
    expect(result.intermediateSteps.length).toBeGreaterThan(0);
    
    const xcmTransferCall = result.intermediateSteps.find((step: any) => 
      step.action?.tool === 'xcm_transfer_native_asset'
    );
    
    expect(xcmTransferCall).toBeDefined();
    expect(xcmTransferCall.action.toolInput).toMatchObject({
      amount: '0.5',
      to: RECIPIENT,
      sourceChain: 'paseo_asset_hub',
      destChain: 'paseo_people'
    });
    
    await sleep(30000);
  }, 300000); 

  it('should call check_balance, then initialize_chain_api, then retry check_balance for uninitialized chain', async () => {
    const result = await ollamaAgent.ask('check balance on Polkadot');
    console.log('Polkadot Balance Query Result:', JSON.stringify(result, null, 2));
    
    expect(result.output).toBeDefined();
    expect(result.intermediateSteps).toBeDefined();
    expect(result.intermediateSteps.length).toBeGreaterThan(0);
    
    const checkBalanceCalls = result.intermediateSteps.filter((step: any) => 
      step.action?.tool === 'check_balance'
    );
    
    const initCall = result.intermediateSteps.find((step: any) => 
      step.action?.tool === 'initialize_chain_api'
    );
    
    expect(checkBalanceCalls.length).toBeGreaterThanOrEqual(1);
    
    expect(initCall).toBeDefined();
    expect(initCall.action.toolInput).toEqual({
      chainId: 'polkadot'  
    });

    checkBalanceCalls.forEach((balanceCall: any) => {
      expect(balanceCall.action.toolInput).toEqual({
        chain: 'polkadot'
      });
    });

    const allSteps = result.intermediateSteps;
    const firstCheckBalanceIndex = allSteps.findIndex((step: any) => step.action?.tool === 'check_balance');
    const initIndex = allSteps.findIndex((step: any) => step.action?.tool === 'initialize_chain_api');
    
    expect(firstCheckBalanceIndex).toBeLessThan(initIndex);
    
    if (checkBalanceCalls.length >= 2) {
      const lastCheckBalanceIndex = allSteps.findLastIndex((step: any) => step.action?.tool === 'check_balance');
      expect(initIndex).toBeLessThan(lastCheckBalanceIndex);
    }
    
    await sleep(30000);
  }, 300000); // 3 minute timeout for this complex test
  
  it('should call bond_extra tool for re-staking rewards on PASEO', async () => {
    const result = await ollamaAgent.ask('re-stake my rewards on PASEO');
    console.log('OllamaAgent Bond Extra Query Result:', result);
    
    expect(result.output).toBeDefined();
    expect(result.intermediateSteps).toBeDefined();
    expect(result.intermediateSteps.length).toBeGreaterThan(0);
    
    const bondExtraCall = result.intermediateSteps.find((step: any) => 
      step.action?.tool === 'bond_extra'
    );
    
    expect(bondExtraCall).toBeDefined();
    
    expect(bondExtraCall.action.toolInput).toMatchObject({
      type: 'Rewards',
      chain: 'paseo'
    });
    
    await sleep(40000);
  }, 300000); 
});
