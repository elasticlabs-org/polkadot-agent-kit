import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PolkadotAgentKit } from '../../src/api';
import { AgentTest } from './agents/agent';
import dotenv from 'dotenv';
import { getBalance, sleep } from './utils';
import { Api, ChainIdAssetHub, getDecimalsByChainId, parseUnits } from '@polkadot-agent-kit/common';
import { getAssetBalance as getAssetBalanceParaSpell } from '@paraspell/sdk-core';
import { getAssetBalance } from '@polkadot-agent-kit/core';
import { Builder } from '@paraspell/sdk';
import type { TCurrencyCore } from '@paraspell/assets';
import { SWAP_PROMPT, BIFROST_PROMPT } from '@polkadot-agent-kit/llm';
dotenv.config({ path: '../../.env' });






describe('PolkadotAgentKit Integration with LLM Agent Swap', () => {
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



    it('should call swap_tokens tool for Polkadot to Polkadot Asset Hub swap', async () => {

        // swap at least 0.2 DOT for sufficient fees on DEX
        // Sometime it is not working with NoDeal issue from Hydration due to insuficient liquidity/fees for Hydration

        const amount = parseUnits("0.2", getDecimalsByChainId('polkadot'));
        const userQuery = `swap 0.2 DOT from Polkadot to USDC on Polkadot Asset Hub`;

        const apiPolkadot = agentKit.getApi('polkadot');

        const balanceDotBefore = await getBalance(apiPolkadot, agentKit.getCurrentAddress());
        console.log('Balance DOT Before:', balanceDotBefore);
        const apiPolkadotAssetHub = agentKit.getApi('polkadot_asset_hub') as Api<ChainIdAssetHub>;

        const balanceUSDCBefore = await getAssetBalance(apiPolkadotAssetHub, 'AssetHubPolkadot', 'USDC', agentKit.getCurrentAddress());
        console.log("Balance USDC before:",balanceUSDCBefore);



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
            currencyTo: 'USDC',
            from: 'Polkadot',
            to: 'AssetHubPolkadot'
        });

        await sleep(3 * 60 * 1000);
        const apiPolkadotAfter = agentKit.getApi('polkadot');

        const balanceDotAfter = await getBalance(apiPolkadotAfter, agentKit.getCurrentAddress());
        console.log('Balance DOT After:', balanceDotAfter);
        const apiPolkadotAssetHubAfter = agentKit.getApi('polkadot_asset_hub') as Api<ChainIdAssetHub>;

        const balanceUSDCAfter = await getAssetBalance(apiPolkadotAssetHubAfter, 'AssetHubPolkadot', 'USDC', agentKit.getCurrentAddress());
        console.log("Balance USDC after:",balanceUSDCAfter);

        // compare the balance before and after swapping 
        expect(balanceDotAfter.data.free).toBeLessThan(balanceDotBefore.data.free - amount);
        expect(balanceUSDCAfter).toBeGreaterThan(balanceUSDCBefore);



    }, 1500000);

});




describe('PolkadotAgentKit Integration with LLM Agent Bifrost', () => {
    let agentKit: PolkadotAgentKit;
    let agent: AgentTest;

    beforeAll(async () => {


        if (process.env.AGENT_PRIVATE_KEY_MAINNET) {
            agentKit = new PolkadotAgentKit({ privateKey: process.env.AGENT_PRIVATE_KEY_MAINNET, keyType: 'Sr25519', chains: ['polkadot', 'bifrost_polkadot'] });
            await agentKit.initializeApi();
            agent = new AgentTest(agentKit, BIFROST_PROMPT);
            await agent.init();
            await sleep(10000);
        } else {
            throw new Error('AGENT_PRIVATE_KEY_MAINNET is not set');
        }
    }, 1500000);
    
    afterAll(async () => {
        await agentKit.disconnect();
    });


    it('should call mint_vdot tool for minting vDOT on Bifrost', async () => {

        // Make sure you have enough BNC and DOT on Bifrost first. if not the test case will be fail 
        // At least amount > 0.5 DOT for test case success 
        const amount = parseUnits("0.5", getDecimalsByChainId('polkadot'));
        console.log("Amount IN Planck:", amount);
        const userQuery = `mint 0.5 DOT to vDOT on Bifrost`;

        // Create paraspell API instance for Bifrost
        let paraspellApi;
        try {
            const builder = Builder();
            await builder.api.init('BifrostPolkadot');
            paraspellApi = builder.api;
        } catch (error) {
            throw new Error(`Failed to initialize paraspell API for Bifrost: ${error instanceof Error ? error.message : String(error)}`);
        }

        const balanceDotBefore = await getAssetBalanceParaSpell({
            address: agentKit.getCurrentAddress(),
            chain: 'BifrostPolkadot',
            currency: {symbol: {type: 'Foreign', value: 'DOT'}} ,
            api: paraspellApi
        });
        console.log('Balance DOT Before:', balanceDotBefore);

    
        const balanceVDotBefore = await getAssetBalanceParaSpell({
            address: agentKit.getCurrentAddress(),
            chain: 'BifrostPolkadot',
            currency: {symbol: {type: 'Foreign', value: 'DOT'}} ,
            api: paraspellApi
        });
        console.log('Balance vDOT Before:', balanceDotBefore);

        try {
            await paraspellApi.disconnect();
            console.log('Paraspell API disconnected successfully');
        } catch (error) {
            console.warn(`Failed to disconnect paraspell API: ${error instanceof Error ? error.message : String(error)}`);
        }

        const result = await agent.ask(userQuery);
        console.log('Mint vDOT Query Result:', result);

        expect(result.output).toBeDefined();
        expect(result.intermediateSteps).toBeDefined();
        expect(result.intermediateSteps?.length).toBeGreaterThan(0);

        const mintVdotCall = result.intermediateSteps?.find((step: any) =>
            step.action?.tool === 'mint_vdot'
        );

        expect(mintVdotCall).toBeDefined();
        expect(mintVdotCall.action.toolInput).toMatchObject({
            amount: '0.5'
        });

        await sleep(1 * 60 * 1000);

        let paraspellApiAfter;
        try {
            const builderAfter = Builder();
            await builderAfter.api.init('BifrostPolkadot');
            paraspellApiAfter = builderAfter.api;
        } catch (error) {
            throw new Error(`Failed to reinitialize paraspell API for balance check: ${error instanceof Error ? error.message : String(error)}`);
        }

        const balanceDotAfter = await getAssetBalanceParaSpell({
            address: agentKit.getCurrentAddress(),
            chain: 'BifrostPolkadot',
            currency: {symbol: {type: 'Foreign', value: 'DOT'}} ,
            api: paraspellApiAfter
        });
        console.log('Balance DOT After:', balanceDotAfter);


        const balancevDotAfter = await getAssetBalanceParaSpell({
            address: agentKit.getCurrentAddress(),
            chain: 'BifrostPolkadot',
            currency: {symbol: {type: 'Foreign', value: 'vDOT'}} ,
            api: paraspellApiAfter
        });
        console.log('Balance vDOT After:', balanceDotAfter);

        // we set fee asset default is BNC (Bifrost)
        expect(balanceDotAfter).toEqual(balanceDotBefore - amount);

        expect(balancevDotAfter).toBeGreaterThan(balanceVDotBefore);

        try {
            await paraspellApiAfter.disconnect();
            console.log('Paraspell API after disconnected successfully');
        } catch (error) {
            console.warn(`Failed to disconnect paraspell API after: ${error instanceof Error ? error.message : String(error)}`);
        }
    }, 1500000);


});






