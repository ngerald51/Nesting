/**
 * PropertyPanel.js - Right Sidebar Properties Editor
 */

import eventBus, { Events } from '../utils/eventBus.js';
import stateManager from '../core/StateManager.js';
import { entityTypes } from '../data/entityTypes.js';
import { jurisdictionsMap } from '../data/jurisdictions.js';
import { formatCurrency, formatDate } from '../utils/helpers.js';
import Config from '../config.js';

class PropertyPanel {
    constructor(nodeManager, connectionManager) {
        this.nodeManager        = nodeManager;
        this.connectionManager  = connectionManager;
        this.contentEl          = document.getElementById('property-content');

        eventBus.on(Events.ENTITY_SELECTED,      (e)  => e ? this._showEntity(e) : this._showEmpty());
        eventBus.on(Events.TRANSACTION_SELECTED, (tx) => tx ? this._showTransaction(tx) : this._showEmpty());
        eventBus.on(Events.ENTITY_UPDATED,       (e)  => {
            if (stateManager.selectedEntityId === e.id) this._showEntity(e);
        });
        eventBus.on(Events.SIMULATION_LOADED, () => this._showEmpty());
    }

    /* ── Entity properties ────────────────────────────── */

    _showEntity(entity) {
        const jurOptions = this._jurisdictionOptions(entity.jurisdiction);
        const typeOptions = entityTypes.map(t =>
            `<option value="${t.id}" ${t.id === entity.type ? 'selected' : ''}>${t.icon} ${t.name}</option>`
        ).join('');

        const riskColor = Config.colors.risk[entity.riskLevel] || '#9E9E9E';

        this.contentEl.innerHTML = `
          <div class="property-group">
            <div class="property-group-title">Entity</div>
            <div class="property-field">
              <label class="property-label">Name</label>
              <input class="property-input" id="pp-name" value="${_esc(entity.name)}">
            </div>
            <div class="property-field">
              <label class="property-label">Type</label>
              <select class="property-select" id="pp-type">${typeOptions}</select>
            </div>
            <div class="property-field">
              <label class="property-label">Jurisdiction</label>
              <select class="property-select" id="pp-jurisdiction">${jurOptions}</select>
            </div>
            <div class="property-field">
              <label class="property-label">Notes</label>
              <textarea class="property-textarea" id="pp-notes">${_esc(entity.metadata?.owner || '')}</textarea>
            </div>
          </div>

          ${entity.riskScore > 0 ? `
          <div class="property-group">
            <div class="property-group-title">Risk Profile</div>
            <div class="risk-meter-container">
              <div class="risk-meter">
                <div class="risk-meter-fill" style="width:${entity.riskScore}%; background:${riskColor}"></div>
              </div>
              <div class="risk-score">${entity.riskScore}</div>
            </div>
            <div style="font-size:12px;color:#757575;margin-bottom:12px">${_cap(entity.riskLevel)} Risk</div>
            ${entity.riskFactors.map(f => `
              <div style="margin-bottom:8px;font-size:12px;">
                <div style="display:flex;justify-content:space-between;margin-bottom:2px">
                  <strong>${f.category}</strong>
                  <span>+${f.contribution}</span>
                </div>
                <div style="color:#757575;font-size:11px">${f.description}</div>
              </div>
            `).join('')}
          </div>` : ''}

          <div class="property-group">
            <div class="property-group-title">Nesting Configuration</div>
            <div class="property-field">
              <label class="property-label">
                <input type="checkbox" id="pp-is-bank" ${entity.isBank ? 'checked' : ''}>
                Is BANK Anchor
              </label>
            </div>
            <div class="property-field">
              <label class="property-label">
                <input type="checkbox" id="pp-same-group" ${entity.sameGroupAmlCtf ? 'checked' : ''}>
                Same Group AML/CTF (F-10 exception)
              </label>
            </div>
            ${entity.type === 'npm_fintech' ? `
            <div class="property-field">
              <label class="property-label">NPM Business Model</label>
              <select class="property-select" id="pp-npm-model">
                <option value="">— Select —</option>
                ${['payment_institution','e_money','remittance','digital_wallet','open_banking'].map(v =>
                    `<option value="${v}" ${entity.npmBusinessModel === v ? 'selected' : ''}>${v.replace(/_/g,' ')}</option>`
                ).join('')}
              </select>
            </div>` : ''}
            ${entity.hopDistance !== null && entity.hopDistance !== undefined ? `
            <div class="property-field">
              <label class="property-label">Hop Distance</label>
              <div class="property-value">${entity.hopDistance === Infinity ? '∞ (unreachable)' : entity.hopDistance}</div>
            </div>` : ''}
            ${entity.permissibilityStatus ? `
            <div class="property-field">
              <label class="property-label">Permissibility</label>
              <div class="property-value">${entity.permissibilityStatus.replace(/_/g,' ')}</div>
            </div>` : ''}
          </div>

          <div class="property-group">
            <div class="property-group-title">Actions</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button class="btn btn-primary" id="pp-save" style="flex:1">Save</button>
              <button class="btn btn-accent" id="pp-connect" style="flex:1">Connect</button>
              <button class="btn btn-secondary" id="pp-delete" style="flex:1">Delete</button>
            </div>
          </div>
        `;

        document.getElementById('pp-save')?.addEventListener('click', () => this._saveEntity(entity.id));
        document.getElementById('pp-connect')?.addEventListener('click', () => {
            this.nodeManager.startConnecting(entity.id);
        });
        document.getElementById('pp-delete')?.addEventListener('click', () => {
            if (confirm(`Delete "${entity.name}"?`)) {
                stateManager.removeEntity(entity.id);
                this._showEmpty();
            }
        });
    }

