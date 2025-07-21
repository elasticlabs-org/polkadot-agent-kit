import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { table } from 'table';
import { configManager } from '../core/config/manager.js';
import { logger } from '../utils/logger.js';
import { CLIError } from '../types/commands.js';

export const configCommand = new Command('config')
  .description('Manage CLI configuration')
  .addCommand(
    new Command('get')
      .description('Get configuration value')
      .argument('[key]', 'Configuration key (dot notation)')
      .action(async (key?: string) => {
        try {
          if (key) {
            const value = configManager.get(key);
            if (value !== undefined) {
              console.log(JSON.stringify(value, null, 2));
            } else {
              logger.warn(`Configuration key '${key}' not found`);
            }
          } else {
            const config = configManager.getConfig();
            console.log(JSON.stringify(config, null, 2));
          }
        } catch (error) {
          throw new CLIError(`Failed to get configuration: ${error instanceof Error ? error.message : String(error)}`);
        }
      })
  )
  .addCommand(
    new Command('set')
      .description('Set configuration value')
      .argument('<key>', 'Configuration key (dot notation)')
      .argument('<value>', 'Configuration value')
      .option('-g, --global', 'Set in global scope', false)
      .option('-p, --project', 'Set in project scope', false)
      .action(async (key: string, value: string, options: { global?: boolean; project?: boolean }) => {
        try {
          const scope = options.global ? 'global' : 'project';
          let parsedValue: any = value;
          
          // Try to parse as JSON first
          try {
            parsedValue = JSON.parse(value);
          } catch {
            // If not valid JSON, treat as string
            // Handle boolean and number strings
            if (value === 'true') parsedValue = true;
            else if (value === 'false') parsedValue = false;
            else if (!isNaN(Number(value))) parsedValue = Number(value);
          }
          
          await configManager.set(key, parsedValue, scope);
          logger.success(`Set ${key} = ${JSON.stringify(parsedValue)} in ${scope} scope`);
        } catch (error) {
          throw new CLIError(`Failed to set configuration: ${error instanceof Error ? error.message : String(error)}`);
        }
      })
  )
  .addCommand(
    new Command('list')
      .description('List all configuration values')
      .option('-f, --format <format>', 'Output format (table|json)', 'table')
      .action(async (options: { format?: string }) => {
        try {
          const config = configManager.listAll();
          
          if (options.format === 'json') {
            console.log(JSON.stringify(config, null, 2));
          } else {
            displayConfigTable(config);
          }
        } catch (error) {
          throw new CLIError(`Failed to list configuration: ${error instanceof Error ? error.message : String(error)}`);
        }
      })
  )
  .addCommand(
    new Command('reset')
      .description('Reset configuration to defaults')
      .option('-g, --global', 'Reset global configuration', false)
      .option('-p, --project', 'Reset project configuration', false)
      .option('-y, --yes', 'Skip confirmation', false)
      .action(async (options: { global?: boolean; project?: boolean; yes?: boolean }) => {
        try {
          const scope = options.global ? 'global' : 'project';
          
          if (!options.yes) {
            const { confirm } = await inquirer.prompt([{
              type: 'confirm',
              name: 'confirm',
              message: `Are you sure you want to reset ${scope} configuration?`,
              default: false
            }]);
            
            if (!confirm) {
              logger.info('Reset cancelled');
              return;
            }
          }
          
          await configManager.reset(scope);
          logger.success(`Reset ${scope} configuration`);
        } catch (error) {
          throw new CLIError(`Failed to reset configuration: ${error instanceof Error ? error.message : String(error)}`);
        }
      })
  )
  .addCommand(
    new Command('validate')
      .description('Validate current configuration')
      .action(async () => {
        try {
          const result = await configManager.validate();
          
          if (result.valid) {
            logger.success('✅ Configuration is valid');
          } else {
            logger.error('❌ Configuration validation failed:');
            result.errors.forEach(error => {
              logger.error(`  - ${error}`);
            });
          }
        } catch (error) {
          throw new CLIError(`Failed to validate configuration: ${error instanceof Error ? error.message : String(error)}`);
        }
      })
  )
  .addCommand(
    new Command('edit')
      .description('Interactively edit configuration')
      .option('-g, --global', 'Edit global configuration', false)
      .option('-p, --project', 'Edit project configuration', false)
      .action(async (options: { global?: boolean; project?: boolean }) => {
        try {
          await interactiveConfigEdit(options.global ? 'global' : 'project');
        } catch (error) {
          throw new CLIError(`Failed to edit configuration: ${error instanceof Error ? error.message : String(error)}`);
        }
      })
  )
  .addCommand(
    new Command('export')
      .description('Export configuration to file')
      .argument('<file>', 'Output file path')
      .action(async (file: string) => {
        try {
          await configManager.export(file);
        } catch (error) {
          throw new CLIError(`Failed to export configuration: ${error instanceof Error ? error.message : String(error)}`);
        }
      })
  )
  .addCommand(
    new Command('import')
      .description('Import configuration from file')
      .argument('<file>', 'Input file path')
      .option('-g, --global', 'Import to global scope', false)
      .option('-p, --project', 'Import to project scope', false)
      .action(async (file: string, options: { global?: boolean; project?: boolean }) => {
        try {
          const scope = options.global ? 'global' : 'project';
          await configManager.import(file, scope);
        } catch (error) {
          throw new CLIError(`Failed to import configuration: ${error instanceof Error ? error.message : String(error)}`);
        }
      })
  )
  .addCommand(
    new Command('paths')
      .description('Show configuration file paths')
      .action(() => {
        logger.info('Configuration file paths:');
        logger.info(`  Global: ${chalk.cyan(configManager.getGlobalConfigPath())}`);
        logger.info(`  Project: ${chalk.cyan(configManager.getProjectConfigPath())}`);
      })
  );

