import { Telegraf } from 'telegraf';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatOpenAI } from '@langchain/openai';
import { DynamicStructuredTool, Tool } from '@langchain/core/tools';

const SYSTEM_PROMPT = `I am a Telegram bot powered by PolkadotAgentKit. I can assist you with:
- Transferring tokens between chains using XCM (e.g., "transfer 1 token to westend_asset_hub to 5CSox4ZSN4SGLKUG9NYPtfVK9sByXLtxP4hmoF4UgkM4jgDJ")
- Checking WND balance on Westend (e.g., "check balance")
- Checking proxies (e.g., "check proxies on westend" or "check proxies")

When transferring tokens, please provide:
1. The amount of tokens to transfer (e.g., 1)
2. The name of the destination chain (e.g., westend, westend_asset_hub)
3. The address to receive the tokens (e.g., 5CSox4ZSN4SGLKUG9NYPtfVK9sByXLtxP4hmoF4UgkM4jgDJ)

Suggested syntax: "transfer [amount] token to [chain name] to [address]"

When checking proxies, you can specify the chain (e.g., "check proxies on westend") or 
not specify a chain (the first chain will be used by default)

Please provide instructions, and I will assist you!`;

export function setupHandlers(
  bot: Telegraf,
  llm: ChatOpenAI,
  toolsByName: Record<string, DynamicStructuredTool>,
): void {

  console.log('toolsByName', toolsByName)

  bot.start((ctx) => {
    ctx.reply(
      'Welcome to Polkadot Bot!\n' +
      'I can assist you with:\n' +
      '- Transferring XCM tokens (e.g., "transfer 1 token to westend_asset_hub to 5CSox4ZSN4SGLKUG9NYPtfVK9sByXLtxP4hmoF4UgkM4jgDJ")\n' +
      '- Checking WND balance (e.g., "check balance")\n' +
      '- Checking proxies (e.g., "check proxies on westend" or "check proxies")\n' +
      'Try asking something!',
    );
  });


  bot.on('text', async (ctx) => {
    const message = ctx.message.text;
    
    if (message.startsWith('/')) return;

    try {
      console.log('Received message:', message);

      const llmWithTools = llm.bindTools(Object.values(toolsByName));
      const messages = [
        new SystemMessage({ content: SYSTEM_PROMPT }),
        new HumanMessage({ content: message }),
      ];

      console.log('Sending request to LLM with messages:', messages);

      const aiMessage = await llmWithTools.invoke(messages);
      
      console.log('LLM response:', aiMessage);
      
      if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
        for (const toolCall of aiMessage.tool_calls) {
          
          const selectedTool = toolsByName[toCamelCase(toolCall.name)];
          if (selectedTool) {
            const toolMessage = await selectedTool.invoke(toolCall);
            
            if (!toolMessage || !toolMessage.content) {
              await ctx.reply('Tool did not return a response.');
              return;
            }
            const response = JSON.parse(toolMessage.content || '{}');
            console.log('Parsed tool response:', response);
            
            if (response.error) {
              await ctx.reply(`Error: ${response.message}`);
            } else {
              await ctx.reply(response.message || response.content || 'No message from tool.');
            }
          } else {
            console.warn(`Tool not found: ${toolCall.name}`);
            await ctx.reply(`Tool ${toolCall.name} not found.`);
          }
        }
      } else {
        const content = String(aiMessage.content || 'No response from LLM.');
        console.log('Sending response to user:', content);
        await ctx.reply(content);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      await ctx.reply(`Sorry, an error occurred: ${error instanceof Error ? error.message : String(error)}`);
    }
  });


  bot.catch((err, ctx) => {
    console.error(`Error for ${ctx.updateType}`, err);
    ctx.reply('An error occurred. Please try again.');
  });
}

function toCamelCase(snakeStr: string) {
  return snakeStr.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}
