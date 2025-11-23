import { tool } from "@langchain/core/tools"

import type { SearchResponse, SearchWebInput } from "../../types/firecrawl"
import { searchWebSchema } from "../../types/firecrawl"

/**
 * Firecrawl API Response Type
 */
interface FirecrawlSearchResponse {
  success: boolean
  data?: Array<{
    title?: string
    url?: string
    description?: string
    markdown?: string
    content?: string
    publishedDate?: string
    [key: string]: unknown
  }>
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
 * Search the web using Firecrawl API
 */
async function searchWeb(input: SearchWebInput): Promise<SearchResponse> {
  const apiKey = getFirecrawlApiKey()
  const baseUrl = process.env.FIRECRAWL_BASE_URL || "https://api.firecrawl.dev"

  try {
    const response = await fetch(`${baseUrl}/v1/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        query: input.query,
        limit: input.limit || 10,
        lang: input.lang,
        country: input.country,
        scrapeOptions: input.scrapeResults
          ? {
              formats: ["markdown"],
              onlyMainContent: true
            }
          : undefined
      })
    })

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as { error?: string }
      throw new Error(
        `Firecrawl API error: ${response.status} - ${errorData.error ?? response.statusText}`
      )
    }

    const data = (await response.json()) as FirecrawlSearchResponse

    if (!data.success) {
      throw new Error(`Search failed: ${data.error ?? "Unknown error"}`)
    }

    return {
      success: true,
      query: input.query,
      total: data.data?.length ?? 0,
      results:
        data.data?.map(result => ({
          title: result.title ?? "",
          url: result.url ?? "",
          description: result.description,
          content: result.markdown ?? result.content,
          publishedDate: result.publishedDate
        })) ?? []
    }
  } catch (error) {
    return {
      success: false,
      query: input.query,
      total: 0,
      results: [],
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

/**
 * Search Web Tool
 * LangChain tool for searching the web
 */
export const searchWebTool = () => {
  return tool(
    async (input: SearchWebInput) => {
      try {
        const result = await searchWeb(input)

        if (!result.success) {
          return `Error searching the web: ${result.error}`
        }

        // Format the result as a readable string
        let output = `# Search Results for "${result.query}"\n\n`
        output += `**Total Results:** ${result.total}\n\n`

        if (result.results.length === 0) {
          output += "No results found.\n"
          return output
        }

        result.results.forEach((searchResult, index) => {
          output += `## ${index + 1}. ${searchResult.title}\n\n`
          output += `**URL:** ${searchResult.url}\n\n`

          if (searchResult.description) {
            output += `**Description:** ${searchResult.description}\n\n`
          }

          if (searchResult.publishedDate) {
            output += `**Published:** ${searchResult.publishedDate}\n\n`
          }

          // Include scraped content if available
          if (searchResult.content) {
            const preview = searchResult.content.substring(0, 500)
            output += `**Content Preview:**\n${preview}${searchResult.content.length > 500 ? "..." : ""}\n\n`
          }

          output += "---\n\n"
        })

        return output
      } catch (error) {
        return `Error searching the web: ${error instanceof Error ? error.message : String(error)}`
      }
    },
    {
      name: "search_web",
      description:
        "Search the web for information using a query. Returns a list of relevant web pages with their content. Optionally scrapes the full content of search result pages. Useful for finding current information or researching topics.",
      schema: searchWebSchema
    }
  )
}
