import { Telegraf } from 'telegraf';
import { Ollama } from 'ollama';
import { setupHandlers } from './handlers';
import { PolkadotAgentKit } from '@polkadot-agent-kit/sdk';

interface BotConfig {
  botToken: string;
  privateKey?: string;
}


export class TelegramBot {
  private bot: Telegraf;
  private agent: PolkadotAgentKit;
  private llm: Ollama;

  constructor(config: BotConfig) {
    const {
      botToken,
      privateKey,
    } = config;

    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN must be provided!');
    }

    this.bot = new Telegraf(botToken);

    this.agent = new PolkadotAgentKit(privateKey as string, {keyType: 'Sr25519'});

    this.llm = new Ollama({
      host: process.env.OLLAMA_URL || "http://localhost:11434", // Default value
    });

  }

  async initialize() {
    console.log("Initializing bot...");
    
    try {
      // Initialize APIs first
      await this.agent.initializeApi();
    
      // Set up tools 
      // Get balance of agent account
      const checkBalance = this.agent.getNativeBalanceTool();
      // Transfer native tokens to a recipient address on a specific chain.
      const transferNative = this.agent.transferNativeTool();
      setupHandlers(this.bot, this.llm, {
        checkBalance: checkBalance,
        transferNative: transferNative,
      } as any);

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
      console.log('Bot is running!');
      
    } catch (error) {
      console.error('Failed to start bot:', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    try {
      await this.agent.disconnect();
      this.bot.stop();
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }
}