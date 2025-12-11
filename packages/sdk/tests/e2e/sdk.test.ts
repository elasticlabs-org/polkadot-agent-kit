import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { PolkadotAgentKit } from '../../src/api';
import { getLangChainTools } from '../../src/langchain';
import { getVercelAITools } from '../../src/vercel';
import type { AgentConfig } from '@polkadot-agent-kit/common';

const mockBalanceResult = { balance: '100.00', symbol: 'WND', chain: 'westend' };
const mockTransferResult = { success: true, transactionHash: '0xMOCKEDTXHASH' };
const mockXcmResult = { success: true, transactionHash: '0xMOCKEDXCMTXHASH' };
const mockSwapResult = { success: true, transactionHash: '0xMOCKEDSWAPTXHASH' };

// Nomination pool mock results
const mockJoinPoolResult = { success: true, transactionHash: '0xMOCKEDJOINPOOLTXHASH', data: { amount: '10', chain: 'polkadot' } };
const mockBondExtraResult = { success: true, transactionHash: '0xMOCKEDBONDEXTRATXHASH' };
const mockUnbondResult = { success: true, transactionHash: '0xMOCKEDUNBONDTXHASH' };
const mockWithdrawUnbondedResult = { success: true, transactionHash: '0xMOCKEDWITHDRAWTXHASH' };
const mockClaimRewardsResult = { success: true, transactionHash: '0xMOCKEDCLAIMREWARDSTXHASH' };

// Bifrost mintVdot mock results
const mockMintVdotResult = { success: true, transactionHash: '0xMOCKEDMINTVDOTTXHASH' };

vi.mock('@langchain/core/tools', () => ({
  tool: vi.fn().mockImplementation((fn: any, options: any) => ({
    name: options?.name,
    description: options?.description,
    schema: options?.schema,
    call: fn
  }))
}));

