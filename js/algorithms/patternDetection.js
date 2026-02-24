/**
 * patternDetection.js - AML Pattern Detection Algorithms
 */

import Config from '../config.js';
import {
    findCycles, findTransactionChains, groupByTimeWindow,
    computeDegreeCentrality, buildGraph
} from './graphAnalysis.js';

/**
 * Run all detectors and return array of pattern results
 */
export function detectAll(simulation) {
    const entities = Array.from(simulation.entities.values());
    const transactions = Array.from(simulation.transactions.values());

    if (entities.length === 0 || transactions.length === 0) return [];

    const results = [
        ...detectSmurfing(entities, transactions),
        ...detectRoundTripping(entities, transactions),
        ...detectRapidMovement(entities, transactions),
        ...detectLayeringComplexity(entities, transactions),
        ...detectNestedShells(entities, transactions),
        ...detectCuckooSmurfing(entities, transactions),
        ...detectCryptoMixing(entities, transactions),
        ...detectNestingRisk(entities, transactions)
    ];

    // Deduplicate patterns of the same type affecting the same entities
    return deduplicatePatterns(results);
}

/* ---- Individual detectors ---- */

/**
 * Smurfing / Structuring
 * Multiple transactions just below the reporting threshold
 */
function detectSmurfing(entities, transactions) {
    const threshold = Config.risk.structuringThreshold;
    const tolerance = Config.risk.structuringTolerance;
    const lowerBound = threshold * (1 - tolerance);
    const patterns = [];

    entities.forEach(entity => {
        const outgoing = transactions.filter(t => t.sourceId === entity.id);
        const windows = groupByTimeWindow(outgoing, 259200000); // 72h window

        windows.forEach(window => {
            const structured = window.transactions.filter(t =>
                t.amount >= lowerBound && t.amount < threshold
            );
            if (structured.length >= 3) {
                const total = structured.reduce((s, t) => s + t.amount, 0);
                patterns.push({
                    type: 'smurfing',
                    severity: structured.length >= 6 ? 'critical' : 'high',
                    description: `${structured.length} transactions just below $${threshold.toLocaleString()} — total $${total.toLocaleString()}`,
                    entities: [entity.id],
                    transactions: structured.map(t => t.id)
                });
            }
        });
    });

    return patterns;
}

/**
 * Round-Tripping
 * Funds return to the original entity via circular paths
 */
function detectRoundTripping(entities, transactions) {
    const cycles = findCycles(entities, transactions, 8);
    const patterns = [];

    for (const cycle of cycles) {
        if (cycle.entities.length < 3) continue;

        // Find the transactions that belong to this cycle
        const cycleTxs = transactions.filter(t =>
            cycle.transactions.includes(t.id)
        );

        if (cycleTxs.length === 0) continue;

        const firstAmount = cycleTxs[0]?.amount || 0;
        const lastAmount  = cycleTxs[cycleTxs.length - 1]?.amount || 0;
        const loss = Math.abs(firstAmount - lastAmount);
        const lossPercent = firstAmount > 0 ? (loss / firstAmount) * 100 : 0;

        // Only flag if amounts are similar (within 30% loss)
        if (lossPercent <= 30 && firstAmount > 0) {
            patterns.push({
                type: 'round_tripping',
                severity: lossPercent < 10 ? 'critical' : 'high',
                description: `Circular flow through ${cycle.entities.length} entities, ${lossPercent.toFixed(1)}% loss`,
                entities: [...cycle.entities],
                transactions: [...cycle.transactions]
            });
        }
    }

    return patterns;
}

/**
 * Rapid Movement (Layering Chain)
 * Quick succession of transfers through 3+ entities
 */
function detectRapidMovement(entities, transactions) {
    const chains = findTransactionChains(transactions, 3600000); // 1h gap
    const patterns = [];

    for (const chainTxIds of chains) {
        const chainTxs = chainTxIds.map(id => transactions.find(t => t.id === id)).filter(Boolean);
        if (chainTxs.length < 3) continue;

        const entityIds = [];
        chainTxs.forEach(t => {
            if (!entityIds.includes(t.sourceId)) entityIds.push(t.sourceId);
            if (!entityIds.includes(t.targetId)) entityIds.push(t.targetId);
        });

        const spanMs = chainTxs[chainTxs.length - 1].timestamp - chainTxs[0].timestamp;
        const spanMin = Math.round(spanMs / 60000);

        patterns.push({
            type: 'rapid_movement',
            severity: chainTxs.length >= 5 ? 'high' : 'medium',
            description: `${chainTxs.length} linked transfers in ${spanMin} min through ${entityIds.length} entities`,
            entities: entityIds,
            transactions: chainTxIds
        });
    }

    return patterns;
}

