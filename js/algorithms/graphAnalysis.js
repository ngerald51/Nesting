/**
 * graphAnalysis.js - Network Analysis Utilities
 * Graph theory algorithms for transaction network analysis
 */

/**
 * Build adjacency list from a simulation
 */
export function buildGraph(entities, transactions) {
    const graph = {};
    entities.forEach(e => { graph[e.id] = []; });
    transactions.forEach(tx => {
        if (!graph[tx.sourceId]) graph[tx.sourceId] = [];
        graph[tx.sourceId].push({ target: tx.targetId, txId: tx.id, amount: tx.amount });
    });
    return graph;
}

/**
 * Build reverse (incoming) adjacency list
 */
export function buildReverseGraph(entities, transactions) {
    const graph = {};
    entities.forEach(e => { graph[e.id] = []; });
    transactions.forEach(tx => {
        if (!graph[tx.targetId]) graph[tx.targetId] = [];
        graph[tx.targetId].push({ source: tx.sourceId, txId: tx.id, amount: tx.amount });
    });
    return graph;
}

/**
 * Find all simple cycles (for round-tripping detection)
 * Uses Johnson's algorithm (simplified DFS variant)
 */
export function findCycles(entities, transactions, maxLength = 8) {
    const graph = buildGraph(entities, transactions);
    const cycles = [];
    const visited = new Set();
    const stack = new Set();

    function dfs(nodeId, startId, path, txPath) {
        if (path.length > maxLength) return;
        visited.add(nodeId);
        stack.add(nodeId);

        const edges = graph[nodeId] || [];
        for (const edge of edges) {
            if (edge.target === startId && path.length >= 2) {
                // Found a cycle back to start
                cycles.push({
                    entities: [...path],
                    transactions: [...txPath]
                });
            } else if (!stack.has(edge.target)) {
                dfs(edge.target, startId, [...path, edge.target], [...txPath, edge.txId]);
            }
        }
        stack.delete(nodeId);
    }

    for (const entity of entities) {
        visited.clear();
        stack.clear();
        dfs(entity.id, entity.id, [entity.id], []);
    }

    return cycles;
}

/**
 * Compute degree centrality (number of connections) per entity
 */
export function computeDegreeCentrality(entities, transactions) {
    const centrality = {};
    entities.forEach(e => { centrality[e.id] = { in: 0, out: 0, total: 0 }; });

    transactions.forEach(tx => {
        if (centrality[tx.sourceId]) centrality[tx.sourceId].out++;
        if (centrality[tx.targetId]) centrality[tx.targetId].in++;
    });

    Object.keys(centrality).forEach(id => {
        centrality[id].total = centrality[id].in + centrality[id].out;
    });

    return centrality;
}

/**
 * Compute betweenness centrality (simplified — fraction of shortest paths through node)
 */
export function computeBetweennessCentrality(entities, transactions) {
    const centrality = {};
    entities.forEach(e => { centrality[e.id] = 0; });

    const graph = buildGraph(entities, transactions);
    const n = entities.length;
    if (n < 3) return centrality;

    for (const source of entities) {
        // BFS from source
        const visited = new Set([source.id]);
        const queue = [[source.id, []]];   // [node, path]
        const paths = {};                  // node -> list of paths

        paths[source.id] = [[source.id]];

        while (queue.length > 0) {
            const [current, path] = queue.shift();
            for (const edge of (graph[current] || [])) {
                const next = edge.target;
                if (!paths[next]) paths[next] = [];
                paths[next].push([...path, next]);
                if (!visited.has(next)) {
                    visited.add(next);
                    queue.push([next, [...path, next]]);
                }
            }
        }

        for (const target of entities) {
            if (target.id === source.id) continue;
            const allPaths = paths[target.id] || [];
            allPaths.forEach(p => {
                // Every intermediate node on this path gets credit
                p.slice(1, -1).forEach(nodeId => {
                    centrality[nodeId] = (centrality[nodeId] || 0) + (1 / allPaths.length);
                });
            });
        }
    }

    // Normalize
    const norm = n > 2 ? (n - 1) * (n - 2) : 1;
    Object.keys(centrality).forEach(id => {
        centrality[id] = centrality[id] / norm;
    });

    return centrality;
}

