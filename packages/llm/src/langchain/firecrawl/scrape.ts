import { tool } from "@langchain/core/tools"

import type { ScrapedPage,ScrapeWebInput } from "../../types/firecrawl"
import { scrapeWebSchema } from "../../types/firecrawl"

/**
 * Firecrawl API Response Type
 */
interface FirecrawlScrapeResponse {
  success: boolean
  data?: {
    markdown?: string
    html?: string
    rawHtml?: string
    content?: string
    links?: string[]
    screenshot?: string
    metadata?: {
      title?: string
      description?: string
      language?: string
      sourceURL?: string
      statusCode?: number
      [key: string]: unknown
    }
    [key: string]: unknown
  }
  error?: string
}

/**
 * Get Firecrawl API key from environment
 */
function getFirecrawlApiKey(): string {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) {
    throw new Error(
      "FIRECRAWL_API_KEY environment variable is required. Get your API key from https://firecrawl.dev"
    )
  }
  return apiKey
}

/**
 * Scrape a web page using Firecrawl API
 */
async function scrapeUrl(input: ScrapeWebInput): Promise<ScrapedPage> {
  const apiKey = getFirecrawlApiKey()
  const baseUrl = process.env.FIRECRAWL_BASE_URL || "https://api.firecrawl.dev"

  try {
    const response = await fetch(`${baseUrl}/v1/scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        url: input.url,
        formats: input.formats || ["markdown"],
        includeTags: input.includeTags,
        excludeTags: input.excludeTags,
        onlyMainContent: input.onlyMainContent ?? true,
        waitFor: input.waitFor
      })
    })

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as { error?: string }
      throw new Error(
        `Firecrawl API error: ${response.status} - ${errorData.error ?? response.statusText}`
      )
    }

    const data = (await response.json()) as FirecrawlScrapeResponse

    if (!data.success) {
      throw new Error(`Scraping failed: ${data.error ?? "Unknown error"}`)
    }

    return {
      url: input.url,
      markdown: data.data?.markdown,
      html: data.data?.html,
      rawHtml: data.data?.rawHtml,
      content: data.data?.content,
      links: data.data?.links,
      screenshot: data.data?.screenshot,
      metadata: {
        title: data.data?.metadata?.title,
        description: data.data?.metadata?.description,
        language: data.data?.metadata?.language,
        sourceURL: data.data?.metadata?.sourceURL,
        statusCode: data.data?.metadata?.statusCode,
        ...data.data?.metadata
      }
    }
  } catch (error) {
    throw new Error(
      `Failed to scrape ${input.url}: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * Scrape Web Tool
 * LangChain tool for scraping web pages
 */
export const scrapeWebTool = () => {
  return tool(
    async (input: ScrapeWebInput) => {
      try {
        const result = await scrapeUrl(input)

        // Format the result as a readable string
        let output = `# Scraped Content from ${result.url}\n\n`

        if (result.metadata?.title) {
          output += `## ${result.metadata.title}\n\n`
        }

        if (result.metadata?.description) {
          output += `**Description:** ${result.metadata.description}\n\n`
        }

        // Include the main content
        if (result.markdown) {
          output += result.markdown
        } else if (result.content) {
          output += result.content
        } else if (result.html) {
          output += `**HTML Content:**\n${result.html.substring(0, 5000)}${result.html.length > 5000 ? "..." : ""}`
        }

        // Include links if requested
        if (result.links && result.links.length > 0) {
          output += `\n\n## Links Found (${result.links.length})\n`
          result.links.slice(0, 20).forEach(link => {
            output += `- ${link}\n`
          })
          if (result.links.length > 20) {
            output += `... and ${result.links.length - 20} more\n`
          }
        }

        return output
      } catch (error) {
        return `Error scraping web page: ${error instanceof Error ? error.message : String(error)}`
      }
    },
    {
      name: "scrape_web",
      description:
        "Scrape content from a web page. Returns the page content in various formats including markdown, HTML, or plain text. Useful for extracting information from documentation, articles, or any web page.",
      schema: scrapeWebSchema
    }
  )
}