function displayConfigTable(config: Record<string, any>): void {
  const data = [
    [chalk.bold('Key'), chalk.bold('Value'), chalk.bold('Type')]
  ];
  
  Object.entries(config).forEach(([key, value]) => {
    const valueStr = typeof value === 'object' 
      ? JSON.stringify(value) 
      : String(value);
    const type = Array.isArray(value) ? 'array' : typeof value;
    
    data.push([
      chalk.cyan(key),
      valueStr.length > 50 ? valueStr.substring(0, 47) + '...' : valueStr,
      chalk.gray(type)
    ]);
  });
  
  const output = table(data, {
    border: {
      topBody: '─',
      topJoin: '┬',
      topLeft: '┌',
      topRight: '┐',
      bottomBody: '─',
      bottomJoin: '┴',
      bottomLeft: '└',
      bottomRight: '┘',
      bodyLeft: '│',
      bodyRight: '│',
      bodyJoin: '│',
      joinBody: '─',
      joinLeft: '├',
      joinRight: '┤',
      joinJoin: '┼'
    },
    columnDefault: {
      paddingLeft: 1,
      paddingRight: 1
    }
  });
  
  console.log(output);
}

async function interactiveConfigEdit(scope: 'global' | 'project'): Promise<void> {
  const config = configManager.getConfig();
  
  const { section } = await inquirer.prompt([{
    type: 'list',
    name: 'section',
    message: 'Which section would you like to edit?',
    choices: [
      { name: 'LLM Settings', value: 'llm' },
      { name: 'Agent Settings', value: 'agents' },
      { name: 'UI Settings', value: 'ui' },
      { name: 'Polkadot Settings', value: 'polkadot' },
    ]
  }]);
  
  switch (section) {
    case 'llm':
      await editLLMSettings(scope);
      break;
    case 'agents':
      await editAgentSettings(scope);
      break;
    case 'ui':
      await editUISettings(scope);
      break;
    case 'polkadot':
      await editPolkadotSettings(scope);
      break;
  }
}

