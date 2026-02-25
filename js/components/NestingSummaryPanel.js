/**
 * NestingSummaryPanel.js - Nesting Analysis Summary UI
 * Renders summary panel (F-14), canvas banners (F-07, F-09), and escalation display.
 */

import eventBus, { Events } from '../utils/eventBus.js';

class NestingSummaryPanel {
    constructor() {
        this.contentEl  = document.getElementById('nesting-summary-content');
        this.bannerEl   = document.getElementById('canvas-banner-container');
        this._lastResult = null;

        eventBus.on(Events.NESTING_ANALYSIS_COMPLETED, (result) => {
            this._lastResult = result;
            this._render(result);
            this._updateBanners(result);
        });

        eventBus.on(Events.IMPERMISSIBLE_DETECTED, (data) => {
            this._showImpermissibleBanner(data);
        });

        eventBus.on(Events.DOUBLE_NESTING_DETECTED, ({ chains }) => {
            this._showDoubleNestingBanner(chains);
        });

        eventBus.on(Events.SIMULATION_LOADED, () => {
            this._clearBanners();
            if (this.contentEl) {
                this.contentEl.innerHTML = '<div class="no-patterns">Run analysis to see nesting summary</div>';
            }
        });

        // Affiliate DD confirmation workflow
        eventBus.on('affiliate:review:required', (data) => {
            this._renderAffiliateDDButtons(data);
        });
    }

    /* ── Main render ───────────────────────────────────── */

    _render(result) {
        if (!this.contentEl) return;
        if (!result) {
            this.contentEl.innerHTML = '<div class="no-patterns">Run analysis to see nesting summary</div>';
            return;
        }

        const type   = result.nestingType;
        const typeLabel = {
            primary:       'Primary Nesting',
            affiliate:     'Affiliate Nesting',
            double:        'Double Nesting',
            impermissible: 'Impermissible Nesting',
            null:          'No Nesting Detected'
        }[type] || 'No Nesting Detected';

        const typeClass = type ? `nesting-${type}` : 'nesting-none';

        // Hop distribution
        const hopCounts = { 0: 0, 1: 0, 2: 0, '3+': 0 };
        if (result.hopMap) {
            result.hopMap.forEach((hop) => {
                if (hop === Infinity) return;
                if (hop === 0)      hopCounts[0]++;
                else if (hop === 1) hopCounts[1]++;
                else if (hop === 2) hopCounts[2]++;
                else                hopCounts['3+']++;
            });
        }

        const hopRows = [
            [0,   hopCounts[0],  'Low'],
            [1,   hopCounts[1],  'Moderate'],
            [2,   hopCounts[2],  'High (CDD Gap)'],
            ['3+',hopCounts['3+'],'Critical (Double Nesting)']
        ].map(([h, count, riskLabel]) => `
            <tr class="hop-row hop-${Math.min(+h || 3, 3)}">
              <td>${h}</td>
              <td>${count}</td>
              <td>${riskLabel}</td>
            </tr>
        `).join('');

        const impCount   = result.impermissiblePairs?.length || 0;
        const cddCount   = result.cddGapCount || 0;
        const dblCount   = result.doubleNestingChains?.length || 0;
        const multiCount = result.multiNpmClusters?.length || 0;

        this.contentEl.innerHTML = `
          <div class="nesting-type-badge ${typeClass}">${typeLabel}</div>

          <div style="font-size:12px;font-weight:600;color:#757575;margin-bottom:4px">Hop Distribution</div>
          <table class="nesting-hop-table">
            <thead>
              <tr>
                <th>Hop</th>
                <th>Count</th>
                <th>Risk Level</th>
              </tr>
            </thead>
            <tbody>${hopRows}</tbody>
          </table>

          <div class="nesting-flags">
            <div>🚫 Impermissible Pairs: <strong>${impCount}</strong></div>
            <div>⚠️ CDD Gap Entities: <strong>${cddCount}</strong></div>
            <div>🪆🪆 Double Nesting Chains: <strong>${dblCount}</strong></div>
            <div>⚠️ Multi-NPM Clusters: <strong>${multiCount}</strong></div>
          </div>
          <div id="affiliate-dd-section"></div>
        `;
    }

