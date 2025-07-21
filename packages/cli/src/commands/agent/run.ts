import { Command } from 'commander';
import fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { configManager } from '../../core/config/manager.js';
import { logger } from '../../utils/logger.js';
import { AgentRunOptions, CLIError } from '../../types/commands.js';
import { AgentMetadata } from '../../types/agent.js';

export const runCommand = new Command('run')
  .description('Execute a command with an AI agent')
  .argument('<name>', 'Agent name')
  .argument('<command>', 'Command to execute')
  .option('-f, --format <format>', 'Output format (json|table|raw)', 'raw')
  .option('-t, --timeout <timeout>', 'Request timeout in seconds', '30')
  .option('-v, --verbose', 'Verbose output', false)
  .action(async (name: string, command: string, options: AgentRunOptions) => {
    try {
      await runAgentCommand(name, command, options);
    } catch (error) {
      throw new CLIError(`Failed to run agent command: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

async function runAgentCommand(agentName: string, command: string, options: AgentRunOptions): Promise<void> {
  // Load agent
  const agent = await loadAgent(agentName);
  if (!agent) {
    throw new Error(`Agent "${agentName}" not found`);
  }

  if (options.verbose) {
    displayAgentInfo(agent);
  }

  logger.info(chalk.blue(`🚀 Executing command with agent "${agentName}"...`));
  
  try {
    // Execute command
    const result = await executeCommand(agent, command, options);
    
    // Display result
    displayResult(result, options);
    
    // Update agent usage
    await updateAgentUsage(agentName);
    
  } catch (error) {
    logger.error(`Command execution failed: ${error instanceof Error ? error.message : String(error)}`);
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
  console.log();
}

async function executeCommand(agent: AgentMetadata, command: string, options: AgentRunOptions): Promise<any> {
  // This is a placeholder implementation
  // In a real implementation, this would integrate with the actual LLM providers
  // and execute the command using the agent's tools
  
  logger.info(`Processing command: "${command}"`);
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // Mock result based on command and agent configuration
  const result = generateMockResult(agent, command);
  
  return result;
}

function generateMockResult(agent: AgentMetadata, command: string): any {
  const commandLower = command.toLowerCase();
  
  // Mock different types of responses based on command content
  if (commandLower.includes('balance')) {
    return {
      type: 'balance',
      data: {
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        balance: '10.5 DOT',
        chain: 'polkadot',
        timestamp: new Date().toISOString(),
      },
      success: true,
      message: 'Balance retrieved successfully'
    };
  }
  
  if (commandLower.includes('transfer')) {
    return {
      type: 'transfer',
      data: {
        from: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        to: '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',
        amount: '1.0 DOT',
        txHash: '0x1234567890abcdef',
        status: 'pending',
      },
      success: true,
      message: 'Transfer initiated successfully'
    };
  }
  
  if (commandLower.includes('staking') || commandLower.includes('stake')) {
    return {
      type: 'staking',
      data: {
        validator: '1FRMM8PEiWXYax7rpS6X4XZX1aAAxSWx1CrKTyrVYhV24fg',
        amount: '100 DOT',
        status: 'bonded',
        rewards: '0.5 DOT',
      },
      success: true,
      message: 'Staking operation completed'
    };
  }
  
  // Default response
  return {
    type: 'general',
    data: {
      command,
      agent: agent.name,
      tools: agent.tools,
      response: `I processed your command "${command}" using my available tools: ${agent.tools.join(', ')}. This is a mock response for demonstration purposes.`,
    },
    success: true,
    message: 'Command processed successfully'
  };
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
    console.log(chalk.green(`Balance: ${result.data.balance}`));
    console.log(chalk.gray(`Address: ${result.data.address}`));
    console.log(chalk.gray(`Chain: ${result.data.chain}`));
  } else if (result.type === 'transfer') {
    console.log(chalk.green(`Transfer Status: ${result.data.status}`));
    console.log(chalk.gray(`Amount: ${result.data.amount}`));
    console.log(chalk.gray(`From: ${result.data.from}`));
    console.log(chalk.gray(`To: ${result.data.to}`));
    if (result.data.txHash) {
      console.log(chalk.gray(`Transaction Hash: ${result.data.txHash}`));
    }
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
