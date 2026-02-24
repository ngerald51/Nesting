/**
 * PatternDetector.js - Pattern Detection Display
 */

import eventBus, { Events } from '../utils/eventBus.js';
import stateManager from '../core/StateManager.js';
import { getPatternDefinition } from '../data/patterns.js';
import Config from '../config.js';

class PatternDetector {
    constructor(nodeManager, connectionManager) {
        this.nodeManager        = nodeManager;
        this.connectionManager  = connectionManager;
        this.patternsEl         = document.getElementById('detected-patterns');
        this.eduModal           = document.getElementById('pattern-education-modal');
        this.eduTitle           = document.getElementById('pattern-education-title');
        this.eduContent         = document.getElementById('pattern-education-content');

        eventBus.on(Events.ANALYSIS_COMPLETED, (data) => this._render(data.patterns));
        eventBus.on(Events.SIMULATION_LOADED,  ()     => this._reset());

        // Close modal buttons
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.dataset.modal;
                if (modalId) document.getElementById(modalId).style.display = 'none';
            });
        });
    }

    _render(patterns) {
        if (!this.patternsEl) return;

        if (!patterns || patterns.length === 0) {
            this.patternsEl.innerHTML =
                '<div class="no-patterns">No suspicious patterns detected</div>';
            return;
        }

        // Sort by severity
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        const sorted = [...patterns].sort((a, b) => (order[a.severity] || 3) - (order[b.severity] || 3));

        this.patternsEl.innerHTML = sorted.map((pattern, idx) => {
            const def = getPatternDefinition(pattern.type) || {};
            const icon = def.icon || '⚠️';
            const name = def.name || _humanize(pattern.type);

            return `
              <div class="pattern-card appearing severity-${pattern.severity}" data-idx="${idx}">
                <div class="pattern-header">
                  <span class="pattern-icon">${icon}</span>
                  <span class="pattern-name">${name}</span>
                  <span class="severity-badge severity-${pattern.severity}">${pattern.severity}</span>
                </div>
                <div class="pattern-description">${_esc(pattern.description)}</div>
                <div class="pattern-details">
                  <button class="btn btn-highlight btn-secondary" data-idx="${idx}">Highlight</button>
                  <button class="btn btn-learn-more btn-primary" data-type="${pattern.type}">Learn More</button>
                </div>
              </div>`;
        }).join('');

        // Bind button events
        this.patternsEl.querySelectorAll('.btn-highlight').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx);
                this._highlight(sorted[idx]);
            });
        });

        this.patternsEl.querySelectorAll('.btn-learn-more').forEach(btn => {
            btn.addEventListener('click', () => this._showEducation(btn.dataset.type));
        });
    }

    _highlight(pattern) {
        // Clear existing highlights
        this.nodeManager.clearHighlights();
        this.connectionManager.clearConnectionHighlights();

        if (pattern.entities?.length)     this.nodeManager.highlightEntities(pattern.entities);
        if (pattern.transactions?.length) this.connectionManager.highlightConnections(pattern.transactions);

        // Auto-clear after 4 seconds
        setTimeout(() => {
            this.nodeManager.clearHighlights();
            this.connectionManager.clearConnectionHighlights();
        }, 4000);
    }

    _showEducation(type) {
        const def = getPatternDefinition(type);
        if (!def || !this.eduModal) return;

        this.eduTitle.textContent = def.name;
        this.eduContent.innerHTML = `
          <div class="pattern-education-section">
            <p>${_esc(def.description)}</p>
          </div>
          <div class="pattern-education-section">
            <h3>Indicators</h3>
            <ul>${def.indicators.map(i => `<li>${_esc(i)}</li>`).join('')}</ul>
          </div>
          <div class="pattern-education-section">
            <h3>Real-World Example</h3>
            <p>${_esc(def.realWorldExample)}</p>
          </div>
          <div class="pattern-education-section">
            <h3>Red Flags</h3>
            <ul>${def.redFlags.map(r => `<li>${_esc(r)}</li>`).join('')}</ul>
          </div>
          <div class="pattern-education-section">
            <h3>Prevention</h3>
            <p>${_esc(def.prevention)}</p>
          </div>
          <div class="pattern-education-section">
            <h3>Legal Consequences</h3>
            <p>${_esc(def.legalConsequences)}</p>
          </div>`;

        this.eduModal.style.display = 'flex';
    }

    _reset() {
        if (this.patternsEl) {
            this.patternsEl.innerHTML = '<div class="no-patterns">No analysis run yet</div>';
        }
    }
}

function _humanize(str) {
    return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
function _esc(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

export default PatternDetector;
