import { tool } from "@langchain/core/tools"

import type { CrawlResult, CrawlWebInput } from "../../types/firecrawl"
import { crawlWebSchema } from "../../types/firecrawl"

/**
 * Firecrawl API Response Types
 */
interface FirecrawlCrawlResponse {
  success: boolean
  id?: string
  data?: Array<{ markdown?: string; url?: string; [key: string]: unknown }>
  error?: string
}

interface FirecrawlStatusResponse {
  status: string
  total?: number
  completed?: number
  data?: Array<{ markdown?: string; url?: string; [key: string]: unknown }>
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
 * Crawl multiple pages from a website using Firecrawl API
 */
async function crawlWebsite(input: CrawlWebInput): Promise<CrawlResult> {
  const apiKey = getFirecrawlApiKey()
  const baseUrl = process.env.FIRECRAWL_BASE_URL || "https://api.firecrawl.dev"

  try {
    // Start the crawl job
    const response = await fetch(`${baseUrl}/v1/crawl`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        url: input.url,
        maxDepth: input.maxDepth || 2,
        limit: input.limit || 10,
        includePaths: input.includePaths,
        excludePaths: input.excludePaths,
        allowBackwardLinks: input.allowBackwardLinks ?? false,
        allowExternalLinks: input.allowExternalLinks ?? false,
        scrapeOptions: {
          formats: ["markdown"],
          onlyMainContent: true
        }
      })
    })

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as { error?: string }
      throw new Error(
        `Firecrawl API error: ${response.status} - ${errorData.error ?? response.statusText}`
      )
    }

    const data = (await response.json()) as FirecrawlCrawlResponse

    if (!data.success) {
      throw new Error(`Crawl failed: ${data.error ?? "Unknown error"}`)
    }

    // If the crawl is async, we need to poll for results
    const jobId = data.id
    if (jobId) {
      return await pollCrawlStatus(baseUrl, apiKey, jobId)
    }

    // If sync response with data
    return {
      success: true,
      total: data.data?.length ?? 0,
      completed: data.data?.length ?? 0,
      pages: (data.data ?? []).map(page => ({
        url: page.url ?? "",
        markdown: page.markdown
      }))
    }
  } catch (error) {
    return {
      success: false,
      total: 0,
      completed: 0,
      pages: [],
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

/**
 * Poll crawl job status until completion
 */
async function pollCrawlStatus(
  baseUrl: string,
  apiKey: string,
  jobId: string,
  maxAttempts = 30
): Promise<CrawlResult> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds between polls

    const response = await fetch(`${baseUrl}/v1/crawl/${jobId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get crawl status: ${response.statusText}`)
    }

    const data = (await response.json()) as FirecrawlStatusResponse

    if (data.status === "completed") {
      return {
        success: true,
        total: data.total ?? 0,
        completed: data.completed ?? 0,
        pages: (data.data ?? []).map(page => ({
          url: page.url ?? "",
          markdown: page.markdown
        }))
      }
    }

    if (data.status === "failed") {
      throw new Error(`Crawl failed: ${data.error ?? "Unknown error"}`)
    }

    // Continue polling if status is "scraping" or "pending"
  }

  throw new Error("Crawl timeout: Job took too long to complete")
}

/**
 * Crawl Web Tool
 * LangChain tool for crawling websites
 */
export const crawlWebTool = () => {
  return tool(
    async (input: CrawlWebInput) => {
      try {
        const result = await crawlWebsite(input)

        if (!result.success) {
          return `Error crawling website: ${result.error}`
        }

        // Format the result as a readable string
        let output = `# Crawl Results for ${input.url}\n\n`
        output += `**Total Pages:** ${result.total}\n`
        output += `**Pages Crawled:** ${result.completed}\n\n`

        if (result.pages.length === 0) {
          output += "No pages were crawled.\n"
          return output
        }

        output += `## Crawled Pages\n\n`

        result.pages.forEach((page, index) => {
          output += `### ${index + 1}. ${page.metadata?.title || page.url}\n\n`
          output += `**URL:** ${page.url}\n\n`

          if (page.metadata?.description) {
            output += `**Description:** ${page.metadata.description}\n\n`
          }

          // Include a preview of the content
          if (page.markdown) {
            const preview = page.markdown.substring(0, 500)
            output += `${preview}${page.markdown.length > 500 ? "..." : ""}\n\n`
          } else if (page.content) {
            const preview = page.content.substring(0, 500)
            output += `${preview}${page.content.length > 500 ? "..." : ""}\n\n`
          }

          output += "---\n\n"
        })

        return output
      } catch (error) {
        return `Error crawling website: ${error instanceof Error ? error.message : String(error)}`
      }
    },
    {
      name: "crawl_web",
      description:
        "Crawl multiple pages from a website starting from a given URL. Follows links within the specified domain and extracts content from each page. Useful for gathering comprehensive information from documentation sites or blogs.",
      schema: crawlWebSchema
    }
  )
}
