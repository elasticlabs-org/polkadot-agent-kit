import { Command } from 'commander';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import { configManager } from '../../core/config/manager';
import { logger } from '../../utils/logger';
import { CLIError } from '../../types/commands';
import { AgentMetadata } from '../../types/agent';

export const modelCommand = new Command('model')
  .description('Manage agent model settings')
  .addCommand(
    new Command('set')
      .description('Set the model for an agent')
      .argument('<name>', 'Agent name')
      .argument('<provider>', 'LLM provider (ollama|openai)')
      .argument('[model]', 'Model name (optional, will prompt if not provided)')
      .action(async (name: string, provider: string, model?: string) => {
        try {
          await setAgentModel(name, provider, model);
        } catch (error) {
          throw new CLIError(`Failed to set agent model: ${error instanceof Error ? error.message : String(error)}`);
        }
      })
  )
  .addCommand(
    new Command('get')
      .description('Get the current model for an agent')
      .argument('<name>', 'Agent name')
      .action(async (name: string) => {
        try {
          await getAgentModel(name);
        } catch (error) {
          throw new CLIError(`Failed to get agent model: ${error instanceof Error ? error.message : String(error)}`);
        }
      })
  )
  .addCommand(
    new Command('list')
      .description('List available models for a provider')
      .argument('<provider>', 'LLM provider (ollama|openai)')
      .action(async (provider: string) => {
        try {
          await listAvailableModels(provider);
        } catch (error) {
          throw new CLIError(`Failed to list models: ${error instanceof Error ? error.message : String(error)}`);
        }
      })
  );

async function setAgentModel(agentName: string, provider: string, model?: string): Promise<void> {
  // Validate provider
  if (!['ollama', 'openai'].includes(provider)) {
    throw new Error('Provider must be either "ollama" or "openai"');
  }

  // Load agent
  const agent = await loadAgent(agentName);
  if (!agent) {
    throw new Error(`Agent "${agentName}" not found`);
  }

  // Get model if not provided
  if (!model) {
    model = await selectModel(provider);
  }

  // Validate model
  const availableModels = await getAvailableModels(provider);
  if (availableModels.length > 0 && !availableModels.includes(model)) {
    logger.warn(`Model "${model}" not found in available models for ${provider}`);
    const { proceed } = await inquirer.prompt([{
      type: 'confirm',
      name: 'proceed',
      message: 'Do you want to proceed anyway?',
      default: false
    }]);
    
    if (!proceed) {
      logger.info('Operation cancelled');
      return;
    }
  }

  // Update agent
  agent.provider = provider as 'ollama' | 'openai';
  agent.model = model;
  agent.updatedAt = new Date();

  // Save agent
  await saveAgent(agentName, agent);

  logger.success(chalk.green(`✅ Updated agent "${agentName}" to use ${provider}:${model}`));
}

async function getAgentModel(agentName: string): Promise<void> {
  const agent = await loadAgent(agentName);
  if (!agent) {
    throw new Error(`Agent "${agentName}" not found`);
  }

  console.log(chalk.blue('🤖 Agent Model Information'));
  console.log(chalk.cyan(`Name: ${agent.name}`));
  console.log(chalk.white(`Provider: ${agent.provider}`));
  console.log(chalk.white(`Model: ${agent.model}`));
  
  if (agent.temperature !== undefined) {
    console.log(chalk.gray(`Temperature: ${agent.temperature}`));
  }
  
  if (agent.maxTokens !== undefined) {
    console.log(chalk.gray(`Max Tokens: ${agent.maxTokens}`));
  }
}

async function listAvailableModels(provider: string): Promise<void> {
  if (!['ollama', 'openai'].includes(provider)) {
    throw new Error('Provider must be either "ollama" or "openai"');
  }

  logger.info(chalk.blue(`📋 Available models for ${provider}:`));

  try {
    const models = await getAvailableModels(provider);
    
    if (models.length === 0) {
      logger.warn(`No models found for ${provider}`);
      
      if (provider === 'ollama') {
        logger.info('Make sure Ollama is running and has models installed');
        logger.info('Visit: https://ollama.ai/library for available models');
      } else if (provider === 'openai') {
        logger.info('Default OpenAI models should be available');
      }
      return;
    }

    models.forEach((model, index) => {
      console.log(`  ${index + 1}. ${chalk.cyan(model)}`);
    });

  } catch (error) {
    logger.error(`Failed to fetch models: ${error instanceof Error ? error.message : String(error)}`);
    
    // Show default models as fallback
    const defaultModels = getDefaultModels(provider);
    if (defaultModels.length > 0) {
      logger.info(`\nDefault ${provider} models:`);
      defaultModels.forEach((model, index) => {
        console.log(`  ${index + 1}. ${chalk.gray(model)}`);
      });
    }
  }
}

async function selectModel(provider: string): Promise<string> {
  const availableModels = await getAvailableModels(provider);
  
  if (availableModels.length === 0) {
    // Fallback to manual input
    const { model } = await inquirer.prompt([{
      type: 'input',
      name: 'model',
      message: `Enter ${provider} model name:`,
      default: getDefaultModels(provider)[0] || 'llama2'
    }]);
    return model;
  }

  const { model } = await inquirer.prompt([{
    type: 'list',
    name: 'model',
    message: `Select ${provider} model:`,
    choices: availableModels
  }]);

  return model;
}

async function getAvailableModels(provider: string): Promise<string[]> {
  const config = configManager.getConfig();
  
  if (provider === 'ollama') {
    try {
      const response = await fetch(`${config.llm.ollama?.baseUrl || 'http://localhost:11434'}/api/tags`);
      if (response.ok) {
        const data = await response.json();
        return data.models?.map((model: any) => model.name) || [];
      }
    } catch (error) {
      logger.debug('Failed to fetch Ollama models:', error);
    }
    
    return getDefaultModels('ollama');
  } else if (provider === 'openai') {
    return getDefaultModels('openai');
  }
  
  return [];
}

function getDefaultModels(provider: string): string[] {
  if (provider === 'ollama') {
    return ['llama2', 'codellama', 'mistral', 'neural-chat', 'llama2:13b', 'llama2:70b'];
  } else if (provider === 'openai') {
    return [
      'gpt-4',
      'gpt-4-turbo',
      'gpt-4-turbo-preview',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k'
    ];
  }
  
  return [];
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

async function saveAgent(name: string, agent: AgentMetadata): Promise<void> {
  const agentsPath = getAgentsPath();
  const agentFile = path.join(agentsPath, `${name}.json`);
  
  await fs.writeJson(agentFile, agent, { spaces: 2 });
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
