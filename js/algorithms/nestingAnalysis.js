/**
 * nestingAnalysis.js - Core Nesting Analysis Algorithms
 * Implements BFS hop distance, nesting classification, impermissible pair detection,
 * double nesting chain detection, affiliate flow detection, and multi-NPM cluster detection.
 */

const IMPERMISSIBLE_PAIRS = [
    ['npm_fintech', 'money_service_business'],
    ['bank',        'money_service_business']
];

/**
 * BFS from all isBank===true nodes through undirected transaction graph.
 * Returns Map<entityId, number> — unreachable entities get Infinity.
 */
export function computeHopMap(entities, transactions) {
    const hopMap = new Map();
    const queue  = [];

    // Seed BFS from all bank anchors
    entities.forEach(e => {
        if (e.isBank) {
            hopMap.set(e.id, 0);
            queue.push(e.id);
        }
    });

    // Build adjacency list (undirected)
    const adj = new Map();
    entities.forEach(e => adj.set(e.id, []));
    transactions.forEach(tx => {
        if (adj.has(tx.sourceId) && adj.has(tx.targetId)) {
            adj.get(tx.sourceId).push(tx.targetId);
            adj.get(tx.targetId).push(tx.sourceId);
        }
    });

    // BFS
    let head = 0;
    while (head < queue.length) {
        const curr = queue[head++];
        const dist = hopMap.get(curr);
        (adj.get(curr) || []).forEach(neighbor => {
            if (!hopMap.has(neighbor)) {
                hopMap.set(neighbor, dist + 1);
                queue.push(neighbor);
            }
        });
    }

    // Mark unreachable
    entities.forEach(e => {
        if (!hopMap.has(e.id)) hopMap.set(e.id, Infinity);
    });

    return hopMap;
}

/**
 * Classify the overall nesting type for this simulation.
 * Priority: impermissible > double (any hop>=3) > affiliate > primary > null
 */
export function classifyNestingType(entities, transactions, hopMap) {
    const impermissible = detectImpermissiblePairs(entities, transactions);
    if (impermissible.length > 0) return 'impermissible';

    const doubleChains = detectDoubleNestingChains(entities, transactions, hopMap);
    if (doubleChains.length > 0) return 'double';

    // Affiliate only counts if the entity is actually connected in the transaction graph.
    const txEntityIds = new Set(transactions.flatMap(tx => [tx.sourceId, tx.targetId]));
    const hasAffiliate = entities.some(e => e.type === 'affiliate' && txEntityIds.has(e.id));
    if (hasAffiliate) return 'affiliate';

    // Primary: bank→npm_fintech→nested_fi→end_customer
    const paths = detectPrimaryNestingPaths(entities, transactions, hopMap);
    if (paths.length > 0) return 'primary';

    return null;
}

/**
 * Detect transactions connecting an npm_fintech/bank to a money_service_business.
 * Returns [{ txId, sourceId, targetId, reason }]
 */
export function detectImpermissiblePairs(entities, transactions) {
    const entityMap = new Map(entities.map(e => [e.id, e]));
    const results   = [];

    transactions.forEach(tx => {
        const src = entityMap.get(tx.sourceId);
        const tgt = entityMap.get(tx.targetId);
        if (!src || !tgt) return;

        for (const [typeA, typeB] of IMPERMISSIBLE_PAIRS) {
            const match =
                (src.type === typeA && tgt.type === typeB) ||
                (src.type === typeB && tgt.type === typeA);
            if (match) {
                results.push({
                    txId:     tx.id,
                    sourceId: tx.sourceId,
                    targetId: tx.targetId,
                    reason:   `Impermissible connection: ${src.type} ↔ ${tgt.type}`
                });
            }
        }
    });

    return results;
}

/**
 * Detect clusters of entities with hopDistance >= 3 (double nesting chains).
 * Returns array of entity-ID arrays (connected subgraphs at hop >= 3).
 */
export function detectDoubleNestingChains(entities, transactions, hopMap) {
    // Infinity hop (unreachable from any BANK anchor) must NOT be treated as double-nesting.
    // Only finite hop distances >= 3 qualify.
    const doubleIds = new Set(
        entities
            .filter(e => { const h = hopMap.get(e.id) ?? Infinity; return isFinite(h) && h >= 3; })
            .map(e => e.id)
    );
    if (doubleIds.size === 0) return [];

    const chains  = [];
    const visited = new Set();

    doubleIds.forEach(startId => {
        if (visited.has(startId)) return;
        const chain = [];
        const queue = [startId];
        visited.add(startId);

        while (queue.length > 0) {
            const curr = queue.shift();
            chain.push(curr);

            transactions.forEach(tx => {
                const neighbor =
                    tx.sourceId === curr ? tx.targetId :
                    tx.targetId === curr ? tx.sourceId : null;
                if (neighbor && doubleIds.has(neighbor) && !visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                }
            });
        }

        if (chain.length > 0) chains.push(chain);
    });

    return chains;
}

