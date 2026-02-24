/**
 * TimelinePlayer.js - Simulation Playback Controls
 */

import Config from '../config.js';
import eventBus, { Events } from '../utils/eventBus.js';
import stateManager from '../core/StateManager.js';

class TimelinePlayer {
    constructor(connectionManager) {
        this.connectionManager = connectionManager;

        this.transactions = [];
        this.currentIndex = 0;
        this.isPlaying    = false;
        this.speed        = 1.0;
        this._playTimer   = null;

        this._bindUI();

        eventBus.on(Events.SIMULATION_LOADED,    () => this._reset());
        eventBus.on(Events.TRANSACTION_ADDED,    () => this._refreshTransactions());
        eventBus.on(Events.TRANSACTION_REMOVED,  () => this._refreshTransactions());
    }

    _bindUI() {
        document.getElementById('btn-play')?.addEventListener('click', () => this.play());
        document.getElementById('btn-pause')?.addEventListener('click', () => this.pause());
        document.getElementById('btn-stop')?.addEventListener('click', () => this.stop());
        document.getElementById('btn-step-back')?.addEventListener('click', () => this.stepBack());
        document.getElementById('btn-step-forward')?.addEventListener('click', () => this.stepForward());

        document.getElementById('playback-speed')?.addEventListener('change', (e) => {
            this.speed = parseFloat(e.target.value) || 1;
        });

        document.getElementById('timeline-scrubber')?.addEventListener('input', (e) => {
            const idx = Math.round((parseInt(e.target.value) / 100) * (this.transactions.length - 1));
            this.currentIndex = Math.max(0, Math.min(idx, this.transactions.length - 1));
            this._updateUI();
        });
    }

    _refreshTransactions() {
        const wasPlaying = this.isPlaying;
        if (wasPlaying) this.pause();

        this.transactions = stateManager.getAllTransactions()
            .sort((a, b) => a.timestamp - b.timestamp || a.sequence - b.sequence);

        this._updateUI();
        if (wasPlaying) this.play();
    }

    _reset() {
        this.stop();
        this._refreshTransactions();
    }

    /* ── Playback ─────────────────────────────────────── */

    play() {
        if (this.isPlaying) return;
        if (this.transactions.length === 0) return;

        this.isPlaying = true;
        this._togglePlayPauseButtons(true);

        if (this.currentIndex >= this.transactions.length) {
            this.currentIndex = 0;
        }

        this._playNext();
    }

    _playNext() {
        if (!this.isPlaying || this.currentIndex >= this.transactions.length) {
            this.isPlaying = false;
            this._togglePlayPauseButtons(false);
            return;
        }

        const tx = this.transactions[this.currentIndex];
        const duration = Math.round(Config.timeline.defaultAnimationDuration / this.speed);

        // Animate the connection
        this.connectionManager.animateTransaction(tx.id, duration);

        this.currentIndex++;
        this._updateUI();

        this._playTimer = setTimeout(() => this._playNext(), duration + 200);
    }

    pause() {
        this.isPlaying = false;
        clearTimeout(this._playTimer);
        this._togglePlayPauseButtons(false);
    }

    stop() {
        this.isPlaying = false;
        clearTimeout(this._playTimer);
        this.currentIndex = 0;
        this._togglePlayPauseButtons(false);
        this._updateUI();
    }

    stepForward() {
        if (this.currentIndex < this.transactions.length) {
            const tx = this.transactions[this.currentIndex];
            this.connectionManager.animateTransaction(tx.id, 600);
            this.currentIndex++;
            this._updateUI();
        }
    }

    stepBack() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this._updateUI();
        }
    }

    /* ── UI sync ──────────────────────────────────────── */

    _updateUI() {
        const total   = this.transactions.length;
        const current = this.currentIndex;
        const pct     = total > 0 ? Math.round((current / total) * 100) : 0;

        const scrubber = document.getElementById('timeline-scrubber');
        if (scrubber) scrubber.value = pct;

        const currentEl = document.getElementById('timeline-current');
        const totalEl   = document.getElementById('timeline-total');
        if (currentEl) currentEl.textContent = current;
        if (totalEl)   totalEl.textContent   = total;
    }

    _togglePlayPauseButtons(playing) {
        const playBtn  = document.getElementById('btn-play');
        const pauseBtn = document.getElementById('btn-pause');
        if (playBtn)  playBtn.style.display  = playing ? 'none'         : 'inline-flex';
        if (pauseBtn) pauseBtn.style.display = playing ? 'inline-flex' : 'none';
    }
}

export default TimelinePlayer;
