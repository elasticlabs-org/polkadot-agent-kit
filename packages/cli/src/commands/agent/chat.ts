import chalk from "chalk";
import { Command } from "commander";
import fs from "fs-extra";
import * as path from "path";
import * as readline from "readline";

import { PolkadotCLIAgent } from "../../core/agent/polkadotAgent";
import { configManager } from "../../core/config/manager";
import type { AgentMetadata, ChatMessage } from "../../types/agent";
import type { AgentChatOptions } from "../../types/commands";
import { CLIError } from "../../types/commands";
import { logger } from "../../utils/logger";

export const chatCommand = new Command("chat")
  .description("Start an interactive chat session with an AI agent")
  .argument("<name>", "Agent name")
  .option("-i, --interactive", "Interactive mode", true)
  .option("--history", "Show chat history", false)
  .option("--save", "Save chat history", true)
  .option("--timeout <timeout>", "Request timeout in seconds", "30")
  .action(async (name: string, options: AgentChatOptions) => {
    try {
      await startChatSession(name, options);
    } catch (error) {
      throw new CLIError(
        `Failed to start chat session: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  });

async function startChatSession(
  agentName: string,
  options: AgentChatOptions,
): Promise<void> {
  // Load agent
  const agent = await loadAgent(agentName);
  if (!agent) {
    throw new Error(`Agent "${agentName}" not found`);
  }

  // Show agent info
  displayAgentInfo(agent);

  // Load chat history if requested
  if (options.history) {
    await displayChatHistory(agentName);
  }

  // Start interactive session
  await runInteractiveChat(agent, options);
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
    throw new Error(
      `Failed to load agent: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function getAgentsPath(): string {
  const config = configManager.getConfig();
  const agentsLocation = config.agents.storageLocation;

  if (agentsLocation.startsWith("~/")) {
    return path.join(process.env.HOME || "", agentsLocation.slice(2));
  }

  return path.resolve(agentsLocation);
}

function displayAgentInfo(agent: AgentMetadata): void {
  console.log(chalk.blue("🤖 Agent Information"));
  console.log(chalk.cyan(`Name: ${agent.name}`));
  console.log(chalk.gray(`Provider: ${agent.provider}`));
  console.log(chalk.gray(`Model: ${agent.model}`));
  console.log(chalk.gray(`Tools: ${agent.tools.join(", ")}`));
  if (agent.description) {
    console.log(chalk.gray(`Description: ${agent.description}`));
  }
  console.log();
  console.log(chalk.yellow("💡 Tips:"));
  console.log(chalk.white('  - Type "exit" or "quit" to end the session'));
  console.log(chalk.white('  - Type "help" to see available commands'));
  console.log(chalk.white('  - Type "clear" to clear the screen'));
  console.log();
}

async function displayChatHistory(agentName: string): Promise<void> {
  const historyPath = getChatHistoryPath(agentName);

  if (!(await fs.pathExists(historyPath))) {
    logger.info("No chat history found");
    return;
  }

  try {
    const history: ChatMessage[] = await fs.readJson(historyPath);

    if (history.length === 0) {
      logger.info("No chat history found");
      return;
    }

    console.log(chalk.blue("📜 Chat History:"));
    console.log();

    history.slice(-10).forEach((message) => {
      const timestamp = new Date(message.timestamp).toLocaleTimeString();
      const roleColor = message.role === "user" ? chalk.green : chalk.blue;
      const roleIcon = message.role === "user" ? "👤" : "🤖";

      console.log(
        `${roleColor(`${roleIcon} ${message.role}`)} ${chalk.gray(`[${timestamp}]`)}`,
      );
      console.log(chalk.white(message.content));
      console.log();
    });
  } catch (error) {
    logger.warn(
      `Failed to load chat history: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function getChatHistoryPath(agentName: string): string {
  const agentsPath = getAgentsPath();
  return path.join(agentsPath, "history", `${agentName}.json`);
}

async function runInteractiveChat(
  agent: AgentMetadata,
  options: AgentChatOptions,
): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.green("You: "),
  });

  console.log(
    chalk.green("🚀 Chat session started! Type your message and press Enter."),
  );
  console.log();

  rl.prompt();

  rl.on("line", async (input: string) => {
    const message = input.trim();

    if (!message) {
      rl.prompt();
      return;
    }

    // Handle special commands
    if (await handleSpecialCommands(message, rl, agent)) {
      return;
    }

    try {
      // Show typing indicator
      const typingInterval = showTypingIndicator();
      // Send message to agent
      const response = await sendMessageToAgent(agent, message, options);

      // Clear typing indicator
      clearInterval(typingInterval);
      process.stdout.write("\r\x1b[K"); // Clear line

      // Display response
      console.log(chalk.blue("🤖 Agent: ") + chalk.white(response));
      console.log();

      // Save to history if enabled
      if (options.save) {
        await saveChatMessage(agent.name, "user", message);
        await saveChatMessage(agent.name, "assistant", response);
      }

      // Update agent usage
      await updateAgentUsage(agent.name);
    } catch (error) {
      console.log(
        chalk.red("❌ Error: ") +
          chalk.white(error instanceof Error ? error.message : String(error)),
      );
      console.log();
    }

    rl.prompt();
  });

  rl.on("close", () => {
    console.log(chalk.yellow("\n👋 Chat session ended. Goodbye!"));
    process.exit(0);
  });
}

async function handleSpecialCommands(
  message: string,
  rl: readline.Interface,
  agent: AgentMetadata,
): Promise<boolean> {
  const command = message.toLowerCase();

  switch (command) {
    case "exit":
    case "quit":
      rl.close();
      return true;

    case "help":
      displayChatHelp();
      rl.prompt();
      return true;

    case "clear":
      console.clear();
      displayAgentInfo(agent);
      rl.prompt();
      return true;

    case "info":
      displayAgentInfo(agent);
      rl.prompt();
      return true;

    case "history":
      await displayChatHistory(agent.name);
      rl.prompt();
      return true;

    default:
      return false;
  }
}

function displayChatHelp(): void {
  console.log(chalk.blue("📖 Available Commands:"));
  console.log(chalk.white("  help     - Show this help message"));
  console.log(chalk.white("  info     - Show agent information"));
  console.log(chalk.white("  history  - Show recent chat history"));
  console.log(chalk.white("  clear    - Clear the screen"));
  console.log(chalk.white("  exit     - End the chat session"));
  console.log();
}

function showTypingIndicator(): NodeJS.Timeout {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;

  return setInterval(() => {
    process.stdout.write(`\r${chalk.blue(frames[i])} Agent is thinking...`);
    i = (i + 1) % frames.length;
  }, 100);
}

async function sendMessageToAgent(
  agent: AgentMetadata,
  message: string,
  options: AgentChatOptions,
): Promise<string> {
  try {
    logger.info("Go to here again in send message to agent ");
    // Initialize the Polkadot CLI Agent
    const cliAgent = new PolkadotCLIAgent(agent);
    await cliAgent.initialize();
    // Send the message to the agent
    const response = await cliAgent.ask(message);

    return response;
  } catch (error) {
    logger.error(
      `Agent communication failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    return `I encountered an error processing your request: ${error instanceof Error ? error.message : String(error)}. Please try again or check your configuration.`;
  }
}

async function saveChatMessage(
  agentName: string,
  role: "user" | "assistant",
  content: string,
): Promise<void> {
  const historyPath = getChatHistoryPath(agentName);
  await fs.ensureDir(path.dirname(historyPath));

  let history: ChatMessage[] = [];

  if (await fs.pathExists(historyPath)) {
    try {
      history = await fs.readJson(historyPath);
    } catch (error) {
      logger.debug(
        `Failed to load existing history: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  const message: ChatMessage = {
    role,
    content,
    timestamp: new Date(),
  };

  history.push(message);

  // Keep only the last N messages based on config
  const config = configManager.getConfig();
  const maxHistory = config.agents.maxHistory;
  if (history.length > maxHistory) {
    history = history.slice(-maxHistory);
  }

  await fs.writeJson(historyPath, history, { spaces: 2 });
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
    logger.debug(
      `Failed to update agent usage: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