/**
 * Detect affiliate entity flows.
 * Returns { hasAffiliate: bool, affiliateChains: entityId[][] }
 */
export function detectAffiliateFlow(entities, transactions) {
    const affiliates = entities.filter(e => e.type === 'affiliate');
    if (affiliates.length === 0) return { hasAffiliate: false, affiliateChains: [] };

    // Only consider affiliates that participate in at least one transaction.
    const txEntityIds = new Set(transactions.flatMap(tx => [tx.sourceId, tx.targetId]));
    const connectedAffiliates = affiliates.filter(e => txEntityIds.has(e.id));
    if (connectedAffiliates.length === 0) return { hasAffiliate: false, affiliateChains: [] };

    const affiliateIds = new Set(connectedAffiliates.map(e => e.id));
    const chains       = [];
    const visited      = new Set();

    affiliateIds.forEach(startId => {
        if (visited.has(startId)) return;
        const chain = [];
        const queue = [startId];
        visited.add(startId);

        while (queue.length > 0) {
            const curr = queue.shift();
            chain.push(curr);

            transactions.forEach(tx => {
                const neighbor =
                    tx.sourceId === curr ? tx.targetId :
                    tx.targetId === curr ? tx.sourceId : null;
                if (neighbor && !visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                }
            });
        }

        chains.push(chain);
    });

    return { hasAffiliate: true, affiliateChains: chains };
}

/**
 * Detect clusters where the same downstream entity appears 2 hops below 2+ different NPMs.
 * Returns entityId[][] — each sub-array contains the NPM IDs sharing a common downstream entity.
 */
export function detectMultiNpmClusters(entities, transactions) {
    const npmIds = entities
        .filter(e => e.type === 'npm_fintech')
        .map(e => e.id);

    if (npmIds.length < 2) return [];

    // Build adjacency (directed)
    const outAdj = new Map();
    entities.forEach(e => outAdj.set(e.id, []));
    transactions.forEach(tx => {
        if (outAdj.has(tx.sourceId)) outAdj.get(tx.sourceId).push(tx.targetId);
    });

    // Get 2-hop downstream set per NPM
    const npmDownstream = new Map();
    npmIds.forEach(npmId => {
        const seen = new Set();
        // 1-hop
        (outAdj.get(npmId) || []).forEach(hop1 => {
            seen.add(hop1);
            // 2-hop
            (outAdj.get(hop1) || []).forEach(hop2 => seen.add(hop2));
        });
        npmDownstream.set(npmId, seen);
    });

    // Find NPMs that share common downstream entities
    const clusters = [];
    const processedNpms = new Set();

    for (let i = 0; i < npmIds.length; i++) {
        for (let j = i + 1; j < npmIds.length; j++) {
            const a = npmIds[i], b = npmIds[j];
            const dA = npmDownstream.get(a);
            const dB = npmDownstream.get(b);

            // Check if any downstream entity appears in both
            let shared = false;
            for (const id of dA) {
                if (dB.has(id)) { shared = true; break; }
            }

            if (shared) {
                // Merge into existing cluster or create new one
                let merged = false;
                for (const cluster of clusters) {
                    if (cluster.includes(a) || cluster.includes(b)) {
                        if (!cluster.includes(a)) cluster.push(a);
                        if (!cluster.includes(b)) cluster.push(b);
                        merged = true;
                        break;
                    }
                }
                if (!merged) clusters.push([a, b]);
            }
        }
    }

    return clusters;
}

/**
 * Compute permissibility status per entity.
 * Returns Map<entityId, 'permissible'|'impermissible'|'review_required'>
 */
