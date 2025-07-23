import chalk from "chalk";
import { Command } from "commander";
import fs from "fs-extra";
import inquirer from "inquirer";
import * as path from "path";

import { configManager } from "../../core/config/manager";
import { CLIError } from "../../types/commands";
import { logger } from "../../utils/logger";

export const deleteCommand = new Command("delete")
  .description("Delete an AI agent")
  .argument("<name>", "Agent name")
  .option("-y, --yes", "Skip confirmation", false)
  .action(async (name: string, options: { yes?: boolean }) => {
    try {
      await deleteAgent(name, options);
    } catch (error) {
      throw new CLIError(
        `Failed to delete agent: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  });

async function deleteAgent(
  agentName: string,
  options: { yes?: boolean },
): Promise<void> {
  const agentsPath = getAgentsPath();
  const agentFile = path.join(agentsPath, `${agentName}.json`);

  // Check if agent exists
  if (!(await fs.pathExists(agentFile))) {
    throw new Error(`Agent "${agentName}" not found`);
  }

  // Load agent info for confirmation
  let agentInfo;
  try {
    agentInfo = await fs.readJson(agentFile);
  } catch (error) {
    throw new Error(
      `Failed to load agent: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // Show agent info
  console.log(chalk.yellow("⚠️  You are about to delete the following agent:"));
  console.log();
  console.log(chalk.cyan(`Name: ${agentInfo.name}`));
  console.log(chalk.gray(`Provider: ${agentInfo.provider}`));
  console.log(chalk.gray(`Model: ${agentInfo.model}`));
  console.log(chalk.gray(`Tools: ${agentInfo.tools.join(", ")}`));
  console.log(chalk.gray(`Usage Count: ${agentInfo.usageCount || 0}`));
  console.log();

  // Confirm deletion
  if (!options.yes) {
    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: `Are you sure you want to delete agent "${agentName}"?`,
        default: false,
      },
    ]);

    if (!confirm) {
      logger.info("Deletion cancelled");
      return;
    }
  }

  try {
    // Delete agent file
    await fs.remove(agentFile);

    // Delete chat history if it exists
    const historyPath = getChatHistoryPath(agentName);
    if (await fs.pathExists(historyPath)) {
      await fs.remove(historyPath);
      logger.debug("Chat history deleted");
    }

    logger.success(chalk.green(`✅ Agent "${agentName}" deleted successfully`));
  } catch (error) {
    throw new Error(
      `Failed to delete agent files: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function getAgentsPath(): string {
  const config = configManager.getConfig();
  const agentsLocation = config.agents.storageLocation;

  if (agentsLocation.startsWith("~/")) {
    const homeDir =
      process.env.HOME || process.env.USERPROFILE || process.cwd();
    return path.join(homeDir, agentsLocation.slice(2));
  }

  return path.resolve(agentsLocation);
}

function getChatHistoryPath(agentName: string): string {
  const agentsPath = getAgentsPath();
  return path.join(agentsPath, "history", `${agentName}.json`);
}