/**
 * Layering Complexity
 * Network of 5+ entities spanning multiple jurisdictions with heavy shell company use
 */
function detectLayeringComplexity(entities, transactions) {
    if (entities.length < 5) return [];
    const patterns = [];

    // Shell company ratio
    const shells = entities.filter(e => e.type === 'shell_company');
    const shellRatio = shells.length / entities.length;

    // Jurisdiction spread
    const jurisdictions = new Set(entities.map(e => e.jurisdiction));

    // Connected components (only if all entities are in one graph)
    const degree = computeDegreeCentrality(entities, transactions);
    const connectedEntities = entities.filter(e => (degree[e.id]?.total || 0) > 0);

    const complexityScore =
        (connectedEntities.length >= 5 ? 30 : 0) +
        (jurisdictions.size >= 3 ? 25 : jurisdictions.size >= 2 ? 10 : 0) +
        (shellRatio >= 0.5 ? 25 : shellRatio >= 0.3 ? 10 : 0) +
        (transactions.length >= 8 ? 20 : transactions.length >= 5 ? 10 : 0);

    if (complexityScore >= 50) {
        patterns.push({
            type: 'layering_complexity',
            severity: complexityScore >= 80 ? 'critical' : 'high',
            description: `Complex network: ${connectedEntities.length} entities, ${jurisdictions.size} jurisdictions, ${shells.length} shell companies`,
            entities: connectedEntities.map(e => e.id),
            transactions: transactions.map(t => t.id)
        });
    }

    return patterns;
}

/**
 * Nested Shell Companies
 * Shell companies directly connected to other shell companies
 */
function detectNestedShells(entities, transactions) {
    const patterns = [];
    const shells = entities.filter(e => e.type === 'shell_company');
    const shellIds = new Set(shells.map(e => e.id));

    shells.forEach(shell => {
        const linkedShells = transactions
            .filter(t => (t.sourceId === shell.id || t.targetId === shell.id))
            .map(t => t.sourceId === shell.id ? t.targetId : t.sourceId)
            .filter(id => shellIds.has(id) && id !== shell.id);

        const unique = [...new Set(linkedShells)];
        if (unique.length >= 2) {
            const involvedTxs = transactions
                .filter(t =>
                    (t.sourceId === shell.id || t.targetId === shell.id) &&
                    (shellIds.has(t.sourceId) || shellIds.has(t.targetId))
                )
                .map(t => t.id);

            patterns.push({
                type: 'layering_complexity',
                severity: 'high',
                description: `Shell company connected to ${unique.length} other shell companies`,
                entities: [shell.id, ...unique],
                transactions: involvedTxs
            });
        }
    });

    return patterns;
}

/**
 * Cuckoo Smurfing
 * Multiple originators depositing to a single legitimate-looking beneficiary
 */
function detectCuckooSmurfing(entities, transactions) {
    const patterns = [];
    const threshold = Config.risk.structuringThreshold;

    entities.forEach(entity => {
        const incoming = transactions.filter(t => t.targetId === entity.id);
        if (incoming.length < 3) return;

        // Multiple distinct sources
        const sources = new Set(incoming.map(t => t.sourceId));
        if (sources.size < 3) return;

        // Each below threshold
        const belowThreshold = incoming.filter(t => t.amount < threshold);
        if (belowThreshold.length < 3) return;

        // Compressed in time (72h)
        const windows = groupByTimeWindow(belowThreshold, 259200000);
        for (const window of windows) {
            const windowSources = new Set(window.transactions.map(t => t.sourceId));
            if (windowSources.size >= 3) {
                const total = window.transactions.reduce((s, t) => s + t.amount, 0);
                patterns.push({
                    type: 'cuckoo_smurfing',
                    severity: 'high',
                    description: `${windowSources.size} sources depositing ${window.transactions.length} sub-threshold amounts totalling $${total.toLocaleString()}`,
                    entities: [entity.id, ...windowSources],
                    transactions: window.transactions.map(t => t.id)
                });
                break;
            }
        }
    });

    return patterns;
}