    _saveEntity(entityId) {
        const isBankEl    = document.getElementById('pp-is-bank');
        const sameGroupEl = document.getElementById('pp-same-group');
        const npmModelEl  = document.getElementById('pp-npm-model');
        const isBank      = isBankEl   ? isBankEl.checked   : false;
        const sameGroup   = sameGroupEl ? sameGroupEl.checked : false;

        const changes = {
            name:            document.getElementById('pp-name').value.trim(),
            type:            document.getElementById('pp-type').value,
            jurisdiction:    document.getElementById('pp-jurisdiction').value,
            metadata:        { owner: document.getElementById('pp-notes').value },
            sameGroupAmlCtf: sameGroup
        };
        if (npmModelEl) changes.npmBusinessModel = npmModelEl.value || null;

        stateManager.updateEntity(entityId, changes);

        // Use dedicated setter for isBank so it emits BANK_ANCHOR_CHANGED
        stateManager.setBankAnchor(entityId, isBank);
    }

    /* ── Transaction properties ───────────────────────── */

    _showTransaction(tx) {
        const source = stateManager.getEntity(tx.sourceId);
        const target = stateManager.getEntity(tx.targetId);

        const methodOptions = [
            ['wire_transfer','Wire Transfer'],
            ['cash','Cash'],
            ['crypto','Crypto'],
            ['check','Check'],
            ['trade','Trade Invoice']
        ].map(([v, l]) => `<option value="${v}" ${v === tx.method ? 'selected' : ''}>${l}</option>`).join('');

        const relTypeOptions = [
            ['','— Select type —'],
            ['respondent','Respondent'],
            ['nested_entity','Nested Entity'],
            ['underlying_customer','Underlying Customer'],
            ['affiliate','Affiliate']
        ].map(([v, l]) =>
            `<option value="${v}" ${v === (tx.relationshipType || '') ? 'selected' : ''}>${l}</option>`
        ).join('');

        const onBehalfOfOptions = [
            `<option value="">— Select entity —</option>`,
            ...stateManager.getAllEntities().map(e =>
                `<option value="${e.id}" ${e.id === tx.onBehalfOf ? 'selected' : ''}>${_esc(e.name)}</option>`
            )
        ].join('');

        this.contentEl.innerHTML = `
          <div class="property-group">
            <div class="property-group-title">Transaction</div>
            <div class="property-field">
              <label class="property-label">From</label>
              <div class="property-value">${_esc(source?.name || tx.sourceId)}</div>
            </div>
            <div class="property-field">
              <label class="property-label">To</label>
              <div class="property-value">${_esc(target?.name || tx.targetId)}</div>
            </div>
            <div class="property-field">
              <label class="property-label">Currency</label>
              <input class="property-input" id="pp-currency" value="${tx.currency}" maxlength="3">
            </div>
            <div class="property-field">
              <label class="property-label">Method</label>
              <select class="property-select" id="pp-method">${methodOptions}</select>
            </div>
            <div class="property-field">
              <label class="property-label">Relationship Type</label>
              <select class="property-select" id="pp-rel-type">${relTypeOptions}</select>
            </div>
            <div class="property-field">
              <label class="property-label">Description</label>
              <input class="property-input" id="pp-desc" value="${_esc(tx.description || '')}">
            </div>
            <div class="property-field">
              <label class="property-label">Formatted</label>
              <div class="property-value">${formatCurrency(tx.amount, tx.currency)}</div>
            </div>
            <div class="property-field">
              <label class="property-label">Cross-Border</label>
              <input type="checkbox" id="pp-cross-border" ${tx.crossBorder ? 'checked' : ''}>
            </div>
            <div class="property-field">
              <label class="property-label">On Behalf</label>
              <input type="checkbox" id="pp-on-behalf" ${tx.onBehalf ? 'checked' : ''}>
            </div>
            <div class="property-field" id="pp-on-behalf-of-row" style="${tx.onBehalf ? '' : 'display:none'}">
              <label class="property-label">On Behalf Of</label>
              <select class="property-select" id="pp-on-behalf-of">${onBehalfOfOptions}</select>
            </div>
          </div>

          ${tx.suspicious ? `
          <div class="property-group">
            <div style="color:var(--color-error);font-weight:600;margin-bottom:8px">⚠ Suspicious</div>
            <ul style="margin:0;padding-left:18px;font-size:12px">
              ${tx.suspicionReasons.map(r => `<li>${r}</li>`).join('')}
            </ul>
          </div>` : ''}

          <div class="property-group">
            <div style="display:flex;gap:8px">
              <button class="btn btn-primary" id="pp-tx-save" style="flex:1">Save</button>
              <button class="btn btn-secondary" id="pp-tx-delete" style="flex:1">Delete</button>
            </div>
          </div>
        `;

        document.getElementById('pp-on-behalf')?.addEventListener('change', (e) => {
            const row = document.getElementById('pp-on-behalf-of-row');
            if (row) row.style.display = e.target.checked ? '' : 'none';
        });

        document.getElementById('pp-tx-save')?.addEventListener('click', () => {
            const onBehalf = document.getElementById('pp-on-behalf').checked;
            stateManager.updateTransaction(tx.id, {
                currency:         (document.getElementById('pp-currency').value || 'USD').toUpperCase().slice(0,3),
                method:           document.getElementById('pp-method').value,
                relationshipType: document.getElementById('pp-rel-type').value || null,
                description:      document.getElementById('pp-desc').value,
                crossBorder:      document.getElementById('pp-cross-border').checked,
                onBehalf,
                onBehalfOf:       onBehalf ? (document.getElementById('pp-on-behalf-of').value || '') : ''
            });
        });

        document.getElementById('pp-tx-delete')?.addEventListener('click', () => {
            if (confirm('Delete this transaction?')) {
                stateManager.removeTransaction(tx.id);
                this._showEmpty();
            }
        });
    }

