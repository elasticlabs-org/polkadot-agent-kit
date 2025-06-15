import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOpenAI } from "@langchain/openai";
import { ChatOllama } from "@langchain/ollama";

export type ChatProvider = "ollama" | "openai";

export type ChatModelWithTools = BaseChatModel & {
  bindTools: (tools: any[]) => any;
};

export interface ChatModelOptions {
  provider: ChatProvider;
  temperature?: number;
  modelName?: string;
  verbose?: boolean;
}

const chatModelConstructors: Record<
  ChatProvider,
  (options: ChatModelOptions) => ChatModelWithTools
> = {
  openai: ({ modelName, temperature = 0.7, verbose = false }) =>
    new ChatOpenAI({
      modelName: modelName ?? "gpt-4o-mini",
      temperature,
      streaming: true,
      openAIApiKey: process.env.OPENAI_API_KEY!,
      verbose,
    }),
  ollama: ({ modelName, temperature = 0.7, verbose = false }) =>
    new ChatOllama({
      model: modelName ?? "llama3",
      temperature,
      verbose,
    }),
};

export class ChatModelFactory {
  static create(options: ChatModelOptions): ChatModelWithTools {
    const { provider } = options;
    const constructor = chatModelConstructors[provider];
    if (!constructor) {
      throw new Error(`Unsupported provider: ${provider}`);
    }
    return constructor(options);
  }
}
