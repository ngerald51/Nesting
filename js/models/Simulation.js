/**
 * Simulation.js - Main Simulation Container
 * Contains all entities, transactions, and simulation state
 */

import Entity from './Entity.js';
import Transaction from './Transaction.js';

export class Simulation {
    constructor(config = {}) {
        this.id = config.id || this.generateId();
        this.name = config.name || 'Untitled Simulation';
        this.description = config.description || '';

        // Core data structures
        this.entities = new Map();
        this.transactions = new Map();

        // Load entities and transactions if provided
        if (config.entities) {
            if (Array.isArray(config.entities)) {
                // From JSON format [[id, entity], ...]
                config.entities.forEach(([id, entityData]) => {
                    this.entities.set(id, Entity.fromJSON(entityData));
                });
            } else if (config.entities instanceof Map) {
                this.entities = config.entities;
            }
        }

        if (config.transactions) {
            if (Array.isArray(config.transactions)) {
                // From JSON format [[id, transaction], ...]
                config.transactions.forEach(([id, txData]) => {
                    this.transactions.set(id, Transaction.fromJSON(txData));
                });
            } else if (config.transactions instanceof Map) {
                this.transactions = config.transactions;
            }
        }

        // Metadata
        this.metadata = {
            totalAmount: config.metadata?.totalAmount || 0,
            timelineStart: config.metadata?.timelineStart || null,
            timelineEnd: config.metadata?.timelineEnd || null,
            detectedPatterns: config.metadata?.detectedPatterns || [],
            overallRiskScore: config.metadata?.overallRiskScore || 0,
            tags: config.metadata?.tags || [],
            ...config.metadata
        };

        // Canvas state
        this.canvasState = {
            zoom: config.canvasState?.zoom || 1,
            panX: config.canvasState?.panX || 0,
            panY: config.canvasState?.panY || 0,
            ...config.canvasState
        };

        // Timestamps
        this.createdAt = config.createdAt || Date.now();
        this.updatedAt = config.updatedAt || Date.now();

        // Version for future compatibility
        this.version = config.version || 1;
    }

