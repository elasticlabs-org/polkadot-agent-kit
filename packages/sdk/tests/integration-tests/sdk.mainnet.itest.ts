import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PolkadotAgentKit } from '../../src/api';
import { OllamaAgent } from './ollamaAgent';
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });
let agentKit: PolkadotAgentKit;
let ollamaAgent: OllamaAgent;

beforeAll(async () => {


    if (process.env.AGENT_PRIVATE_KEY_MAINNET) {
        agentKit = new PolkadotAgentKit({ privateKey: process.env.AGENT_PRIVATE_KEY_MAINNET, keyType: 'Sr25519', chains: ['polkadot'] });
        await agentKit.initializeApi();
        ollamaAgent = new OllamaAgent(agentKit);
        await ollamaAgent.init();
    } else {
        throw new Error('AGENT_PRIVATE_KEY_MAINNET is not set');
    }
}, 1500000);

afterAll(async () => {
    await agentKit.disconnect();
});


describe('PolkadotAgentKit Integration with OllamaAgent', () => {


    it('should call swap_tokens tool for Polkadot to Polkadot Asset Hub swap', async () => {
        const userQuery = `swap 0.1 DOT from Polkadot to USDt on Polkadot Asset Hub`;
        const result = await ollamaAgent.ask(userQuery);
        console.log('Swap Tokens Query Result (Polkadot → Polkadot Asset Hub):', result);

        expect(result.output).toBeDefined();
        expect(result.intermediateSteps).toBeDefined();
        expect(result.intermediateSteps.length).toBeGreaterThan(0);

        const swapCall = result.intermediateSteps.find((step: any) =>
            step.action?.tool === 'swap_tokens'
        );

        expect(swapCall).toBeDefined();
        expect(swapCall.action.toolInput).toMatchObject({
            amount: '0.1',
            currencyFrom: 'DOT',
            currencyTo: 'USDt',
            from: 'Polkadot',
            to: 'AssetHubPolkadot'
        });


    }, 1500000);

});
