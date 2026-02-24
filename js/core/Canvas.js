/**
 * Canvas.js - Flow Canvas with Zoom, Pan, and jsPlumb Integration
 */

import Config from '../config.js';
import eventBus, { Events } from '../utils/eventBus.js';
import { clamp } from '../utils/helpers.js';

class Canvas {
    constructor() {
        this.zoom   = Config.canvas.defaultZoom;
        this.panX   = 0;
        this.panY   = 0;
        this._isPanning  = false;
        this._panStartX  = 0;
        this._panStartY  = 0;
        this._panOriginX = 0;
        this._panOriginY = 0;

        this.canvasEl    = document.getElementById('flow-canvas');
        this.nodesEl     = document.getElementById('nodes-container');

        // jsPlumb instance (set after ready)
        this.jsPlumb = null;
        this._initJsPlumb();
        this._bindEvents();
    }

    /* ── jsPlumb ──────────────────────────────────────── */

    _initJsPlumb() {
        // jsPlumb 2.x exposes itself as a global
        if (typeof jsPlumb === 'undefined') {
            console.error('jsPlumb not loaded');
            return;
        }

        jsPlumb.ready(() => {
            this.jsPlumb = jsPlumb.getInstance({
                Container:          this.nodesEl,
                ConnectionsDetachable: false,
                PaintStyle:         { stroke: Config.colors.connection.default, strokeWidth: 2 },
                HoverPaintStyle:    { stroke: Config.colors.connection.active,  strokeWidth: 3 },
                ConnectorStyle:     { stroke: Config.colors.connection.default, strokeWidth: 2 },
                Connector:          ['Flowchart', { cornerRadius: 6, stub: 30 }],
                Endpoint:           'Blank',
                Anchor:             'Continuous'
            });

            // Emit so NodeManager / ConnectionManager know jsPlumb is ready
            eventBus.emit('canvas:ready', this.jsPlumb);
        });
    }

    /* ── Events ───────────────────────────────────────── */

    _bindEvents() {
        // Zoom — mousewheel on canvas
        this.canvasEl.addEventListener('wheel', this._onWheel.bind(this), { passive: false });

        // Pan — mousedown only on bare canvas (not nodes)
        this.canvasEl.addEventListener('mousedown', this._onPanStart.bind(this));
        document.addEventListener('mousemove',  this._onPanMove.bind(this));
        document.addEventListener('mouseup',    this._onPanEnd.bind(this));

        // Toolbar zoom buttons
        document.getElementById('btn-zoom-in')?.addEventListener('click', () => this.zoomIn());
        document.getElementById('btn-zoom-out')?.addEventListener('click', () => this.zoomOut());
        document.getElementById('btn-zoom-reset')?.addEventListener('click', () => this.resetZoom());
        document.getElementById('btn-fit-view')?.addEventListener('click', () => this.fitView());
    }

    _onWheel(e) {
        e.preventDefault();
        const factor = e.deltaY < 0 ? (1 + Config.canvas.zoomStep) : (1 - Config.canvas.zoomStep);
        this._applyZoom(this.zoom * factor);
    }

    _onPanStart(e) {
        // Only pan when clicking directly on canvas, grid, or empty nodes-container — not on a node
        if (e.target !== this.canvasEl &&
            e.target !== document.getElementById('canvas-grid') &&
            e.target !== this.nodesEl) return;
        if (e.button !== 0) return;
        this._isPanning = true;
        this._panStartX  = e.clientX;
        this._panStartY  = e.clientY;
        this._panOriginX = this.panX;
        this._panOriginY = this.panY;
        this.canvasEl.style.cursor = 'grabbing';
    }

    _onPanMove(e) {
        if (!this._isPanning) return;
        this.panX = this._panOriginX + (e.clientX - this._panStartX);
        this.panY = this._panOriginY + (e.clientY - this._panStartY);
        this._applyTransform();
        if (this.jsPlumb) this.jsPlumb.repaintEverything();
    }

    _onPanEnd() {
        if (!this._isPanning) return;
        this._isPanning = false;
        this.canvasEl.style.cursor = 'grab';
    }

    /* ── Zoom controls ────────────────────────────────── */

    _applyZoom(newZoom) {
        this.zoom = clamp(newZoom, Config.canvas.minZoom, Config.canvas.maxZoom);
        this._applyTransform();
        if (this.jsPlumb) this.jsPlumb.setZoom(this.zoom);
        eventBus.emit(Events.CANVAS_ZOOM, this.zoom);
    }

    _applyTransform() {
        this.nodesEl.style.transform =
            `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
    }

    zoomIn()    { this._applyZoom(this.zoom * (1 + Config.canvas.zoomStep)); }
    zoomOut()   { this._applyZoom(this.zoom * (1 - Config.canvas.zoomStep)); }
    resetZoom() { this.zoom = 1; this.panX = 0; this.panY = 0; this._applyTransform(); if (this.jsPlumb) this.jsPlumb.setZoom(1); }

    fitView() {
        const nodes = this.nodesEl.querySelectorAll('.entity-node');
        if (nodes.length === 0) { this.resetZoom(); return; }

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        nodes.forEach(node => {
            const x = parseInt(node.style.left) || 0;
            const y = parseInt(node.style.top)  || 0;
            const w = node.offsetWidth  || Config.canvas.nodeWidth;
            const h = node.offsetHeight || 120;
            minX = Math.min(minX, x);     minY = Math.min(minY, y);
            maxX = Math.max(maxX, x + w); maxY = Math.max(maxY, y + h);
        });

        const padding = 60;
        const contentW = maxX - minX + padding * 2;
        const contentH = maxY - minY + padding * 2;
        const canvasRect = this.canvasEl.getBoundingClientRect();

        const scaleX = canvasRect.width  / contentW;
        const scaleY = canvasRect.height / contentH;
        const newZoom = clamp(Math.min(scaleX, scaleY), Config.canvas.minZoom, Config.canvas.maxZoom);

        this.zoom = newZoom;
        this.panX = (canvasRect.width  - contentW * newZoom) / 2 - (minX - padding) * newZoom;
        this.panY = (canvasRect.height - contentH * newZoom) / 2 - (minY - padding) * newZoom;
        this._applyTransform();
        if (this.jsPlumb) this.jsPlumb.setZoom(this.zoom);
    }

    /* ── Helpers for other components ─────────────────── */

    /**
     * Convert a client-space point to canvas-space (accounting for pan+zoom)
     */
    clientToCanvas(clientX, clientY) {
        const rect = this.canvasEl.getBoundingClientRect();
        return {
            x: (clientX - rect.left - this.panX) / this.zoom,
            y: (clientY - rect.top  - this.panY) / this.zoom
        };
    }

    getState() {
        return { zoom: this.zoom, panX: this.panX, panY: this.panY };
    }
}

export default Canvas;
