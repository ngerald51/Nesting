/**
 * NodeManager.js - Entity Node Rendering and Interaction
 */

import Config from '../config.js';
import eventBus, { Events } from '../utils/eventBus.js';
import stateManager from './StateManager.js';
import { getEntityType } from '../data/entityTypes.js';
import { getJurisdiction } from '../data/jurisdictions.js';
import { formatCurrency } from '../utils/helpers.js';

class NodeManager {
    constructor(canvas) {
        this.canvas    = canvas;
        this.jsPlumb   = null;
        this.nodeEls   = new Map();   // entityId -> DOM element

        // Wait for jsPlumb to initialise (or use it directly if already ready)
        eventBus.on('canvas:ready', (instance) => {
            this.jsPlumb = instance;
            this._bindJsPlumbEvents();
        });
        if (canvas.jsPlumb) {
            this.jsPlumb = canvas.jsPlumb;
            this._bindJsPlumbEvents();
        }

        // React to state events
        eventBus.on(Events.ENTITY_ADDED,   (e)    => this.renderNode(e));
        eventBus.on(Events.ENTITY_UPDATED, (e)    => this.updateNode(e));
        eventBus.on(Events.ENTITY_REMOVED, ({entityId}) => this.removeNode(entityId));
        eventBus.on(Events.ENTITY_SELECTED,(e)    => this._highlightSelected(e?.id));
        eventBus.on(Events.SIMULATION_LOADED, ()  => this._reloadAll());
        eventBus.on(Events.ANALYSIS_COMPLETED, () => this._refreshRiskBadges());
    }

    /* ── Rendering ────────────────────────────────────── */

    renderNode(entity) {
        if (this.nodeEls.has(entity.id)) {
            this.updateNode(entity);
            return this.nodeEls.get(entity.id);
        }

        const el = document.createElement('div');
        el.id        = `node-${entity.id}`;
        el.className = 'entity-node entering';
        el.dataset.entityId = entity.id;
        el.style.left = `${entity.position.x}px`;
        el.style.top  = `${entity.position.y}px`;

        el.innerHTML = this._buildNodeHTML(entity);

        document.getElementById('nodes-container').appendChild(el);
        this.nodeEls.set(entity.id, el);

        // Remove the "entering" animation class after it plays
        setTimeout(() => el.classList.remove('entering'), 350);

        // Make draggable via jsPlumb when ready
        if (this.jsPlumb) {
            this._makeDraggable(el, entity);
        } else {
            eventBus.once('canvas:ready', () => this._makeDraggable(el, entity));
        }

        // Prevent browser HTML5 drag from intercepting jsPlumb's mouse-based drag
        el.addEventListener('dragstart', (e) => e.preventDefault());

        // Click-to-connect / select
        el.addEventListener('click', (e) => this._onNodeClick(e, entity.id));

        return el;
    }

    updateNode(entity) {
        const el = this.nodeEls.get(entity.id);
        if (!el) { this.renderNode(entity); return; }
        el.innerHTML = this._buildNodeHTML(entity);
        // Click listener is added once in renderNode — do NOT add it again here
    }

    removeNode(entityId) {
        const el = this.nodeEls.get(entityId);
        if (!el) return;

        el.classList.add('exiting');
        setTimeout(() => {
            if (this.jsPlumb) {
                this.jsPlumb.remove(el);
            } else {
                el.remove();
            }
            this.nodeEls.delete(entityId);
        }, 220);
    }

    _reloadAll() {
        // Clear existing nodes
        this.nodeEls.forEach((el, id) => {
            if (this.jsPlumb) this.jsPlumb.remove(el);
            else el.remove();
        });
        this.nodeEls.clear();

        // Render from simulation
        stateManager.getAllEntities().forEach(e => this.renderNode(e));
    }

    _refreshRiskBadges() {
        stateManager.getAllEntities().forEach(entity => {
            const el = this.nodeEls.get(entity.id);
            if (!el) return;
            const badge = el.querySelector('.risk-badge');
            if (!badge) return;
            badge.textContent = entity.riskScore || '';
            badge.className = `risk-badge risk-${entity.riskLevel || 'low'}`;

            // Pulsing for critical
            if (entity.riskLevel === 'critical') el.classList.add('risk-critical-pulse');
            else el.classList.remove('risk-critical-pulse');
        });
    }

