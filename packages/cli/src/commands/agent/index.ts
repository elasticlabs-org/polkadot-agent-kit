import { Command } from 'commander';
import { createCommand } from './create';
import { listCommand } from './list';
import { chatCommand } from './chat';
import { runCommand } from './run';
import { deleteCommand } from './delete';
import { modelCommand } from './model';

export const agentCommands = new Command('agent')
  .description('Manage AI agents')
  .addCommand(createCommand)
  .addCommand(listCommand)
  .addCommand(chatCommand)
  .addCommand(runCommand)
  .addCommand(deleteCommand)
  .addCommand(modelCommand);
