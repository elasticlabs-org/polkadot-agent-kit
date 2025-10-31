import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PolkadotAgentKit } from '../../src/api';
import { AgentTest } from './agents/agent';
import dotenv from 'dotenv';
import { getBalance, sleep } from './utils';
import { Api, ChainIdAssetHub } from '@polkadot-agent-kit/common';
import { getAssetBalance } from '@polkadot-agent-kit/core';
import { SWAP_PROMPT } from '@polkadot-agent-kit/llm';
dotenv.config({ path: '../../.env' });
let agentKit: PolkadotAgentKit;
let agent: AgentTest;

beforeAll(async () => {


    if (process.env.AGENT_PRIVATE_KEY_MAINNET) {
        agentKit = new PolkadotAgentKit({ privateKey: process.env.AGENT_PRIVATE_KEY_MAINNET, keyType: 'Sr25519', chains: ['polkadot', 'polkadot_asset_hub'] });
        await agentKit.initializeApi();
        agent = new AgentTest(agentKit, SWAP_PROMPT);
        await agent.init();
        await sleep(10000);
    } else {
        throw new Error('AGENT_PRIVATE_KEY_MAINNET is not set');
    }
}, 1500000);

afterAll(async () => {
    await agentKit.disconnect();
});


describe('PolkadotAgentKit Integration with LLM Agent', () => {


    it('should call swap_tokens tool for Polkadot to Polkadot Asset Hub swap', async () => {
        
        // swap at least 1 DOT for sufficient fees on DEX
        
        const userQuery = `swap 0.2 DOT from Polkadot to USDt on Polkadot Asset Hub`;

        console.log("Bot agent:", agentKit.getCurrentAddress())
        const apiPolkadot = agentKit.getApi('polkadot');

        const balanceDotBefore = await getBalance(apiPolkadot, agentKit.getCurrentAddress());
        console.log('Balance DOT Before:', balanceDotBefore);
        const apiPolkadotAssetHub = agentKit.getApi('polkadot_asset_hub') as Api<ChainIdAssetHub>;

        const balanceUsdtBefore = await getAssetBalance(apiPolkadotAssetHub, 'AssetHubPolkadot', 'USDt', agentKit.getCurrentAddress());
        console.log("Balance USDC before:",balanceUsdtBefore);



        const result = await agent.ask(userQuery);
        console.log('Swap Tokens Query Result (Polkadot → Polkadot Asset Hub):', result);

        expect(result.output).toBeDefined();
        expect(result.intermediateSteps).toBeDefined();
        expect(result.intermediateSteps?.length).toBeGreaterThan(0);

        const swapCall = result.intermediateSteps?.find((step: any) =>
            step.action?.tool === 'swap_tokens'
        );

        expect(swapCall).toBeDefined();
        expect(swapCall.action.toolInput).toMatchObject({
            amount: '0.2',
            currencyFrom: 'DOT',
            currencyTo: 'USDt',
            from: 'Polkadot',
            to: 'AssetHubPolkadot'
        });

        await sleep(3 * 60 * 1000);
        const apiPolkadotAfter = agentKit.getApi('polkadot');

        const balanceDotAfter = await getBalance(apiPolkadotAfter, agentKit.getCurrentAddress());
        console.log('Balance DOT After:', balanceDotAfter);
        const apiPolkadotAssetHubAfter = agentKit.getApi('polkadot_asset_hub') as Api<ChainIdAssetHub>;

        const balanceUsdtAfter = await getAssetBalance(apiPolkadotAssetHubAfter, 'AssetHubPolkadot', 'USDt', agentKit.getCurrentAddress());
        console.log("Balance USDC after:",balanceUsdtAfter);



    }, 1500000);


});
