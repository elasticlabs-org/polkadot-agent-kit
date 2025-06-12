# Telegram Bot Example with Polkadot Agent Kit

This example demonstrates how to build a Telegram bot using the Polkadot Agent Kit.

## Prerequisites

- Node.js installed on your system
- PNPM package manager
- A Telegram Bot Token (obtain from [@BotFather](https://t.me/botfather))

## Setup 

1. **Environment Variables**
   - Create a `.env` file in the project root
   - Add your Telegram bot token:
     ```
     TELEGRAM_BOT_TOKEN=your_bot_token_here
     ```
   - Add Agent Private Key: 
     ```
     PRIVATE_KEY=xxx
     ```

2. **Install Dependencies**

   ```bash
   pnpm install --ignore-workspace
   ```

3. **Download Ollama Desktop**
Ollama is a tool designed to make it easy to run large language models (LLMs) like LLaMA, Mistral, Gemma, and others locally on your own machine—especially for developers.

Link: https://ollama.com/


4. **Install specific model**

This implementation utilizes the `Qwen3` model to handle reasoning and generate responses within the Polkadot AI Agent framework.

```bash
ollama run qwen3:latest
```

5. **Start the Bot**
   ```bash
   pnpm run dev
   ```

## Features

- Interact with Polkadot ecosystem (Polkadot, Polkadot Hub, Kusama, ...) through Telegram
- Execute blockchain queries and transactions

## Usage

After starting the bot:
1. Open Telegram
2. Search for your bot using its username
3. Start interacting with commands (use /help to see available commands)

