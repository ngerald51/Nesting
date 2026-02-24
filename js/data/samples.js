/**
 * samples.js - Sample Simulation Scenarios
 * Pre-built examples demonstrating different money laundering patterns
 */

export const sampleScenarios = [
    {
        id: 'basic-smurfing',
        name: 'Basic Smurfing Example',
        description: 'Simple structuring pattern showing multiple small deposits to avoid reporting thresholds',
        difficulty: 'beginner',
        pattern: 'smurfing',
        entities: [
            {
                type: 'originator',
                name: 'Criminal Organization',
                jurisdiction: 'US',
                position: { x: 200, y: 400 },
                metadata: {
                    businessType: 'Drug Trafficking',
                    owner: 'Unknown'
                }
            },
            {
                type: 'cash_intensive_business',
                name: 'Restaurant A',
                jurisdiction: 'US',
                position: { x: 600, y: 250 },
                metadata: {
                    businessType: 'Italian Restaurant',
                    owner: 'Front LLC'
                }
            },
            {
                type: 'cash_intensive_business',
                name: 'Restaurant B',
                jurisdiction: 'US',
                position: { x: 600, y: 400 },
                metadata: {
                    businessType: 'Steakhouse',
                    owner: 'Front LLC'
                }
            },
            {
                type: 'cash_intensive_business',
                name: 'Car Wash C',
                jurisdiction: 'US',
                position: { x: 600, y: 550 },
                metadata: {
                    businessType: 'Automated Car Wash',
                    owner: 'Clean Auto Inc'
                }
            },
            {
                type: 'final_beneficiary',
                name: 'Legitimate Account',
                jurisdiction: 'US',
                position: { x: 1000, y: 400 },
                metadata: {
                    businessType: 'Personal Account',
                    owner: 'John Doe'
                }
            }
        ],
        transactions: [
            {
                sourceIndex: 0,
                targetIndex: 1,
                amount: 9500,
                timestamp: 0,
                method: 'cash',
                description: 'Cash deposit - below CTR threshold',
                sequence: 1
            },
            {
                sourceIndex: 0,
                targetIndex: 2,
                amount: 9200,
                timestamp: 3600000, // 1 hour later
                method: 'cash',
                description: 'Cash deposit - below CTR threshold',
                sequence: 2
            },
            {
                sourceIndex: 0,
                targetIndex: 3,
                amount: 9800,
                timestamp: 7200000, // 2 hours later
                method: 'cash',
                description: 'Cash deposit - below CTR threshold',
                sequence: 3
            },
            {
                sourceIndex: 1,
                targetIndex: 4,
                amount: 9500,
                timestamp: 86400000, // 24 hours later
                method: 'wire_transfer',
                description: '"Business revenue" transfer',
                sequence: 4
            },
            {
                sourceIndex: 2,
                targetIndex: 4,
                amount: 9200,
                timestamp: 86400000,
                method: 'wire_transfer',
                description: '"Business revenue" transfer',
                sequence: 5
            },
            {
                sourceIndex: 3,
                targetIndex: 4,
                amount: 9800,
                timestamp: 86400000,
                method: 'wire_transfer',
                description: '"Business revenue" transfer',
                sequence: 6
            }
        ]
    },

    {
        id: 'shell-company-layering',
        name: 'Shell Company Network',
        description: 'Complex layering through multiple shell companies across different jurisdictions',
        difficulty: 'intermediate',
        pattern: 'layering_complexity',
        entities: [
            {
                type: 'originator',
                name: 'Corrupt Official',
                jurisdiction: 'NG',
                position: { x: 150, y: 400 }
            },
            {
                type: 'shell_company',
                name: 'Alpha Holdings Ltd',
                jurisdiction: 'KY',
                position: { x: 450, y: 250 }
            },
            {
                type: 'shell_company',
                name: 'Beta Investments SA',
                jurisdiction: 'PA',
                position: { x: 450, y: 400 }
            },
            {
                type: 'shell_company',
                name: 'Gamma Trading AG',
                jurisdiction: 'CH',
                position: { x: 450, y: 550 }
            },
            {
                type: 'offshore_trust',
                name: 'Delta Family Trust',
                jurisdiction: 'LI',
                position: { x: 750, y: 325 }
            },
            {
                type: 'nominee_account',
                name: 'Professional Services Account',
                jurisdiction: 'LU',
                position: { x: 750, y: 475 }
            },
            {
                type: 'real_estate',
                name: 'Luxury Property LLC',
                jurisdiction: 'GB',
                position: { x: 1050, y: 400 }
            }
        ],
        transactions: [
            { sourceIndex: 0, targetIndex: 1, amount: 2000000, timestamp: 0, method: 'wire_transfer', description: 'Bribe proceeds', sequence: 1 },
            { sourceIndex: 0, targetIndex: 2, amount: 1500000, timestamp: 86400000, method: 'wire_transfer', description: 'Kickback payment', sequence: 2 },
            { sourceIndex: 1, targetIndex: 3, amount: 1950000, timestamp: 172800000, method: 'wire_transfer', description: 'Investment', sequence: 3 },
            { sourceIndex: 2, targetIndex: 3, amount: 1450000, timestamp: 172800000, method: 'wire_transfer', description: 'Capital contribution', sequence: 4 },
            { sourceIndex: 3, targetIndex: 4, amount: 2000000, timestamp: 259200000, method: 'wire_transfer', description: 'Trust funding', sequence: 5 },
            { sourceIndex: 3, targetIndex: 5, amount: 1350000, timestamp: 259200000, method: 'wire_transfer', description: 'Professional fees', sequence: 6 },
            { sourceIndex: 4, targetIndex: 6, amount: 1950000, timestamp: 345600000, method: 'wire_transfer', description: 'Property purchase', sequence: 7 },
            { sourceIndex: 5, targetIndex: 6, amount: 1300000, timestamp: 345600000, method: 'wire_transfer', description: 'Property investment', sequence: 8 }
        ]
    },

    {
        id: 'crypto-conversion',
        name: 'Cryptocurrency Conversion',
        description: 'Using crypto exchanges to layer and obscure funds',
        difficulty: 'intermediate',
        pattern: 'crypto_mixing',
        entities: [
            {
                type: 'originator',
                name: 'Ransomware Operator',
                jurisdiction: 'RU',
                position: { x: 150, y: 400 }
            },
            {
                type: 'crypto_exchange',
                name: 'Exchange A (Lax KYC)',
                jurisdiction: 'VG',
                position: { x: 450, y: 300 }
            },
            {
                type: 'crypto_exchange',
                name: 'Privacy Exchange B',
                jurisdiction: 'Unknown',
                position: { x: 450, y: 500 }
            },
            {
                type: 'shell_company',
                name: 'Tech Consulting Ltd',
                jurisdiction: 'KY',
                position: { x: 750, y: 400 }
            },
            {
                type: 'final_beneficiary',
                name: 'Personal Bank Account',
                jurisdiction: 'CH',
                position: { x: 1050, y: 400 }
            }
        ],
        transactions: [
            { sourceIndex: 0, targetIndex: 1, amount: 500000, timestamp: 0, method: 'crypto', description: 'Bitcoin from ransomware', sequence: 1 },
            { sourceIndex: 1, targetIndex: 2, amount: 480000, timestamp: 3600000, method: 'crypto', description: 'Convert to Monero', sequence: 2 },
            { sourceIndex: 2, targetIndex: 3, amount: 460000, timestamp: 86400000, method: 'crypto', description: 'Back to BTC, cash out', sequence: 3 },
            { sourceIndex: 3, targetIndex: 4, amount: 450000, timestamp: 172800000, method: 'wire_transfer', description: '"Consulting fees"', sequence: 4 }
        ]
    },

    {
        id: 'round-trip',
        name: 'Round-Tripping Scheme',
        description: 'Funds leave and return through multiple jurisdictions to appear as foreign investment',
        difficulty: 'advanced',
        pattern: 'round_tripping',
        entities: [
            {
                type: 'originator',
                name: 'Company Alpha (US)',
                jurisdiction: 'US',
                position: { x: 150, y: 400 }
            },
            {
                type: 'shell_company',
                name: 'Offshore Beta (Cayman)',
                jurisdiction: 'KY',
                position: { x: 450, y: 250 }
            },
            {
                type: 'shell_company',
                name: 'Offshore Gamma (BVI)',
                jurisdiction: 'VG',
                position: { x: 750, y: 250 }
            },
            {
                type: 'nominee_account',
                name: 'Investment Vehicle',
                jurisdiction: 'LU',
                position: { x: 1050, y: 400 }
            },
            {
                type: 'final_beneficiary',
                name: 'Company Alpha (US) - Returns',
                jurisdiction: 'US',
                position: { x: 750, y: 550 }
            }
        ],
        transactions: [
            { sourceIndex: 0, targetIndex: 1, amount: 3000000, timestamp: 0, method: 'wire_transfer', description: 'Offshore "investment"', sequence: 1 },
            { sourceIndex: 1, targetIndex: 2, amount: 2950000, timestamp: 86400000, method: 'wire_transfer', description: 'Management fee transfer', sequence: 2 },
            { sourceIndex: 2, targetIndex: 3, amount: 2900000, timestamp: 172800000, method: 'wire_transfer', description: 'Investment fund', sequence: 3 },
            { sourceIndex: 3, targetIndex: 4, amount: 2850000, timestamp: 2592000000, method: 'wire_transfer', description: '"Foreign investment" in Company Alpha', sequence: 4 }
        ]
    },

    {
        id: 'trade-based',
        name: 'Trade-Based Money Laundering',
        description: 'Using over-invoicing and under-invoicing in international trade',
        difficulty: 'advanced',
        pattern: 'trade_based',
        entities: [
            {
                type: 'originator',
                name: 'Cartel-Controlled Exporter',
                jurisdiction: 'MX',
                position: { x: 150, y: 300 }
            },
            {
                type: 'trade_company',
                name: 'Importer Shell Company',
                jurisdiction: 'PA',
                position: { x: 450, y: 200 }
            },
            {
                type: 'correspondent_bank',
                name: 'International Bank',
                jurisdiction: 'US',
                position: { x: 450, y: 400 }
            },
            {
                type: 'trade_company',
                name: 'Re-Exporter',
                jurisdiction: 'KY',
                position: { x: 750, y: 300 }
            },
            {
                type: 'final_beneficiary',
                name: 'Cartel Beneficiary',
                jurisdiction: 'CH',
                position: { x: 1050, y: 400 }
            }
        ],
        transactions: [
            { sourceIndex: 0, targetIndex: 1, amount: 100000, timestamp: 0, method: 'wire_transfer', description: 'Goods sold at 10% market value (under-invoiced)', sequence: 1 },
            { sourceIndex: 1, targetIndex: 3, amount: 1000000, timestamp: 86400000, method: 'wire_transfer', description: 'Same goods sold at 1000% markup (over-invoiced)', sequence: 2 },
            { sourceIndex: 3, targetIndex: 4, amount: 950000, timestamp: 172800000, method: 'wire_transfer', description: '"Profit" from trade', sequence: 3 }
        ]
    },

    {
        id: 'cuckoo-smurfing',
        name: 'Cuckoo Smurfing Operation',
        description: 'Depositing illicit funds into legitimate accounts expecting international transfers',
        difficulty: 'advanced',
        pattern: 'cuckoo_smurfing',
        entities: [
            {
                type: 'originator',
                name: 'Cash Courier A',
                jurisdiction: 'CN',
                position: { x: 150, y: 250 }
            },
            {
                type: 'originator',
                name: 'Cash Courier B',
                jurisdiction: 'CN',
                position: { x: 150, y: 400 }
            },
            {
                type: 'originator',
                name: 'Cash Courier C',
                jurisdiction: 'CN',
                position: { x: 150, y: 550 }
            },
            {
                type: 'money_service_business',
                name: 'Remittance Service',
                jurisdiction: 'AU',
                position: { x: 550, y: 400 }
            },
            {
                type: 'final_beneficiary',
                name: 'Legitimate Business (Unwitting)',
                jurisdiction: 'AU',
                position: { x: 950, y: 400 },
                metadata: {
                    note: 'Expecting legitimate payment from Chinese customer'
                }
            }
        ],
        transactions: [
            { sourceIndex: 0, targetIndex: 3, amount: 45000, timestamp: 0, method: 'cash', description: 'Cash deposit for "remittance"', sequence: 1 },
            { sourceIndex: 1, targetIndex: 3, amount: 38000, timestamp: 3600000, method: 'cash', description: 'Cash deposit for "remittance"', sequence: 2 },
            { sourceIndex: 2, targetIndex: 3, amount: 42000, timestamp: 7200000, method: 'cash', description: 'Cash deposit for "remittance"', sequence: 3 },
            { sourceIndex: 3, targetIndex: 4, amount: 125000, timestamp: 86400000, method: 'wire_transfer', description: 'Combined transfer (replaces legitimate funds)', sequence: 4 }
        ]
    }
];

/**
 * Get sample scenario by ID
 */
export function getSampleScenario(id) {
    return sampleScenarios.find(s => s.id === id);
}

/**
 * Get sample scenarios by difficulty
 */
export function getSamplesByDifficulty(difficulty) {
    return sampleScenarios.filter(s => s.difficulty === difficulty);
}

/**
 * Get sample scenarios by pattern type
 */
export function getSamplesByPattern(pattern) {
    return sampleScenarios.filter(s => s.pattern === pattern);
}

export default sampleScenarios;
