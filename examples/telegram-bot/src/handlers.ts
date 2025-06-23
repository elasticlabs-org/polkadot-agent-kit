import { Telegraf } from "telegraf";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { ChatModelWithTools } from "./models";

const SYSTEM_PROMPT = `I am a Telegram bot powered by PolkadotAgentKit. I can assist you with:
- Transferring native tokens on specific chain (e.g., "transfer 1 WND to 5CSox4ZSN4SGLKUG9NYPtfVK9sByXLtxP4hmoF4UgkM4jgDJ on westend_asset_hub")
- Checking WND balance on Westend (e.g., "check balance")
- Checking proxies (e.g., "check proxies on westend" or "check proxies")
- Transfer tokens through XCM (e.g., "transfer 1 WND to 5CSox4ZSN4SGLKUG9NYPtfVK9sByXLtxP4hmoF4UgkM4jgDJ from west to westend_asset_hub ")

IMPORTANT: When users mention chain names, I must convert them to the correct parameter values using this mapping:

| User Input | Real Param (USE THIS IN TOOL CALLS) |
|------------|-------------------------------------|
| Westend | west |
| Westend Asset Hub | west_asset_hub |
| Polkadot | polkadot |
| Kusama | kusama |

CHAIN NAME CONVERSION RULES:
- Always use the "Real Param" values when calling tools
- "Westend" → "west"
- "Westend Asset Hub" → "west_asset_hub"  
- "Polkadot" → "polkadot"
- "Kusama" → "kusama"

For XCM transfers, when the user says:
"transfer X WND to [address] from [source_chain_user_input] to [dest_chain_user_input]"

I must:
1. Convert source chain user input to real param (e.g., "Westend" → "west")
2. Convert destination chain user input to real param (e.g., "Westend Asset Hub" → "west_asset_hub")
3. Use these converted values in the tool call parameters

Example:
User: "transfer 0.1 WND to 5D7jcv6aYbhbYGVY8k65oemM6FVNoyBfoVkuJ5cbFvbefftr from Westend to Westend Asset Hub"
Tool call should use: sourceChain: "west", destChain: "west_asset_hub"

When transferring tokens, please provide:
1. The amount of tokens to transfer (e.g., 1)
2. The address to receive the tokens (e.g., 5CSox4ZSN4SGLKUG9NYPtfVK9sByXLtxP4hmoF4UgkM4jgDJ)
3. The name of the destination chain (convert to real param)

When transferring tokens through XCM, please provide:
1. The amount of tokens to transfer (e.g., 1)
2. The address to receive the tokens (e.g., 5CSox4ZSN4SGLKUG9NYPtfVK9sByXLtxP4hmoF4UgkM4jgDJ)
3. The name of the source chain (convert to real param)
4. The name of the destination chain (convert to real param)

When checking proxies, you can specify the chain (convert to real param) or not specify a chain (the first chain will be used by default)

Please provide instructions, and I will assist you!`;

export function setupHandlers(
  bot: Telegraf,
  llm: ChatModelWithTools,
  toolsByName: Record<string, DynamicStructuredTool>,
): void {
  bot.start((ctx) => {
    ctx.reply(
      "Welcome to Polkadot Bot!\n" +
        "I can assist you with:\n" +
        '- Transferring native tokens  (e.g., "transfer 1 token to westend_asset_hub to 5CSox4ZSN4SGLKUG9NYPtfVK9sByXLtxP4hmoF4UgkM4jgDJ")\n' +
        '- Checking balance (e.g., "check balance on west/polkadot/kusama")\n' +
        '- Checking proxies (e.g., "check proxies on westend" or "check proxies")\n' +
        '- Transfer tokens through XCM (e.g., "transfer 1 WND to 5CSox4ZSN4SGLKUG9NYPtfVK9sByXLtxP4hmoF4UgkM4jgDJ from west to west_asset_hub ")\n' +
        "Try asking something!",
    );
  });

  bot.on("text", async (ctx) => {
    const message = ctx.message.text;

    if (message.startsWith("/")) return;

    try {
      const llmWithTools = llm.bindTools(Object.values(toolsByName));
      const messages = [
        new SystemMessage({ content: SYSTEM_PROMPT }),
        new HumanMessage({ content: message }),
      ];
      const aiMessage = await llmWithTools.invoke(messages);
      if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
        for (const toolCall of aiMessage.tool_calls) {
          const selectedTool = toolsByName[toCamelCase(toolCall.name)];
          if (selectedTool) {
            const toolMessage = await selectedTool.invoke(toolCall);
            if (!toolMessage || !toolMessage.content) {
              await ctx.reply("Tool did not return a response.");
              return;
            }
            const response = JSON.parse(toolMessage.content || "{}");
            console.log("response", response);
            if (response.error) {
              await ctx.reply(`Error: ${response.message}`);
            } else {
              const content = JSON.parse(response.content || "{}");
              await ctx.reply(content.data || "No message from tool.");
            }
          } else {
            console.warn(`Tool not found: ${toolCall.name}`);
            await ctx.reply(`Tool ${toolCall.name} not found.`);
          }
        }
      } else {
        const content = String(aiMessage.content || "No response from LLM.");
        await ctx.reply(content);
      }
    } catch (error) {
      console.error("Error handling message:", error);
      if (error instanceof Error) {
        console.error("Error stack:", error.stack);
      }
      await ctx.reply(
        `Sorry, an error occurred: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  });

  bot.catch((err, ctx) => {
    console.error(`Error for ${ctx.updateType}`, err);
    ctx.reply("An error occurred. Please try again.");
  });
}

function toCamelCase(snakeStr: string) {
  return snakeStr.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}