export function computePermissibilityByEntity(entities, hopMap, impermissiblePairs, doubleChains) {
    const impermissibleEntityIds = new Set();
    impermissiblePairs.forEach(pair => {
        impermissibleEntityIds.add(pair.sourceId);
        impermissibleEntityIds.add(pair.targetId);
    });

    const doubleChainIds = new Set(doubleChains.flat());

    const result = new Map();

    entities.forEach(e => {
        if (impermissibleEntityIds.has(e.id)) {
            result.set(e.id, 'impermissible');
        } else if (doubleChainIds.has(e.id)) {
            // Same group AML/CTF exception (F-10)
            result.set(e.id, e.sameGroupAmlCtf ? 'permissible' : 'impermissible');
        } else if (e.type === 'affiliate') {
            result.set(e.id, 'review_required');
        } else {
            result.set(e.id, 'permissible');
        }
    });

    return result;
}

/**
 * Detect primary nesting paths: bank(hop0)→npm_fintech(hop1)→nested_fi(hop2)→end_customer(hop3).
 * Returns [{ entities:[...], transactions:[...] }]
 */
export function detectPrimaryNestingPaths(entities, transactions, hopMap) {
    const entityMap = new Map(entities.map(e => [e.id, e]));
    const paths     = [];

    // Find all bank entities (hop 0)
    const banks = entities.filter(e => e.isBank);

    banks.forEach(bank => {
        // BFS from bank following outgoing edges, looking for the hop sequence
        const queue = [{ entityId: bank.id, path: [bank.id], txPath: [], hop: 0 }];

        while (queue.length > 0) {
            const { entityId, path, txPath, hop } = queue.shift();
            if (hop >= 3) continue;

            transactions
                .filter(tx => tx.sourceId === entityId)
                .forEach(tx => {
                    const nextId  = tx.targetId;
                    const nextHop = hopMap.get(nextId);
                    if (nextHop === undefined || nextHop !== hop + 1) return;
                    if (path.includes(nextId)) return;  // no cycles

                    const newPath   = [...path, nextId];
                    const newTxPath = [...txPath, tx.id];

                    // Check if we've reached hop 3 (end customer level)
                    if (hop + 1 === 3) {
                        paths.push({ entities: newPath, transactions: newTxPath });
                    } else {
                        queue.push({ entityId: nextId, path: newPath, txPath: newTxPath, hop: hop + 1 });
                    }
                });
        }
    });

    return paths;
}

/**
 * Run complete nesting analysis.
 * Stores result in simulation.metadata.nestingAnalysis and returns it.
 */
export function runNestingAnalysis(simulation) {
    const entities     = Array.from(simulation.entities.values());
    const transactions = Array.from(simulation.transactions.values());

    if (entities.length === 0) {
        const empty = {
            hopMap:                new Map(),
            nestingType:           null,
            doubleNestingChains:   [],
            impermissiblePairs:    [],
            multiNpmClusters:      [],
            primaryNestingPaths:   [],
            affiliateFlow:         { hasAffiliate: false, affiliateChains: [] },
            permissibilityByEntity:new Map(),
            cddGapCount:           0
        };
        simulation.metadata.nestingAnalysis = empty;
        return empty;
    }

    const hopMap              = computeHopMap(entities, transactions);
    const impermissiblePairs  = detectImpermissiblePairs(entities, transactions);
    const doubleNestingChains = detectDoubleNestingChains(entities, transactions, hopMap);
    const affiliateFlow       = detectAffiliateFlow(entities, transactions);
    const multiNpmClusters    = detectMultiNpmClusters(entities, transactions);
    const primaryNestingPaths = detectPrimaryNestingPaths(entities, transactions, hopMap);
    const permissibilityByEntity = computePermissibilityByEntity(
        entities, hopMap, impermissiblePairs, doubleNestingChains
    );
    const nestingType = classifyNestingType(entities, transactions, hopMap);

    // CDD gap count: entities at a finite hop >= 2 (unreachable entities excluded)
    const cddGapCount = entities.filter(e => { const h = hopMap.get(e.id) ?? Infinity; return isFinite(h) && h >= 2; }).length;

    const result = {
        hopMap,
        nestingType,
        doubleNestingChains,
        impermissiblePairs,
        multiNpmClusters,
        primaryNestingPaths,
        affiliateFlow,
        permissibilityByEntity,
        cddGapCount
    };

    simulation.metadata.nestingAnalysis = result;
    return result;
}

export default {
    computeHopMap,
    classifyNestingType,
    detectImpermissiblePairs,
    detectDoubleNestingChains,
    detectAffiliateFlow,
    detectMultiNpmClusters,
    computePermissibilityByEntity,
    detectPrimaryNestingPaths,
    runNestingAnalysis
};
