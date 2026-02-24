/**
 * Toolbar.js - Top Toolbar Actions
 */

import eventBus, { Events } from '../utils/eventBus.js';
import stateManager from '../core/StateManager.js';
import storageManager from '../utils/storage.js';
import { sampleScenarios } from '../data/samples.js';
import Simulation from '../models/Simulation.js';
import Entity from '../models/Entity.js';
import Transaction from '../models/Transaction.js';

class Toolbar {
    constructor(exportManager) {
        this.exportManager = exportManager;
        this._bindButtons();
        this._bindSimulationName();
        this._bindModals();
        this._updateStats();

        eventBus.on(Events.ENTITY_ADDED,       () => this._updateStats());
        eventBus.on(Events.ENTITY_REMOVED,     () => this._updateStats());
        eventBus.on(Events.TRANSACTION_ADDED,  () => this._updateStats());
        eventBus.on(Events.TRANSACTION_REMOVED,() => this._updateStats());
        eventBus.on(Events.SIMULATION_LOADED,  () => {
            this._updateStats();
            this._syncName();
        });
    }

    _bindButtons() {
        document.getElementById('btn-new')?.addEventListener('click', () => this._newSimulation());
        document.getElementById('btn-save')?.addEventListener('click', () => this._save());
        document.getElementById('btn-load')?.addEventListener('click', () => this._openLoadModal());
        document.getElementById('btn-export-json')?.addEventListener('click', () => this.exportManager.exportJSON());
        document.getElementById('btn-export-pdf')?.addEventListener('click', () => this.exportManager.exportPDF());
        document.getElementById('btn-analyze')?.addEventListener('click', () => stateManager.runAnalysis());
        document.getElementById('btn-learn')?.addEventListener('click', () => {
            document.getElementById('learn-modal').style.display = 'flex';
        });

        document.getElementById('btn-help')?.addEventListener('click', () => {
            document.getElementById('help-modal').style.display = 'flex';
        });

        document.getElementById('file-import')?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const sim = await this.exportManager.importJSON(file);
            if (sim) stateManager.loadSimulation(sim);
            e.target.value = '';
        });
    }

    _bindSimulationName() {
        const nameInput = document.getElementById('simulation-name');
        if (!nameInput) return;
        nameInput.addEventListener('change', () => {
            stateManager.setSimulationName(nameInput.value.trim() || 'Untitled Simulation');
        });
    }

    _bindModals() {
        // Close any modal when clicking the backdrop
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.style.display = 'none';
            });
        });

        // ESC key closes all modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
                stateManager.cancelConnecting();
            }
        });
    }

    _newSimulation() {
        if (stateManager.isDirty) {
            if (!confirm('Unsaved changes will be lost. Create new simulation?')) return;
        }
        stateManager.newSimulation();
    }

    _save() {
        const result = stateManager.saveSimulation();
        if (!result.success) {
            alert('Save failed: ' + result.error);
        } else {
            this._flashButton('btn-save');
        }
    }

    _openLoadModal() {
        const listEl = document.getElementById('simulation-list');
        if (!listEl) return;

        const simulations = storageManager.getSimulationMetadata();

        if (simulations.length === 0 && sampleScenarios.length === 0) {
            listEl.innerHTML = '<p style="color:#9E9E9E;font-size:13px;text-align:center">No saved simulations</p>';
        } else {
            listEl.innerHTML = '';

            // Saved simulations
            if (simulations.length > 0) {
                const header = document.createElement('div');
                header.style.cssText = 'font-weight:600;font-size:12px;color:#9E9E9E;text-transform:uppercase;margin-bottom:8px';
                header.textContent = 'Saved Simulations';
                listEl.appendChild(header);

                simulations.forEach(meta => {
                    const item = this._simListItem(meta, () => this._loadById(meta.id));
                    listEl.appendChild(item);
                });
            }

            // Sample scenarios
            const sampleHeader = document.createElement('div');
            sampleHeader.style.cssText = 'font-weight:600;font-size:12px;color:#9E9E9E;text-transform:uppercase;margin:16px 0 8px';
            sampleHeader.textContent = 'Sample Scenarios';
            listEl.appendChild(sampleHeader);

            sampleScenarios.forEach(scenario => {
                const meta = {
                    id: scenario.id,
                    name: scenario.name,
                    description: scenario.description,
                    entityCount: scenario.entities.length,
                    transactionCount: scenario.transactions.length
                };
                const item = this._simListItem(meta, () => this._loadSample(scenario), scenario.difficulty);
                listEl.appendChild(item);
            });
        }

        document.getElementById('load-modal').style.display = 'flex';
    }

    _simListItem(meta, onClick, badge = null) {
        const item = document.createElement('div');
        item.className = 'simulation-list-item';
        item.innerHTML = `
          <div class="simulation-list-info">
            <div class="simulation-list-name">${_esc(meta.name)}
              ${badge ? `<span style="margin-left:8px;padding:2px 6px;font-size:10px;background:#E3F2FD;color:#1976D2;border-radius:4px">${badge}</span>` : ''}
            </div>
            <div class="simulation-list-meta">
              ${meta.entityCount} entities • ${meta.transactionCount} transactions
              ${meta.description ? ' • ' + _esc(meta.description.slice(0, 60)) + '…' : ''}
            </div>
          </div>`;
        item.addEventListener('click', onClick);
        return item;
    }

    _loadById(id) {
        const simulations = storageManager.getAllSimulations();
        const simData = simulations.find(s => s.id === id);
        if (!simData) return;

        const sim = Simulation.fromJSON(simData);
        stateManager.loadSimulation(sim);
        document.getElementById('load-modal').style.display = 'none';
    }

    _loadSample(scenario) {
        // Build a Simulation from the sample scenario definition
        const sim = new Simulation({
            name:        scenario.name,
            description: scenario.description
        });

        const createdEntities = scenario.entities.map(eData => {
            const entity = new Entity({
                type:         eData.type,
                name:         eData.name,
                jurisdiction: eData.jurisdiction || 'US',
                amlStage:     eData.amlStage || null,
                position:     eData.position,
                metadata:     eData.metadata || {}
            });
            return entity;
        });

        createdEntities.forEach(e => sim.entities.set(e.id, e));

        // Map scenario transaction sourceIndex/targetIndex to real entity IDs
        let seq = 1;
        scenario.transactions.forEach(txData => {
            const source = createdEntities[txData.sourceIndex];
            const target = createdEntities[txData.targetIndex];
            if (!source || !target) return;

            const tx = new Transaction({
                sourceId:    source.id,
                targetId:    target.id,
                amount:      txData.amount,
                timestamp:   txData.timestamp || seq * 3600000,
                method:      txData.method || 'wire_transfer',
                description: txData.description || '',
                sequence:    seq++
            });
            sim.addTransaction(tx);
        });

        stateManager.loadSimulation(sim);
        document.getElementById('load-modal').style.display = 'none';
    }

    _updateStats() {
        const eEl = document.getElementById('entity-count');
        const tEl = document.getElementById('transaction-count');
        if (eEl) eEl.textContent = `${stateManager.getEntityCount()} entities`;
        if (tEl) tEl.textContent = `${stateManager.getTransactionCount()} transactions`;
    }

    _syncName() {
        const nameInput = document.getElementById('simulation-name');
        if (nameInput) nameInput.value = stateManager.getSimulationName();
    }

    _flashButton(id) {
        const btn = document.getElementById(id);
        if (!btn) return;
        const orig = btn.style.background;
        btn.style.background = '#43A047';
        setTimeout(() => { btn.style.background = orig; }, 800);
    }
}

function _esc(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

export default Toolbar;
