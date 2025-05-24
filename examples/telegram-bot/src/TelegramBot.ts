import { Telegraf } from 'telegraf';
import { ChatOpenAI } from '@langchain/openai';
import { Tool } from '@langchain/core/tools';
import { setupHandlers } from './handlers';
import { PolkadotAgentKit } from '@polkadot-agent-kit/sdk';
import { getChainByName, KnownChainId, getAllSupportedChains } from '@polkadot-agent-kit/common';


interface BotConfig {
  botToken: string;
  openAiApiKey?: string;
  privateKey?: string;
  // delegatePrivateKey?: string;
  // chains: { url: string; name: string; apiKey: string; type: 'RelayChain' | 'ParaChain'; paraId?: number }[];
}

export class TelegramBot {
  private bot: Telegraf;
  private agent: PolkadotAgentKit;
  private llm: ChatOpenAI;

  constructor(config: BotConfig) {
    const {
      botToken,
      openAiApiKey,
      privateKey,
      // delegatePrivateKey,
      // chains,
    } = config;

    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN must be provided!');
    }

    this.bot = new Telegraf(botToken);

    this.agent = new PolkadotAgentKit(privateKey as string, {keyType: 'Sr25519'});

    this.llm = new ChatOpenAI({
      modelName: 'gpt-4',
      temperature: 0.7,
      openAIApiKey: openAiApiKey,
      streaming: true,
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
      });

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