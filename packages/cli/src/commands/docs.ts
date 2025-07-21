import { Command } from 'commander';
import open from 'open';
import { logger } from '../utils/logger.js';
import { CLIError } from '../types/commands.js';

export const docsCommand = new Command('docs')
  .description('Open Polkadot Agent Kit documentation')
  .option('-s, --section <section>', 'Open specific documentation section')
  .action(async (options: { section?: string }) => {
    try {
      await openDocumentation(options.section);
    } catch (error) {
      throw new CLIError(`Failed to open documentation: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

async function openDocumentation(section?: string): Promise<void> {
  const baseUrl = 'https://github.com/elasticlabs-org/polkadot-agent-kit';
  
  const sections: Record<string, string> = {
    'getting-started': `${baseUrl}#getting-started`,
    'installation': `${baseUrl}#installation`,
    'usage': `${baseUrl}#usage`,
    'examples': `${baseUrl}/tree/main/examples`,
    'api': `${baseUrl}/tree/main/packages`,
    'sdk': `${baseUrl}/tree/main/packages/sdk`,
    'llm': `${baseUrl}/tree/main/packages/llm`,
    'core': `${baseUrl}/tree/main/packages/core`,
    'common': `${baseUrl}/tree/main/packages/common`,
    'cli': `${baseUrl}/tree/main/packages/cli`,
    'contributing': `${baseUrl}/blob/main/CONTRIBUTING.md`,
    'changelog': `${baseUrl}/blob/main/CHANGELOG.md`,
    'license': `${baseUrl}/blob/main/LICENSE`,
  };

  let url = baseUrl;
  
  if (section) {
    if (sections[section]) {
      url = sections[section];
      logger.info(`Opening ${section} documentation...`);
    } else {
      logger.warn(`Unknown documentation section: ${section}`);
      logger.info('Available sections:');
      Object.keys(sections).forEach(key => {
        logger.info(`  - ${key}`);
      });
      return;
    }
  } else {
    logger.info('Opening Polkadot Agent Kit documentation...');
  }

  try {
    await open(url);
    logger.success('Documentation opened in your default browser');
  } catch (error) {
    logger.error('Failed to open browser automatically');
    logger.info(`Please visit: ${url}`);
  }
}
