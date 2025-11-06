
# Polkadot Agent Playground

A modern, interactive web application that provides a comprehensive environment for exploring, testing, and interacting with the Polkadot ecosystem through AI-powered agents. The playground combines natural language chat interfaces, developer tools, and blockchain operations in a single unified experience.



## Installation

### Prerequisites

- **Node.js** 22+ and **pnpm** (or npm/yarn)
- For **Ollama**: Local Ollama installation and running service
- For **OpenAI**: Valid OpenAI API key
- For **Google GenAI**: Valid Google API key
- **Polkadot Account**: Private key for blockchain operations

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd polkadot-agent-kit/apps/playground
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables (optional)

Create a `.env.local` file in the playground directory:

```env
# Optional: Set default values or API keys
NEXT_PUBLIC_DEFAULT_LLM_PROVIDER=ollama
NEXT_PUBLIC_OLLAMA_BASE_URL=http://localhost:11434
```

**Note**: API keys for LLM providers are stored securely in browser localStorage, not in environment variables.

### 4. Start the development server

```bash
pnpm run dev
```

The application will be available at `http://localhost:3000`

---


## Contributing

Contributions are welcome! Areas for improvement:

- Additional LLM provider support
- Enhanced error messages and user feedback
- More developer tools and utilities
- Improved mobile experience
- Additional documentation and examples

---

## License

Apache-2.0

---

## Related Resources

- [Polkadot Agent Kit SDK Documentation](../../packages/sdk/README.md)
- [LangChain Documentation](https://js.langchain.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [Radix UI Documentation](https://www.radix-ui.com/)

---

## Support

For issues, questions, or contributions:

- **GitHub Issues**: Report bugs and request features
- **Documentation**: Check main README and package documentation
- **Examples**: Review Telegram Bot and MCP Server examples

---

For more details, explore the source code in the respective directories.
