/**
 * entityTypes.js - Entity Type Definitions
 * Defines all entity types with their properties, icons, and risk levels
 */

export const entityTypes = [
    {
        id: 'originator',
        name: 'Originator',
        icon: '👤',
        description: 'Source of illicit funds - the criminal actor introducing money into the financial system',
        baseRisk: 30,
        amlStage: 'placement',
        color: '#F44336',
        tooltip: 'The originator is where the illegal funds begin their journey. This is typically a criminal organization or individual seeking to launder proceeds from illegal activities.'
    },
    {
        id: 'shell_company',
        name: 'Shell Company',
        icon: '🏢',
        description: 'Company with no real operations or employees, used to hide beneficial ownership',
        baseRisk: 90,
        amlStage: 'layering',
        color: '#FF9800',
        tooltip: 'Shell companies are legal entities with no significant assets or operations. They are commonly used in money laundering to obscure the true ownership and source of funds.'
    },
    {
        id: 'correspondent_bank',
        name: 'Correspondent Bank',
        icon: '🏦',
        description: 'Bank that provides services to another bank, often used for international transfers',
        baseRisk: 20,
        amlStage: null,
        color: '#2196F3',
        tooltip: 'Correspondent banks facilitate international wire transfers. While legitimate, they can be exploited for laundering due to the complexity and volume of cross-border transactions.'
    },
    {
        id: 'nominee_account',
        name: 'Nominee Account',
        icon: '👥',
        description: 'Bank account held in the name of one person on behalf of another (the beneficial owner)',
        baseRisk: 85,
        amlStage: 'layering',
        color: '#FF9800',
        tooltip: 'Nominee accounts hide the true beneficial owner. The account holder is typically a trusted associate or professional (lawyer, accountant) acting on behalf of the actual owner.'
    },
    {
        id: 'crypto_exchange',
        name: 'Crypto Exchange',
        icon: '₿',
        description: 'Platform for exchanging cryptocurrency and fiat currency, offering anonymity',
        baseRisk: 60,
        amlStage: 'layering',
        color: '#FF9800',
        tooltip: 'Cryptocurrency exchanges can be used to convert illicit funds into digital assets, providing a layer of anonymity and making it harder to trace the money trail.'
    },
    {
        id: 'cash_intensive_business',
        name: 'Cash Business',
        icon: '🏪',
        description: 'Business with high cash turnover (restaurant, casino, car wash) used to mix illicit and legitimate funds',
        baseRisk: 70,
        amlStage: 'integration',
        color: '#4CAF50',
        tooltip: 'Cash-intensive businesses like restaurants, casinos, or car washes are used to integrate laundered money back into the legitimate economy by mixing it with genuine business revenue.'
    },
    {
        id: 'final_beneficiary',
        name: 'Final Beneficiary',
        icon: '🎯',
        description: 'Ultimate recipient of the laundered funds, now appearing legitimate',
        baseRisk: 30,
        amlStage: 'integration',
        color: '#4CAF50',
        tooltip: 'The final beneficiary receives the laundered funds, which now appear to come from legitimate sources. This completes the money laundering cycle.'
    },
    {
        id: 'trade_company',
        name: 'Trade Company',
        icon: '📦',
        description: 'Import/export company used for trade-based money laundering (over/under-invoicing)',
        baseRisk: 75,
        amlStage: 'layering',
        color: '#FF9800',
        tooltip: 'Trade companies can manipulate invoice prices to move value across borders. Over-invoicing imports or under-invoicing exports are common trade-based laundering techniques.'
    },
    {
        id: 'real_estate',
        name: 'Real Estate',
        icon: '🏠',
        description: 'Property purchase/sale used to integrate funds and store value',
        baseRisk: 65,
        amlStage: 'integration',
        color: '#4CAF50',
        tooltip: 'Real estate is a popular integration method. Criminals buy property with illicit funds, then sell it later to create apparently legitimate proceeds.'
    },
    {
        id: 'offshore_trust',
        name: 'Offshore Trust',
        icon: '🏝️',
        description: 'Legal arrangement in a foreign jurisdiction to hide assets and ownership',
        baseRisk: 88,
        amlStage: 'layering',
        color: '#FF9800',
        tooltip: 'Offshore trusts in secrecy jurisdictions provide legal structures to hide beneficial ownership and protect assets from scrutiny.'
    },
    {
        id: 'money_service_business',
        name: 'Money Service Business',
        icon: '💱',
        description: 'Currency exchange, money transfer, or check cashing service',
        baseRisk: 55,
        amlStage: 'placement',
        color: '#F44336',
        tooltip: 'Money service businesses (MSBs) like remittance companies and currency exchanges can be exploited for placement due to their cash-handling nature and less stringent regulations than banks.'
    },
    {
        id: 'professional_service',
        name: 'Professional Service Provider',
        icon: '💼',
        description: 'Lawyer, accountant, or corporate service provider facilitating transactions',
        baseRisk: 45,
        amlStage: 'layering',
        color: '#FF9800',
        tooltip: 'Lawyers, accountants, and corporate service providers can be unwitting or complicit participants in laundering by setting up structures, managing accounts, and providing professional legitimacy.'
    },
    {
        id: 'casino',
        name: 'Casino',
        icon: '🎰',
        description: 'Gambling establishment used to place and integrate funds',
        baseRisk: 72,
        amlStage: 'integration',
        color: '#4CAF50',
        tooltip: 'Casinos are classic laundering vehicles. Criminals exchange cash for chips, gamble minimally, then cash out with a receipt showing "gambling winnings" as the source.'
    },
    {
        id: 'precious_metals',
        name: 'Precious Metals Dealer',
        icon: '💎',
        description: 'Gold, diamond, or jewelry dealer used for value storage and transfer',
        baseRisk: 68,
        amlStage: 'layering',
        color: '#FF9800',
        tooltip: 'Precious metals and gems provide portable, valuable assets that can be purchased with cash and easily transported across borders, facilitating both layering and value transfer.'
    },
    {
        id: 'investment_fund',
        name: 'Investment Fund',
        icon: '📈',
        description: 'Hedge fund, private equity, or investment vehicle for layering',
        baseRisk: 58,
        amlStage: 'integration',
        color: '#4CAF50',
        tooltip: 'Investment funds can be used to integrate laundered money into apparently legitimate investment returns, creating complex paper trails that obscure the original source.'
    },
    {
        id: 'merchant',
        name: 'Merchant',
        icon: '🛒',
        description: 'Retail or e-commerce merchant accepting payments, potentially used for integration of laundered funds',
        baseRisk: 35,
        amlStage: 'integration',
        color: '#4CAF50',
        tooltip: 'Merchants can be used to integrate laundered funds through fraudulent sales transactions or by over-reporting legitimate revenue.'
    },
    {
        id: 'npm_fintech',
        name: 'NPM FINTECH',
        icon: '💻',
        description: 'Non-bank payment institution or fintech company facilitating electronic payments',
        baseRisk: 50,
        amlStage: 'layering',
        color: '#FF9800',
        tooltip: 'Non-bank payment institutions and fintech companies provide digital payment rails that can be exploited for rapid layering of funds across multiple accounts.'
    }
];

/**
 * Get entity type by ID
 */
export function getEntityType(id) {
    return entityTypes.find(type => type.id === id);
}

/**
 * Get entity types by AML stage
 */
export function getEntityTypesByStage(stage) {
    return entityTypes.filter(type => type.amlStage === stage);
}

/**
 * Get high-risk entity types
 */
export function getHighRiskEntityTypes(threshold = 70) {
    return entityTypes.filter(type => type.baseRisk >= threshold);
}

/**
 * Get placement stage entities
 */
export function getPlacementEntities() {
    return getEntityTypesByStage('placement');
}

/**
 * Get layering stage entities
 */
export function getLayeringEntities() {
    return getEntityTypesByStage('layering');
}

/**
 * Get integration stage entities
 */
export function getIntegrationEntities() {
    return getEntityTypesByStage('integration');
}

export default entityTypes;
