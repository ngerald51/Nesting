/**
 * eventBus.js - Event Bus for Component Communication
 * Simple publish-subscribe pattern for decoupled component communication
 */

class EventBus {
    constructor() {
        this.events = {};
    }

    /**
     * Subscribe to an event
     */
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);

        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    /**
     * Unsubscribe from an event
     */
    off(event, callback) {
        if (!this.events[event]) return;

        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }

    /**
     * Emit an event
     */
    emit(event, data) {
        if (!this.events[event]) return;

        this.events[event].forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event handler for "${event}":`, error);
            }
        });
    }

    /**
     * Subscribe to event once (auto-unsubscribe after first call)
     */
    once(event, callback) {
        const wrapper = (data) => {
            callback(data);
            this.off(event, wrapper);
        };
        this.on(event, wrapper);
    }

    /**
     * Clear all listeners for an event
     */
    clear(event) {
        if (event) {
            delete this.events[event];
        } else {
            this.events = {};
        }
    }

    /**
     * Get count of listeners for an event
     */
    listenerCount(event) {
        return this.events[event] ? this.events[event].length : 0;
    }
}

// Create singleton instance
const eventBus = new EventBus();

// Define event names as constants for consistency
export const Events = {
    // Entity events
    ENTITY_ADDED: 'entity:added',
    ENTITY_REMOVED: 'entity:removed',
    ENTITY_UPDATED: 'entity:updated',
    ENTITY_SELECTED: 'entity:selected',
    ENTITY_MOVED: 'entity:moved',

    // Transaction events
    TRANSACTION_ADDED: 'transaction:added',
    TRANSACTION_REMOVED: 'transaction:removed',
    TRANSACTION_UPDATED: 'transaction:updated',
    TRANSACTION_SELECTED: 'transaction:selected',

    // Simulation events
    SIMULATION_LOADED: 'simulation:loaded',
    SIMULATION_CLEARED: 'simulation:cleared',
    SIMULATION_SAVED: 'simulation:saved',

    // Analysis events
    ANALYSIS_STARTED: 'analysis:started',
    ANALYSIS_COMPLETED: 'analysis:completed',
    PATTERN_DETECTED: 'pattern:detected',
    RISK_CALCULATED: 'risk:calculated',

    // UI events
    CANVAS_ZOOM: 'canvas:zoom',
    CANVAS_PAN: 'canvas:pan',
    MODAL_OPEN: 'modal:open',
    MODAL_CLOSE: 'modal:close',

    // Timeline events
    TIMELINE_PLAY: 'timeline:play',
    TIMELINE_PAUSE: 'timeline:pause',
    TIMELINE_STEP: 'timeline:step',

    // Nesting analysis events
    NESTING_ANALYSIS_COMPLETED: 'nesting:analysis:completed',
    IMPERMISSIBLE_DETECTED:     'nesting:impermissible:detected',
    DOUBLE_NESTING_DETECTED:    'nesting:double:detected',
    BANK_ANCHOR_CHANGED:        'nesting:bank:changed',
    NPM_MODEL_CHANGED:          'nesting:npm:model:changed'
};

export default eventBus;
