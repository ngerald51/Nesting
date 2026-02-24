/**
 * Transaction.js - Transaction Data Model
 * Represents money flow between entities
 */

export class Transaction {
    constructor(config = {}) {
        this.id = config.id || this.generateId();
        this.sourceId = config.sourceId;
        this.targetId = config.targetId;
        this.amount = config.amount || 0;
        this.currency = config.currency || 'USD';
        this.timestamp = config.timestamp || Date.now();
        this.sequence = config.sequence || 0;
        this.method = config.method || 'wire_transfer';
        this.description = config.description || '';
        this.flags = config.flags || [];
        this.animationDuration = config.animationDuration || 2000;
        this.crossBorder = config.crossBorder || false;
        this.onBehalf = config.onBehalf || false;
        this.onBehalfOf = config.onBehalfOf || '';

        // Analysis results
        this.suspicious = config.suspicious || false;
        this.suspicionReasons = config.suspicionReasons || [];
        this.riskScore = config.riskScore || 0;

        // UI state
        this.highlighted = false;
    }

    /**
     * Generate unique ID for transaction
     */
    generateId() {
        return `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Check if transaction is cross-border
     */
    isCrossBorder(simulation) {
        const source = simulation.entities.get(this.sourceId);
        const target = simulation.entities.get(this.targetId);
        return source && target && source.jurisdiction !== target.jurisdiction;
    }

    /**
     * Check if transaction amount is round
     */
    isRoundAmount() {
        // Check if amount is a round number (ends in multiple zeros)
        return this.amount % 1000 === 0 && this.amount > 1000;
    }

    /**
     * Check if transaction is below reporting threshold
     */
    isBelowThreshold(threshold = 10000) {
        return this.amount < threshold;
    }

    /**
     * Check if transaction is just below threshold (structuring indicator)
     */
    isJustBelowThreshold(threshold = 10000, margin = 1000) {
        return this.amount >= (threshold - margin) && this.amount < threshold;
    }

    /**
     * Add flag to transaction
     */
    addFlag(flag) {
        if (!this.flags.includes(flag)) {
            this.flags.push(flag);
        }
    }

    /**
     * Remove flag from transaction
     */
    removeFlag(flag) {
        this.flags = this.flags.filter(f => f !== flag);
    }

    /**
     * Mark transaction as suspicious
     */
    markSuspicious(reason) {
        this.suspicious = true;
        if (reason && !this.suspicionReasons.includes(reason)) {
            this.suspicionReasons.push(reason);
        }
    }

    /**
     * Clear suspicious status
     */
    clearSuspicious() {
        this.suspicious = false;
        this.suspicionReasons = [];
    }

    /**
     * Get formatted amount
     */
    getFormattedAmount() {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: this.currency
        }).format(this.amount);
    }

    /**
     * Get formatted timestamp
     */
    getFormattedTimestamp() {
        return new Date(this.timestamp).toLocaleString();
    }

    /**
     * Get time difference from another transaction
     */
    getTimeDifference(otherTransaction) {
        return Math.abs(this.timestamp - otherTransaction.timestamp);
    }

    /**
     * Check if transaction occurred within time window of another
     */
    isWithinTimeWindow(otherTransaction, windowMs = 86400000) { // 24 hours default
        return this.getTimeDifference(otherTransaction) <= windowMs;
    }

    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            id: this.id,
            sourceId: this.sourceId,
            targetId: this.targetId,
            amount: this.amount,
            currency: this.currency,
            timestamp: this.timestamp,
            sequence: this.sequence,
            method: this.method,
            description: this.description,
            flags: [...this.flags],
            animationDuration: this.animationDuration,
            crossBorder: this.crossBorder,
            onBehalf: this.onBehalf,
            onBehalfOf: this.onBehalfOf,
            suspicious: this.suspicious,
            suspicionReasons: [...this.suspicionReasons],
            riskScore: this.riskScore
        };
    }

    /**
     * Create from JSON
     */
    static fromJSON(json) {
        return new Transaction(json);
    }

    /**
     * Clone transaction
     */
    clone() {
        return Transaction.fromJSON(this.toJSON());
    }

    /**
     * Update transaction properties
     */
    update(props) {
        Object.keys(props).forEach(key => {
            if (key === 'flags' || key === 'suspicionReasons') {
                this[key] = [...props[key]];
            } else {
                this[key] = props[key];
            }
        });
    }
}

export default Transaction;
