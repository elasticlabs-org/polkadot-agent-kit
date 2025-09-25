import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { PolkadotAgentKit } from '../../src/api';
import { RECIPIENT, sleep, getBalance, estimateTransactionFee, RECIPIENT2, RECIPIENT3, RECIPIENT4, RECIPIENT5, XCM_SYSTEM_PROMPT, RECIPIENT6, RECIPIENT0 } from './utils';
import { OllamaAgent } from './ollamaAgent';
import { estimateXcmFee, transferNativeCall } from '@polkadot-agent-kit/core';
import { parseUnits, getDecimalsByChainId } from '@polkadot-agent-kit/common';
import dotenv from 'dotenv';
import { ASSETS_PROMPT } from '@polkadot-agent-kit/llm';
dotenv.config({ path: '../../.env' });



/// Note: 
/// We are using Ollama for testing purposes, but you can use any other model you want


describe('PolkadotAgentKit Integration with OllamaAgent check balance', () => {
  let agentKit: PolkadotAgentKit;
  let ollamaAgent: OllamaAgent;

  beforeAll(async () => {
    // Make sure private key 
    if (process.env.AGENT_PRIVATE_KEY) {
      agentKit = new PolkadotAgentKit({
        privateKey: process.env.AGENT_PRIVATE_KEY,
        keyType: 'Sr25519',
        chains: ['west', 'west_asset_hub', 'paseo', 'paseo_asset_hub']
      });
      await agentKit.initializeApi();


      ollamaAgent = new OllamaAgent(agentKit, "qwen3:latest", ASSETS_PROMPT);
      await ollamaAgent.init();

      console.log('🏗️ Assets Agent initialized with ASSETS_PROMPT');
    } else {
      throw new Error('AGENT_PRIVATE_KEY is not set');
    }
  }, 3500000);

  describe('Check balance on Westend with different users intent ', () => {
    const testCases = [
      { query: 'check balance on paseo', expectedChain: 'paseo' },
      { query: 'check balance on Paseo Asset Hub', expectedChain: 'paseo_asset_hub' },
      { query: 'check balance on Asset Hub Paseo', expectedChain: 'paseo_asset_hub' },
    ];

    it.each(testCases)(
      'should call check_balance tool with correct chain for "$query"',
      async ({ query, expectedChain }) => {
        const result = await ollamaAgent.ask(query);

        expect(result.output).toBeDefined();
        expect(result.intermediateSteps).toBeDefined();
        expect(result.intermediateSteps.length).toBeGreaterThan(0);

        const balanceCall = result.intermediateSteps.find(
          (step: any) => step.action?.tool === 'check_balance'
        );

        expect(balanceCall).toBeDefined();
        expect(balanceCall.action.toolInput).toEqual({
          chain: expectedChain,
        });

        await sleep(30000);
      },
      3500000
    );
  });

})

describe('PolkadotAgentKit Integration with OllamaAgent transfer_native tool', () => {
  let agentKit: PolkadotAgentKit;
  let ollamaAgent: OllamaAgent;

  beforeAll(async () => {
    // Make sure private key 
    if (process.env.AGENT_PRIVATE_KEY) {
      agentKit = new PolkadotAgentKit({
        privateKey: process.env.AGENT_PRIVATE_KEY,
        keyType: 'Sr25519',
        chains: ['west']
      });
      await agentKit.initializeApi();


      ollamaAgent = new OllamaAgent(agentKit, "qwen3:latest", ASSETS_PROMPT);
      await ollamaAgent.init();

      console.log('🏗️ Assets Agent initialized with ASSETS_PROMPT');
    } else {
      throw new Error('AGENT_PRIVATE_KEY is not set');
    }
  }, 3500000);

  describe('Should call transfer_native tool', () => {

    const testCases = [
      `transfer 0.001 WND to ${RECIPIENT0} on Westend Relay Chain`,
    ];

    it.each(testCases)('should call transfer_native tool with correct parameters for query: "%s"', async (userQuery) => {
      const balanceRecipientBefore = await getBalance(agentKit.getApi('west'), RECIPIENT0);
      const balanceAgentBefore = await getBalance(agentKit.getApi('west'), agentKit.getCurrentAddress());
      const result = await ollamaAgent.ask(userQuery);
      console.log('Transfer Query Result:', result);


      const amount = parseUnits("0.001", getDecimalsByChainId('west'));

      const tx = await transferNativeCall(agentKit.getApi('west'), agentKit.getCurrentAddress(), RECIPIENT0, amount);

      const feeTx = await estimateTransactionFee(tx.transaction!, RECIPIENT0);
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
        to: RECIPIENT0,
      });

      await sleep(30000);

      const balanceRecipientAfter = await getBalance(agentKit.getApi('west'), RECIPIENT0);
      expect(balanceRecipientAfter.data.free).toEqual(balanceRecipientBefore.data.free + amount);

      const balanceAgentAfter = await getBalance(agentKit.getApi('west'), agentKit.getCurrentAddress());
      expect(balanceAgentAfter.data.free).toBeLessThan(balanceAgentBefore.data.free - amount - feeTx);

    }, 3500000);


  })

})



