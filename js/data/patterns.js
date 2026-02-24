/**
 * patterns.js - Money Laundering Pattern Definitions
 * Educational content about different ML patterns
 */

export const patternDefinitions = {
    smurfing: {
        id: 'smurfing',
        name: 'Smurfing (Structuring)',
        icon: '🐢',
        description: 'Breaking large sums into smaller transactions below reporting thresholds to avoid detection.',
        severity: 'high',
        indicators: [
            'Multiple transactions just below $10,000 threshold',
            'Same source distributing to multiple destinations',
            'Transactions clustered in time (24-72 hours)',
            'Round or similar amounts',
            'Pattern of deposits followed by immediate withdrawals'
        ],
        realWorldExample: 'A drug dealer with $100,000 in cash deposits $9,500 into 11 different bank accounts over a weekend to avoid the Currency Transaction Report (CTR) filing requirement.',
        detection: {
            algorithm: 'Analyze transactions for amounts just below threshold ($10K), same source/similar targets, temporal clustering',
            threshold: 10000,
            timeWindow: 259200000, // 72 hours in milliseconds
            minTransactions: 3
        },
        prevention: 'Banks aggregate related transactions and file Suspicious Activity Reports (SARs) when patterns are detected.',
        legalConsequences: 'Structuring is a federal crime in the US, punishable by up to 5 years imprisonment and fines.',
        redFlags: [
            'Customer reluctance to provide information',
            'Nervous behavior during transactions',
            'Use of multiple people (smurfs) to conduct transactions',
            'Consistent just-below-threshold amounts'
        ]
    },

    round_tripping: {
        id: 'round_tripping',
        name: 'Round-Tripping',
        icon: '🔄',
        description: 'Moving funds through multiple entities and jurisdictions before returning to the originator.',
        severity: 'critical',
        indicators: [
            'Circular transaction paths',
            'Funds eventually return to source',
            'Multiple intermediary entities',
            'Cross-border transactions',
            'Total outflow ≈ total inflow for intermediaries'
        ],
        realWorldExample: 'Company A in the US sends $1M to offshore Company B, which sends it to Company C, which invests it back into Company A, making the money appear as foreign investment.',
        detection: {
            algorithm: 'Graph traversal to detect circular paths, compare inflow/outflow balances',
            minHops: 2,
            tolerance: 0.1 // 10% difference allowed
        },
        prevention: 'Enhanced due diligence on complex corporate structures, beneficial ownership transparency requirements.',
        legalConsequences: 'Can constitute money laundering, tax evasion, and fraud, with significant penalties.',
        redFlags: [
            'Unnecessarily complex transaction routes',
            'Funds returning to origin after layering',
            'Use of tax haven jurisdictions',
            'Minimal legitimate business purpose'
        ]
    },

    rapid_movement: {
        id: 'rapid_movement',
        name: 'Rapid Movement Chain',
        icon: '⚡',
        description: 'Quick succession of transfers through multiple entities to obscure the trail.',
        severity: 'medium',
        indicators: [
            'Transfers occurring within minutes/hours',
            '3+ entities in sequence',
            'Decreasing amounts (indicating fees)',
            'Mix of different transfer methods',
            'Cross-jurisdictional movement'
        ],
        realWorldExample: 'Funds move from Bank A to Exchange B to Company C to Bank D within 2 hours, making real-time tracking difficult.',
        detection: {
            algorithm: 'Time-series analysis for transaction clusters, identify sequential chains with short intervals',
            maxInterval: 3600000, // 1 hour in milliseconds
            minEntities: 3
        },
        prevention: 'Real-time transaction monitoring systems, international information sharing through FIUs.',
        legalConsequences: 'Evidence of intent to obscure, can support money laundering charges.',
        redFlags: [
            'Unusual speed of transactions',
            'Lack of business justification',
            'Involvement of high-risk jurisdictions',
            'Use of exchange services or crypto'
        ]
    },

    layering_complexity: {
        id: 'layering_complexity',
        name: 'Complex Layering Network',
        icon: '🕸️',
        description: 'Creating a complex web of transactions through many entities to make tracing nearly impossible.',
        severity: 'critical',
        indicators: [
            '5+ entities in transaction network',
            'Mix of entity types (shells, trusts, banks)',
            'Multiple jurisdictions involved',
            'High concentration of shell companies',
            'Nested ownership structures'
        ],
        realWorldExample: 'The 1MDB scandal involved funds moving through dozens of shell companies in multiple countries before being used to purchase luxury assets.',
        detection: {
            algorithm: 'Network analysis for complexity metrics, count unique entities and jurisdictions',
            minEntities: 5,
            complexityScore: 70
        },
        prevention: 'Beneficial ownership registries, international cooperation, AI-powered network analysis.',
        legalConsequences: 'Sophisticated laundering can result in enhanced penalties and RICO charges.',
        redFlags: [
            'Unusually complex corporate structures',
            'Use of multiple professional intermediaries',
            'Involvement of secrecy jurisdictions',
            'Lack of clear business purpose'
        ]
    },

    trade_based: {
        id: 'trade_based',
        name: 'Trade-Based Money Laundering',
        icon: '🚢',
        description: 'Using international trade to disguise illicit funds through over/under-invoicing.',
        severity: 'high',
        indicators: [
            'Import/export companies involved',
            'Unusual pricing (too high/low)',
            'Mismatched invoice and shipment values',
            'Phantom shipments (no actual goods)',
            'Frequent amendments to trade documents'
        ],
        realWorldExample: 'A drug cartel exports goods to an overseas shell company at 10% of market value, then "sells" them back at inflated prices to move value across borders.',
        detection: {
            algorithm: 'Compare invoice amounts to market prices, analyze trade patterns',
            priceVarianceThreshold: 0.3 // 30% variance
        },
        prevention: 'Customs data analysis, market price comparisons, scrutiny of free trade zones.',
        legalConsequences: 'Can involve customs fraud, money laundering, and tax evasion charges.',
        redFlags: [
            'Prices significantly different from market',
            'Trading in high-risk commodities',
            'Use of free trade zones',
            'Frequent trade with high-risk countries'
        ]
    },

    cuckoo_smurfing: {
        id: 'cuckoo_smurfing',
        name: 'Cuckoo Smurfing',
        icon: '🐦',
        description: 'Depositing illicit funds into legitimate beneficiary accounts without their knowledge.',
        severity: 'high',
        indicators: [
            'Legitimate beneficiary receiving funds',
            'Multiple deposits from unknown sources',
            'Deposits match expected international transfers',
            'Beneficiary unaware of true source',
            'Pattern: N originators → 1 beneficiary'
        ],
        realWorldExample: 'A money laundering syndicate deposits drug money into accounts of legitimate businesses expecting international payments, replacing the legitimate funds that are diverted elsewhere.',
        detection: {
            algorithm: 'Identify accounts with multiple unrelated depositors, cross-reference with expected transfers',
            minDepositors: 3,
            pattern: 'many-to-one'
        },
        prevention: 'Verification of sender identity, reconciliation of expected vs. actual transfers.',
        legalConsequences: 'Launderers face money laundering charges; beneficiaries may face scrutiny but are often unwitting.',
        redFlags: [
            'Unexpected sources for funds',
            'Amounts matching expected transfers but wrong origin',
            'Multiple cash deposits for international transfers',
            'Beneficiary surprise at deposit details'
        ]
    },

    integration_real_estate: {
        id: 'integration_real_estate',
        name: 'Real Estate Integration',
        icon: '🏘️',
        description: 'Using property purchases and sales to integrate laundered money into the legitimate economy.',
        severity: 'medium',
        indicators: [
            'Cash purchases of high-value properties',
            'Rapid buy-sell cycles',
            'Prices above market value',
            'Use of shell companies for purchase',
            'Nominee buyers'
        ],
        realWorldExample: 'A shell company buys a $5M property in cash, holds it for 6 months, then sells it for $5.2M, creating apparently legitimate proceeds.',
        detection: {
            algorithm: 'Monitor real estate transactions for cash purchases, shell company buyers, rapid flips',
            cashThreshold: 100000,
            rapidFlipDays: 180
        },
        prevention: 'Beneficial ownership disclosure in real estate, restrictions on cash purchases, professional gatekeeper regulations.',
        legalConsequences: 'Can result in asset forfeiture and money laundering charges.',
        redFlags: [
            'All-cash purchases',
            'Buyer using shell company',
            'Price not consistent with market',
            'Lack of mortgage (unusual for legitimate buyers)',
            'Rapid turnover of property'
        ]
    },

    nesting_risk: {
        id: 'nesting_risk',
        name: 'Nesting Risk',
        icon: '🪆',
        description: 'Illicit funds routed through a chain of intermediary accounts — correspondent banks, NPM Fintech entities, or shell companies — to obscure their origin before integration into the legitimate financial system.',
        severity: 'critical',
        indicators: [
            '2+ consecutive correspondent banks, NPM Fintech, or shell companies in the transaction chain',
            'Funds pass through multiple nesting-type entities before reaching a legitimate-looking beneficiary',
            'Cross-jurisdictional hops between nesting intermediaries',
            'On-behalf or nominee structures layered within the chain',
            'Little or no legitimate business purpose for the chain of intermediaries'
        ],
        realWorldExample: 'A criminal organisation routes proceeds through an NPM Fintech platform, which forwards funds to a correspondent bank in a secrecy jurisdiction, which then passes them through two offshore shell companies before the money arrives at a real estate entity — making the origin nearly impossible to trace.',
        detection: {
            algorithm: 'Graph cluster analysis: identify connected components of nesting-type entities (correspondent_bank, npm_fintech, shell_company, nominee_account, offshore_trust) with 2+ members linked by transactions',
            nestingTypes: ['correspondent_bank', 'npm_fintech', 'shell_company', 'nominee_account', 'offshore_trust'],
            minChainLength: 2
        },
        prevention: 'Correspondent banking due diligence (CBDD), transaction monitoring across nostro/vostro accounts, mandatory disclosure of beneficial ownership for all intermediaries in a payment chain.',
        legalConsequences: 'Nesting structures can constitute money laundering and breach of correspondent banking regulations, with potential de-risking (termination of banking relationships), fines, and criminal liability for complicit institutions.',
        redFlags: [
            'Multiple nesting-type entities connected in sequence',
            'Funds entering and exiting the chain with no obvious commercial rationale',
            'High-risk or secrecy jurisdictions present in the intermediary chain',
            'Use of NPM Fintech platforms alongside correspondent banks',
            'On-behalf flags on transactions within the chain'
        ]
    },

    crypto_mixing: {
        id: 'crypto_mixing',
        name: 'Cryptocurrency Mixing',
        icon: '🌀',
        description: 'Using cryptocurrency mixing services or exchanges to obscure the source of digital funds.',
        severity: 'high',
        indicators: [
            'Use of mixing/tumbling services',
            'Multiple crypto exchanges',
            'Conversion between different cryptocurrencies',
            'Use of privacy coins (Monero, Zcash)',
            'On-chain patterns suggesting mixing'
        ],
        realWorldExample: 'Stolen Bitcoin is sent through a mixing service, converted to Monero, then back to Bitcoin through a different exchange, obscuring the trail.',
        detection: {
            algorithm: 'Blockchain analysis for mixing patterns, exchange surveillance',
            mixingServices: ['tornado_cash', 'wasabi_wallet', 'samourai'],
            privacyCoins: ['monero', 'zcash', 'dash']
        },
        prevention: 'Blockchain analytics, exchange compliance programs, regulations on mixing services.',
        legalConsequences: 'Using mixers for illicit funds can support money laundering charges.',
        redFlags: [
            'Use of known mixing services',
            'Multiple conversions between currencies',
            'Use of privacy-focused cryptocurrencies',
            'Withdrawal to unhosted wallets',
            'Layered exchange transactions'
        ]
    }
};

/**
 * Get pattern definition by ID
 */
export function getPatternDefinition(id) {
    return patternDefinitions[id];
}

/**
 * Get all pattern definitions as array
 */
export function getAllPatterns() {
    return Object.values(patternDefinitions);
}

/**
 * Get patterns by severity
 */
export function getPatternsBySeverity(severity) {
    return Object.values(patternDefinitions).filter(p => p.severity === severity);
}

export default patternDefinitions;