vi.mock('../../src/api', () => {
  return {
    PolkadotAgentKit: vi.fn().mockImplementation((config: AgentConfig) => {

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
        swapTokensTool: vi.fn(() => ({
          call: vi.fn(async (input: any) => mockSwapResult)
        })),
        // Nomination pool tools
        joinPoolTool: vi.fn(() => ({
          call: vi.fn(async (input: any) => mockJoinPoolResult)
        })),
        bondExtraTool: vi.fn(() => ({
          call: vi.fn(async (input: any) => mockBondExtraResult)
        })),
        unbondTool: vi.fn(() => ({
          call: vi.fn(async (input: any) => mockUnbondResult)
        })),
        withdrawUnbondedTool: vi.fn(() => ({
          call: vi.fn(async (input: any) => mockWithdrawUnbondedResult)
        })),
        claimRewardsTool: vi.fn(() => ({
          call: vi.fn(async (input: any) => mockClaimRewardsResult)
        })),
        // Bifrost mintVdot tool
        mintVdotTool: vi.fn(() => ({
          call: vi.fn(async (input: any) => mockMintVdotResult)
        })),
        getActions: vi.fn(() => [
          {
            name: 'check_balance',
            description: 'Check balance of the wallet address on a specific chain',
            schema: {} as any,
            invoke: vi.fn(async (args: any) => JSON.stringify(mockBalanceResult))
          },
          {
            name: 'transfer_native',
            description: 'Transfer native tokens to an address',
            schema: {} as any,
            invoke: vi.fn(async (args: any) => JSON.stringify(mockTransferResult))
          }
        ]),
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
    name: 'swapTokensTool 1 DOT from Polkadot to USDT on Asset Hub',
    arrange: (agent: PolkadotAgentKit) => agent.swapTokensTool(),
    act: (tool: any) => tool.call({ from: 'Polkadot', to: 'AssetHubPolkadot', currencyFrom: 'DOT', currencyTo: 'USDT', amount: (1 * 10 ** 10).toString() }),
    assert: (result: any) => {
      expect(result).toEqual(mockSwapResult);
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe('0xMOCKEDSWAPTXHASH');
    }
  },
  {
    name: 'swapTokensTool 1 DOT to USDT on HydrationDex',
    arrange: (agent: PolkadotAgentKit) => agent.swapTokensTool(),
    act: (tool: any) => tool.call({ currencyFrom: 'DOT', currencyTo: 'USDT', amount: (1 * 10 ** 10).toString(), dex: 'HydrationDex' }),
    assert: (result: any) => {
      expect(result).toEqual(mockSwapResult);
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe('0xMOCKEDSWAPTXHASH');
    }
  },
  // Nomination Pool Tests
  {
    name: 'joinPoolTool join nomination pool with 10 DOT on Polkadot',
    arrange: (agent: PolkadotAgentKit) => agent.joinPoolTool(),
    act: (tool: any) => tool.call({ amount: '10', chain: 'polkadot' }),
    assert: (result: any) => {
      expect(result).toEqual(mockJoinPoolResult);
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe('0xMOCKEDJOINPOOLTXHASH');
      expect(result.data).toEqual({ amount: '10', chain: 'polkadot' });
    }
  },
  {
    name: 'joinPoolTool join nomination pool with 5 KSM on Kusama',
    arrange: (agent: PolkadotAgentKit) => agent.joinPoolTool(),
    act: (tool: any) => tool.call({ amount: '5', chain: 'kusama' }),
    assert: (result: any) => {
      expect(result).toEqual(mockJoinPoolResult);
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe('0xMOCKEDJOINPOOLTXHASH');
    }
  },
  {
    name: 'bondExtraTool bond 2 DOT from free balance on Polkadot',
    arrange: (agent: PolkadotAgentKit) => agent.bondExtraTool(),
    act: (tool: any) => tool.call({ type: 'FreeBalance', amount: '2', chain: 'polkadot' }),
    assert: (result: any) => {
      expect(result).toEqual(mockBondExtraResult);
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe('0xMOCKEDBONDEXTRATXHASH');
    }
  },
  {
    name: 'bondExtraTool re-stake rewards on Polkadot',
    arrange: (agent: PolkadotAgentKit) => agent.bondExtraTool(),
    act: (tool: any) => tool.call({ type: 'Rewards', chain: 'polkadot' }),
    assert: (result: any) => {
      expect(result).toEqual(mockBondExtraResult);
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe('0xMOCKEDBONDEXTRATXHASH');
    }
  },
  {
    name: 'bondExtraTool bond 1 KSM from free balance on Kusama',
    arrange: (agent: PolkadotAgentKit) => agent.bondExtraTool(),
    act: (tool: any) => tool.call({ type: 'FreeBalance', amount: '1', chain: 'kusama' }),
    assert: (result: any) => {
      expect(result).toEqual(mockBondExtraResult);
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe('0xMOCKEDBONDEXTRATXHASH');
    }
  },
  {
    name: 'unbondTool unbond 3 DOT from nomination pool on Polkadot',
    arrange: (agent: PolkadotAgentKit) => agent.unbondTool(),
    act: (tool: any) => tool.call({ amount: '3', chain: 'polkadot' }),
    assert: (result: any) => {
      expect(result).toEqual(mockUnbondResult);
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe('0xMOCKEDUNBONDTXHASH');
    }
  },
  {
    name: 'unbondTool unbond 1.5 KSM from nomination pool on Kusama',
    arrange: (agent: PolkadotAgentKit) => agent.unbondTool(),
    act: (tool: any) => tool.call({ amount: '1.5', chain: 'kusama' }),
    assert: (result: any) => {
      expect(result).toEqual(mockUnbondResult);
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe('0xMOCKEDUNBONDTXHASH');
    }
  },
  {
    name: 'withdrawUnbondedTool withdraw unbonded tokens with 0 slashing spans on Polkadot',
    arrange: (agent: PolkadotAgentKit) => agent.withdrawUnbondedTool(),
    act: (tool: any) => tool.call({ slashingSpans: '0', chain: 'polkadot' }),
    assert: (result: any) => {
      expect(result).toEqual(mockWithdrawUnbondedResult);
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe('0xMOCKEDWITHDRAWTXHASH');
    }
  },
  {
    name: 'withdrawUnbondedTool withdraw unbonded tokens with 2 slashing spans on Kusama',
    arrange: (agent: PolkadotAgentKit) => agent.withdrawUnbondedTool(),
    act: (tool: any) => tool.call({ slashingSpans: '2', chain: 'kusama' }),
    assert: (result: any) => {
      expect(result).toEqual(mockWithdrawUnbondedResult);
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe('0xMOCKEDWITHDRAWTXHASH');
    }
  },
  {
    name: 'claimRewardsTool claim rewards from nomination pool on Polkadot',
    arrange: (agent: PolkadotAgentKit) => agent.claimRewardsTool(),
    act: (tool: any) => tool.call({ chain: 'polkadot' }),
    assert: (result: any) => {
      expect(result).toEqual(mockClaimRewardsResult);
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe('0xMOCKEDCLAIMREWARDSTXHASH');
    }
  },
  {
    name: 'claimRewardsTool claim rewards from nomination pool on Kusama',
    arrange: (agent: PolkadotAgentKit) => agent.claimRewardsTool(),
    act: (tool: any) => tool.call({ chain: 'kusama' }),
    assert: (result: any) => {
      expect(result).toEqual(mockClaimRewardsResult);
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe('0xMOCKEDCLAIMREWARDSTXHASH');
    }
  },
  // Bifrost mintVdot Tests
  {
    name: 'mintVdotTool mint 10 DOT to vDOT on Bifrost',
    arrange: (agent: PolkadotAgentKit) => agent.mintVdotTool(),
    act: (tool: any) => tool.call({ amount: '10' }),
    assert: (result: any) => {
      expect(result).toEqual(mockMintVdotResult);
      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe('0xMOCKEDMINTVDOTTXHASH');
    }
  },
];

describe('PolkadotAgentKit E2E', () => {
  let agent: PolkadotAgentKit;

  beforeAll(async () => {
    agent = new PolkadotAgentKit({
      privateKey: '0xabc',
      keyType: 'Sr25519'
    });
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

  describe('getLangChainTools', () => {
    it('should return a tool array with correct structure', async () => {
      const tools = getLangChainTools(agent);

      expect(Array.isArray(tools)).toBe(true);
      expect(tools).toHaveLength(2);

      const checkBalance = tools[0];
      const transferNative = tools[1];

      expect(checkBalance.name).toBe('check_balance');
      expect(checkBalance.description).toBe('Check balance of the wallet address on a specific chain');
      expect(typeof checkBalance.call).toBe('function');

      expect(transferNative.name).toBe('transfer_native');
      expect(transferNative.description).toBe('Transfer native tokens to an address');
      expect(typeof transferNative.call).toBe('function');
    });

    it('should execute tools and return expected results', async () => {
      const tools = getLangChainTools(agent);

      const balanceResult = await tools[0].call({ chain: 'westend' });
      const transferResult = await tools[1].call({
        to: '5D7jcv6aYbhbYGVY8k65oemM6FVNoyBfoVkuJ5cbFvbefftr',
        amount: (0.01 * 10 ** 12).toString(),
        chain: 'westend'
      });

      expect(balanceResult).toBe(JSON.stringify(mockBalanceResult));
      expect(transferResult).toBe(JSON.stringify(mockTransferResult));
    });
  });

  describe('getVercelAITools', () => {
    it('should return a toolset with correct structure', () => {
      const toolSet = getVercelAITools(agent);

      expect(toolSet).toBeDefined();
      expect(typeof toolSet).toBe('object');
      expect(toolSet.check_balance).toBeDefined();
      expect(toolSet.transfer_native).toBeDefined();

      // Check that the tools have the expected structure
      expect(typeof toolSet.check_balance.execute).toBe('function');
      expect(typeof toolSet.transfer_native.execute).toBe('function');
    });

    it('should have tools with correct descriptions', () => {
      const toolSet = getVercelAITools(agent);

      expect(toolSet.check_balance.description).toBe('Check balance of the wallet address on a specific chain');
      expect(toolSet.transfer_native.description).toBe('Transfer native tokens to an address');
    });
  });
});

