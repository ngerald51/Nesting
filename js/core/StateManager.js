/**
 * StateManager.js - Central Application State
 * Single source of truth for the simulation and UI state
 */

import Simulation from '../models/Simulation.js';
import Entity from '../models/Entity.js';
import Transaction from '../models/Transaction.js';
import eventBus, { Events } from '../utils/eventBus.js';
import storageManager from '../utils/storage.js';
import { scoreAll } from '../algorithms/riskScoring.js';
import { detectAll } from '../algorithms/patternDetection.js';

class StateManager {
    constructor() {
        this.simulation = new Simulation({ name: 'Untitled Simulation' });
        this.selectedEntityId = null;
        this.selectedTransactionId = null;
        this.connectingFromId = null;  // Entity waiting for a second click
        this.isDirty = false;
    }

    /* ── Simulation ────────────────────────────────────── */

    newSimulation() {
        this.simulation = new Simulation({ name: 'Untitled Simulation' });
        this.selectedEntityId = null;
        this.selectedTransactionId = null;
        this.connectingFromId = null;
        this.isDirty = false;
        eventBus.emit(Events.SIMULATION_LOADED, this.simulation);
    }

    loadSimulation(simulation) {
        this.simulation = simulation;
        this.selectedEntityId = null;
        this.selectedTransactionId = null;
        this.connectingFromId = null;
        this.isDirty = false;
        eventBus.emit(Events.SIMULATION_LOADED, simulation);
    }

    saveSimulation() {
        const result = storageManager.saveSimulation(this.simulation);
        if (result.success) {
            this.isDirty = false;
            eventBus.emit(Events.SIMULATION_SAVED, this.simulation);
        }
        return result;
    }

    getSimulationName() {
        return this.simulation.name;
    }

    setSimulationName(name) {
        this.simulation.name = name;
        this.markDirty();
    }

    /* ── Entities ──────────────────────────────────────── */

    addEntity(config) {
        const entity = new Entity(config);
        this.simulation.addEntity(entity);
        this.markDirty();
        eventBus.emit(Events.ENTITY_ADDED, entity);
        return entity;
    }

    updateEntity(entityId, changes) {
        const entity = this.simulation.entities.get(entityId);
        if (!entity) return null;
        entity.update(changes);
        this.simulation.updatedAt = Date.now();
        this.markDirty();
        eventBus.emit(Events.ENTITY_UPDATED, entity);
        return entity;
    }

    removeEntity(entityId) {
        const entity = this.simulation.entities.get(entityId);
        if (!entity) return;
        this.simulation.removeEntity(entityId);
        if (this.selectedEntityId === entityId) this.selectedEntityId = null;
        this.markDirty();
        eventBus.emit(Events.ENTITY_REMOVED, { entityId });
    }

    selectEntity(entityId) {
        this.selectedEntityId = entityId;
        this.selectedTransactionId = null;
        const entity = this.simulation.entities.get(entityId);
        eventBus.emit(Events.ENTITY_SELECTED, entity);
    }

    clearSelection() {
        this.selectedEntityId = null;
        this.selectedTransactionId = null;
        eventBus.emit(Events.ENTITY_SELECTED, null);
    }

    /* ── Connection (click-to-connect) ────────────────── */

    startConnecting(entityId) {
        this.connectingFromId = entityId;
    }

    finishConnecting(targetEntityId) {
        const sourceId = this.connectingFromId;
        this.connectingFromId = null;

        if (!sourceId || sourceId === targetEntityId) return null;

        // Avoid duplicate connections
        const exists = Array.from(this.simulation.transactions.values()).some(
            t => t.sourceId === sourceId && t.targetId === targetEntityId
        );
        if (exists) return null;

        return this.addTransaction({
            sourceId,
            targetId: targetEntityId,
            amount: 100000,
            currency: 'USD',
            timestamp: Date.now(),
            method: 'wire_transfer',
            sequence: this.simulation.transactions.size + 1
        });
    }

    cancelConnecting() {
        this.connectingFromId = null;
    }

    /* ── Transactions ──────────────────────────────────── */

    addTransaction(config) {
        const tx = new Transaction({
            ...config,
            sequence: config.sequence ?? this.simulation.transactions.size + 1
        });
        this.simulation.addTransaction(tx);
        this.markDirty();
        eventBus.emit(Events.TRANSACTION_ADDED, tx);
        return tx;
    }

    updateTransaction(txId, changes) {
        const tx = this.simulation.transactions.get(txId);
        if (!tx) return null;
        tx.update(changes);
        this.simulation.updatedAt = Date.now();
        this.markDirty();
        eventBus.emit(Events.TRANSACTION_UPDATED, tx);
        return tx;
    }

    removeTransaction(txId) {
        this.simulation.removeTransaction(txId);
        if (this.selectedTransactionId === txId) this.selectedTransactionId = null;
        this.markDirty();
        eventBus.emit(Events.TRANSACTION_REMOVED, { txId });
    }

    selectTransaction(txId) {
        this.selectedTransactionId = txId;
        this.selectedEntityId = null;
        const tx = this.simulation.transactions.get(txId);
        eventBus.emit(Events.TRANSACTION_SELECTED, tx);
    }

    /* ── Analysis ──────────────────────────────────────── */

    runAnalysis() {
        if (this.simulation.isEmpty()) return;

        eventBus.emit(Events.ANALYSIS_STARTED, null);

        // Pattern detection (must run first so risk scoring can use it)
        const patterns = detectAll(this.simulation);
        this.simulation.metadata.detectedPatterns = patterns;

        // Risk scoring
        const riskProfiles = scoreAll(this.simulation);
        let totalRisk = 0;
        riskProfiles.forEach((profile, entityId) => {
            const entity = this.simulation.entities.get(entityId);
            if (entity) entity.updateRiskAssessment(profile);
            totalRisk += profile.overallScore;
        });

        const entityCount = this.simulation.entities.size;
        this.simulation.metadata.overallRiskScore =
            entityCount > 0 ? Math.round(totalRisk / entityCount) : 0;

        this.markDirty();
        eventBus.emit(Events.ANALYSIS_COMPLETED, {
            patterns,
            riskProfiles,
            overallScore: this.simulation.metadata.overallRiskScore
        });
    }

    /* ── Helpers ───────────────────────────────────────── */

    markDirty() {
        this.isDirty = true;
        storageManager.scheduleAutoSave(this.simulation);
    }

    getEntityCount()     { return this.simulation.entities.size; }
    getTransactionCount(){ return this.simulation.transactions.size; }
    getAllEntities()      { return Array.from(this.simulation.entities.values()); }
    getAllTransactions()  { return Array.from(this.simulation.transactions.values()); }
    getEntity(id)        { return this.simulation.entities.get(id); }
    getTransaction(id)   { return this.simulation.transactions.get(id); }
}

// Singleton
const stateManager = new StateManager();
export default stateManager;