    /**
     * Generate unique ID for simulation
     */
    generateId() {
        return `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Add entity to simulation
     */
    addEntity(entity) {
        this.entities.set(entity.id, entity);
        this.updatedAt = Date.now();
        return entity;
    }

    /**
     * Remove entity from simulation
     */
    removeEntity(entityId) {
        // Remove all connected transactions
        const entity = this.entities.get(entityId);
        if (entity) {
            const transactionIds = [
                ...entity.connections.incoming,
                ...entity.connections.outgoing
            ];
            transactionIds.forEach(txId => this.removeTransaction(txId));
        }

        this.entities.delete(entityId);
        this.updatedAt = Date.now();
    }

    /**
     * Get entity by ID
     */
    getEntity(entityId) {
        return this.entities.get(entityId);
    }

    /**
     * Add transaction to simulation
     */
    addTransaction(transaction) {
        this.transactions.set(transaction.id, transaction);

        // Update entity connections
        const source = this.entities.get(transaction.sourceId);
        const target = this.entities.get(transaction.targetId);

        if (source) {
            source.addOutgoingTransaction(transaction.id);
        }
        if (target) {
            target.addIncomingTransaction(transaction.id);
        }

        this.updatedAt = Date.now();
        this.updateMetadata();
        return transaction;
    }

    /**
     * Remove transaction from simulation
     */
    removeTransaction(transactionId) {
        const transaction = this.transactions.get(transactionId);
        if (transaction) {
            // Update entity connections
            const source = this.entities.get(transaction.sourceId);
            const target = this.entities.get(transaction.targetId);

            if (source) {
                source.removeTransaction(transactionId);
            }
            if (target) {
                target.removeTransaction(transactionId);
            }
        }

        this.transactions.delete(transactionId);
        this.updatedAt = Date.now();
        this.updateMetadata();
    }

    /**
     * Get transaction by ID
     */
    getTransaction(transactionId) {
        return this.transactions.get(transactionId);
    }

    /**
     * Get all transactions sorted by timestamp
     */
    getSortedTransactions() {
        return Array.from(this.transactions.values())
            .sort((a, b) => a.timestamp - b.timestamp || a.sequence - b.sequence);
    }

    /**
     * Get entities by type
     */
    getEntitiesByType(type) {
        return Array.from(this.entities.values())
            .filter(entity => entity.type === type);
    }

    /**
     * Get transactions for entity
     */
    getTransactionsForEntity(entityId, direction = 'all') {
        const entity = this.entities.get(entityId);
        if (!entity) return [];

        let txIds = [];
        if (direction === 'incoming' || direction === 'all') {
            txIds = [...txIds, ...entity.connections.incoming];
        }
        if (direction === 'outgoing' || direction === 'all') {
            txIds = [...txIds, ...entity.connections.outgoing];
        }

        return txIds.map(id => this.transactions.get(id)).filter(Boolean);
    }

    /**
     * Update simulation metadata
     */
    updateMetadata() {
        // Calculate total amount
        this.metadata.totalAmount = Array.from(this.transactions.values())
            .reduce((sum, tx) => sum + tx.amount, 0);

        // Update timeline boundaries
        const timestamps = Array.from(this.transactions.values())
            .map(tx => tx.timestamp)
            .filter(Boolean);

        if (timestamps.length > 0) {
            this.metadata.timelineStart = Math.min(...timestamps);
            this.metadata.timelineEnd = Math.max(...timestamps);
        } else {
            this.metadata.timelineStart = null;
            this.metadata.timelineEnd = null;
        }
    }

    /**
     * Clear all entities and transactions
     */
    clear() {
        this.entities.clear();
        this.transactions.clear();
        this.metadata = {
            totalAmount: 0,
            timelineStart: null,
            timelineEnd: null,
            detectedPatterns: [],
            overallRiskScore: 0,
            tags: []
        };
        this.updatedAt = Date.now();
    }

    /**
     * Get simulation statistics
     */
    getStatistics() {
        return {
            entityCount: this.entities.size,
            transactionCount: this.transactions.size,
            totalAmount: this.metadata.totalAmount,
            avgRiskScore: this.getAverageRiskScore(),
            patternCount: this.metadata.detectedPatterns.length,
            timelineSpan: this.getTimelineSpan()
        };
    }

    /**
     * Get average risk score across all entities
     */
    getAverageRiskScore() {
        const entities = Array.from(this.entities.values());
        if (entities.length === 0) return 0;

        const totalRisk = entities.reduce((sum, entity) => sum + entity.riskScore, 0);
        return totalRisk / entities.length;
    }

    /**
     * Get timeline span in milliseconds
     */
    getTimelineSpan() {
        if (!this.metadata.timelineStart || !this.metadata.timelineEnd) {
            return 0;
        }
        return this.metadata.timelineEnd - this.metadata.timelineStart;
    }

    /**
     * Check if simulation is empty
     */
    isEmpty() {
        return this.entities.size === 0 && this.transactions.size === 0;
    }

    /**
     * Validate simulation integrity
     */
    validate() {
        const issues = [];

        // Check that all transaction references are valid
        this.transactions.forEach(tx => {
            if (!this.entities.has(tx.sourceId)) {
                issues.push(`Transaction ${tx.id} references non-existent source ${tx.sourceId}`);
            }
            if (!this.entities.has(tx.targetId)) {
                issues.push(`Transaction ${tx.id} references non-existent target ${tx.targetId}`);
            }
        });

        // Check that all entity connections reference existing transactions
        this.entities.forEach(entity => {
            [...entity.connections.incoming, ...entity.connections.outgoing].forEach(txId => {
                if (!this.transactions.has(txId)) {
                    issues.push(`Entity ${entity.id} references non-existent transaction ${txId}`);
                }
            });
        });

        return {
            valid: issues.length === 0,
            issues
        };
    }

    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            entities: Array.from(this.entities.entries()).map(([id, entity]) => [id, entity.toJSON()]),
            transactions: Array.from(this.transactions.entries()).map(([id, tx]) => [id, tx.toJSON()]),
            metadata: { ...this.metadata },
            canvasState: { ...this.canvasState },
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            version: this.version
        };
    }

    /**
     * Create from JSON
     */
    static fromJSON(json) {
        return new Simulation(json);
    }

    /**
     * Clone simulation
     */
    clone() {
        return Simulation.fromJSON(this.toJSON());
    }
}

export default Simulation;
