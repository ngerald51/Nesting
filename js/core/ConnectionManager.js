/**
 * ConnectionManager.js - Transaction Connections and Flow Animations
 */

import Config from '../config.js';
import eventBus, { Events } from '../utils/eventBus.js';
import stateManager from './StateManager.js';
import { formatCurrency } from '../utils/helpers.js';

class ConnectionManager {
    constructor(canvas, nodeManager) {
        this.canvas      = canvas;
        this.nodeManager = nodeManager;
        this.jsPlumb     = null;

        // txId -> jsPlumb connection object
        this.connections = new Map();

        eventBus.on('canvas:ready', (instance) => {
            this.jsPlumb = instance;
            this._bindJsPlumbEvents();
        });
        if (canvas.jsPlumb) {
            this.jsPlumb = canvas.jsPlumb;
            this._bindJsPlumbEvents();
        }

        eventBus.on(Events.TRANSACTION_ADDED,   tx => this.renderConnection(tx));
        eventBus.on(Events.TRANSACTION_UPDATED, tx => this._refreshLabel(tx));
        eventBus.on(Events.TRANSACTION_REMOVED, ({txId}) => this.removeConnection(txId));
        eventBus.on(Events.SIMULATION_LOADED,   ()  => this._reloadAll());
        eventBus.on(Events.ANALYSIS_COMPLETED,  ()  => this._colorSuspicious());
        eventBus.on(Events.NESTING_ANALYSIS_COMPLETED, () => this._colorAllConnections());
        eventBus.on(Events.IMPERMISSIBLE_DETECTED, ({ tx }) => this._flagImpermissible(tx));
    }

    /* ── Render ───────────────────────────────────────── */

    renderConnection(tx) {
        if (!this.jsPlumb) {
            eventBus.once('canvas:ready', () => this.renderConnection(tx));
            return;
        }

        const sourceEl = this.nodeManager.getNodeEl(tx.sourceId);
        const targetEl = this.nodeManager.getNodeEl(tx.targetId);
        if (!sourceEl || !targetEl) return;

        const color = this._connectionColor(tx);

        const paintStyle = {
            stroke:      color,
            strokeWidth: this._strokeWidth(tx.amount)
        };
        if (tx.flags?.includes('impermissible')) {
            paintStyle.dashstyle = '2 2';
        } else if (tx.suspicious) {
            paintStyle.dashstyle = '4 3';
        } else if (tx.relationshipType === 'nested_entity') {
            paintStyle.dashstyle = '6 3';
        } else if (tx.relationshipType === 'affiliate') {
            paintStyle.dashstyle = '8 4';
        } else if (tx.onBehalf) {
            paintStyle.dashstyle = '6 3';
        }

        const relAbbrev = this._humanizeRel(tx.relationshipType);
        const labelText = tx.currency + (relAbbrev ? ` · ${relAbbrev}` : '');

        const conn = this.jsPlumb.connect({
            source:    sourceEl,
            target:    targetEl,
            anchors:   ['Continuous', 'Continuous'],
            connector: ['Flowchart', { cornerRadius: 6, stub: 30 }],
            paintStyle,
            hoverPaintStyle: { stroke: Config.colors.connection.active, strokeWidth: 3 },
            overlays: [
                ['Arrow', { width: 12, length: 12, location: 1 }],
                ['Label', {
                    label:    `<span class="connection-label">${labelText}</span>`,
                    cssClass: 'connection-label-overlay',
                    location: 0.5
                }]
            ]
        });
        if (this.jsPlumb) this.jsPlumb.repaintEverything();

        if (conn) {
            this.connections.set(tx.id, conn);

            // Click on connection → select transaction
            conn.bind('click', () => stateManager.selectTransaction(tx.id));
        }
    }

    removeConnection(txId) {
        const conn = this.connections.get(txId);
        if (!conn) return;
        if (this.jsPlumb) this.jsPlumb.deleteConnection(conn);
        this.connections.delete(txId);
    }

    _reloadAll() {
        // Delete all existing connections
        this.connections.forEach((conn) => {
            if (this.jsPlumb) this.jsPlumb.deleteConnection(conn);
        });
        this.connections.clear();

        // Re-render from simulation after nodes have rendered
        setTimeout(() => {
            stateManager.getAllTransactions().forEach(tx => this.renderConnection(tx));
        }, 50);
    }

    /* ── Animation ────────────────────────────────────── */

    /**
     * Animate a single transaction: a particle travels along the connection path
     */
    animateTransaction(txId, durationMs = Config.timeline.defaultAnimationDuration) {
        const tx = stateManager.getTransaction(txId);
        if (!tx) return;

        const conn = this.connections.get(txId);
        if (!conn) return;

        // Get path element from jsPlumb SVG
        const pathEl = conn.connector.path;
        if (!pathEl) return;

        const container = document.getElementById('nodes-container');
        const totalLength = pathEl.getTotalLength();

        const particle = document.createElement('div');
        particle.className = 'transaction-particle';
        particle.style.cssText = `
            position: absolute;
            width: 10px; height: 10px;
            background: ${this._connectionColor(tx)};
            border-radius: 50%;
            box-shadow: 0 0 8px ${this._connectionColor(tx)};
            pointer-events: none;
            z-index: 500;
            transform: translate(-50%, -50%);
        `;
        container.appendChild(particle);

        // Highlight the connection while animating
        conn.setPaintStyle({ stroke: Config.colors.connection.animated, strokeWidth: 3 });

        let startTime = null;

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / durationMs, 1);
            const point = pathEl.getPointAtLength(progress * totalLength);

