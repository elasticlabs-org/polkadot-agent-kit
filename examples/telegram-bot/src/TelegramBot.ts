import { Telegraf } from "telegraf";
import { setupHandlers } from "./handlers";
import { createCustomTool, getLangChainTools, PolkadotAgentKit } from "@polkadot-agent-kit/sdk";
import {
  ChatModelFactory,
  ChatModelOptions,
  ChatModelWithTools,
} from "./models";
import z from "zod";

interface BotConfig {
  botToken: string;
  openAiApiKey?: string;
  privateKey?: string;
  mnemonic?: string;
}

export class TelegramBot {
  private bot: Telegraf;
  private agent: PolkadotAgentKit;
  private llm: ChatModelWithTools;

  private initializeLLM(openAiApiKey?: string): ChatModelWithTools {
    const options: ChatModelOptions = {
      provider: openAiApiKey ? ("openai" as const) : ("ollama" as const),
      modelName: openAiApiKey ? "gpt-4o-mini" : "qwen3:latest",
      temperature: 0.7,
      verbose: false,
    };
    return ChatModelFactory.create(options);
  }

  constructor(config: BotConfig) {
    const { botToken, openAiApiKey, privateKey } = config;

    if (!botToken) {
      throw new Error("TELEGRAM_BOT_TOKEN must be provided!");
    }

    this.bot = new Telegraf(botToken);

    this.agent = new PolkadotAgentKit({
      privateKey: privateKey as string,
      keyType: "Sr25519",
      chains: ["polkadot", "polkadot_asset_hub"]
    });

    this.llm = this.initializeLLM(openAiApiKey);
  }

  async initialize() {
    console.log("Initializing bot...");

    try {
      // Initialize APIs first
      await this.agent.initializeApi();

      const customTool = createCustomTool(
        "vote_on_proposal",
        "Vote on a governance proposal",
        z.object({
          proposalId: z.number(),
          vote: z.enum(["aye", "nay"]),
        }),
        async (args) => {
          // TODO: 
          // - Call the vote on the proposal 
          // - Return the result
          return JSON.stringify({
            content: JSON.stringify({
              success: true,
              data: `Voted ${args.vote} on proposal ${args.proposalId}`,
              tool: "vote_on_proposal",
              timestamp: new Date().toISOString()
            }),
            tool_call_id: `vote_on_proposal_${Date.now()}`
          });
        }
      );
      this.agent.addCustomTools([customTool]);
      const tools = getLangChainTools(this.agent);
      setupHandlers(this.bot, this.llm, tools);

      console.log("Bot initialization complete");
    } catch (error) {
      console.error("Failed to initialize bot:", error);
      throw error;
    }
  }

  public async start(): Promise<void> {
    try {
      await this.initialize();
      await this.bot.launch();
      console.log("Bot is running!");
    } catch (error) {
      console.error("Failed to start bot:", error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    try {
      await this.agent.disconnect();
      this.bot.stop();
    } catch (error) {
      console.error("Error during shutdown:", error);
    }
  }
}
