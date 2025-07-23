import chalk from "chalk";
import { Command } from "commander";
import fs from "fs-extra";
import * as path from "path";
import { table } from "table";

import { configManager } from "../../core/config/manager";
import type { AgentMetadata } from "../../types/agent";
import type { AgentListOptions } from "../../types/commands";
import { CLIError } from "../../types/commands";
import { logger } from "../../utils/logger";

export const listCommand = new Command("list")
  .description("List all AI agents")
  .option("-p, --provider <provider>", "Filter by provider")
  .option("-f, --format <format>", "Output format (table|json)", "table")
  .option("--filter <filter>", "Filter agents by name pattern")
  .action(async (options: AgentListOptions) => {
    try {
      await listAgents(options);
    } catch (error) {
      throw new CLIError(
        `Failed to list agents: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  });

async function listAgents(options: AgentListOptions): Promise<void> {
  const agents = await loadAllAgents();

  // Apply filters
  let filteredAgents = agents;

  if (options.provider) {
    filteredAgents = filteredAgents.filter(
      (agent) => agent.provider === options.provider,
    );
  }

  if (options.filter) {
    const pattern = new RegExp(options.filter, "i");
    filteredAgents = filteredAgents.filter(
      (agent) =>
        pattern.test(agent.name) || pattern.test(agent.description || ""),
    );
  }

  if (filteredAgents.length === 0) {
    logger.info("No agents found");
    logger.info("Create your first agent with: pak agent create <name>");
    return;
  }

  // Display results
  if (options.format === "json") {
    console.log(JSON.stringify(filteredAgents, null, 2));
  } else {
    displayAgentsTable(filteredAgents);
  }
}

async function loadAllAgents(): Promise<AgentMetadata[]> {
  const agentsPath = getAgentsPath();

  if (!(await fs.pathExists(agentsPath))) {
    return [];
  }

  const files = await fs.readdir(agentsPath);
  const agentFiles = files.filter((file) => file.endsWith(".json"));

  const agents: AgentMetadata[] = [];

  for (const file of agentFiles) {
    try {
      const filePath = path.join(agentsPath, file);
      const agentData = await fs.readJson(filePath);
      agents.push(agentData);
    } catch (error) {
      logger.warn(
        `Failed to load agent from ${file}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Sort by name
  agents.sort((a, b) => a.name.localeCompare(b.name));

  return agents;
}

function getAgentsPath(): string {
  const config = configManager.getConfig();
  const agentsLocation = config.agents.storageLocation;

  if (agentsLocation.startsWith("~/")) {
    return path.join(process.env.HOME || "", agentsLocation.slice(2));
  }

  return path.resolve(agentsLocation);
}

function displayAgentsTable(agents: AgentMetadata[]): void {
  const data = [
    [
      chalk.bold("Name"),
      chalk.bold("Provider"),
      chalk.bold("Model"),
      chalk.bold("Tools"),
      chalk.bold("Usage"),
      chalk.bold("Last Used"),
      chalk.bold("Status"),
    ],
  ];

  agents.forEach((agent) => {
    const toolsStr =
      agent.tools.length > 3
        ? `${agent.tools.slice(0, 3).join(", ")}...`
        : agent.tools.join(", ");

    const lastUsed = agent.lastUsed
      ? formatRelativeTime(new Date(agent.lastUsed))
      : "Never";

    const status = getAgentStatus(agent);

    data.push([
      chalk.cyan(agent.name),
      getProviderDisplay(agent.provider),
      chalk.gray(agent.model),
      chalk.white(toolsStr),
      chalk.yellow(agent.usageCount.toString()),
      chalk.gray(lastUsed),
      status,
    ]);
  });

  const output = table(data, {
    border: {
      topBody: "─",
      topJoin: "┬",
      topLeft: "┌",
      topRight: "┐",
      bottomBody: "─",
      bottomJoin: "┴",
      bottomLeft: "└",
      bottomRight: "┘",
      bodyLeft: "│",
      bodyRight: "│",
      bodyJoin: "│",
      joinBody: "─",
      joinLeft: "├",
      joinRight: "┤",
      joinJoin: "┼",
    },
    columnDefault: {
      paddingLeft: 1,
      paddingRight: 1,
    },
  });

  console.log(output);

  // Summary
  const summary = generateSummary(agents);
  console.log(summary);
}

function getProviderDisplay(provider: string): string {
  switch (provider) {
    case "ollama":
      return chalk.blue("Ollama");
    case "openai":
      return chalk.green("OpenAI");
    default:
      return chalk.gray(provider);
  }
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) {
    return "Just now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString();
  }
}

function getAgentStatus(agent: AgentMetadata): string {
  // Check if agent configuration is valid
  if (!agent.provider || !agent.model) {
    return chalk.red("⚠️  Invalid");
  }

  // Check if provider is configured
  const config = configManager.getConfig();
  if (agent.provider === "openai" && !config.llm.openai?.apiKey) {
    return chalk.yellow("⚠️  No API Key");
  }

  return chalk.green("✅ Ready");
}

function generateSummary(agents: AgentMetadata[]): string {
  const totalAgents = agents.length;
  const providerCounts = agents.reduce(
    (acc, agent) => {
      acc[agent.provider] = (acc[agent.provider] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const totalUsage = agents.reduce((sum, agent) => sum + agent.usageCount, 0);
  const activeAgents = agents.filter((agent) => agent.usageCount > 0).length;

  let summary = `\n${chalk.bold("Summary:")}`;
  summary += `\n  Total agents: ${chalk.cyan(totalAgents)}`;
  summary += `\n  Active agents: ${chalk.green(activeAgents)}`;
  summary += `\n  Total usage: ${chalk.yellow(totalUsage)}`;

  if (Object.keys(providerCounts).length > 0) {
    summary += `\n  Providers:`;
    Object.entries(providerCounts).forEach(([provider, count]) => {
      summary += `\n    ${getProviderDisplay(provider)}: ${count}`;
    });
  }

  return summary;
}