            // Offset by pan/zoom of the container
            const rect = container.getBoundingClientRect();
            const canvasRect = document.getElementById('flow-canvas').getBoundingClientRect();

            // Point is in SVG space which matches canvas space
            particle.style.left = `${point.x}px`;
            particle.style.top  = `${point.y}px`;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                particle.remove();
                // Restore original style
                const restored = {
                    stroke:      this._connectionColor(tx),
                    strokeWidth: this._strokeWidth(tx.amount)
                };
                if (tx.suspicious)  restored.dashstyle = '4 3';
                else if (tx.onBehalf) restored.dashstyle = '6 3';
                conn.setPaintStyle(restored);
            }
        };

        requestAnimationFrame(animate);
    }

    /* ── Analysis coloring ────────────────────────────── */

    _colorSuspicious() {
        stateManager.getAllTransactions().forEach(tx => {
            const conn = this.connections.get(tx.id);
            if (!conn) return;
            const style = {
                stroke:      this._connectionColor(tx),
                strokeWidth: this._strokeWidth(tx.amount)
            };
            if (tx.suspicious)  style.dashstyle = '4 3';
            else if (tx.onBehalf) style.dashstyle = '6 3';
            conn.setPaintStyle(style);
        });
    }

    _refreshLabel(tx) {
        const conn = this.connections.get(tx.id);
        if (!conn) return;
        // Update the label overlay
        const overlays = conn.getOverlays();
        Object.values(overlays).forEach(overlay => {
            if (overlay.type === 'Label') {
                overlay.setLabel(`<span class="connection-label">${tx.currency}</span>`);
            }
        });
        // Repaint
        if (this.jsPlumb) this.jsPlumb.repaintEverything();
    }

    /* ── Helpers ──────────────────────────────────────── */

    _connectionColor(tx) {
        if (tx.flags?.includes('impermissible')) return '#B71C1C';
        if (tx.suspicious)  return Config.colors.connection.suspect;
        if (tx.relationshipType && Config.colors.connection[tx.relationshipType]) {
            return Config.colors.connection[tx.relationshipType];
        }
        if (tx.crossBorder && tx.onBehalf) return '#1565C0'; // dark blue — both flags
        if (tx.crossBorder) return '#2196F3';                // blue — cross-border
        if (tx.onBehalf)    return '#7B1FA2';                // purple — on-behalf
        if (tx.method === 'crypto') return '#9C27B0';
        if (tx.method === 'cash')   return '#FF9800';
        return Config.colors.connection.default;
    }

    _humanizeRel(r) {
        return { respondent: 'Resp', nested_entity: 'Nested', underlying_customer: 'UC', affiliate: 'Aff' }[r] || '';
    }

    _flagImpermissible(tx) {
        const conn = this.connections.get(tx.id);
        if (!conn) return;
        conn.setPaintStyle({ stroke: '#B71C1C', strokeWidth: 3, dashstyle: '2 2' });
    }

    _colorAllConnections() {
        stateManager.getAllTransactions().forEach(tx => {
            const conn = this.connections.get(tx.id);
            if (!conn) return;
            const style = {
                stroke:      this._connectionColor(tx),
                strokeWidth: this._strokeWidth(tx.amount)
            };
            if (tx.flags?.includes('impermissible')) {
                style.dashstyle = '2 2';
            } else if (tx.suspicious) {
                style.dashstyle = '4 3';
            } else if (tx.relationshipType === 'nested_entity') {
                style.dashstyle = '6 3';
            } else if (tx.relationshipType === 'affiliate') {
                style.dashstyle = '8 4';
            } else if (tx.onBehalf) {
                style.dashstyle = '6 3';
            }
            conn.setPaintStyle(style);
        });
    }

    _strokeWidth(amount) {
        if (amount >= 10_000_000) return 6;
        if (amount >= 1_000_000)  return 4;
        if (amount >= 100_000)    return 3;
        return 2;
    }

    _bindJsPlumbEvents() {
        // Connection drag-to-create support (optional)
        this.jsPlumb.bind('connection', (info) => {
            // Allow jsPlumb drag-to-connect (if endpoints are added)
        });
    }

    highlightConnections(txIds) {
        this.connections.forEach((conn, txId) => {
            if (txIds.includes(txId)) {
                conn.setPaintStyle({ stroke: Config.colors.connection.active, strokeWidth: 4 });
            } else {
                const tx = stateManager.getTransaction(txId);
                if (tx) conn.setPaintStyle({ stroke: this._connectionColor(tx), strokeWidth: this._strokeWidth(tx.amount) });
            }
        });
    }

    clearConnectionHighlights() {
        this.connections.forEach((conn, txId) => {
            const tx = stateManager.getTransaction(txId);
            if (!tx) return;
            const style = {
                stroke:      this._connectionColor(tx),
                strokeWidth: this._strokeWidth(tx.amount)
            };
            if (tx.suspicious)  style.dashstyle = '4 3';
            else if (tx.onBehalf) style.dashstyle = '6 3';
            conn.setPaintStyle(style);
        });
    }
}

export default ConnectionManager;