    /* ── Empty state ──────────────────────────────────── */

    _showEmpty() {
        this.contentEl.innerHTML = `
          <div class="empty-state">
            <p>Select an entity or transaction to view properties</p>
          </div>`;
    }

    /* ── Helpers ──────────────────────────────────────── */

    _jurisdictionOptions(selected) {
        const options = [['US','United States'],['GB','United Kingdom'],['DE','Germany'],
            ['FR','France'],['CH','Switzerland'],['SG','Singapore'],['HK','Hong Kong'],
            ['KY','Cayman Islands'],['BM','Bermuda'],['VG','British Virgin Islands'],
            ['PA','Panama'],['AE','United Arab Emirates'],['IR','Iran'],['KP','North Korea'],
            ['RU','Russia'],['CN','China'],['AU','Australia'],['CA','Canada'],
            ['LU','Luxembourg'],['LI','Liechtenstein']];

        // Add any unknown selected option
        const exists = options.some(([c]) => c === selected);
        if (!exists && selected) options.unshift([selected, selected]);

        return options.map(([code, name]) =>
            `<option value="${code}" ${code === selected ? 'selected' : ''}>${name} (${code})</option>`
        ).join('');
    }
}

function _esc(str) {
    const d = document.createElement('div');
    d.textContent = String(str || '');
    return d.innerHTML;
}
function _cap(str) { return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''; }

export default PropertyPanel;
