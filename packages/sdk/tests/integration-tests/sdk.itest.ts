import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { PolkadotAgentKit } from '../../src/api';
import { RECIPIENT, sleep, getBalance, estimateTransactionFee, RECIPIENT2, RECIPIENT3, RECIPIENT4, RECIPIENT5, XCM_SYSTEM_PROMPT, RECIPIENT6, RECIPIENT0, getBondedAmountByMember, RECIPIENT7, RECIPIENT8 } from './utils';
import { AgentTest } from './agents/agent';
import { estimateXcmFee, transferNativeCall } from '@polkadot-agent-kit/core';
import { parseUnits, getDecimalsByChainId } from '@polkadot-agent-kit/common';
import dotenv from 'dotenv';
import { ASSETS_PROMPT, NOMINATION_PROMPT, XCM_PROMPT } from '@polkadot-agent-kit/llm';
dotenv.config({ path: '../../.env' });



/// Note:   
/// We are using Ollama for testing purposes, but you can use any other model you want


describe('PolkadotAgentKit Integration with OllamaAgent check balance', () => {
  let agentKit: PolkadotAgentKit;
  let agent: AgentTest;

  beforeAll(async () => {
    // Make sure private key 
    if (process.env.AGENT_PRIVATE_KEY) {
      agentKit = new PolkadotAgentKit({
        privateKey: process.env.AGENT_PRIVATE_KEY,
        keyType: 'Sr25519',
        chains: ['west', 'west_asset_hub', 'paseo', 'paseo_asset_hub','west_people']
      });
      await agentKit.initializeApi();
      agent = new AgentTest(agentKit, ASSETS_PROMPT);
      await agent.init();
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
        const result = await agent.ask(query);

        expect(result.output).toBeDefined();
        expect(result.intermediateSteps).toBeDefined();
        expect(result.intermediateSteps?.length).toBeGreaterThan(0);

        const balanceCall = result.intermediateSteps?.find(
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
  let agent: AgentTest;

  beforeAll(async () => {
    // Make sure private key 
    if (process.env.AGENT_PRIVATE_KEY) {
      agentKit = new PolkadotAgentKit({
        privateKey: process.env.AGENT_PRIVATE_KEY,
        keyType: 'Sr25519',
        chains: ['west']
      });
      await agentKit.initializeApi();
      agent = new AgentTest(agentKit, ASSETS_PROMPT);
      await agent.init();

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
      const result = await agent.ask(userQuery);
      console.log('Transfer Query Result:', result);


      const amount = parseUnits("0.001", getDecimalsByChainId('west'));

      const tx = await transferNativeCall(agentKit.getApi('west'), agentKit.getCurrentAddress(), RECIPIENT0, amount);

      const feeTx = await estimateTransactionFee(tx.transaction!, RECIPIENT0);
      expect(result.output).toBeDefined();
      expect(result.intermediateSteps).toBeDefined();
      expect(result.intermediateSteps?.length).toBeGreaterThan(0);

      const transferCall = result.intermediateSteps?.find((step: any) =>
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
  let agent: AgentTest;    

  beforeAll(async () => {
    // Make sure private key 
    if (process.env.AGENT_PRIVATE_KEY) {
      agentKit = new PolkadotAgentKit({ 
        privateKey: process.env.AGENT_PRIVATE_KEY, 
        keyType: 'Sr25519', 
        chains: ['west', 'west_people', 'paseo', 'paseo_asset_hub', 'west_asset_hub' ]
      });
      await agentKit.initializeApi();

      agent = new AgentTest(agentKit, XCM_PROMPT);
      await agent.init();
      
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
    const feeXCMBefore = await estimateXcmFee(expectedSourceChain, agentKit.getCurrentAddress(), expectedDestChain, recipient, amountParsed.toString());
    console.log("XCM Fee Before:", feeXCMBefore.fee);
      const result = await agent.ask(userQuery);
      console.log(`XCM Transfer Query Result (${testName}):`, result);

      expect(result.output).toBeDefined();
      expect(result.intermediateSteps).toBeDefined();
      expect(result.intermediateSteps?.length).toBeGreaterThan(0);

      const xcmTransferCall = result.intermediateSteps?.find((step: any) =>
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
    const feeXCMAfter = await estimateXcmFee(expectedSourceChain, agentKit.getCurrentAddress(), expectedDestChain, recipient, amountParsed.toString());
    console.log("XCM Fee After:", feeXCMAfter.fee);
    expect(balanceAgentAfter.data.free).toBeLessThan(balanceAgentBefore.data.free - amountParsed - feeXCMAfter.fee);
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
        name: 'Paseo Asset Hub to Paseo 1 ',
        query: `transfer 0.1 WND to ${RECIPIENT2} from Paseo Asset Hub to Paseo`,
        recipient: RECIPIENT2,
        sourceChainId: 'paseo_asset_hub',
        destChainId: 'paseo',
        expectedSourceChain: 'AssetHubPaseo',
        expectedDestChain: 'Paseo'
      },
      {
        name: 'Paseo Asset Hub to Paseo 2',
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





describe('PolkadotAgentKit Integration with LLM Agent staking nomination pool tools', () => {
  let agentKit: PolkadotAgentKit;
  let agent: AgentTest;

  beforeAll(async () => {
    // Make sure private key 
    if (process.env.AGENT_PRIVATE_KEY) {
      agentKit = new PolkadotAgentKit({
        privateKey: process.env.AGENT_PRIVATE_KEY,
        keyType: 'Sr25519',
        chains: ['paseo_asset_hub']
      });
      await agentKit.initializeApi();


      agent = new AgentTest(agentKit, NOMINATION_PROMPT);
      await agent.init();
    } else {
      throw new Error('AGENT_PRIVATE_KEY is not set');
    }
  }, 3500000);

  afterEach(async () => {
    // Add delay between tests to avoid stale transaction errors
    await sleep(120000); // 120 seconds delay (2 minutes)
  });


  it('should call join_pool tool', async () => {

    await sleep(60000); // 60 seconds additional delay
    
    const userQuery = 'join pool with 1 PAS on Paseo Asset Hub';
    
    // Get bonded amount before the operation (only if we expect a successful join)
    const bondedAmountBefore = await getBondedAmountByMember(agentKit.getApi('paseo_asset_hub') as any, agentKit.getCurrentAddress());

    
    const result = await agent.ask(userQuery);
    console.log('Join Pool Query Result:', result);

    // Check that we have intermediate steps
    expect(result.intermediateSteps).toBeDefined();
    expect(result.intermediateSteps?.length).toBeGreaterThan(0);

    // Find the join_pool tool call
    const joinPoolCall = result.intermediateSteps?.find((step: any) =>
      step.action?.tool === 'join_pool'
    );

    expect(joinPoolCall).toBeDefined();
    expect(joinPoolCall.action.toolInput).toMatchObject({
      amount: '1',
      chain: 'paseo_asset_hub'
    });

    // Check for either successful join or account already belongs to pool error
    const observationStep = result.intermediateSteps?.find((step: any) =>
      step.observation && (
        step.observation.includes('Successfully joined pool') ||
        step.observation.includes('NominationPools.AccountBelongsToOtherPool')
      )
    );

    expect(observationStep).toBeDefined();
    // Wait for transaction to be processed
    await sleep(30000);
        
    // Check if it's a successful join or an error
    if (observationStep.observation.includes('Successfully joined pool')) {
      expect(observationStep.observation).toContain('Successfully joined pool');
      console.log('Successfully joined nomination pool');

      const bondedAmountAfter = await getBondedAmountByMember(agentKit.getApi('paseo_asset_hub') as any, agentKit.getCurrentAddress());
      
      const expectedAmount = parseUnits("1", getDecimalsByChainId('paseo_asset_hub'));
      expect(bondedAmountAfter).toEqual(bondedAmountBefore + expectedAmount);

    } else if (observationStep.observation.includes('NominationPools.AccountBelongsToOtherPool')) {
      expect(observationStep.observation).toContain('NominationPools.AccountBelongsToOtherPool');
      console.log('Account already belongs to a nomination pool - this is expected behavior');
    } else {
      throw new Error('Unexpected observation: ' + observationStep.observation);
    }
    
  }, 3500000);

  it('should call bond_extra tool with FreeBalance', async () => {

    await sleep(60000); // 60 seconds additional delay
    
    const userQuery = 'bond extra 1 PAS on Paseo Asset Hub';
    
    // Get bonded amount before the operation
    const bondedAmountBefore = await getBondedAmountByMember(agentKit.getApi('paseo_asset_hub') as any, agentKit.getCurrentAddress());
    console.log('Bonded amount before:', bondedAmountBefore);
    
    const result = await agent.ask(userQuery);
    console.log('Bond Extra Query Result:', result);

    // Check that we have intermediate steps
    expect(result.intermediateSteps).toBeDefined();
    expect(result.intermediateSteps?.length).toBeGreaterThan(0);

    // Find the bond_extra tool call
    const bondExtraCall = result.intermediateSteps?.find((step: any) =>
      step.action?.tool === 'bond_extra'
    );

    expect(bondExtraCall).toBeDefined();
    expect(bondExtraCall.action.toolInput).toMatchObject({
      amount: '1',
      chain: 'paseo_asset_hub',
      type: 'FreeBalance'
    });

    const observationStep = result.intermediateSteps?.find((step: any) =>
      step.observation && step.observation.includes('Successfully bonded extra tokens')
    );

    expect(observationStep).toBeDefined();
    expect(observationStep.observation).toContain('Successfully bonded extra tokens (FreeBalance) on paseo_asset_hub');
    
    // Wait for transaction to be processed
    await sleep(30000);
    
    // Get bonded amount after the operation
    const bondedAmountAfter = await getBondedAmountByMember(agentKit.getApi('paseo_asset_hub') as any, agentKit.getCurrentAddress());
    console.log('Bonded amount after:', bondedAmountAfter);
    
    const expectedAmount = parseUnits("1", getDecimalsByChainId('paseo_asset_hub'));
    expect(bondedAmountAfter).toEqual(bondedAmountBefore + expectedAmount);
    
  }, 3500000);


  it('should call bond_extra tool with Rewards', async () => {
    const userQuery = 'bond rewards on Paseo Asset Hub';
    
    const result = await agent.ask(userQuery);
    console.log('Bond Extra Query Result:', result);

    // Check that we have intermediate steps
    expect(result.intermediateSteps).toBeDefined();
    expect(result.intermediateSteps?.length).toBeGreaterThan(0);

    // Find the bond_extra tool call
    const bondExtraCall = result.intermediateSteps?.find((step: any) =>
      step.action?.tool === 'bond_extra'
    );

    expect(bondExtraCall).toBeDefined();
    expect(bondExtraCall.action.toolInput).toMatchObject({
      chain: 'paseo_asset_hub',
      type: 'Rewards'
    });

    const observationStep = result.intermediateSteps?.find((step: any) =>
      step.observation && step.observation.includes('Successfully bonded extra tokens')
    );

    expect(observationStep).toBeDefined();
    expect(observationStep.observation).toContain('Successfully bonded extra tokens (Rewards) on paseo_asset_hub');
    
    
  }, 3500000);


  it('should call unbond tool', async () => {
    const userQuery = 'unbond 0.01 PAS on Paseo Asset Hub';
    
    const result = await agent.ask(userQuery);
    console.log('Unbond Query Result:', result);

    // Check that we have intermediate steps
    expect(result.intermediateSteps).toBeDefined();
    expect(result.intermediateSteps?.length).toBeGreaterThan(0);

    const unbondCall = result.intermediateSteps?.find((step: any) =>
      step.action?.tool === 'unbond'
    );

    expect(unbondCall).toBeDefined();
    expect(unbondCall.action.toolInput).toMatchObject({
      chain: 'paseo_asset_hub',
      amount: '0.01'
    });

    
    
  }, 3500000);

  it('should call withdraw unbond tool', async () => {
    const userQuery = 'withdraw unbonded on Paseo Asset Hub';
    
    const result = await agent.ask(userQuery);
    console.log('Withdraw Unbonded Query Result:', result);

    // Check that we have intermediate steps
    expect(result.intermediateSteps).toBeDefined();
    expect(result.intermediateSteps?.length).toBeGreaterThan(0);

    const withdrawUnbondedCall = result.intermediateSteps?.find((step: any) =>
      step.action?.tool === 'withdraw_unbonded'
    );

    expect(withdrawUnbondedCall).toBeDefined();
    expect(withdrawUnbondedCall.action.toolInput).toMatchObject({
      chain: 'paseo_asset_hub',
      slashingSpans: "0"
    });
  }, 3500000);


  it('should call claim rewards  tool', async () => {
    const userQuery = 'claim rewards from pool on paseo_asset_hub';
    
    const result = await agent.ask(userQuery);
    console.log('Claim Rewards Query Result:', result);


    expect(result.intermediateSteps).toBeDefined();
    expect(result.intermediateSteps?.length).toBeGreaterThan(0);


    const claimRewardsCall = result.intermediateSteps?.find((step: any) =>
      step.action?.tool === 'claim_rewards'
    );

    expect(claimRewardsCall).toBeDefined();
    expect(claimRewardsCall.action.toolInput).toMatchObject({
      chain: 'paseo_asset_hub',
    });
  }, 3500000);

})

