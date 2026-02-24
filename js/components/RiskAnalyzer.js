/**
 * RiskAnalyzer.js - Risk Analysis Display
 */

import Config from '../config.js';
import eventBus, { Events } from '../utils/eventBus.js';
import stateManager from '../core/StateManager.js';

class RiskAnalyzer {
    constructor() {
        this.overallEl  = document.getElementById('overall-risk');
        this.topRisksEl = document.getElementById('top-risks');

        eventBus.on(Events.ANALYSIS_COMPLETED, (data) => this._render(data));
        eventBus.on(Events.SIMULATION_LOADED,  ()     => this._reset());
    }

    _render({ overallScore, riskProfiles }) {
        this._renderOverall(overallScore);
        this._renderTopRisks(riskProfiles);
    }

    _renderOverall(score) {
        if (!this.overallEl) return;

        const level = this._level(score);
        const color = Config.colors.risk[level];

        this.overallEl.innerHTML = `
          <div class="risk-meter-container">
            <div class="risk-meter">
              <div class="risk-meter-fill updating" style="width:${score}%;background:${color}"></div>
            </div>
            <div class="risk-score" style="color:${color}">${score}</div>
          </div>
          <div class="risk-label" style="color:${color}">${_cap(level)} Overall Risk</div>
        `;
    }

    _renderTopRisks(riskProfiles) {
        if (!this.topRisksEl) return;
        if (!riskProfiles || riskProfiles.size === 0) {
            this.topRisksEl.innerHTML = '<div style="font-size:12px;color:#9E9E9E">Run analysis first</div>';
            return;
        }

        const top5 = [...riskProfiles.values()]
            .sort((a, b) => b.overallScore - a.overallScore)
            .slice(0, 5);

        this.topRisksEl.innerHTML = top5.map(profile => {
            const entity = stateManager.getEntity(profile.subjectId);
            const name   = entity ? entity.name : profile.subjectId;
            const color  = Config.colors.risk[profile.riskLevel];
            const topFactors = profile.factors
                .sort((a, b) => b.contribution - a.contribution)
                .slice(0, 2);

            return `
              <div class="risk-item risk-${profile.riskLevel}">
                <div class="risk-entity" style="color:${color}">${_esc(name)}</div>
                <div style="font-size:11px;color:#757575;margin-bottom:4px">Score: ${profile.overallScore}</div>
                <div class="risk-factors">
                  ${topFactors.map(f => `
                    <span class="risk-factor">
                      ${f.category} (+${f.contribution})
                    </span>`).join('')}
                </div>
              </div>`;
        }).join('');
    }

    _reset() {
        if (this.overallEl) {
            this.overallEl.innerHTML = `
              <div class="risk-meter-container">
                <div class="risk-meter"><div class="risk-meter-fill" style="width:0%"></div></div>
                <div class="risk-score">0</div>
              </div>
              <div class="risk-label">No Risk Calculated</div>`;
        }
        if (this.topRisksEl) this.topRisksEl.innerHTML = '';
    }

    _level(score) {
        const { thresholds } = Config.risk;
        if (score >= thresholds.critical[0]) return 'critical';
        if (score >= thresholds.high[0])     return 'high';
        if (score >= thresholds.medium[0])   return 'medium';
        return 'low';
    }
}

function _cap(str) { return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''; }
function _esc(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }

export default RiskAnalyzer;
