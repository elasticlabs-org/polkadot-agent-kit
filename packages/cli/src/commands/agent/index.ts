import { Command } from "commander";

import { chatCommand } from "./chat";
import { createCommand } from "./create";
import { deleteCommand } from "./delete";
import { listCommand } from "./list";
import { modelCommand } from "./model";
import { runCommand } from "./run";

export const agentCommands = new Command("agent")
  .description("Manage AI agents")
  .addCommand(createCommand)
  .addCommand(listCommand)
  .addCommand(chatCommand)
  .addCommand(runCommand)
  .addCommand(deleteCommand)
  .addCommand(modelCommand);
