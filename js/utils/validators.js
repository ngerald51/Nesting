/**
 * validators.js - Data Validation Functions
 * Validation utilities for entities, transactions, and simulations
 */

/**
 * Validate entity data
 */
export function validateEntity(entity) {
    const errors = [];

    // Required fields
    if (!entity.id) {
        errors.push('Entity ID is required');
    }

    if (!entity.type) {
        errors.push('Entity type is required');
    }

    if (!entity.name || entity.name.trim() === '') {
        errors.push('Entity name is required');
    }

    if (!entity.jurisdiction || entity.jurisdiction.length !== 2) {
        errors.push('Valid jurisdiction code is required (ISO 2-letter)');
    }

    // Position validation
    if (!entity.position || typeof entity.position.x !== 'number' || typeof entity.position.y !== 'number') {
        errors.push('Valid position coordinates are required');
    }

    // Risk score validation
    if (entity.riskScore !== undefined && (entity.riskScore < 0 || entity.riskScore > 100)) {
        errors.push('Risk score must be between 0 and 100');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate transaction data
 */
export function validateTransaction(transaction, entities = []) {
    const errors = [];

    // Required fields
    if (!transaction.id) {
        errors.push('Transaction ID is required');
    }

    if (!transaction.sourceId) {
        errors.push('Source entity ID is required');
    }

    if (!transaction.targetId) {
        errors.push('Target entity ID is required');
    }

    // Self-referencing check
    if (transaction.sourceId === transaction.targetId) {
        errors.push('Source and target cannot be the same entity');
    }

    // Entity existence validation (if entities provided)
    if (entities.length > 0) {
        const sourceExists = entities.some(e => e.id === transaction.sourceId);
        const targetExists = entities.some(e => e.id === transaction.targetId);

        if (!sourceExists) {
            errors.push('Source entity does not exist');
        }
        if (!targetExists) {
            errors.push('Target entity does not exist');
        }
    }

    // Amount validation
    if (typeof transaction.amount !== 'number' || transaction.amount <= 0) {
        errors.push('Amount must be a positive number');
    }

    if (transaction.amount > 999999999999) {
        errors.push('Amount exceeds maximum allowed value');
    }

    // Currency validation
    if (!transaction.currency || transaction.currency.length !== 3) {
        errors.push('Valid currency code is required (ISO 3-letter)');
    }

    // Timestamp validation
    if (!transaction.timestamp || transaction.timestamp < 0) {
        errors.push('Valid timestamp is required');
    }

    // Method validation
    const validMethods = ['wire_transfer', 'cash', 'crypto', 'check', 'trade'];
    if (!transaction.method || !validMethods.includes(transaction.method)) {
        errors.push(`Method must be one of: ${validMethods.join(', ')}`);
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate simulation data
 */
export function validateSimulation(simulation) {
    const errors = [];

    // Required fields
    if (!simulation.id) {
        errors.push('Simulation ID is required');
    }

    if (!simulation.name || simulation.name.trim() === '') {
        errors.push('Simulation name is required');
    }

    // Entities validation
    if (!Array.isArray(simulation.entities) && !(simulation.entities instanceof Map)) {
        errors.push('Entities must be an array or Map');
    }

    // Transactions validation
    if (!Array.isArray(simulation.transactions) && !(simulation.transactions instanceof Map)) {
        errors.push('Transactions must be an array or Map');
    }

    // Metadata validation
    if (!simulation.metadata || typeof simulation.metadata !== 'object') {
        errors.push('Metadata must be an object');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate jurisdiction code
 */
export function isValidJurisdictionCode(code) {
    return typeof code === 'string' && /^[A-Z]{2}$/.test(code);
}

/**
 * Validate currency code
 */
export function isValidCurrencyCode(code) {
    return typeof code === 'string' && /^[A-Z]{3}$/.test(code);
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidURL(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Validate date is in valid range
 */
export function isValidDate(timestamp) {
    const date = new Date(timestamp);
    return !isNaN(date.getTime()) &&
           date.getTime() > 0 &&
           date.getTime() < 253402300799999; // Max valid date
}

/**
 * Sanitize string input
 */
export function sanitizeString(str, maxLength = 255) {
    if (typeof str !== 'string') return '';

    return str
        .trim()
        .slice(0, maxLength)
        .replace(/[<>]/g, ''); // Remove potential HTML tags
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(value, min = -Infinity, max = Infinity) {
    const num = Number(value);
    if (isNaN(num)) return 0;
    return Math.min(Math.max(num, min), max);
}

/**
 * Validate risk score
 */
export function isValidRiskScore(score) {
    return typeof score === 'number' && score >= 0 && score <= 100;
}

/**
 * Validate AML stage
 */
export function isValidAMLStage(stage) {
    const validStages = ['placement', 'layering', 'integration', null];
    return validStages.includes(stage);
}

/**
 * Validate entity type
 */
export function isValidEntityType(type) {
    const validTypes = [
        'originator',
        'shell_company',
        'correspondent_bank',
        'nominee_account',
        'crypto_exchange',
        'cash_intensive_business',
        'final_beneficiary',
        'trade_company',
        'real_estate',
        'offshore_trust',
        'money_service_business',
        'professional_service',
        'casino',
        'precious_metals',
        'investment_fund'
    ];
    return validTypes.includes(type);
}

/**
 * Validate pattern severity
 */
export function isValidSeverity(severity) {
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    return validSeverities.includes(severity);
}

/**
 * Validate file size
 */
export function isValidFileSize(file, maxSizeMB = 10) {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
}

/**
 * Validate file type
 */
export function isValidFileType(file, allowedTypes = ['application/json']) {
    return allowedTypes.includes(file.type);
}

/**
 * Validate JSON structure
 */
export function isValidJSON(str) {
    try {
        JSON.parse(str);
        return true;
    } catch {
        return false;
    }
}

/**
 * Check if value is empty
 */
export function isEmpty(value) {
    if (value == null) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
}

/**
 * Validate transaction amount for structuring detection
 */
export function isStructuredAmount(amount, threshold = 10000, tolerance = 0.05) {
    const lowerBound = threshold * (1 - tolerance);
    return amount >= lowerBound && amount < threshold;
}

/**
 * Validate round amount (potential red flag)
 */
export function isRoundAmount(amount, divisor = 1000) {
    return amount % divisor === 0 && amount >= divisor;
}

export default {
    validateEntity,
    validateTransaction,
    validateSimulation,
    isValidJurisdictionCode,
    isValidCurrencyCode,
    isValidEmail,
    isValidURL,
    isValidDate,
    sanitizeString,
    sanitizeNumber,
    isValidRiskScore,
    isValidAMLStage,
    isValidEntityType,
    isValidSeverity,
    isValidFileSize,
    isValidFileType,
    isValidJSON,
    isEmpty,
    isStructuredAmount,
    isRoundAmount
};
