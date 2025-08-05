import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import "mcps-logger/console";
import { PolkadotAgentKit } from "@polkadot-agent-kit/sdk";


import type { PolkadotMCPServerConfig } from "./types/index";

export class PolkadotMCPServer {
  private server: McpServer;
  private polkadotAgent: PolkadotAgentKit;
  private isInitialized: boolean = false;

  constructor(config: PolkadotMCPServerConfig) {
    // Initialize Polkadot Agent Kit
    this.polkadotAgent = new PolkadotAgentKit(config.privateKey, {
      keyType: "Sr25519",
      chains: ["polkadot"]
    });

    this.server = new McpServer({
      name: config.name,
      version: config.version,
    });

    // Register tools
    this.registerTools();
  }

  private registerTools(): void {
    // Check Balance Tool
    // this.server.tool(
    //   'check_balance',
    //   'Check the native token balance of an account on a Polkadot chain',
    //   {
    //     chain: z.string().describe("The chain to check balance on (e.g., 'polkadot', 'kusama', 'westend')"),
    //   },
    //   async ({ chain }) => {
    //     try {
    //       console.log("Chain:", chain);
    //       // const targetAddress = this.polkadotAgent.getCurrentAddress();
    //       // console.log("Target Address:",targetAddress);
    //       // console.log("Chain:", chain);

    //       // if (!targetAddress) {
    //       //   return {
    //       //     content: [
    //       //       {
    //       //         type: "text",
    //       //         text: "Error: No address provided and no default address configured"
    //       //       }
    //       //     ]
    //       //   };
    //       // }

    //       // Use the SDK's native balance tool
    //       // const balanceTool = this.polkadotAgent.getNativeBalanceTool();
    //       // console.log("balance:", balanceTool);
    //       // // Call the tool with the target address
    //       // const result = await balanceTool.call({
    //       //   address: targetAddress,
    //       //   chain: chain as KnownChainId
    //       // });

    //       // // Parse the result from the SDK tool
    //       // if (result.error) {
    //       //   return {
    //       //     content: [
    //       //       {
    //       //         type: "text",
    //       //         text: `Balance check failed: ${result.error}`
    //       //       }
    //       //     ]
    //       //   };
    //       // }

    //       const balance = "0";
    //       const symbol = "DOT";

    //       return {
    //         content: [
    //           {
    //             type: "text",
    //             text: `Balance on ${chain}: ${balance} ${symbol}`
    //           }
    //         ]
    //       };

    //     } catch (error) {
    //       return {
    //         content: [
    //           {
    //             type: "text",
    //             text: `Error checking balance: ${error.message}`
    //           }
    //         ]
    //       };
    //     }
    //   }
    // );

    // this.server.tool(
    //   'transfer_native',
    //   'Transfer native tokens from one account to another',
    //   {
    //     to: z.string().describe("The recipient address"),
    //     amount: z.string().describe("The amount to transfer (in token units)"),
    //     chain: z.string().describe("The chain to transfer on (e.g., 'polkadot', 'kusama', 'westend')")
    //   },
    //   async ({ to, amount, chain }) => {
    //     try {
    //       // Use the SDK's transfer tool
    //       const transferTool = this.polkadotAgent.transferNativeTool();

    //       // Call the tool with the transfer parameters
    //       const result = await transferTool.call({
    //         to,
    //         amount,
    //         chain: chain as KnownChainId
    //       });

    //       // Parse the result from the SDK tool
    //       if (result.error) {
    //         return {
    //           content: [
    //             {
    //               type: "text",
    //               text: `Transfer failed: ${result.error}`
    //             }
    //           ]
    //         };
    //       }

    //       return {
    //         content: [
    //           {
    //             type: "text",
    //             text: `Transfer successful: ${result.transactionHash}`
    //           }
    //         ]
    //       };

    //     } catch (error) {
    //       return {
    //         content: [
    //           {
    //             type: "text",
    //             text: `Error during transfer: ${error.message}`
    //           }
    //         ]
    //       };
    //     }
    //   }
    // );


    this.server.tool(
      'get-weather',
      'Tool to get the weather of a city',
      {
        city: z.string().describe("The name of the city to get the weather for")
      },
      async ({ city }) => {
        try {
          const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=10&language=en&format=json`);
          const data = await response.json();

          if (data.results.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: `No results found for city: ${city}`
                }
              ]
            };
          }

          const { latitude, longitude } = data.results[0];
          const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,precipitation,apparent_temperature,relative_humidity_2m&forecast_days=1`);

          const weatherData = await weatherResponse.json();

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(weatherData, null, 2)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error fetching weather data: ${error.message}`
              }
            ]
          };
        }
      }
    );

  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log("🚀 Initializing PolkadotAgentKit APIs...");
    await this.polkadotAgent.initializeApi(); 
    this.isInitialized = true;
    console.log("✅ API initialization complete");
  }


  async start(): Promise<void> {

    await this.initialize();
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }

  async stop(): Promise<void> {
    await this.server.close();
  }


} 