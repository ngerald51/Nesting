/**
 * Entity.js - Entity Data Model
 * Represents entities in the financial crime network (shell companies, banks, etc.)
 */

export class Entity {
    constructor(config = {}) {
        this.id = config.id || this.generateId();
        this.type = config.type || 'shell_company';
        this.name = config.name || this.generateDefaultName();
        this.jurisdiction = config.jurisdiction || 'US';
        this.amlStage = config.amlStage || null;

        // Position on canvas
        this.position = config.position || { x: 100, y: 100 };

        // Metadata
        this.metadata = {
            registrationDate: config.metadata?.registrationDate || Date.now(),
            owner: config.metadata?.owner || '',
            businessType: config.metadata?.businessType || '',
            ...config.metadata
        };

        // Risk analysis
        this.riskScore = config.riskScore || 0;
        this.riskLevel = config.riskLevel || 'low';
        this.riskFactors = config.riskFactors || [];

        // Connections
        this.connections = {
            incoming: config.connections?.incoming || [],
            outgoing: config.connections?.outgoing || []
        };

        // Nesting analysis fields
        this.isBank              = config.isBank              || false;
        this.hopDistance         = config.hopDistance         ?? null;
        this.cddGap              = config.cddGap              || false;
        this.sameGroupAmlCtf     = config.sameGroupAmlCtf     || false;
        this.npmBusinessModel    = config.npmBusinessModel    || null;
        this.permissibilityStatus= config.permissibilityStatus|| null;
        this.nestingRole         = config.nestingRole         || null;

        // UI state
        this.selected = false;
        this.highlighted = false;
    }

    /**
     * Generate unique ID for entity
     */
    generateId() {
        return `entity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate default name based on entity type
     */
    generateDefaultName() {
        const names = {
            originator: 'Criminal',
            shell_company: 'Acme Holdings Ltd',
            correspondent_bank: 'International Bank',
            nominee_account: 'Nominee Account',
            crypto_exchange: 'Crypto Exchange',
            cash_intensive_business: 'Cash Business',
            final_beneficiary: 'Beneficiary'
        };
        return names[this.type] || 'Entity';
    }

    /**
     * Add incoming transaction
     */
    addIncomingTransaction(transactionId) {
        if (!this.connections.incoming.includes(transactionId)) {
            this.connections.incoming.push(transactionId);
        }
    }

    /**
     * Add outgoing transaction
     */
    addOutgoingTransaction(transactionId) {
        if (!this.connections.outgoing.includes(transactionId)) {
            this.connections.outgoing.push(transactionId);
        }
    }

    /**
     * Remove transaction
     */
    removeTransaction(transactionId) {
        this.connections.incoming = this.connections.incoming.filter(id => id !== transactionId);
        this.connections.outgoing = this.connections.outgoing.filter(id => id !== transactionId);
    }

    /**
     * Get total incoming amount
     */
    getTotalIncoming(simulation) {
        return this.connections.incoming.reduce((total, txId) => {
            const tx = simulation.transactions.get(txId);
            return total + (tx ? tx.amount : 0);
        }, 0);
    }

    /**
     * Get total outgoing amount
     */
    getTotalOutgoing(simulation) {
        return this.connections.outgoing.reduce((total, txId) => {
            const tx = simulation.transactions.get(txId);
            return total + (tx ? tx.amount : 0);
        }, 0);
    }

    /**
     * Get net flow (incoming - outgoing)
     */
    getNetFlow(simulation) {
        return this.getTotalIncoming(simulation) - this.getTotalOutgoing(simulation);
    }

    /**
     * Check if entity is intermediary (has both incoming and outgoing)
     */
    isIntermediary() {
        return this.connections.incoming.length > 0 && this.connections.outgoing.length > 0;
    }

    /**
     * Update risk assessment
     */
    updateRiskAssessment(riskProfile) {
        this.riskScore = riskProfile.overallScore;
        this.riskLevel = riskProfile.riskLevel;
        this.riskFactors = riskProfile.factors;
    }

    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            jurisdiction: this.jurisdiction,
            amlStage: this.amlStage,
            position: { ...this.position },
            metadata: { ...this.metadata },
            riskScore: this.riskScore,
            riskLevel: this.riskLevel,
            riskFactors: [...this.riskFactors],
            connections: {
                incoming: [...this.connections.incoming],
                outgoing: [...this.connections.outgoing]
            },
            isBank:               this.isBank,
            hopDistance:          this.hopDistance,
            cddGap:               this.cddGap,
            sameGroupAmlCtf:      this.sameGroupAmlCtf,
            npmBusinessModel:     this.npmBusinessModel,
            permissibilityStatus: this.permissibilityStatus,
            nestingRole:          this.nestingRole
        };
    }

    /**
     * Create from JSON
     */
    static fromJSON(json) {
        return new Entity(json);
    }

    /**
     * Clone entity
     */
    clone() {
        return Entity.fromJSON(this.toJSON());
    }

    /**
     * Update entity properties
     */
    update(props) {
        Object.keys(props).forEach(key => {
            if (key === 'position' || key === 'metadata' || key === 'connections') {
                this[key] = { ...this[key], ...props[key] };
            } else {
                this[key] = props[key];
            }
        });
    }
}

export default Entity;
