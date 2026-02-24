/**
 * config.js - Application Configuration
 */

const Config = {
    app: {
        name: 'AML Nesting Flow Simulator',
        version: '1.0.0',
        autoSaveInterval: 2000
    },

    canvas: {
        minZoom: 0.2,
        maxZoom: 3.0,
        zoomStep: 0.15,
        defaultZoom: 1.0,
        gridSize: 20,
        nodeWidth: 200,
        nodeMinWidth: 160
    },

    risk: {
        weights: {
            jurisdiction:        0.30,
            entityType:          0.25,
            transactionVolume:   0.20,
            networkCentrality:   0.15,
            patternInvolvement:  0.10
        },
        thresholds: {
            low:      [0,  30],
            medium:   [30, 55],
            high:     [55, 75],
            critical: [75, 100]
        },
        structuringThreshold: 10000,
        structuringTolerance: 0.05   // within 5% of threshold = suspicious
    },

    timeline: {
        defaultAnimationDuration: 1800,  // ms per transaction
        defaultSpeed: 1.0,
        speeds: [0.5, 1, 2, 4]
    },

    storage: {
        maxSimulations: 50,
        compressionEnabled: true
    },

    export: {
        pdfOrientation: 'landscape',
        pdfUnit: 'mm',
        pdfFormat: 'a4'
    },

    colors: {
        stages: {
            placement:   '#F44336',
            layering:    '#FF9800',
            integration: '#4CAF50',
            none:        '#9E9E9E'
        },
        risk: {
            low:      '#4CAF50',
            medium:   '#FFEB3B',
            high:     '#FF5722',
            critical: '#B71C1C'
        },
        fatf: {
            compliant:   '#4CAF50',
            enhanced:    '#FFEB3B',
            greylist:    '#FF9800',
            blacklisted: '#F44336'
        },
        connection: {
            default:  '#607D8B',
            active:   '#2196F3',
            suspect:  '#F44336',
            animated: '#4CAF50'
        }
    }
};

export default Config;
