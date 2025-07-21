#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { configManager } from './core/config/manager';
import { logger } from './utils/logger';
import { CLIError } from './types/commands';


import { initCommand } from './commands/init';
import { configCommand } from './commands/config';
import { agentCommands } from './commands/agent/index';
import { docsCommand } from './commands/docs';

const program = new Command();

async function main() {
  try {
    // Initialize configuration manager
    await configManager.initialize();

    // Set up the main CLI program
    program
      .name('pak')
      .description('Polkadot Agent Kit CLI - AI Agent Management for Polkadot')
      .version('1.0.0')
      .option('-v, --verbose', 'Enable verbose logging')
      .option('--no-color', 'Disable colored output')
      .hook('preAction', (thisCommand) => {
        const options = thisCommand.opts();
        if (options.verbose) {
          logger.info('Verbose mode enabled');
        }
        if (!options.color) {
          logger.info('Color output disabled');
        }
      });

    // Register commands
    program.addCommand(initCommand);
    program.addCommand(configCommand);
    program.addCommand(agentCommands);
    program.addCommand(docsCommand);

    // Global error handler
    program.exitOverride((err) => {
      if (err.code === 'commander.help') {
        process.exit(0);
      }
      if (err.code === 'commander.version') {
        process.exit(0);
      }
      throw err;
    });

    // Parse command line arguments
    await program.parseAsync(process.argv);

  } catch (error) {
    handleError(error);
    process.exit(1);
  }
}

function handleError(error: unknown): void {
  if (error instanceof CLIError) {
    logger.error(`${error.name}: ${error.message}`);
    if (error.code) {
      logger.debug(`Error code: ${error.code}`);
    }
  } else if (error instanceof Error) {
    logger.error(`Unexpected error: ${error.message}`);
    logger.debug(error.stack || 'No stack trace available');
  } else {
    logger.error(`Unknown error: ${String(error)}`);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('\nReceived SIGINT. Gracefully shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM. Gracefully shutting down...');
  process.exit(0);
});

// Start the CLI
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('pak.js')) {
  main().catch(handleError);
}

export { program };
