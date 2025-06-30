import { type HrmpChannel } from '../types/hrmp'

/**
 * Builds an adjacency list representation of the HRMP channels graph.
 * @param hrmpChannels - A readonly array of HRMP channels.
 * @returns An adjacency list (Map) where keys are sender parachain IDs
 *          and values are arrays of recipient parachain IDs.
 */
export function buildHrmpGraph(hrmpChannels: readonly HrmpChannel[]): Map<number, number[]> {
  const graph = new Map<number, number[]>()
  for (const channel of hrmpChannels) {
    if (!graph.has(channel.sender)) {
      graph.set(channel.sender, [])
    }
    graph.get(channel.sender)!.push(channel.recipient)
  }
  return graph
}

/**
 * Finds the shortest path between two parachains using Breadth-First Search (BFS).
 * @param graph - The adjacency list of the HRMP channels.
 * @param startNode - The starting parachain ID.
 * @param endNode - The ending parachain ID.
 * @returns An array of parachain IDs representing the path from start to end,
 *          or null if no path is found.
 */
export function findHrmpPathBfs(
  graph: Map<number, number[]>,
  startNode: number,
  endNode: number
): number[] | null {
  if (startNode === endNode) {
    return [startNode]
  }

  // A queue of paths, where each path is an array of node IDs
  const queue: number[][] = [[startNode]]
  const visited = new Set<number>([startNode])

  while (queue.length > 0) {
    const path = queue.shift()!
    const node = path[path.length - 1]

    if (node === endNode) {
      return path
    }

    const neighbors = graph.get(node) || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor)
        const newPath = [...path, neighbor]
        queue.push(newPath)
      }
    }
  }

  return null // No path found
} 