describe('PolkadotAgentKit Integration with OllamaAgent for XCM Transfer', () => {
  let agentKit: PolkadotAgentKit;  
  let ollamaAgent: OllamaAgent;    

  beforeAll(async () => {
    // Make sure private key 
    if (process.env.AGENT_PRIVATE_KEY) {
      agentKit = new PolkadotAgentKit({ 
        privateKey: process.env.AGENT_PRIVATE_KEY, 
        keyType: 'Sr25519', 
        chains: ['west', 'west_people', 'paseo', 'paseo_asset_hub', 'west_asset_hub' ]
      });
      await agentKit.initializeApi();

      ollamaAgent = new OllamaAgent(agentKit, "qwen3:latest", XCM_SYSTEM_PROMPT);
      await ollamaAgent.init();
      
    } else {
      throw new Error('AGENT_PRIVATE_KEY is not set');
    }
  }, 3500000);

  afterEach(async () => {

    await sleep(30000); // 30 seconds delay
  });

  // Helper function to test XCM transfer variations
  const testXcmTransfer = async (
    testName: string,
    userQuery: string,
    recipient: string,
    sourceChainId: any,
    destChainId: any,
    expectedSourceChain: string,
    expectedDestChain: string,
    amount: string = "0.1"
  ) => {
    const balanceAgentBefore = await getBalance(agentKit.getApi(sourceChainId), agentKit.getCurrentAddress());
    const balanceRecipientBefore = await getBalance(agentKit.getApi(destChainId), recipient);
    const amountParsed = parseUnits(amount, getDecimalsByChainId(sourceChainId));

      const result = await ollamaAgent.ask(userQuery);
      console.log(`XCM Transfer Query Result (${testName}):`, result);

      expect(result.output).toBeDefined();
      expect(result.intermediateSteps).toBeDefined();
      expect(result.intermediateSteps.length).toBeGreaterThan(0);

      const xcmTransferCall = result.intermediateSteps.find((step: any) =>
        step.action?.tool === 'xcm_transfer_native_asset'
      );

      expect(xcmTransferCall).toBeDefined();
      expect(xcmTransferCall.action.toolInput).toMatchObject({
      amount: amount,
        to: recipient,
        sourceChain: expectedSourceChain,
        destChain: expectedDestChain
      });

      await sleep(3 * 60 * 1000); // 3 minutes
    const balanceRecipientAfter = await getBalance(agentKit.getApi(destChainId), recipient);
    expect(balanceRecipientAfter.data.free).toBeLessThan(balanceRecipientBefore.data.free + amountParsed);

    const balanceAgentAfter = await getBalance(agentKit.getApi(sourceChainId), agentKit.getCurrentAddress());
    const feeXCM = await estimateXcmFee(expectedSourceChain, agentKit.getCurrentAddress(), expectedDestChain, recipient, amountParsed.toString());
    expect(balanceAgentAfter.data.free).toBeLessThan(balanceAgentBefore.data.free - amountParsed - feeXCM.fee);
  };

  describe('1. Relay Chain to Parachain Transfers', () => {
    const relayToParachainCases = [
      {
        name: 'from Westend to Asset Hub Westend',
        query: `transfer 0.1 WND to ${RECIPIENT} from Westend to Asset Hub Westend`,
        recipient: RECIPIENT,
        sourceChainId: 'west',
        destChainId: 'west_asset_hub',
        expectedSourceChain: 'Westend',
        expectedDestChain: 'AssetHubWestend'
      },
      {
        name: 'from Westend to Asset Hub West',
        query: `transfer 0.1 WND to ${RECIPIENT2} from Westend to Asset Hub West`,
        recipient: RECIPIENT2,
        sourceChainId: 'west',
        destChainId: 'west_asset_hub',
        expectedSourceChain: 'Westend',
        expectedDestChain: 'AssetHubWestend'
      },
      {
        name: 'from Westend to Westend\'s Asset Hub',
        query: `transfer 0.1 WND to ${RECIPIENT3} from Westend to Westend's Asset Hub`,
        recipient: RECIPIENT3,
        sourceChainId: 'west',
        destChainId: 'west_asset_hub',
        expectedSourceChain: 'Westend',
        expectedDestChain: 'AssetHubWestend'
      },
      {
        name: 'from Westend\'s relay chain to Westend\'s Asset Hub',
        query: `transfer 0.1 WND to ${RECIPIENT4} from Westend's relay chain to Westend's Asset Hub`,
        recipient: RECIPIENT4,
        sourceChainId: 'west',
        destChainId: 'west_asset_hub',
        expectedSourceChain: 'Westend',
        expectedDestChain: 'AssetHubWestend'
      },
      {
        name: 'from West to Asset Hub West',
        query: `transfer 0.1 WND to ${RECIPIENT5} from West to Westend Asset Hub`,
        recipient: RECIPIENT5,
        sourceChainId: 'west',
        destChainId: 'west_asset_hub',
        expectedSourceChain: 'Westend',
        expectedDestChain: 'AssetHubWestend'
      },
      {
        name: 'from West to West Asset Hub',
        query: `transfer 0.1 WND to ${RECIPIENT6} from West to West Asset Hub`,
        recipient: RECIPIENT6,
        sourceChainId: 'west',
        destChainId: 'west_asset_hub',
        expectedSourceChain: 'Westend',
        expectedDestChain: 'AssetHubWestend'
      }
    ];

    relayToParachainCases.forEach(({ name, query, recipient, sourceChainId, destChainId, expectedSourceChain, expectedDestChain }) => {
      it(`should call xcm_transfer_native_asset tool for "${name}"`, async () => {
        await testXcmTransfer(name, query, recipient, sourceChainId, destChainId, expectedSourceChain, expectedDestChain);
      }, 3500000);
    });
  });

  describe('2. Parachain to Relay Chain Transfers', () => {
    const parachainToRelayCases = [
      {
        name: 'Paseo Asset Hub to Paseo',
        query: `transfer 0.1 WND to ${RECIPIENT2} from Paseo Asset Hub to Paseo`,
        recipient: RECIPIENT2,
        sourceChainId: 'paseo_asset_hub',
        destChainId: 'paseo',
        expectedSourceChain: 'AssetHubPaseo',
        expectedDestChain: 'Paseo'
      },
      {
        name: 'Paseo Asset Hub to Paseo',
        query: `transfer 0.1 WND to ${RECIPIENT3} from Asset Hub Paseo to Paseo`,
        recipient: RECIPIENT3,
        sourceChainId: 'paseo_asset_hub',
        destChainId: 'paseo',
        expectedSourceChain: 'AssetHubPaseo',
        expectedDestChain: 'Paseo'
      }
    ];

    parachainToRelayCases.forEach(({ name, query, recipient, sourceChainId, destChainId, expectedSourceChain, expectedDestChain }) => {
      it(`should call xcm_transfer_native_asset tool for "${name}"`, async () => {
        await testXcmTransfer(name, query, recipient, sourceChainId, destChainId, expectedSourceChain, expectedDestChain);
      }, 3500000);
    });
  });

  describe('3. Parachain to Parachain Transfers', () => {
    it('should call xcm_transfer_native_asset tool for "West Asset Hub to West People Chain"', async () => {
      await testXcmTransfer(
        'West Asset Hub to West People Chain',
        `transfer 0.2 WND to ${RECIPIENT6} from AssetHubWestend to PeopleWestend via XCM`,
        RECIPIENT6,
        'west_asset_hub',
        'west_people',
        'AssetHubWestend',
        'PeopleWestend',
        '0.2'
      );
    }, 3500000);
  });

})


