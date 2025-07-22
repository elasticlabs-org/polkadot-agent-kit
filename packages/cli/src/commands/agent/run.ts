import { Command } from 'commander';
import fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { configManager } from '../../core/config/manager';
import { logger } from '../../utils/logger';
import { AgentRunOptions, CLIError } from '../../types/commands';
import { AgentMetadata } from '../../types/agent';
import { PolkadotAgentKit } from '@polkadot-agent-kit/sdk';

export const runCommand = new Command('run')
  .description('Execute a command with an AI agent')
  .option('-f, --format <format>', 'Output format (json|table|raw)', 'raw')
  .option('-t, --timeout <timeout>', 'Request timeout in seconds', '30')
  .option('-v, --verbose', 'Verbose output', false);

// Check balance subcommand
runCommand
  .command('check-balance')
  .description('Check the balance of the agent wallet')
  .requiredOption('-a, --agent <agent>', 'Agent name')
  .option('-c, --chain <chain>', 'Chain to check balance on', 'polkadot')
  .action(async (options: { agent: string, chain?: string }, cmd) => {
    const parentOptions = cmd.parent?.opts() as AgentRunOptions;
    const agentName = options.agent;
    try {
      await runCheckBalanceCommand(agentName, options.chain || 'polkadot', parentOptions);
    } catch (error) {
      throw new CLIError(`Failed to check balance: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

// Transfer subcommand
runCommand
  .command('transfer')
  .description('Transfer tokens to an address')
  .requiredOption('-a, --agent <agent>', 'Agent name')
  .argument('<amount>', 'Amount of tokens to transfer')
  .argument('<address>', 'Address to receive the tokens')
  .option('-c, --chain <chain>', 'Destination chain', 'polkadot')
  .action(async (amount: string, address: string, options: { agent: string, chain?: string }, cmd) => {
    const parentOptions = cmd.parent?.opts() as AgentRunOptions;
    const agentName = options.agent;
    try {
      await runTransferCommand(agentName, amount, address, options.chain || 'polkadot', parentOptions);
    } catch (error) {
      throw new CLIError(`Failed to transfer tokens: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

// XCM transfer subcommand
runCommand
  .command('xcm')
  .description('Transfer tokens via XCM between chains')
  .requiredOption('-a, --agent <agent>', 'Agent name')
  .argument('<amount>', 'Amount of tokens to transfer')
  .argument('<address>', 'Address to receive the tokens')
  .argument('<source-chain>', 'Source chain')
  .argument('<dest-chain>', 'Destination chain')
  .action(async (amount: string, address: string, sourceChain: string, destChain: string, options: { agent: string }, cmd) => {
    const parentOptions = cmd.parent?.opts() as AgentRunOptions;
    const agentName = options.agent;
    try {
      await runXcmCommand(agentName, amount, address, sourceChain, destChain, parentOptions);
    } catch (error) {
      throw new CLIError(`Failed to execute XCM transfer: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

// Swap subcommand
runCommand
  .command('swap')
  .description('Swap tokens')
  .requiredOption('-a, --agent <agent>', 'Agent name')
  .argument('<amount>', 'Amount of tokens to swap')
  .argument('<from-currency>', 'Currency to swap from')
  .argument('<to-currency>', 'Currency to swap to')
  .argument('<source-chain>', 'Source chain for cross-chain swap')
  .argument('<destination-chain>', 'Destination chain for cross-chain swap')
  .option('--dex <dex>', 'DEX to use for the swap')
  .option('--receiver <address>', 'Receiver address (defaults to sender)')
  .action(async (amount: string, fromCurrency: string, toCurrency: string, options: {
    agent: string;
    receiver?: string;
  }, cmd) => {
    const parentOptions = cmd.parent?.opts() as AgentRunOptions;
    const agentName = options.agent;
    try {
      await runSwapCommand(agentName, amount, fromCurrency, toCurrency, options, parentOptions);
    } catch (error) {
      throw new CLIError(`Failed to execute swap: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

// Check balance command
async function runCheckBalanceCommand(agentName: string, chain: string, options: AgentRunOptions): Promise<void> {
  const agent = await loadAgent(agentName);
  if (!agent) {
    throw new Error(`Agent "${agentName}" not found`);
  }

  if (options.verbose) {
    displayAgentInfo(agent);
  }

  logger.info(chalk.blue(`🚀 Checking balance for agent "${agentName}" on ${chain}...`));
  
  try {
    const result = await executeBalanceCheckCommand(agent, chain);
    displayResult(result, options);
    await updateAgentUsage(agentName);
  } catch (error) {
    logger.error(`Balance check failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Transfer command
async function runTransferCommand(agentName: string, amount: string, address: string, chain: string, options: AgentRunOptions): Promise<void> {
  const agent = await loadAgent(agentName);
  if (!agent) {
    throw new Error(`Agent "${agentName}" not found`);
  }

  if (options.verbose) {
    displayAgentInfo(agent);
  }

  logger.info(chalk.blue(`🚀 Transferring ${amount} tokens to ${address} on ${chain} with agent "${agentName}"...`));
  
  try {
    const result = await executeTransferCommand(agent, amount, address, chain);
    displayResult(result, options);
    await updateAgentUsage(agentName);
  } catch (error) {
    logger.error(`Transfer failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// XCM command
async function runXcmCommand(agentName: string, amount: string, address: string, sourceChain: string, destChain: string, options: AgentRunOptions): Promise<void> {
  const agent = await loadAgent(agentName);
  if (!agent) {
    throw new Error(`Agent "${agentName}" not found`);
  }

  if (options.verbose) {
    displayAgentInfo(agent);
  }

  logger.info(chalk.blue(`🚀 XCM transfer of ${amount} tokens to ${address} from ${sourceChain} to ${destChain} with agent "${agentName}"...`));
  
  try {
    const result = await executeXcmTransferCommand(agent, amount, address, sourceChain, destChain);
    displayResult(result, options);
    await updateAgentUsage(agentName);
  } catch (error) {
    logger.error(`XCM transfer failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Swap command
async function runSwapCommand(agentName: string, amount: string, fromCurrency: string, toCurrency: string, swapOptions: {
  fromChain?: string;
  toChain?: string;
  dex?: string;
  receiver?: string;
}, options: AgentRunOptions): Promise<void> {
  const agent = await loadAgent(agentName);
  if (!agent) {
    throw new Error(`Agent "${agentName}" not found`);
  }

  if (options.verbose) {
    displayAgentInfo(agent);
  }

  logger.info(chalk.blue(`🚀 Swapping ${amount} ${fromCurrency} to ${toCurrency} with agent "${agentName}"...`));
  
  try {
    const result = await executeSwapCommand(agent, amount, fromCurrency, toCurrency, swapOptions);
    displayResult(result, options);
    await updateAgentUsage(agentName);
  } catch (error) {
    logger.error(`Swap failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

async function loadAgent(name: string): Promise<AgentMetadata | null> {
  const agentsPath = getAgentsPath();
  const agentFile = path.join(agentsPath, `${name}.json`);
  
  if (!(await fs.pathExists(agentFile))) {
    return null;
  }
  
  try {
    return await fs.readJson(agentFile);
  } catch (error) {
    throw new Error(`Failed to load agent: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function getAgentsPath(): string {
  const config = configManager.getConfig();
  const agentsLocation = config.agents.storageLocation;
  
  if (agentsLocation.startsWith('~/')) {
    const homeDir = process.env.HOME || process.env.USERPROFILE || process.cwd();
    return path.join(homeDir, agentsLocation.slice(2));
  }
  
  return path.resolve(agentsLocation);
}

function displayAgentInfo(agent: AgentMetadata): void {
  console.log(chalk.blue('🤖 Agent Information'));
  console.log(chalk.cyan(`Name: ${agent.name}`));
  console.log(chalk.gray(`Provider: ${agent.provider}`));
  console.log(chalk.gray(`Model: ${agent.model}`));
  console.log(chalk.gray(`Tools: ${agent.tools.join(', ')}`));
  console.log(chalk.gray(`Key Type: ${agent.polkadotConfig.keyType}`));
  console.log(chalk.gray(`Networks: ${agent.polkadotConfig.chains ? agent.polkadotConfig.chains.join(', ') : 'All supported networks'}`));
  console.log();
}

// New execution functions for subcommands
async function executeBalanceCheckCommand(agent: AgentMetadata, chain: string): Promise<any> {
  try {
    // Initialize PolkadotAgentKit with the agent's configuration
    const agentKit = new PolkadotAgentKit(agent.polkadotConfig.privateKey, {
      keyType: agent.polkadotConfig.keyType,
      chains: agent.polkadotConfig.chains as any,
    });
    const agentAddress = agentKit.getCurrentAddress();
    logger.info('Initializing Polkadot Agent Kit...');
    await agentKit.initializeApi();
    
    logger.info(`Checking balance on chain: ${chain}`);
    
    // Get the balance tool and execute it
    const balanceTool = agentKit.getNativeBalanceTool();
    const balanceResult = await balanceTool.call({ chain });
    
    return {
      type: 'balance',
      data: {
        agent: agent.name,
        address: agentAddress,
        chain,
        balance: balanceResult,
        rawResult: balanceResult,
      },
      success: true,
      message: `Balance check completed for ${chain}`
    };
    
  } catch (error) {
    logger.error(`Balance check failed: ${error instanceof Error ? error.message : String(error)}`);
    
    return {
      type: 'error',
      data: {
        agent: agent.name,
        error: error instanceof Error ? error.message : String(error),
      },
      success: false,
      message: 'Balance check failed'
    };
  }
}

async function executeTransferCommand(agent: AgentMetadata, amount: string, address: string, chain: string): Promise<any> {
  try {
    // Initialize PolkadotAgentKit with the agent's configuration
    const agentKit = new PolkadotAgentKit(agent.polkadotConfig.privateKey, {
      keyType: agent.polkadotConfig.keyType,
      chains: agent.polkadotConfig.chains as any,
    });
    
    logger.info('Initializing Polkadot Agent Kit...');
    await agentKit.initializeApi();
    
    logger.info(`Transferring ${amount} tokens to ${address} on ${chain}`);
    
    // Get the transfer tool and execute it
    const transferTool = agentKit.transferNativeTool();
    const transferResult = await transferTool.call({ to: address, amount, chain });
    
    
    return {
      type: 'transfer',
      data: {
        agent: agent.name,
        amount,
        to: address,
        chain,
        result: transferResult,
      },
      success: true,
      message: `Transfer completed on ${chain}`
    };
    
  } catch (error) {
    logger.error(`Transfer failed: ${error instanceof Error ? error.message : String(error)}`);
    
    return {
      type: 'error',
      data: {
        agent: agent.name,
        error: error instanceof Error ? error.message : String(error),
      },
      success: false,
      message: 'Transfer failed'
    };
  }
}

async function executeXcmTransferCommand(agent: AgentMetadata, amount: string, address: string, sourceChain: string, destChain: string): Promise<any> {
  try {
    // Initialize PolkadotAgentKit with the agent's configuration
    const agentKit = new PolkadotAgentKit(agent.polkadotConfig.privateKey, {
      keyType: agent.polkadotConfig.keyType,
      chains: agent.polkadotConfig.chains as any,
    });
    
    logger.info('Initializing Polkadot Agent Kit...');
    await agentKit.initializeApi();
    
    logger.info(`XCM transfer of ${amount} tokens to ${address} from ${sourceChain} to ${destChain}`);
    
    // Get the XCM transfer tool and execute it
    const xcmTool = agentKit.xcmTransferNativeTool();
    const xcmResult = await xcmTool.call({ to: address , amount, sourceChain, destChain });
    
    
    return {
      type: 'xcm',
      data: {
        agent: agent.name,
        amount,
        to: address,
        sourceChain,
        destChain,
        result: xcmResult,
      },
      success: true,
      message: `XCM transfer completed from ${sourceChain} to ${destChain}`
    };
    
  } catch (error) {
    logger.error(`XCM transfer failed: ${error instanceof Error ? error.message : String(error)}`);
    
    return {
      type: 'error',
      data: {
        agent: agent.name,
        error: error instanceof Error ? error.message : String(error),
      },
      success: false,
      message: 'XCM transfer failed'
    };
  }
}

async function executeSwapCommand(agent: AgentMetadata, amount: string, fromCurrency: string, toCurrency: string, swapOptions: {
  fromChain?: string;
  toChain?: string;
  dex?: string;
  receiver?: string;
}): Promise<any> {
  try {
    // Initialize PolkadotAgentKit with the agent's configuration
    const agentKit = new PolkadotAgentKit(agent.polkadotConfig.privateKey, {
      keyType: agent.polkadotConfig.keyType,
      chains: agent.polkadotConfig.chains as any,
    });
    
    logger.info('Initializing Polkadot Agent Kit...');
    await agentKit.initializeApi();
    
    logger.info(`Swapping ${amount} ${fromCurrency} to ${toCurrency}`);
    
    // Get the swap tool and execute it
    const swapTool = agentKit.swapTokensTool();
    const swapResult = await swapTool.call({
      amount,
      from: swapOptions.fromChain,
      to: swapOptions.toChain,
      currencyFrom: fromCurrency,
      currencyTo: toCurrency,
      dex: swapOptions.dex,
      receiver: swapOptions.receiver,
    });
    
    // Clean up
    await agentKit.disconnect();
    
    return {
      type: 'swap',
      data: {
        agent: agent.name,
        amount,
        fromCurrency,
        toCurrency,
        swapOptions,
        result: swapResult,
      },
      success: true,
      message: `Swap completed: ${amount} ${fromCurrency} to ${toCurrency}`
    };
    
  } catch (error) {
    logger.error(`Swap failed: ${error instanceof Error ? error.message : String(error)}`);
    
    return {
      type: 'error',
      data: {
        agent: agent.name,
        error: error instanceof Error ? error.message : String(error),
      },
      success: false,
      message: 'Swap failed'
    };
  }
}

function displayResult(result: any, options: AgentRunOptions): void {
  switch (options.format) {
    case 'json':
      console.log(JSON.stringify(result, null, 2));
      break;
      
    case 'table':
      displayTableResult(result);
      break;
      
    case 'raw':
    default:
      displayRawResult(result);
      break;
  }
}

function displayTableResult(result: any): void {
  if (result.success) {
    logger.success(`✅ ${result.message}`);
  } else {
    logger.error(`❌ ${result.message}`);
  }
  
  console.log();
  console.log(chalk.bold('Result Details:'));
  
  if (result.data && typeof result.data === 'object') {
    Object.entries(result.data).forEach(([key, value]) => {
      console.log(`  ${chalk.cyan(key)}: ${chalk.white(String(value))}`);
    });
  }
}

function displayRawResult(result: any): void {
  if (result.success) {
    logger.success(`✅ ${result.message}`);
  } else {
    logger.error(`❌ ${result.message}`);
  }
  
  if (result.type === 'balance') {
    console.log(chalk.green(`\n💰 Balance Information:`));
    console.log(chalk.gray(`Address: ${result.data.address}`));
    console.log(chalk.gray(`Chain: ${result.data.chain}`));
    
    console.log(chalk.white(JSON.stringify(result.data.rawResult, null, 2)));

  } else if (result.type === 'info') {
    console.log(chalk.blue(`\n📋 Available Commands:`));
    if (result.data.availableCommands) {
      result.data.availableCommands.forEach((cmd: string) => {
        console.log(chalk.gray(`  • ${cmd}`));
      });
    }
    console.log(chalk.white(`\n${result.data.message}`));
  } else if (result.type === 'success') {
    console.log(chalk.green(`Agent Address: ${result.data.address}`));
    console.log(chalk.gray(`Networks: ${result.data.networks}`));
    console.log(chalk.gray(`Available Tools: ${result.data.tools.join(', ')}`));
    console.log(chalk.white(result.data.message));
  } else if (result.type === 'error') {
    console.log(chalk.red(`Error: ${result.data.error}`));
  } else if (result.type === 'transfer') {
    console.log(chalk.green(`\n💸 Transfer Information:`));
    console.log(chalk.gray(`Amount: ${result.data.amount}`));
    console.log(chalk.gray(`To: ${result.data.to}`));
    console.log(chalk.gray(`Chain: ${result.data.chain}`));
    console.log(chalk.white(JSON.stringify(result.data.result, null, 2)));
  } else if (result.type === 'xcm') {
    console.log(chalk.green(`\n🌉 XCM Transfer Information:`));
    console.log(chalk.gray(`Amount: ${result.data.amount}`));
    console.log(chalk.gray(`To: ${result.data.to}`));
    console.log(chalk.gray(`From: ${result.data.sourceChain} to ${result.data.destChain}`));
    console.log(chalk.white(JSON.stringify(result.data.result, null, 2)));
  } else if (result.type === 'swap') {
    console.log(chalk.green(`\n🔄 Swap Information:`));
    console.log(chalk.gray(`Amount: ${result.data.amount}`));
    console.log(chalk.gray(`From: ${result.data.fromCurrency} to ${result.data.toCurrency}`));
    if (result.data.swapOptions.fromChain && result.data.swapOptions.toChain) {
      console.log(chalk.gray(`Chains: ${result.data.swapOptions.fromChain} to ${result.data.swapOptions.toChain}`));
    }
    if (result.data.swapOptions.dex) {
      console.log(chalk.gray(`DEX: ${result.data.swapOptions.dex}`));
    }
    console.log(chalk.white(JSON.stringify(result.data.result, null, 2)));
  } else if (result.type === 'staking') {
    console.log(chalk.green(`Staking Status: ${result.data.status}`));
    console.log(chalk.gray(`Amount: ${result.data.amount}`));
    console.log(chalk.gray(`Validator: ${result.data.validator}`));
    if (result.data.rewards) {
      console.log(chalk.yellow(`Rewards: ${result.data.rewards}`));
    }
  } else if (result.data && result.data.response) {
    console.log(chalk.white(result.data.response));
  }
}

async function updateAgentUsage(agentName: string): Promise<void> {
  const agentsPath = getAgentsPath();
  const agentFile = path.join(agentsPath, `${agentName}.json`);
  
  try {
    const agent: AgentMetadata = await fs.readJson(agentFile);
    agent.usageCount += 1;
    agent.lastUsed = new Date();
    agent.updatedAt = new Date();
    
    await fs.writeJson(agentFile, agent, { spaces: 2 });
  } catch (error) {
    logger.debug(`Failed to update agent usage: ${error instanceof Error ? error.message : String(error)}`);
  }
}
