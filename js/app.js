/**
 * app.js - Application Entry Point
 * Initialises all components and wires them together
 */

import Canvas             from './core/Canvas.js';
import NodeManager        from './core/NodeManager.js';
import ConnectionManager  from './core/ConnectionManager.js';
import stateManager       from './core/StateManager.js';

import EntityPalette      from './components/EntityPalette.js';
import PropertyPanel      from './components/PropertyPanel.js';
import TimelinePlayer     from './components/TimelinePlayer.js';
import RiskAnalyzer       from './components/RiskAnalyzer.js';
import PatternDetector    from './components/PatternDetector.js';
import ExportManager      from './components/ExportManager.js';
import Toolbar            from './components/Toolbar.js';
import NestingSummaryPanel from './components/NestingSummaryPanel.js';
import AffiliateWorkflow  from './components/AffiliateWorkflow.js';

import storageManager     from './utils/storage.js';

// ── Boot ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Apply saved settings
    const settings = storageManager.getSettings();
    storageManager.applySettings(settings);

    // Core rendering layer
    const canvas            = new Canvas();
    const nodeManager       = new NodeManager(canvas);
    const connectionManager = new ConnectionManager(canvas, nodeManager);

    // Analysis components (register listeners before simulation loads)
    const riskAnalyzer     = new RiskAnalyzer();
    const patternDetector  = new PatternDetector(nodeManager, connectionManager);

    // Nesting analysis components (register before simulation loads)
    const nestingSummaryPanel = new NestingSummaryPanel();
    const affiliateWorkflow   = new AffiliateWorkflow();

    // Expose stateManager globally for NestingSummaryPanel's lazy helper
    window._stateManager = stateManager;

    // Interaction components
    const entityPalette  = new EntityPalette(canvas, nodeManager);
    const propertyPanel  = new PropertyPanel(nodeManager, connectionManager);
    const timelinePlayer = new TimelinePlayer(connectionManager);
    const exportManager  = new ExportManager();
    const toolbar        = new Toolbar(exportManager);

    // ── Canvas click: deselect / cancel connecting ──────
    document.getElementById('flow-canvas')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('flow-canvas') ||
            e.target === document.getElementById('canvas-grid') ||
            e.target === document.getElementById('nodes-container')) {
            if (stateManager.connectingFromId) {
                stateManager.cancelConnecting();
                nodeManager.clearHighlights();
            } else {
                stateManager.clearSelection();
            }
        }
    });

    // ── Keyboard shortcuts ───────────────────────────────
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.key) {
            case 'Delete':
            case 'Backspace': {
                if (stateManager.selectedEntityId) {
                    const entity = stateManager.getEntity(stateManager.selectedEntityId);
                    if (entity && confirm(`Delete "${entity.name}"?`)) {
                        stateManager.removeEntity(stateManager.selectedEntityId);
                    }
                } else if (stateManager.selectedTransactionId) {
                    if (confirm('Delete this transaction?')) {
                        stateManager.removeTransaction(stateManager.selectedTransactionId);
                    }
                }
                break;
            }
            case 'Escape': {
                stateManager.cancelConnecting();
                nodeManager.clearHighlights();
                break;
            }
            case 's': {
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    stateManager.saveSimulation();
                }
                break;
            }
        }
    });

    // ── Show "connecting" cursor hint ────────────────────
    // Import Events dynamically to avoid circular imports at module load
    import('./utils/eventBus.js').then(({ default: eventBus, Events }) => {
        eventBus.on(Events.ENTITY_SELECTED, (entity) => {
            const canvas = document.getElementById('flow-canvas');
            if (!canvas) return;
            // Visual hint when in connecting mode is handled by node highlight
        });
    });

    console.log('[AML Simulator] Application initialised successfully.');
});