async function editLLMSettings(scope: 'global' | 'project'): Promise<void> {
  const config = configManager.getConfig();
  
  const questions = [
    {
      type: 'list',
      name: 'defaultProvider',
      message: 'Default LLM provider:',
      choices: ['ollama', 'openai'],
      default: config.llm.defaultProvider
    }
  ];
  
  const answers = await inquirer.prompt(questions);
  
  await configManager.set('llm.defaultProvider', answers.defaultProvider, scope);
  
  if (answers.defaultProvider === 'ollama') {
    const ollamaQuestions = [
      {
        type: 'input',
        name: 'baseUrl',
        message: 'Ollama base URL:',
        default: config.llm.ollama?.baseUrl || 'http://localhost:11434'
      },
      {
        type: 'input',
        name: 'defaultModel',
        message: 'Default Ollama model:',
        default: config.llm.ollama?.defaultModel || 'llama2'
      }
    ];
    
    const ollamaAnswers = await inquirer.prompt(ollamaQuestions);
    await configManager.set('llm.ollama.baseUrl', ollamaAnswers.baseUrl, scope);
    await configManager.set('llm.ollama.defaultModel', ollamaAnswers.defaultModel, scope);
  }
  
  if (answers.defaultProvider === 'openai') {
    const openaiQuestions = [
      {
        type: 'input',
        name: 'defaultModel',
        message: 'Default OpenAI model:',
        default: config.llm.openai?.defaultModel || 'gpt-3.5-turbo'
      },
      {
        type: 'password',
        name: 'apiKey',
        message: 'OpenAI API key (leave empty to skip):',
        mask: '*'
      }
    ];
    
    const openaiAnswers = await inquirer.prompt(openaiQuestions);
    await configManager.set('llm.openai.defaultModel', openaiAnswers.defaultModel, scope);
    
    if (openaiAnswers.apiKey) {
      await configManager.set('llm.openai.apiKey', openaiAnswers.apiKey, scope);
    }
  }
  
  logger.success('LLM settings updated');
}

async function editAgentSettings(scope: 'global' | 'project'): Promise<void> {
  const config = configManager.getConfig();
  
  const questions = [
    {
      type: 'input',
      name: 'storageLocation',
      message: 'Agent storage location:',
      default: config.agents.storageLocation
    },
    {
      type: 'number',
      name: 'maxHistory',
      message: 'Maximum chat history:',
      default: config.agents.maxHistory
    },
    {
      type: 'checkbox',
      name: 'defaultTools',
      message: 'Default tools for new agents:',
      choices: [
        'balance',
        'transfer',
        'xcm',
        'staking',
        'swap',
        'governance',
        'identity',
        'multisig'
      ],
      default: config.agents.defaultTools
    }
  ];
  
  const answers = await inquirer.prompt(questions);
  
  await configManager.set('agents.storageLocation', answers.storageLocation, scope);
  await configManager.set('agents.maxHistory', answers.maxHistory, scope);
  await configManager.set('agents.defaultTools', answers.defaultTools, scope);
  
  logger.success('Agent settings updated');
}

async function editUISettings(scope: 'global' | 'project'): Promise<void> {
  const config = configManager.getConfig();
  
  const questions = [
    {
      type: 'confirm',
      name: 'colorOutput',
      message: 'Enable colored output:',
      default: config.ui.colorOutput
    },
    {
      type: 'confirm',
      name: 'verboseLogging',
      message: 'Enable verbose logging:',
      default: config.ui.verboseLogging
    },
    {
      type: 'confirm',
      name: 'progressIndicators',
      message: 'Show progress indicators:',
      default: config.ui.progressIndicators
    },
    {
      type: 'list',
      name: 'theme',
      message: 'UI theme:',
      choices: ['light', 'dark', 'auto'],
      default: config.ui.theme
    }
  ];
  
  const answers = await inquirer.prompt(questions);
  
  for (const [key, value] of Object.entries(answers)) {
    await configManager.set(`ui.${key}`, value, scope);
  }
  
  logger.success('UI settings updated');
}

async function editPolkadotSettings(scope: 'global' | 'project'): Promise<void> {
  const config = configManager.getConfig();
  
  const questions = [
    {
      type: 'list',
      name: 'defaultChain',
      message: 'Default Polkadot chain:',
      choices: ['polkadot', 'kusama', 'westend'],
      default: config.polkadot.defaultChain
    }
  ];
  
  const answers = await inquirer.prompt(questions);
  
  await configManager.set('polkadot.defaultChain', answers.defaultChain, scope);
  
  logger.success('Polkadot settings updated');
}