/**
 * Cryptocurrency Mixing
 * Crypto exchange with many-to-many flows (multiple in, multiple out ≈ same total)
 */
function detectCryptoMixing(entities, transactions) {
    const patterns = [];
    const cryptoExchanges = entities.filter(e => e.type === 'crypto_exchange');

    cryptoExchanges.forEach(exchange => {
        const incoming = transactions.filter(t => t.targetId === exchange.id);
        const outgoing = transactions.filter(t => t.sourceId === exchange.id);

        if (incoming.length < 2 || outgoing.length < 2) return;

        const totalIn  = incoming.reduce((s, t) => s + t.amount, 0);
        const totalOut = outgoing.reduce((s, t) => s + t.amount, 0);
        const diff = Math.abs(totalIn - totalOut);

        if (totalIn > 0 && diff / totalIn < 0.15) {   // within 15%
            const involvedEntities = [
                exchange.id,
                ...new Set([...incoming.map(t => t.sourceId), ...outgoing.map(t => t.targetId)])
            ];
            patterns.push({
                type: 'crypto_mixing',
                severity: 'medium',
                description: `Crypto exchange: ${incoming.length} inputs, ${outgoing.length} outputs — total $${totalIn.toLocaleString()}`,
                entities: involvedEntities,
                transactions: [...incoming.map(t => t.id), ...outgoing.map(t => t.id)]
            });
        }
    });

    return patterns;
}

/**
 * Nesting Risk
 * Funds routed through a chain of correspondent banks, NPM Fintech entities,
 * or shell/nominee/offshore structures to obscure origin before integration.
 */
function detectNestingRisk(entities, transactions) {
    const NESTING_TYPES = new Set([
        'correspondent_bank', 'npm_fintech', 'shell_company',
        'nominee_account', 'offshore_trust'
    ]);
    const entityMap = new Map(entities.map(e => [e.id, e]));
    const nestingIds = new Set(
        entities.filter(e => NESTING_TYPES.has(e.type)).map(e => e.id)
    );

    if (nestingIds.size < 2) return [];

    const patterns = [];
    const visited = new Set();

    for (const startId of nestingIds) {
        if (visited.has(startId)) continue;

        // BFS to find the connected component of nesting-type entities
        const chain = [];
        const queue = [startId];
        visited.add(startId);

        while (queue.length > 0) {
            const curr = queue.shift();
            chain.push(curr);

            for (const tx of transactions) {
                const neighbor =
                    tx.sourceId === curr ? tx.targetId :
                    tx.targetId === curr ? tx.sourceId : null;
                if (neighbor && nestingIds.has(neighbor) && !visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                }
            }
        }

        if (chain.length < 2) continue;

        // Gather all transactions touching this chain; classify entry/exit entities
        const chainSet = new Set(chain);
        const feeders   = new Set();
        const receivers = new Set();
        const chainTxIds = [];

        for (const tx of transactions) {
            const srcIn = chainSet.has(tx.sourceId);
            const tgtIn = chainSet.has(tx.targetId);
            if (srcIn || tgtIn) chainTxIds.push(tx.id);
            if (!srcIn && tgtIn) feeders.add(tx.sourceId);
            if (srcIn && !tgtIn) receivers.add(tx.targetId);
        }

        const typeNames = [...new Set(
            chain.map(id => {
                const type = entityMap.get(id)?.type || '';
                return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            })
        )];

        patterns.push({
            type: 'nesting_risk',
            severity: chain.length >= 3 ? 'critical' : 'high',
            description: `${chain.length} connected intermediaries (${typeNames.join(', ')}) forming a nesting chain to layer funds before integration`,
            entities: [...chain, ...feeders, ...receivers],
            transactions: chainTxIds
        });
    }

    return patterns;
}

/* ---- Helpers ---- */

function deduplicatePatterns(patterns) {
    const seen = new Set();
    return patterns.filter(p => {
        const key = p.type + ':' + [...p.entities].sort().join(',');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

export default { detectAll };
