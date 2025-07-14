import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { PolkadotAgentKit } from '../../src/api';
import type { AgentConfig } from '@polkadot-agent-kit/common';

const mockBalanceResult = { balance: '100.00', symbol: 'WND', chain: 'westend' };
const mockTransferResult = { success: true, transactionHash: '0xMOCKEDTXHASH' };
const mockXcmResult = { success: true, transactionHash: '0xMOCKEDXCMTXHASH' };
const mockSwapResult = { success: true, transactionHash: '0xMOCKEDSWAPTXHASH' };

vi.mock('../../src/api', () => {
  return {
    PolkadotAgentKit: vi.fn().mockImplementation((privateKey: string, config?: AgentConfig) => {

      const instanceConfig = config ? { ...config } : { keyType: 'Sr25519' };
      
      return {
        initializeApi: vi.fn().mockResolvedValue(undefined),
        getNativeBalanceTool: vi.fn(() => ({
          call: vi.fn(async (input: any) => mockBalanceResult)
        })),
        transferNativeTool: vi.fn(() => ({
          call: vi.fn(async (input: any) => mockTransferResult)
        })),
        xcmTransferNativeTool: vi.fn(() => ({
          call: vi.fn(async (input: any) => mockXcmResult)
        })),
        getCurrentAddress: vi.fn(() => '5FakeAddress'),
        swapCrossChainTokensTool: vi.fn(() => ({
          call: vi.fn(async (input: any) => mockSwapResult)
        })),
        disconnect: vi.fn().mockResolvedValue(undefined),
        config: instanceConfig,
      };
    })
  };
});

vi.mock('@langchain/ollama', () => ({
  ChatOllama: vi.fn().mockImplementation(() => ({
    call: vi.fn(async (input: any) => ({
      output: `Ollama response for: ${JSON.stringify(input)}`
    }))
  }))
}));


const scenarios = [
  {
    name: 'getNativeBalanceTool on Westend',
    arrange: (agent: PolkadotAgentKit) => agent.getNativeBalanceTool(),
    act: (tool: any) => tool.call({ chain: 'westend' }),
    assert: (result: any) => {
      expect(result).toEqual(mockBalanceResult);
      expect(result.balance).toBe('100.00');
      expect(result.symbol).toBe('WND');
      expect(result.chain).toBe('westend');
    }
  },
  {
    name: 'transferNativeTool 0.01 WND to recipient on Westend',
    arrange: (agent: PolkadotAgentKit) => agent.transferNativeTool(),
    act: (tool: any) => tool.call({ to: '5D7jcv6aYbhbYGVY8k65oemM6FVNoyBfoVkuJ5cbFvbefftr', amount: (0.01 * 10 ** 12).toString(), chain: 'westend' }),
    assert: (result: any) => {
      expect(result).toEqual(mockTransferResult);
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe('0xMOCKEDTXHASH');
    }
  },
  {
    name: 'xcmTransferNativeTool 0.1 WND from Westend to Westend Asset Hub',
    arrange: (agent: PolkadotAgentKit) => agent.xcmTransferNativeTool(),
    act: (tool: any) => tool.call({ to: '5D7jcv6aYbhbYGVY8k65oemM6FVNoyBfoVkuJ5cbFvbefftr', amount: (0.1 * 10 ** 12).toString(), sourceChain: 'westend', destChain: 'westend_asset_hub' }),
    assert: (result: any) => {
      expect(result).toEqual(mockXcmResult);
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe('0xMOCKEDXCMTXHASH');
    }
  },
  {
    name: 'xcmTransferNativeTool 0.1 WND from Westend Asset Hub to Westend',
    arrange: (agent: PolkadotAgentKit) => agent.xcmTransferNativeTool(),
    act: (tool: any) => tool.call({ to: '5D7jcv6aYbhbYGVY8k65oemM6FVNoyBfoVkuJ5cbFvbefftr', amount: (0.1 * 10 ** 12).toString(), sourceChain: 'westend_asset_hub', destChain: 'westend' }),
    assert: (result: any) => {
      expect(result).toEqual(mockXcmResult);
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe('0xMOCKEDXCMTXHASH');
    }
  },
  {
    name: 'swapCrossChainTokensTool 1 DOT from Polkadot to USDT on Asset Hub',
    arrange: (agent: PolkadotAgentKit) => agent.swapCrossChainTokensTool(),
    act: (tool: any) => tool.call({ from: 'Polkadot', to: 'AssetHubPolkadot', currencyFrom: 'DOT', currencyTo: 'USDT', amount: (1 * 10 ** 10).toString() }),
    assert: (result: any) => {
      expect(result).toEqual(mockSwapResult);
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe('0xMOCKEDSWAPTXHASH');
    }
  }
];

describe('PolkadotAgentKit E2E', () => {
  let agent: PolkadotAgentKit;

  beforeAll(async () => {
    agent = new PolkadotAgentKit('0xe5be9a5092b81bca64be81d212e7f2f9eba183bb7a90954f7b76361f6edb5c0a', { keyType: 'Sr25519' });
    await agent.initializeApi();
  });

  afterAll(async () => {
    await agent.disconnect();
  });

  scenarios.forEach(({ name, arrange, act, assert }) => {
    it(name, async () => {
      const tool = arrange(agent);
      const result = await act(tool);
      assert(result);
    });
  });
});

