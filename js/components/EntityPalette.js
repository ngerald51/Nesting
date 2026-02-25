/**
 * EntityPalette.js - Left Sidebar Entity Palette
 * Allows drag-and-drop of entity types onto the canvas
 */

import eventBus, { Events } from '../utils/eventBus.js';
import stateManager from '../core/StateManager.js';
import { entityTypes } from '../data/entityTypes.js';
import Config from '../config.js';

class EntityPalette {
    constructor(canvas, nodeManager) {
        this.canvas      = canvas;
        this.nodeManager = nodeManager;

        this.paletteEl = document.getElementById('palette-items');
        this.canvasEl  = document.getElementById('flow-canvas');

        this._render();
        this._bindDropTarget();
    }

    _render() {
        this.paletteEl.innerHTML = '';

        entityTypes.forEach(typeDef => {
            const item = document.createElement('div');
            item.className      = 'palette-item';
            item.draggable      = true;
            item.dataset.type   = typeDef.id;
            item.title          = typeDef.tooltip || typeDef.description;

            item.innerHTML = `
              <span class="palette-item-icon">${typeDef.icon}</span>
              <div class="palette-item-info">
                <div class="palette-item-name">${typeDef.name}</div>
                <div class="palette-item-description">${typeDef.description}</div>
              </div>
            `;

            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('entityType', typeDef.id);
                e.dataTransfer.effectAllowed = 'copy';
                item.style.opacity = '0.5';
            });
            item.addEventListener('dragend', () => { item.style.opacity = '1'; });

            // Double-click to add at centre of canvas
            item.addEventListener('dblclick', () => {
                const rect = this.canvasEl.getBoundingClientRect();
                const pos  = this.canvas.clientToCanvas(
                    rect.left + rect.width  / 2 + Math.random() * 80 - 40,
                    rect.top  + rect.height / 2 + Math.random() * 80 - 40
                );
                this._createEntity(typeDef.id, pos);
            });

            this.paletteEl.appendChild(item);
        });
    }

    _bindDropTarget() {
        this.canvasEl.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        this.canvasEl.addEventListener('drop', (e) => {
            e.preventDefault();
            const type = e.dataTransfer.getData('entityType');
            if (!type) return;

            const pos = this.canvas.clientToCanvas(e.clientX, e.clientY);
            this._createEntity(type, pos);
        });
    }

    _createEntity(type, pos) {
        const typeDef = entityTypes.find(t => t.id === type);
        if (!typeDef) return;

        stateManager.addEntity({
            type,
            name:        typeDef.name,
            jurisdiction:'US',
            amlStage:    typeDef.amlStage || null,
            position:    {
                x: Math.max(10, Math.round(pos.x)),
                y: Math.max(10, Math.round(pos.y))
            }
        });
    }
}

function _cap(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

export default EntityPalette;
