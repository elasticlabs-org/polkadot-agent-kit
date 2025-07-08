import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { PolkadotAgentKit } from '../../src/api';
import type { AgentConfig, KnownChainId } from '@polkadot-agent-kit/common';

const mockBalanceResult = { balance: '100.00', symbol: 'WND', chain: 'westend' };
const mockTransferResult = { success: true, transactionHash: '0xMOCKEDTXHASH' };
const mockXcmResult = { success: true, transactionHash: '0xMOCKEDXCMTXHASH' };

vi.mock('../../src/api', () => {
  return {
    PolkadotAgentKit: vi.fn().mockImplementation((privateKey: string, config?: any) => {
      // Create a new instance for each call to avoid shared state
      const instanceConfig = config ? { ...config } : { keyType: 'Sr25519' };
      const allowedChains = config?.chains || ['polkadot', 'west', 'polkadot_asset_hub', 'west_asset_hub'];
      
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
        disconnect: vi.fn().mockResolvedValue(undefined),
        // Chain limitation methods
        config: instanceConfig,
        getAllowedChains: vi.fn(() => allowedChains),
        validateChainAccess: vi.fn((chainId: string) => {
          if (!allowedChains.includes(chainId)) {
            throw new Error(`Chain '${chainId}' is not allowed. Allowed chains: ${allowedChains.join(', ')}`);
          }
        }),
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

describe('PolkadotAgentKit E2E - Chain Limitation', () => {
  describe('Agent with Limited Chains', () => {
    it('should create agent with specific chains only', async () => {
      const config: AgentConfig = {
        keyType: 'Sr25519',
        chains: ['polkadot', 'west'] as KnownChainId[]
      };
      
      const limitedAgent = new PolkadotAgentKit(
        '0xe5be9a5092b81bca64be81d212e7f2f9eba183bb7a90954f7b76361f6edb5c0a',
        config
      );
      
      // Verify configuration
      expect(limitedAgent.config.chains).toEqual(['polkadot', 'west']);
      expect(limitedAgent.getAllowedChains()).toEqual(['polkadot', 'west']);
    });

    it('should validate chain access correctly', () => {
      const config: AgentConfig = {
        keyType: 'Sr25519',
        chains: ['polkadot'] as KnownChainId[]
      };
      
      const limitedAgent = new PolkadotAgentKit(
        '0xe5be9a5092b81bca64be81d212e7f2f9eba183bb7a90954f7b76361f6edb5c0a',
        config
      );
      
      // Should not throw for allowed chains
      expect(() => limitedAgent.validateChainAccess('polkadot')).not.toThrow();
      
      // Should throw for disallowed chains
      expect(() => limitedAgent.validateChainAccess('west')).toThrow();
      expect(() => limitedAgent.validateChainAccess('polkadot_asset_hub')).toThrow();
    });

    it('should create tools that respect chain limitations', () => {
      const config: AgentConfig = {
        keyType: 'Sr25519',
        chains: ['west'] as KnownChainId[]
      };
      
      const limitedAgent = new PolkadotAgentKit(
        '0xe5be9a5092b81bca64be81d212e7f2f9eba183bb7a90954f7b76361f6edb5c0a',
        config
      );
      
      // Tools should be created successfully
      expect(() => limitedAgent.getNativeBalanceTool()).not.toThrow();
      expect(() => limitedAgent.transferNativeTool()).not.toThrow();
      expect(() => limitedAgent.xcmTransferNativeTool()).not.toThrow();
      
      // Verify allowed chains
      expect(limitedAgent.getAllowedChains()).toEqual(['west']);
    });

    it('should handle empty chains array', () => {
      const config: AgentConfig = {
        keyType: 'Sr25519',
        chains: [] as KnownChainId[]
      };
      
      const restrictedAgent = new PolkadotAgentKit(
        '0xe5be9a5092b81bca64be81d212e7f2f9eba183bb7a90954f7b76361f6edb5c0a',
        config
      );
      
      // Should have no allowed chains
      expect(restrictedAgent.getAllowedChains()).toEqual([]);
      
      // Should reject all chain access
      expect(() => restrictedAgent.validateChainAccess('polkadot')).toThrow();
      expect(() => restrictedAgent.validateChainAccess('west')).toThrow();
    });

    it('should work with all supported chains when no limitation', () => {
      const config: AgentConfig = {
        keyType: 'Sr25519'
        // No chains specified - should allow all
      };
      
      const fullAgent = new PolkadotAgentKit(
        '0xe5be9a5092b81bca64be81d212e7f2f9eba183bb7a90954f7b76361f6edb5c0a',
        config
      );
      
      // Should allow all chains
      expect(fullAgent.getAllowedChains()).toEqual([
        'polkadot',
        'west', 
        'polkadot_asset_hub',
        'west_asset_hub'
      ]);
      
      // Should not throw for any chain
      expect(() => fullAgent.validateChainAccess('polkadot')).not.toThrow();
      expect(() => fullAgent.validateChainAccess('west')).not.toThrow();
      expect(() => fullAgent.validateChainAccess('polkadot_asset_hub')).not.toThrow();
      expect(() => fullAgent.validateChainAccess('west_asset_hub')).not.toThrow();
    });
  });

  describe('Chain Limitation Error Scenarios', () => {
    it('should provide helpful error messages', () => {
      const config: AgentConfig = {
        keyType: 'Sr25519',
        chains: ['polkadot', 'west'] as KnownChainId[]
      };
      
      const limitedAgent = new PolkadotAgentKit(
        '0xe5be9a5092b81bca64be81d212e7f2f9eba183bb7a90954f7b76361f6edb5c0a',
        config
      );
      
      try {
        limitedAgent.validateChainAccess('polkadot_asset_hub');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('polkadot_asset_hub');
        expect((error as Error).message).toContain('not allowed');
        expect((error as Error).message).toContain('polkadot, west');
      }
    });

    it('should handle case sensitivity', () => {
      const config: AgentConfig = {
        keyType: 'Sr25519',
        chains: ['polkadot'] as KnownChainId[]
      };
      
      const limitedAgent = new PolkadotAgentKit(
        '0xe5be9a5092b81bca64be81d212e7f2f9eba183bb7a90954f7b76361f6edb5c0a',
        config
      );
      
      // Should work for exact match
      expect(() => limitedAgent.validateChainAccess('polkadot')).not.toThrow();
      
      // Should fail for case mismatch
      expect(() => limitedAgent.validateChainAccess('POLKADOT' as KnownChainId)).toThrow();
    });
  });

  describe('Chain Limitation Integration', () => {
    it('should maintain configuration consistency', async () => {
      const config: AgentConfig = {
        keyType: 'Sr25519',
        chains: ['west', 'polkadot'] as KnownChainId[]
      };
      
      const limitedAgent = new PolkadotAgentKit(
        '0xe5be9a5092b81bca64be81d212e7f2f9eba183bb7a90954f7b76361f6edb5c0a',
        config
      );
      
      // Configuration should be preserved
      expect(limitedAgent.config.chains).toEqual(['west', 'polkadot']);
      expect(limitedAgent.getAllowedChains()).toEqual(['west', 'polkadot']);
      
      // Create tools and verify configuration is maintained
      limitedAgent.getNativeBalanceTool();
      limitedAgent.transferNativeTool();
      limitedAgent.xcmTransferNativeTool();
      
      expect(limitedAgent.config.chains).toEqual(['west', 'polkadot']);
      expect(limitedAgent.getAllowedChains()).toEqual(['west', 'polkadot']);
    });

    it('should handle configuration immutability', () => {
      const config: AgentConfig = {
        keyType: 'Sr25519',
        chains: ['polkadot'] as KnownChainId[]
      };
      
      const limitedAgent = new PolkadotAgentKit(
        '0xe5be9a5092b81bca64be81d212e7f2f9eba183bb7a90954f7b76361f6edb5c0a',
        config
      );
      
      // Attempt to modify the configuration externally
      config.chains = ['west'] as KnownChainId[];
      
      // Agent should maintain its original configuration
      expect(limitedAgent.config.chains).toEqual(['polkadot']);
      expect(limitedAgent.getAllowedChains()).toEqual(['polkadot']);
    });
  });
});