    /* ── HTML builder ─────────────────────────────────── */

    _buildNodeHTML(entity) {
        const typeDef = getEntityType(entity.type) || { icon: '❓', name: entity.type };
        const jur     = getJurisdiction(entity.jurisdiction);
        const flag    = jur ? jur.getFlagEmoji() : '🏳';
        const fatfColor = jur ? jur.getFATFColor() : '#9E9E9E';
        const stage   = entity.amlStage || 'none';
        const stageColor = Config.colors.stages[stage] || Config.colors.stages.none;

        return `
          <div class="node-header" style="border-top: 3px solid ${stageColor}">
            <span class="node-icon">${typeDef.icon}</span>
            <div class="node-title">
              <div class="node-name">${_esc(entity.name)}</div>
              <div class="node-type">${typeDef.name}</div>
            </div>
            <span class="node-flag" title="${jur ? jur.getDescription() : entity.jurisdiction}"
                  style="border-bottom: 2px solid ${fatfColor}">${flag}</span>
          </div>
          <div class="node-body">
            <div class="node-field">
              <span class="node-field-label">Jurisdiction</span>
              <span class="node-field-value">${entity.jurisdiction}</span>
            </div>
            <div class="node-field">
              <span class="node-field-label">Stage</span>
              <span class="node-field-value" style="color:${stageColor}">${_cap(stage)}</span>
            </div>
          </div>
          <div class="risk-badge risk-${entity.riskLevel || 'low'}">${entity.riskScore || ''}</div>
          <div class="aml-stage-indicator aml-stage-${stage}"></div>
        `;
    }

    /* ── Dragging ─────────────────────────────────────── */

    _makeDraggable(el, entity) {
        this.jsPlumb.draggable(el, {
            start: () => {
                el.classList.add('dragging');
            },
            drag: (params) => {
                // Update entity position while dragging
                entity.position.x = parseInt(el.style.left) || 0;
                entity.position.y = parseInt(el.style.top)  || 0;
            },
            stop: () => {
                el.classList.remove('dragging');
                entity.position.x = parseInt(el.style.left) || 0;
                entity.position.y = parseInt(el.style.top)  || 0;
                stateManager.updateEntity(entity.id, {
                    position: { x: entity.position.x, y: entity.position.y }
                });
                eventBus.emit(Events.ENTITY_MOVED, entity);
            }
        });
    }

    /* ── Click-to-connect ─────────────────────────────── */

    _onNodeClick(e, entityId) {
        e.stopPropagation();

        if (stateManager.connectingFromId) {
            // Second click — complete the connection
            const tx = stateManager.finishConnecting(entityId);
            this._clearConnectingHighlight();
            if (!tx) {
                this._flashNode(entityId, 'shake');
            }
        } else {
            // First click — select and enter connecting mode
            stateManager.selectEntity(entityId);
            this.startConnecting(entityId);
        }
    }

    startConnecting(entityId) {
        stateManager.startConnecting(entityId);
        const el = this.nodeEls.get(entityId);
        if (el) el.classList.add('highlighted');
    }

    _clearConnectingHighlight() {
        this.nodeEls.forEach(el => el.classList.remove('highlighted'));
    }

    _flashNode(entityId, animClass) {
        const el = this.nodeEls.get(entityId);
        if (!el) return;
        el.classList.add(animClass);
        setTimeout(() => el.classList.remove(animClass), 600);
    }

    /* ── Selection highlight ──────────────────────────── */

    _highlightSelected(entityId) {
        this.nodeEls.forEach((el, id) => {
            el.classList.toggle('selected', id === entityId);
        });
    }

    /* ── jsPlumb connection events ────────────────────── */

    _bindJsPlumbEvents() {
        // (Connections are created programmatically by ConnectionManager)
    }

    /* ── Public helpers ───────────────────────────────── */

    getNodeEl(entityId) {
        return this.nodeEls.get(entityId);
    }

    highlightEntities(entityIds, style = 'pattern-highlight') {
        this.nodeEls.forEach((el, id) => {
            el.classList.toggle(style, entityIds.includes(id));
        });
    }

    clearHighlights() {
        this.nodeEls.forEach(el => {
            el.classList.remove('pattern-highlight', 'highlighted');
        });
    }
}

function _esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function _cap(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

export default NodeManager;
