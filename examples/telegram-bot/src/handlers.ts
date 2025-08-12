import { Telegraf } from "telegraf";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StructuredTool } from "@langchain/core/tools";
import { ChatModelWithTools } from "./models";

import { ASSETS_PROMPT, NOMINATION_PROMPT, SWAP_PROMPT, IDENTITY_PROMPT } from "@polkadot-agent-kit/llm";
export const SYSTEM_PROMPT = ASSETS_PROMPT + SWAP_PROMPT + NOMINATION_PROMPT + IDENTITY_PROMPT;

export function setupHandlers(
  bot: Telegraf,
  llm: ChatModelWithTools,
  tools: StructuredTool[],
): void {
  bot.start((ctx) => {
    ctx.reply(
      "Welcome to Polkadot Bot!\n" +
        "I can assist you with:\n" +
        '- Transferring native tokens  (e.g., "transfer 1 token to westend_asset_hub to 5CSox4ZSN4SGLKUG9NYPtfVK9sByXLtxP4hmoF4UgkM4jgDJ")\n' +
        '- Checking balance (e.g., "check balance on west/polkadot/kusama")\n' +
        '- Checking proxies (e.g., "check proxies on westend" or "check proxies")\n' +
        '- Transfer tokens through XCM (e.g., "transfer 1 WND to 5CSox4ZSN4SGLKUG9NYPtfVK9sByXLtxP4hmoF4UgkM4jgDJ from west to westend_asset_hub ")\n' +
        '- Register identity on People Chain (e.g., "register identity display=\"Gemini AI\" web=\"https://gemini.google.com\" twitter=\"@GoogleAI\" github=\"google\"")' +
        '- Bonding to a pool (e.g., "bond 100 DOT on Polkadot")\n' +
        '- Re-staking rewards (e.g., "re-stake my rewards on Paseo")\n' +
        '- Unbonding tokens from a pool (e.g., "unbond 100 DOT on Polkadot")\n' +
        '- Claiming rewards from a pool (e.g., "claim rewards from pool on paseo")\n' +
        '- Withdraw unbonded from a pool (e.g, "withdraw unbonded with 1 amount from pool on paseo")\n' +
        '- Swapping tokens (e.g., "swap 1 DOT to USDT on Hydra")\n' +
        "Try asking something!",
    );
  });

  bot.on("text", async (ctx) => {
    const message = ctx.message.text;

    if (message.startsWith("/")) return;

    try {
      const llmWithTools = llm.bindTools(Object.values(tools));
      const messages = [
        new SystemMessage({ content: SYSTEM_PROMPT }),
        new HumanMessage({ content: message }),
      ];
      const aiMessage = await llmWithTools.invoke(messages);
      if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
        for (const toolCall of aiMessage.tool_calls) {
          
          const selectedTool = tools.find((tool: StructuredTool) => tool.name === toolCall.name);
          if (selectedTool) {
            const toolMessage = await selectedTool.invoke(toolCall);
            if (!toolMessage || !toolMessage.content) {
              await ctx.reply("Tool did not return a response.");
              return;
            }
            const response = JSON.parse(toolMessage.content || "{}");
            if (response.error) {
              await ctx.reply(`Error: ${response.message}`);
            } else {
              const content = JSON.parse(response.content || "{}");
              const data = JSON.stringify(content.data);
              await ctx.reply(data || "No message from tool.");
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
