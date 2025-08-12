import { Telegraf } from "telegraf";
import { setupHandlers } from "./handlers";
import { getLangChainTools, PolkadotAgentKit } from "@polkadot-agent-kit/sdk";
import {
  ChatModelFactory,
  ChatModelOptions,
  ChatModelWithTools,
} from "./models";

interface BotConfig {
  botToken: string;
  openAiApiKey?: string;
  privateKey?: string;
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

    this.agent = new PolkadotAgentKit(privateKey as string, {
      keyType: "Sr25519",
      chains: ["paseo","paseo_people"]
    });

    this.llm = this.initializeLLM(openAiApiKey);
  }

  async initialize() {
    console.log("Initializing bot...");

    try {
      // Initialize APIs first
      await this.agent.initializeApi();

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
