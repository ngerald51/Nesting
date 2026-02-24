/**
 * riskScoring.js - Multi-Factor Risk Scoring Engine
 */

import Config from '../config.js';
import { computeDegreeCentrality, computeBetweennessCentrality, computeEntityFlows } from './graphAnalysis.js';
import { getEntityType } from '../data/entityTypes.js';
import { getJurisdiction } from '../data/jurisdictions.js';

const W = Config.risk.weights;

/**
 * Score a single entity.
 * Returns { overallScore, riskLevel, factors[] }
 */
export function scoreEntity(entity, simulation) {
    const entities = Array.from(simulation.entities.values());
    const transactions = Array.from(simulation.transactions.values());

    const factors = [
        calcJurisdictionFactor(entity),
        calcEntityTypeFactor(entity),
        calcTransactionVolumeFactor(entity, transactions),
        calcNetworkFactor(entity, entities, transactions),
        calcPatternFactor(entity, simulation.metadata.detectedPatterns || [])
    ];

    const overallScore = factors.reduce((sum, f) => sum + f.raw * f.weight, 0);
    const clamped = Math.min(100, Math.max(0, Math.round(overallScore)));

    return {
        subjectId: entity.id,
        overallScore: clamped,
        riskLevel: getRiskLevel(clamped),
        factors: factors.map(f => ({
            category:    f.category,
            contribution: Math.round(f.raw * f.weight),
            description: f.description
        }))
    };
}

/**
 * Score all entities and return Map<entityId, profile>
 */
export function scoreAll(simulation) {
    const results = new Map();
    simulation.entities.forEach(entity => {
        results.set(entity.id, scoreEntity(entity, simulation));
    });
    return results;
}

/**
 * Jurisdiction risk factor (weight: 30%)
 */
function calcJurisdictionFactor(entity) {
    const jur = getJurisdiction(entity.jurisdiction);
    let raw = 50; // default if unknown
    let description = `Jurisdiction: ${entity.jurisdiction} (unknown)`;

    if (jur) {
        raw = jur.getRiskScore();
        description = `${jur.name} — ${jur.fatfRating.toUpperCase()} FATF rating`;
        if (jur.sanctioned) description += ', sanctioned';
        if (jur.isTaxHaven()) description += ', tax haven';
    }

    return { category: 'Jurisdiction', raw, weight: W.jurisdiction, description };
}

/**
 * Entity type inherent risk factor (weight: 25%)
 */
function calcEntityTypeFactor(entity) {
    const typeDef = getEntityType(entity.type);
    const raw = typeDef ? typeDef.baseRisk : 50;
    const description = typeDef
        ? `${typeDef.name} — inherent risk ${typeDef.baseRisk}/100`
        : `Unknown entity type (${entity.type})`;

    return { category: 'Entity Type', raw, weight: W.entityType, description };
}

/**
 * Transaction volume / velocity factor (weight: 20%)
 */
function calcTransactionVolumeFactor(entity, transactions) {
    const REPORTING_THRESHOLD = Config.risk.structuringThreshold;
    const TOLERANCE = Config.risk.structuringTolerance;

    const txns = transactions.filter(t => t.sourceId === entity.id || t.targetId === entity.id);
    if (txns.length === 0) return { category: 'Transaction Volume', raw: 0, weight: W.transactionVolume, description: 'No transactions' };

    const totalAmount = txns.reduce((s, t) => s + t.amount, 0);
    const avgAmount = totalAmount / txns.length;

    let raw = 0;
    const flags = [];

    // High total volume
    if (totalAmount > 10_000_000) { raw += 30; flags.push('Total flow >$10M'); }
    else if (totalAmount > 1_000_000) { raw += 20; flags.push('Total flow >$1M'); }
    else if (totalAmount > 100_000)  { raw += 10; flags.push('Total flow >$100K'); }

    // Structuring (smurfing) indicator
    const structured = txns.filter(t =>
        t.amount < REPORTING_THRESHOLD &&
        t.amount >= REPORTING_THRESHOLD * (1 - TOLERANCE)
    );
    if (structured.length >= 3) { raw += 35; flags.push(`${structured.length} transactions near threshold`); }
    else if (structured.length >= 1) { raw += 15; flags.push('Near-threshold transaction'); }

    // Round amounts
    const roundAmounts = txns.filter(t => t.amount > 0 && t.amount % 1000 === 0);
    if (roundAmounts.length / txns.length > 0.6) { raw += 15; flags.push('Mostly round amounts'); }

    // High frequency
    if (txns.length > 20) { raw += 20; flags.push(`${txns.length} transactions`); }
    else if (txns.length > 10) { raw += 10; flags.push(`${txns.length} transactions`); }

    raw = Math.min(100, raw);
    const description = flags.length ? flags.join('; ') : 'Normal transaction volume';

    return { category: 'Transaction Volume', raw, weight: W.transactionVolume, description };
}

/**
 * Network centrality factor (weight: 15%)
 */
function calcNetworkFactor(entity, entities, transactions) {
    const degree = computeDegreeCentrality(entities, transactions);
    const betweenness = computeBetweennessCentrality(entities, transactions);

    const d = degree[entity.id] || { in: 0, out: 0, total: 0 };
    const b = betweenness[entity.id] || 0;

    let raw = 0;
    const flags = [];

    // High degree = many counterparties
    if (d.total > 10) { raw += 30; flags.push(`${d.total} counterparties`); }
    else if (d.total > 5) { raw += 15; flags.push(`${d.total} counterparties`); }

    // Hub/intermediary (both incoming and outgoing)
    if (d.in > 0 && d.out > 0) { raw += 20; flags.push('Intermediary node'); }

    // High betweenness centrality = critical bridge
    if (b > 0.3) { raw += 30; flags.push('Critical network bridge'); }
    else if (b > 0.1) { raw += 15; flags.push('Network bridge'); }

    raw = Math.min(100, raw);
    const description = flags.length ? flags.join('; ') : 'Low network centrality';

    return { category: 'Network Position', raw, weight: W.networkCentrality, description };
}

/**
 * Pattern involvement factor (weight: 10%)
 */
function calcPatternFactor(entity, detectedPatterns) {
    if (!detectedPatterns || detectedPatterns.length === 0) {
        return { category: 'Pattern Involvement', raw: 0, weight: W.patternInvolvement, description: 'No patterns detected yet' };
    }

    const involved = detectedPatterns.filter(p => p.entities && p.entities.includes(entity.id));
    if (involved.length === 0) {
        return { category: 'Pattern Involvement', raw: 0, weight: W.patternInvolvement, description: 'Not involved in patterns' };
    }

    const severityScores = { low: 25, medium: 50, high: 75, critical: 100 };
    const maxRaw = Math.max(...involved.map(p => severityScores[p.severity] || 50));
    const names = involved.map(p => p.type).join(', ');

    return {
        category: 'Pattern Involvement',
        raw: maxRaw,
        weight: W.patternInvolvement,
        description: `Involved in: ${names}`
    };
}

/**
 * Map numeric score to risk level label
 */
export function getRiskLevel(score) {
    const { thresholds } = Config.risk;
    if (score >= thresholds.critical[0]) return 'critical';
    if (score >= thresholds.high[0])     return 'high';
    if (score >= thresholds.medium[0])   return 'medium';
    return 'low';
}

export default { scoreEntity, scoreAll, getRiskLevel };
