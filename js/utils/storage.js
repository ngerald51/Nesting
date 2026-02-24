/**
 * storage.js - LocalStorage Manager
 * Handles persistence of simulations with compression
 */

import Simulation from '../models/Simulation.js';

class StorageManager {
    constructor() {
        this.STORAGE_KEY = 'aml_simulations';
        this.SETTINGS_KEY = 'aml_settings';
        this.RECENT_KEY = 'aml_recent';
        this.MAX_SIMULATIONS = 50;
        this.autoSaveEnabled = true;
        this.autoSaveDelay = 2000; // 2 seconds
        this.autoSaveTimer = null;
    }

    /**
     * Get all simulations
     */
    getAllSimulations() {
        try {
            const compressed = localStorage.getItem(this.STORAGE_KEY);
            if (!compressed) return [];

            // Decompress if LZString is available
            const json = window.LZString
                ? LZString.decompress(compressed)
                : compressed;

            return JSON.parse(json);
        } catch (error) {
            console.error('Failed to load simulations:', error);
            return [];
        }
    }

    /**
     * Save simulation
     */
    saveSimulation(simulation) {
        try {
            const simulations = this.getAllSimulations();
            const index = simulations.findIndex(s => s.id === simulation.id);

            const serialized = simulation.toJSON();

            if (index >= 0) {
                simulations[index] = serialized;
            } else {
                simulations.push(serialized);

                // Limit total simulations
                if (simulations.length > this.MAX_SIMULATIONS) {
                    simulations.shift(); // Remove oldest
                }
            }

            // Compress if LZString is available
            const json = JSON.stringify(simulations);
            const compressed = window.LZString
                ? LZString.compress(json)
                : json;

            localStorage.setItem(this.STORAGE_KEY, compressed);

            // Update recent list
            this.addToRecent(simulation.id);

            return { success: true };
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                return {
                    success: false,
                    error: 'Storage quota exceeded. Please delete old simulations or export to file.'
                };
            }
            console.error('Failed to save simulation:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Load simulation by ID
     */
    loadSimulation(id) {
        try {
            const simulations = this.getAllSimulations();
            const simData = simulations.find(s => s.id === id);

            if (!simData) return null;

            return Simulation.fromJSON(simData);
        } catch (error) {
            console.error('Failed to load simulation:', error);
            return null;
        }
    }

    /**
     * Delete simulation
     */
    deleteSimulation(id) {
        try {
            const simulations = this.getAllSimulations();
            const filtered = simulations.filter(s => s.id !== id);

            const json = JSON.stringify(filtered);
            const compressed = window.LZString
                ? LZString.compress(json)
                : json;

            localStorage.setItem(this.STORAGE_KEY, compressed);

            // Remove from recent
            this.removeFromRecent(id);

            return { success: true };
        } catch (error) {
            console.error('Failed to delete simulation:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get simulation metadata (without full data)
     */
    getSimulationMetadata() {
        const simulations = this.getAllSimulations();
        return simulations.map(sim => ({
            id: sim.id,
            name: sim.name,
            description: sim.description,
            entityCount: sim.entities.length,
            transactionCount: sim.transactions.length,
            createdAt: sim.createdAt,
            updatedAt: sim.updatedAt
        }));
    }

    /**
     * Schedule auto-save
     */
    scheduleAutoSave(simulation) {
        if (!this.autoSaveEnabled) return;

        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
        }

        this.autoSaveTimer = setTimeout(() => {
            const result = this.saveSimulation(simulation);
            if (result.success) {
                this.showNotification('Auto-saved', 'success');
            }
        }, this.autoSaveDelay);
    }

    /**
     * Cancel auto-save
     */
    cancelAutoSave() {
        if (this.autoSaveTimer) {
            clearTimeout(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    /**
     * Add simulation to recent list
     */
    addToRecent(id) {
        try {
            let recent = JSON.parse(localStorage.getItem(this.RECENT_KEY) || '[]');

            // Remove if already exists
            recent = recent.filter(sid => sid !== id);

            // Add to front
            recent.unshift(id);

            // Keep only last 10
            recent = recent.slice(0, 10);

            localStorage.setItem(this.RECENT_KEY, JSON.stringify(recent));
        } catch (error) {
            console.error('Failed to update recent list:', error);
        }
    }

    /**
     * Remove simulation from recent list
     */
    removeFromRecent(id) {
        try {
            let recent = JSON.parse(localStorage.getItem(this.RECENT_KEY) || '[]');
            recent = recent.filter(sid => sid !== id);
            localStorage.setItem(this.RECENT_KEY, JSON.stringify(recent));
        } catch (error) {
            console.error('Failed to update recent list:', error);
        }
    }

    /**
     * Get recent simulations
     */
    getRecentSimulations() {
        try {
            const recentIds = JSON.parse(localStorage.getItem(this.RECENT_KEY) || '[]');
            const simulations = this.getAllSimulations();

            return recentIds
                .map(id => simulations.find(s => s.id === id))
                .filter(Boolean)
                .map(sim => ({
                    id: sim.id,
                    name: sim.name,
                    updatedAt: sim.updatedAt
                }));
        } catch (error) {
            console.error('Failed to get recent simulations:', error);
            return [];
        }
    }

    /**
     * Export simulation to JSON file
     */
    exportToFile(simulation) {
        try {
            const json = JSON.stringify(simulation.toJSON(), null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `${simulation.name.replace(/\s+/g, '_')}_${Date.now()}.json`;
            link.click();

            URL.revokeObjectURL(url);

            return { success: true };
        } catch (error) {
            console.error('Failed to export simulation:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Import simulation from JSON file
     */
    async importFromFile(file) {
        try {
            const text = await this.readFile(file);
            const data = JSON.parse(text);

            // Import classes
            const { default: Simulation } = await import('../models/Simulation.js');

            const simulation = Simulation.fromJSON(data);

            // Generate new ID to avoid conflicts
            const { generateUUID } = await import('./helpers.js');
            simulation.id = generateUUID();
            simulation.name = `${simulation.name} (Imported)`;

            return { success: true, simulation };
        } catch (error) {
            console.error('Failed to import simulation:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Read file as text
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    /**
     * Get/Set settings
     */
    getSettings() {
        try {
            const settings = localStorage.getItem(this.SETTINGS_KEY);
            return settings ? JSON.parse(settings) : this.getDefaultSettings();
        } catch (error) {
            console.error('Failed to load settings:', error);
            return this.getDefaultSettings();
        }
    }

    saveSettings(settings) {
        try {
            localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
            this.applySettings(settings);
            return { success: true };
        } catch (error) {
            console.error('Failed to save settings:', error);
            return { success: false, error: error.message };
        }
    }

    getDefaultSettings() {
        return {
            autoSave: true,
            autoSaveDelay: 2000,
            theme: 'light',
            animationSpeed: 1.0,
            showRiskScores: true,
            showJurisdictionFlags: true,
            defaultJurisdiction: 'US',
            defaultCurrency: 'USD',
            tutorialCompleted: false
        };
    }

    applySettings(settings) {
        this.autoSaveEnabled = settings.autoSave;
        this.autoSaveDelay = settings.autoSaveDelay;
        // Other settings can be applied by components
    }

    /**
     * Clear all storage
     */
    clearAll() {
        if (confirm('This will delete all saved simulations. Are you sure?')) {
            try {
                localStorage.removeItem(this.STORAGE_KEY);
                localStorage.removeItem(this.RECENT_KEY);
                return { success: true };
            } catch (error) {
                console.error('Failed to clear storage:', error);
                return { success: false, error: error.message };
            }
        }
        return { success: false, error: 'Cancelled by user' };
    }

    /**
     * Get storage usage info
     */
    getStorageInfo() {
        try {
            let totalSize = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    totalSize += localStorage[key].length + key.length;
                }
            }

            const sizeKB = (totalSize / 1024).toFixed(2);
            const maxSizeKB = 5120; // ~5MB typical limit
            const percentUsed = ((totalSize / (maxSizeKB * 1024)) * 100).toFixed(1);

            return {
                totalSize: totalSize,
                sizeKB: sizeKB,
                percentUsed: percentUsed,
                simulationCount: this.getAllSimulations().length
            };
        } catch (error) {
            console.error('Failed to get storage info:', error);
            return null;
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // This would integrate with a notification system
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

// Create singleton instance
const storageManager = new StorageManager();

export default storageManager;
export { StorageManager };
