import { Telegraf } from 'telegraf';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { Ollama } from 'ollama';
import { ToolCall } from '@langchain/core/dist/messages/tool';


const SYSTEM_PROMPT = `I am a Telegram bot powered by PolkadotAgentKit. I can assist you with:
- Transferring native tokens on specific chain (e.g., "transfer 1 WND to 5CSox4ZSN4SGLKUG9NYPtfVK9sByXLtxP4hmoF4UgkM4jgDJ on westend_asset_hub")
- Checking WND balance on Westend (e.g., "check balance")
- Checking proxies (e.g., "check proxies on westend" or "check proxies")
- Transfer tokens through XCM (e.g., "transfer 1 WND to 5CSox4ZSN4SGLKUG9NYPtfVK9sByXLtxP4hmoF4UgkM4jgDJ from west to westend_asset_hub ")

When transferring tokens, please provide:
1. The amount of tokens to transfer (e.g., 1)
2. The address to receive the tokens (e.g., 5CSox4ZSN4SGLKUG9NYPtfVK9sByXLtxP4hmoF4UgkM4jgDJ)
3. The name of the destination chain (e.g., westend, westend_asset_hub)


Suggested syntax: "transfer [amount] token to [chain name] to [address]"

When checking proxies, you can specify the chain (e.g., "check proxies on westend") or 
not specify a chain (the first chain will be used by default)

Please provide instructions, and I will assist you!`;

export function setupHandlers(
  bot: Telegraf,
  llm: Ollama ,
  toolsByName: Record<string, DynamicStructuredTool>,
): void {

  bot.start((ctx) => {
    ctx.reply(
      'Welcome to Polkadot Bot!\n' +
      'I can assist you with:\n' +
      '- Transferring native tokens  (e.g., "transfer 1 token to westend_asset_hub to 5CSox4ZSN4SGLKUG9NYPtfVK9sByXLtxP4hmoF4UgkM4jgDJ")\n' +
      '- Checking balance (e.g., "check balance on west/polkadot/kusama")\n' +
      '- Checking proxies (e.g., "check proxies on westend" or "check proxies")\n' +
      'Try asking something!',
    );
  });


  bot.on('text', async (ctx) => {
    const message = ctx.message.text;
    console.log(message);
    if (message.startsWith('/')) return;

    try {
      const messages = [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: message,
        }
      ];

      // Convert DynamicStructuredTool to Ollama Tool format
      const tools = Object.values(toolsByName).map(tool => {

        const shape = tool.schema._def.shape();
        
        // Convert the shape to the format Ollama expects
        const properties = Object.entries(shape).reduce((acc, [key, value]) => {
          const def = (value as any)?._def ?? {};
          acc[key] = {
            type: def.typeName === 'ZodString' ? 'string' :
                  def.typeName === 'ZodNumber' ? 'number' :
                  def.typeName === 'ZodBoolean' ? 'boolean' :
                  def.typeName === 'ZodArray' ? 'array' : 'object',
            description: def?.description || '',
            ...(def?.values && { enum: def.values }),
            ...(def?.typeName === 'ZodArray' && {
              items: {
                type: def?.type?._def?.typeName === 'ZodString' ? 'string' :
                      def?.type?._def?.typeName === 'ZodNumber' ? 'number' :
                      def?.type?._def?.typeName === 'ZodBoolean' ? 'boolean' : 'object'
              }
            })
          };
          return acc;
        }, {} as Record<string, any>);

        return {
          type: "function",
          function: {
            name: tool.name,
            description: tool.description,
            parameters: {
              type: "object",
              properties,
              required: Object.keys(properties)
            }
          }
        };
      });

      
      const response = await llm.chat({
        model: 'qwen3:latest',
        messages: messages,
        tools: tools
      });

      if (response.message.tool_calls && response.message.tool_calls.length > 0) {
        for (const toolCall of response.message.tool_calls) {
          const selectedTool = toolsByName[toCamelCase(toolCall.function.name)];
          if (selectedTool) {
            try {
            
              
              // Convert Ollama tool call format to LangChain ToolCall format
              const langchainToolCall: ToolCall = {
                name: toolCall.function.name,
                args: toolCall.function.arguments,
                type: "tool_call"
              };
              
              const toolMessage = await selectedTool.invoke(langchainToolCall);
              
              if (!toolMessage || !toolMessage.content) {
                await ctx.reply('Tool did not return a response.');
                return;
              }

              const response = JSON.parse(toolMessage.content || '{}');
              
              if (response.error) {
                await ctx.reply(`Error: ${response.message}`);
              } else {
                await ctx.reply(response.data || 'No message from tool.');
              }
            } catch (parseError) {
              console.error('Error parsing tool arguments:', parseError);
              await ctx.reply('Error processing tool arguments. Please try again.');
            }
          } else {
            console.warn(`Tool not found: ${toolCall.function.name}`);
            await ctx.reply(`Tool ${toolCall.function.name} not found.`);
          }
        }
      } else {
        const content = String(response.message.content || 'No response from LLM.');
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