/**
 * Find all paths from source to target (up to maxDepth hops)
 */
export function findPaths(sourceId, targetId, graph, maxDepth = 10) {
    const paths = [];

    function dfs(current, path, txPath, visited) {
        if (path.length > maxDepth) return;
        if (current === targetId && path.length > 1) {
            paths.push({ entities: [...path], transactions: [...txPath] });
            return;
        }
        for (const edge of (graph[current] || [])) {
            if (!visited.has(edge.target)) {
                visited.add(edge.target);
                dfs(edge.target, [...path, edge.target], [...txPath, edge.txId], new Set(visited));
            }
        }
    }

    const visited = new Set([sourceId]);
    dfs(sourceId, [sourceId], [], visited);
    return paths;
}

/**
 * Compute total flow (incoming / outgoing) per entity
 */
export function computeEntityFlows(entities, transactions) {
    const flows = {};
    entities.forEach(e => { flows[e.id] = { incoming: 0, outgoing: 0, net: 0, txCount: 0 }; });

    transactions.forEach(tx => {
        if (flows[tx.sourceId]) {
            flows[tx.sourceId].outgoing += tx.amount;
            flows[tx.sourceId].txCount++;
        }
        if (flows[tx.targetId]) {
            flows[tx.targetId].incoming += tx.amount;
            flows[tx.targetId].txCount++;
        }
    });

    Object.keys(flows).forEach(id => {
        flows[id].net = flows[id].incoming - flows[id].outgoing;
    });

    return flows;
}

/**
 * Detect chained transaction sequences (rapid movement)
 * Returns arrays of transaction IDs representing chains
 */
export function findTransactionChains(transactions, maxGapMs = 3600000) {
    if (transactions.length < 2) return [];

    const sorted = [...transactions].sort((a, b) => a.timestamp - b.timestamp || a.sequence - b.sequence);
    const chains = [];

    // Build entity→outgoing tx lookup
    const outgoing = {};
    sorted.forEach(tx => {
        if (!outgoing[tx.sourceId]) outgoing[tx.sourceId] = [];
        outgoing[tx.sourceId].push(tx);
    });

    const inChain = new Set();

    for (const tx of sorted) {
        if (inChain.has(tx.id)) continue;

        const chain = [tx];
        let current = tx;

        while (true) {
            const nextOptions = (outgoing[current.targetId] || []).filter(t =>
                !inChain.has(t.id) &&
                t.timestamp - current.timestamp <= maxGapMs &&
                t.timestamp >= current.timestamp
            );
            if (nextOptions.length === 0) break;
            const next = nextOptions[0];
            chain.push(next);
            current = next;
        }

        if (chain.length >= 3) {
            chain.forEach(t => inChain.add(t.id));
            chains.push(chain.map(t => t.id));
        }
    }

    return chains;
}

/**
 * Get unique jurisdiction count for a set of entity IDs
 */
export function countJurisdictions(entityIds, entities) {
    const jurisdictions = new Set();
    entities
        .filter(e => entityIds.includes(e.id))
        .forEach(e => jurisdictions.add(e.jurisdiction));
    return jurisdictions.size;
}

/**
 * Group transactions by time window
 */
export function groupByTimeWindow(transactions, windowMs = 86400000) {
    if (!transactions.length) return [];

    const sorted = [...transactions].sort((a, b) => a.timestamp - b.timestamp);
    const windows = [];
    let current = null;

    for (const tx of sorted) {
        if (!current || tx.timestamp - current.start > windowMs) {
            current = { start: tx.timestamp, end: tx.timestamp, transactions: [] };
            windows.push(current);
        }
        current.transactions.push(tx);
        current.end = tx.timestamp;
    }

    return windows;
}

export default {
    buildGraph, buildReverseGraph,
    findCycles, findPaths,
    computeDegreeCentrality, computeBetweennessCentrality,
    computeEntityFlows, findTransactionChains,
    countJurisdictions, groupByTimeWindow
};
