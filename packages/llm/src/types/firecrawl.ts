import { z } from "zod"

/**
 * Firecrawl tool names
 */
export enum FirecrawlToolNames {
  SCRAPE_WEB = "scrape_web",
  CRAWL_WEB = "crawl_web",
  SEARCH_WEB = "search_web"
}

/**
 * Schema for scraping a single web page
 */
export const scrapeWebSchema = z.object({
  url: z.string().url().describe("The URL of the web page to scrape"),
  formats: z
    .array(z.enum(["markdown", "html", "rawHtml", "content", "links", "screenshot"]))
    .optional()
    .describe("Output formats to return (default: markdown)"),
  includeTags: z
    .array(z.string())
    .optional()
    .describe("HTML tags to include in the output"),
  excludeTags: z
    .array(z.string())
    .optional()
    .describe("HTML tags to exclude from the output"),
  onlyMainContent: z
    .boolean()
    .optional()
    .describe("Extract only the main content, removing navigation, ads, etc."),
  waitFor: z
    .number()
    .optional()
    .describe("Time in milliseconds to wait for dynamic content to load")
})

export type ScrapeWebInput = z.infer<typeof scrapeWebSchema>

/**
 * Schema for crawling multiple pages from a website
 */
export const crawlWebSchema = z.object({
  url: z.string().url().describe("The starting URL to crawl from"),
  maxDepth: z
    .number()
    .min(1)
    .max(10)
    .optional()
    .describe("Maximum depth to crawl (default: 2)"),
  limit: z
    .number()
    .min(1)
    .max(100)
    .optional()
    .describe("Maximum number of pages to crawl (default: 10)"),
  includePaths: z
    .array(z.string())
    .optional()
    .describe("URL patterns to include (e.g., /blog/*)"),
  excludePaths: z
    .array(z.string())
    .optional()
    .describe("URL patterns to exclude"),
  allowBackwardLinks: z
    .boolean()
    .optional()
    .describe("Allow following links to parent directories"),
  allowExternalLinks: z
    .boolean()
    .optional()
    .describe("Allow following external links")
})

export type CrawlWebInput = z.infer<typeof crawlWebSchema>

/**
 * Schema for searching the web
 */
export const searchWebSchema = z.object({
  query: z.string().describe("The search query"),
  limit: z
    .number()
    .min(1)
    .max(20)
    .optional()
    .describe("Maximum number of search results (default: 10)"),
  lang: z
    .string()
    .optional()
    .describe("Language code for search results (e.g., 'en', 'es')"),
  country: z
    .string()
    .optional()
    .describe("Country code for search results (e.g., 'us', 'uk')"),
  scrapeResults: z
    .boolean()
    .optional()
    .describe("Whether to scrape the content of search result pages")
})

export type SearchWebInput = z.infer<typeof searchWebSchema>

/**
 * Scraped page data
 */
export interface ScrapedPage {
  url: string
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
    error?: string
  }
}

/**
 * Crawl result containing multiple pages
 */
export interface CrawlResult {
  success: boolean
  total: number
  completed: number
  pages: ScrapedPage[]
  error?: string
}

/**
 * Search result
 */
export interface SearchResult {
  title: string
  url: string
  description?: string
  content?: string
  publishedDate?: string
}

/**
 * Search response
 */
export interface SearchResponse {
  success: boolean
  query: string
  total: number
  results: SearchResult[]
  error?: string
}

/**
 * Firecrawl configuration
 */
export interface FirecrawlConfig {
  apiKey?: string
  baseUrl?: string
  timeout?: number
}

/**
 * Tool configuration for scraping web pages
 */
export const toolConfigScrapeWeb = {
  name: FirecrawlToolNames.SCRAPE_WEB,
  description:
    "Scrape content from a web page. Returns the page content in various formats including markdown, HTML, or plain text. Useful for extracting information from documentation, articles, or any web page.",
  schema: scrapeWebSchema
}

/**
 * Tool configuration for crawling websites
 */
export const toolConfigCrawlWeb = {
  name: FirecrawlToolNames.CRAWL_WEB,
  description:
    "Crawl multiple pages from a website starting from a given URL. Follows links within the specified domain and extracts content from each page. Useful for gathering comprehensive information from documentation sites or blogs.",
  schema: crawlWebSchema
}

/**
 * Tool configuration for web search
 */
export const toolConfigSearchWeb = {
  name: FirecrawlToolNames.SEARCH_WEB,
  description:
    "Search the web for information using a query. Returns a list of relevant web pages with their content. Optionally scrapes the full content of search result pages. Useful for finding current information or researching topics.",
  schema: searchWebSchema
}

