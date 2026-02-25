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
     * Animate a single transaction: a particle travels along the connection path.
     * Uses dagre to compute edge waypoints in CSS coordinate space so the dot
     * stays on the line at any zoom / pan level.
     */
    animateTransaction(txId, durationMs = Config.timeline.defaultAnimationDuration) {
        const tx = stateManager.getTransaction(txId);
        if (!tx) return;

        const conn = this.connections.get(txId);
        if (!conn) return;

        const container = document.getElementById('nodes-container');
        const color = this._connectionColor(tx);

        const particle = document.createElement('div');
        particle.className = 'transaction-particle';
        particle.style.cssText = `
            position: absolute;
            width: 10px; height: 10px;
            background: ${color};
            border-radius: 50%;
            box-shadow: 0 0 8px ${color};
            pointer-events: none;
            z-index: 500;
            transform: translate(-50%, -50%);
        `;
        container.appendChild(particle);

        conn.setPaintStyle({ stroke: Config.colors.connection.animated, strokeWidth: 3 });

        // Primary: dagre-computed waypoints in CSS coordinate space
        const waypoints = this._buildDagreEdgePoints(tx);

        let startTime = null;

        if (waypoints && waypoints.length >= 2) {
            const animate = (timestamp) => {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / durationMs, 1);
                const pt = this._interpolatePolyline(waypoints, progress);
                particle.style.left = `${pt.x}px`;
                particle.style.top  = `${pt.y}px`;
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    particle.remove();
                    this._restoreConnectionStyle(tx, conn);
                }
            };
            requestAnimationFrame(animate);
            return;
        }

        // Fallback: SVG path with screen-CTM coordinate conversion
        const pathEl = conn.connector?.path;
        if (!pathEl) { particle.remove(); return; }

        const totalLength = pathEl.getTotalLength();
        const canvasEl    = document.getElementById('flow-canvas');

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / durationMs, 1);
            const svgRaw   = pathEl.getPointAtLength(progress * totalLength);

            // Convert SVG-local → screen → #nodes-container CSS space
            const svgPt    = pathEl.ownerSVGElement.createSVGPoint();
            svgPt.x = svgRaw.x;
            svgPt.y = svgRaw.y;
            const screenPt  = svgPt.matrixTransform(pathEl.getScreenCTM());
            const canvasRect = canvasEl.getBoundingClientRect();
            particle.style.left = `${(screenPt.x - canvasRect.left - this.canvas.panX) / this.canvas.zoom}px`;
            particle.style.top  = `${(screenPt.y - canvasRect.top  - this.canvas.panY) / this.canvas.zoom}px`;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                particle.remove();
                this._restoreConnectionStyle(tx, conn);
            }
        };
        requestAnimationFrame(animate);
    }

    /**
     * Build edge waypoints for `tx` in #nodes-container CSS coordinate space
     * using dagre for layout-aware routing.
     *
     * Strategy:
     *  1. Feed every entity to dagre with its actual CSS bounding box.
     *  2. Run dagre.layout() — this assigns dagre-space positions and edge points.
     *  3. Derive a 2-D similarity transform (rotation + scale + translate) from
     *     the source/target node pair: dagre-space → CSS-space.
     *  4. Apply that transform to every edge waypoint so the particle follows a
     *     path in CSS space that preserves the dagre routing shape.
     */
    _buildDagreEdgePoints(tx) {
        if (typeof dagre === 'undefined') return null;

        const g = new dagre.graphlib.Graph({ multigraph: true });
        g.setGraph({ rankdir: 'LR', ranksep: 60, nodesep: 40 });
        g.setDefaultEdgeLabel(() => ({}));

        const cssCenter = {};
        stateManager.getAllEntities().forEach(entity => {
            const el = this.nodeManager.getNodeEl(entity.id);
            if (!el) return;
            const w = el.offsetWidth  || Config.canvas.nodeWidth;
            const h = el.offsetHeight || 120;
            cssCenter[entity.id] = {
                x: (parseFloat(el.style.left) || 0) + w / 2,
                y: (parseFloat(el.style.top)  || 0) + h / 2
            };
            g.setNode(entity.id, { width: w, height: h });
        });

        stateManager.getAllTransactions().forEach(t => {
            if (g.hasNode(t.sourceId) && g.hasNode(t.targetId)) {
                try { g.setEdge(t.sourceId, t.targetId, {}, t.id); } catch (_) {}
            }
        });

        try { dagre.layout(g); } catch (_) { return null; }

        let edgeData = null;
        try {
            edgeData = g.edge({ v: tx.sourceId, w: tx.targetId, name: tx.id });
        } catch (_) {
            try { edgeData = g.edge(tx.sourceId, tx.targetId); } catch (_) {}
        }
        if (!edgeData?.points?.length) return null;

        const srcD = g.node(tx.sourceId);
        const tgtD = g.node(tx.targetId);
        const srcC = cssCenter[tx.sourceId];
        const tgtC = cssCenter[tx.targetId];
        if (!srcD || !tgtD || !srcC || !tgtC) return null;

        // Similarity transform: dagre space → CSS space
        // Using source/target node centres as the two control points.
        // Represents a complex multiplication w = a*z + b where a,b ∈ ℂ.
        const dxD = tgtD.x - srcD.x, dyD = tgtD.y - srcD.y;
        const dxC = tgtC.x - srcC.x, dyC = tgtC.y - srcC.y;
        const lenSqD = dxD * dxD + dyD * dyD;

        if (lenSqD < 1) {
            // Degenerate (source === target in dagre): straight line in CSS space
            const n = edgeData.points.length;
            return edgeData.points.map((_, i) => ({
                x: srcC.x + (i / Math.max(n - 1, 1)) * (tgtC.x - srcC.x),
                y: srcC.y + (i / Math.max(n - 1, 1)) * (tgtC.y - srcC.y)
            }));
        }

        const aRe = (dxC * dxD + dyC * dyD) / lenSqD;
        const aIm = (dyC * dxD - dxC * dyD) / lenSqD;
        const bRe = srcC.x - (aRe * srcD.x - aIm * srcD.y);
        const bIm = srcC.y - (aRe * srcD.y + aIm * srcD.x);

        return edgeData.points.map(p => ({
            x: aRe * p.x - aIm * p.y + bRe,
            y: aRe * p.y + aIm * p.x + bIm
        }));
    }

    /**
     * Interpolate a position at fraction `t` [0,1] along a polyline.
     */
    _interpolatePolyline(points, t) {
        if (points.length === 1) return points[0];
        const segs = [];
        let total = 0;
        for (let i = 0; i < points.length - 1; i++) {
            const len = Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
            segs.push(len);
            total += len;
        }
        if (total === 0) return points[0];
        const target = t * total;
        let acc = 0;
        for (let i = 0; i < segs.length; i++) {
            if (acc + segs[i] >= target || i === segs.length - 1) {
                const segT = segs[i] > 0 ? (target - acc) / segs[i] : 0;
                return {
                    x: points[i].x + segT * (points[i + 1].x - points[i].x),
                    y: points[i].y + segT * (points[i + 1].y - points[i].y)
                };
            }
            acc += segs[i];
        }
        return points[points.length - 1];
    }

    _restoreConnectionStyle(tx, conn) {
        const style = {
            stroke:      this._connectionColor(tx),
            strokeWidth: this._strokeWidth(tx.amount)
        };
        if (tx.flags?.includes('impermissible'))        style.dashstyle = '2 2';
        else if (tx.suspicious)                         style.dashstyle = '4 3';
        else if (tx.relationshipType === 'nested_entity') style.dashstyle = '6 3';
        else if (tx.relationshipType === 'affiliate')     style.dashstyle = '8 4';
        else if (tx.onBehalf)                            style.dashstyle = '6 3';
        conn.setPaintStyle(style);
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
