import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PolkadotAgentKit } from '../../src/api';
import { RECIPIENT, sleep, getBalance, estimateTransactionFee, RECIPIENT2, RECIPIENT3, RECIPIENT4 } from './utils';
import { OllamaAgent } from './ollamaAgent';
import { estimateXcmFee, transferNativeCall } from '@polkadot-agent-kit/core';
import { parseUnits, getDecimalsByChainId } from '@polkadot-agent-kit/common';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });
let agentKit: PolkadotAgentKit;
let ollamaAgent: OllamaAgent;

beforeAll(async () => {

  // Make sure private key 
  if (process.env.AGENT_PRIVATE_KEY) {
  agentKit = new PolkadotAgentKit( { privateKey: process.env.AGENT_PRIVATE_KEY,  keyType: 'Sr25519', chains: ['paseo','west', 'west_asset_hub', 'west_people'] });
    await agentKit.initializeApi();
    ollamaAgent = new OllamaAgent(agentKit);
    await ollamaAgent.init();
  } else {
    throw new Error('AGENT_PRIVATE_KEY is not set');
  }
}, 1500000);

afterAll(async () => {
  await agentKit.disconnect();
});

/// Note: 
/// We are using Ollama for testing purposes, but you can use any other model you want
/// We are using Westend and Westend Asset Hub for integrations tests 
describe('PolkadotAgentKit Integration with OllamaAgent', () => {
  // it('should call check_balance tool with correct chain parameter', async () => {
  //   const result = await ollamaAgent.ask('check balance on Paseo');
    
  //   expect(result.output).toBeDefined();
  //   expect(result.intermediateSteps).toBeDefined();
  //   expect(result.intermediateSteps.length).toBeGreaterThan(0);
    
  //   const balanceCall = result.intermediateSteps.find((step: any) => 
  //     step.action?.tool === 'check_balance'
  //   );
    
  //   expect(balanceCall).toBeDefined();
  //   expect(balanceCall.action.toolInput).toEqual({
  //     chain: 'paseo'  
  //   });
    
  //   await sleep(30000);
  // }, 1500000); 

  it('should call transfer_native tool with correct parameters', async () => {
    const userQuery = `transfer 100 WND to ${RECIPIENT} on Westend`;
    const balanceRecipientBefore = await getBalance(agentKit.getApi('west'), RECIPIENT);
    const balanceAgentBefore = await getBalance(agentKit.getApi('west'), agentKit.getCurrentAddress());
    const result = await ollamaAgent.ask(userQuery);
    console.log('Transfer Query Result:', result);


    // const amount = parseUnits("0.001", getDecimalsByChainId('west'));

    // const feeTx = await estimateTransactionFee(await transferNativeCall(agentKit.getApi('west'), agentKit.getCurrentAddress(), RECIPIENT, amount), RECIPIENT);
    // expect(result.output).toBeDefined();
    // expect(result.intermediateSteps).toBeDefined();
    // expect(result.intermediateSteps.length).toBeGreaterThan(0);
    
    // const transferCall = result.intermediateSteps.find((step: any) => 
    //   step.action?.tool === 'transfer_native'
    // );
    
    // expect(transferCall).toBeDefined();
    // expect(transferCall.action.toolInput).toMatchObject({
    //   amount: '0.001',
    //   chain: 'west',
    //   to: RECIPIENT,
    // });
    
    // await sleep(30000);

    // const balanceRecipientAfter = await getBalance(agentKit.getApi('west'), RECIPIENT);
    // expect(balanceRecipientAfter.data.free).toEqual(balanceRecipientBefore.data.free + amount);

    // const balanceAgentAfter = await getBalance(agentKit.getApi('west'), agentKit.getCurrentAddress());
    // expect(balanceAgentAfter.data.free).toBeLessThan(balanceAgentBefore.data.free - amount - feeTx);

  }, 1500000); 

  // it('should call xcm_transfer_native_asset tool for Westend to Asset Hub transfer', async () => {
  //   const userQuery = `transfer 0.1 WND to ${RECIPIENT2} from Westend to Westend Asset Hub`;

  //   const balanceAgentBefore = await getBalance(agentKit.getApi('west'), agentKit.getCurrentAddress());
  //   // Get balance Recipient Before on Westend Asset Hub
  //   const balanceRecipientBefore = await getBalance(agentKit.getApi('west_asset_hub'), RECIPIENT2);

  //   const amount = parseUnits("0.1", getDecimalsByChainId('west'));

  //   const result = await ollamaAgent.ask(userQuery);
  //   console.log('XCM Transfer Query Result (Westend → Asset Hub):', result);
    
  //   expect(result.output).toBeDefined();
  //   expect(result.intermediateSteps).toBeDefined();
  //   expect(result.intermediateSteps.length).toBeGreaterThan(0);
    
  //   const xcmTransferCall = result.intermediateSteps.find((step: any) => 
  //     step.action?.tool === 'xcm_transfer_native_asset'
  //   );
    
  //   expect(xcmTransferCall).toBeDefined();
  //   expect(xcmTransferCall.action.toolInput).toMatchObject({
  //     amount: '0.1',
  //     to: RECIPIENT2,
  //     sourceChain: 'Westend',
  //     destChain: 'AssetHubWestend'
  //   });

  //   await sleep(3 * 60 * 1000); // 3 minutes
  //   // Note: make sure get balance on destination chain about 2-3 mins to get the latest balance update
  //   const balanceRecipientAfter = await getBalance(agentKit.getApi('west_asset_hub'), RECIPIENT2);
  //   // Noted: cant compare equal due to deposit assets on destination chain 
  //   expect(balanceRecipientAfter.data.free).toBeLessThan(balanceRecipientBefore.data.free + amount);

  //   const balanceAgentAfter = await getBalance(agentKit.getApi('west'), agentKit.getCurrentAddress());
  //   const feeXCM = await estimateXcmFee('Westend', agentKit.getCurrentAddress(), 'AssetHubWestend', RECIPIENT2, amount.toString());

  //   // after < before - amount - fee XCM estimate on source chain
  //   expect(balanceAgentAfter.data.free).toBeLessThan(balanceAgentBefore.data.free - amount - feeXCM.fee);

  // }, 1500000); 

  // it('should call xcm_transfer_native_asset tool for Asset Hub to Westend transfer', async () => {
  //   const userQuery = `transfer 0.1 WND to ${RECIPIENT3} from Asset Hub to Westend`;
    
  //   // Get balances before transfer
  //   const balanceAgentBefore = await getBalance(agentKit.getApi('west_asset_hub'), agentKit.getCurrentAddress());
  //   const balanceRecipientBefore = await getBalance(agentKit.getApi('west'), RECIPIENT3);
    
  //   const amount = parseUnits("0.1", getDecimalsByChainId('west_asset_hub'));
  //   console.log("Amount Here:", amount);
    
  //   const result = await ollamaAgent.ask(userQuery);
  //   console.log('XCM Transfer Query Result (Asset Hub → Westend):', result);
    
  //   expect(result.output).toBeDefined();
  //   expect(result.intermediateSteps).toBeDefined();
  //   expect(result.intermediateSteps.length).toBeGreaterThan(0);
    
  //   const xcmTransferCall = result.intermediateSteps.find((step: any) => 
  //     step.action?.tool === 'xcm_transfer_native_asset'
  //   );
    
  //   expect(xcmTransferCall).toBeDefined();
  //   expect(xcmTransferCall.action.toolInput).toMatchObject({
  //     amount: '0.1',
  //     to: RECIPIENT3,
  //     sourceChain: 'AssetHubWestend',
  //     destChain: 'Westend'
  //   });
    
  //   await sleep(3 * 60 * 1000); // 3 minutes
  //   // Note: make sure get balance on destination chain about 2-3 mins to get the latest balance update
    
  //   // Check recipient balance on destination chain (Westend)
  //   const balanceRecipientAfter = await getBalance(agentKit.getApi('west'), RECIPIENT3);
  //   // Noted: cant compare equal due to deposit assets on destination chain 
  //   expect(balanceRecipientAfter.data.free).toBeLessThan(balanceRecipientBefore.data.free + amount);

  //   // Check agent balance on source chain (Asset Hub)
  //   const balanceAgentAfter = await getBalance(agentKit.getApi('west_asset_hub'), agentKit.getCurrentAddress());
  //   const feeXCM = await estimateXcmFee('AssetHubWestend', agentKit.getCurrentAddress(), 'Westend', RECIPIENT3, amount.toString());

  //   // after < before - amount - fee XCM estimate on source chain
  //   expect(balanceAgentAfter.data.free).toBeLessThan(balanceAgentBefore.data.free - amount - feeXCM.fee);
    
  // }, 1500000);

  // it('should call xcm_transfer_native_asset tool for West Asset Hub to West People Chain transfer', async () => {

  //   const userQuery = `transfer 0.5 WND to ${RECIPIENT4} from AssetHubWestend to PeopleWestend via XCM`;
    
  //   // Get balances before transfer
  //   const balanceAgentBefore = await getBalance(agentKit.getApi('west_asset_hub'), agentKit.getCurrentAddress());
  //   const balanceRecipientBefore = await getBalance(agentKit.getApi('west_people'), RECIPIENT4);
    
  //   const amount = parseUnits("0.5", getDecimalsByChainId('west_asset_hub'));
    
  //   const result = await ollamaAgent.ask(userQuery);
  //   console.log('XCM Transfer Query Result (West Asset Hub → West People Chain):', result);
    
  //   expect(result.output).toBeDefined();
  //   expect(result.intermediateSteps).toBeDefined();
  //   expect(result.intermediateSteps.length).toBeGreaterThan(0);
    
  //   const xcmTransferCall = result.intermediateSteps.find((step: any) => 
  //     step.action?.tool === 'xcm_transfer_native_asset'
  //   );
    
  //   expect(xcmTransferCall).toBeDefined();
  //   expect(xcmTransferCall.action.toolInput).toMatchObject({
  //     amount: '0.5',
  //     to: RECIPIENT4,
  //     sourceChain: 'AssetHubWestend',  
  //     destChain: 'PeopleWestend'      
  //   });
    
  //   await sleep(3 * 60 * 1000); // 3 minutes
  //   // Note: make sure get balance on destination chain about 2-3 mins to get the latest balance update
    
  //   // Check recipient balance on destination chain (PeopleWestend)
  //   const balanceRecipientAfter = await getBalance(agentKit.getApi('west_people'), RECIPIENT4);
  //   // Noted: cant compare equal due to deposit assets on destination chain 
  //   expect(balanceRecipientAfter.data.free).toBeLessThan(balanceRecipientBefore.data.free + amount);

  //   // Check agent balance on source chain (Asset Hub)
  //   const balanceAgentAfter = await getBalance(agentKit.getApi('west_asset_hub'), agentKit.getCurrentAddress());
  //   const feeXCM = await estimateXcmFee('AssetHubWestend', agentKit.getCurrentAddress(), 'PeopleWestend', RECIPIENT4, amount.toString());

  //   // after < before - amount - fee XCM estimate on source chain
  //   expect(balanceAgentAfter.data.free).toBeLessThan(balanceAgentBefore.data.free - amount - feeXCM.fee);
    
  // }, 1500000);
});