    /* ── Canvas banners ───────────────────────────────── */

    _updateBanners(result) {
        if (!this.bannerEl) return;
        this._clearBanners();

        if (result.impermissiblePairs?.length > 0) {
            this._addBanner(
                'banner-impermissible',
                `🚫 ${result.impermissiblePairs.length} IMPERMISSIBLE CONNECTION(S) DETECTED`,
                false   // persistent
            );
        }

        if (result.doubleNestingChains?.length > 0) {
            // Amber if all entities in chains have sameGroupAmlCtf
            const { simulation } = this._getStateManager();
            let allSameGroup = false;
            if (simulation) {
                const chainIds = result.doubleNestingChains.flat();
                allSameGroup = chainIds.length > 0 &&
                    chainIds.every(id => simulation.entities.get(id)?.sameGroupAmlCtf);
            }
            const bannerClass = allSameGroup ? 'banner-amber' : 'banner-double-nesting';
            const msg = allSameGroup
                ? `🪆 Double Nesting Detected — Same Group AML/CTF Exception Applied`
                : `🪆🪆 DOUBLE NESTING DETECTED: ${result.doubleNestingChains.length} chain(s) at hop ≥ 3`;
            this._addBanner(bannerClass, msg, false);
        }
    }

    _showImpermissibleBanner(data) {
        if (!this.bannerEl) return;
        this._addBanner(
            'banner-impermissible',
            `🚫 IMPERMISSIBLE CONNECTION: ${data.pair?.reason || 'NPM/Bank ↔ Money Service Business'}`,
            8000   // auto-dismiss in 8s
        );
    }

    _showDoubleNestingBanner(chains) {
        if (!this.bannerEl) return;
        this._addBanner(
            'banner-double-nesting',
            `🪆🪆 DOUBLE NESTING DETECTED: ${chains.length} chain(s) with entities at hop ≥ 3`,
            10000  // auto-dismiss in 10s
        );
    }

    _addBanner(cls, text, autoDismissMs) {
        if (!this.bannerEl) return;
        const banner = document.createElement('div');
        banner.className = `canvas-banner ${cls}`;
        banner.innerHTML = `
          <span>${text}</span>
          <button class="banner-dismiss" title="Dismiss">×</button>
        `;
        banner.querySelector('.banner-dismiss').addEventListener('click', () => banner.remove());
        this.bannerEl.appendChild(banner);

        if (autoDismissMs) {
            setTimeout(() => banner.remove(), autoDismissMs);
        }
    }

    _clearBanners() {
        if (this.bannerEl) this.bannerEl.innerHTML = '';
    }

    /* ── Affiliate DD buttons ─────────────────────────── */

    _renderAffiliateDDButtons(data) {
        const section = document.getElementById('affiliate-dd-section');
        if (!section || !data?.pendingEntities?.length) return;

        section.innerHTML = `
          <div style="margin-top:8px;font-size:12px;font-weight:600;color:#E65100">
            Affiliate DD Confirmation Required
          </div>
          ${data.pendingEntities.map(e => `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px;font-size:12px">
              <span>${e.name}</span>
              <button class="btn btn-primary btn-confirm-dd" data-entity-id="${e.id}" style="padding:2px 8px;font-size:11px">Confirm DD</button>
            </div>
          `).join('')}
        `;

        section.querySelectorAll('.btn-confirm-dd').forEach(btn => {
            btn.addEventListener('click', () => {
                const entityId = btn.dataset.entityId;
                eventBus.emit('affiliate:dd:confirmed', { entityId });
                btn.closest('div').remove();
            });
        });
    }

    /* ── Helpers ──────────────────────────────────────── */

    _getStateManager() {
        // Lazy-load to avoid circular imports at module evaluation
        try {
            const sm = window._stateManager || null;
            return { simulation: sm?.simulation || null };
        } catch {
            return { simulation: null };
        }
    }
}

export default NestingSummaryPanel;
