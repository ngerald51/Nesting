/**
 * helpers.js - Utility Helper Functions
 * Common utility functions used throughout the application
 */

/**
 * Generate a unique ID
 */
export function generateId(prefix = 'id') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate UUID v4
 */
export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Format currency amount
 */
export function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatNumber(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + 'B';
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

/**
 * Format date to readable string
 */
export function formatDate(timestamp, includeTime = true) {
    const date = new Date(timestamp);
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };

    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }

    return date.toLocaleString('en-US', options);
}

/**
 * Format time duration
 */
export function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

/**
 * Debounce function
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function
 */
export function throttle(func, limit = 300) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Deep clone an object
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof Array) return obj.map(item => deepClone(item));

    const clonedObj = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            clonedObj[key] = deepClone(obj[key]);
        }
    }
    return clonedObj;
}

/**
 * Check if two objects are equal (deep comparison)
 */
export function isEqual(obj1, obj2) {
    if (obj1 === obj2) return true;
    if (obj1 == null || obj2 == null) return false;
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
        if (!keys2.includes(key)) return false;
        if (!isEqual(obj1[key], obj2[key])) return false;
    }

    return true;
}

/**
 * Get nested property value safely
 */
export function getNestedValue(obj, path, defaultValue = undefined) {
    const keys = path.split('.');
    let result = obj;

    for (const key of keys) {
        if (result == null || typeof result !== 'object') {
            return defaultValue;
        }
        result = result[key];
    }

    return result !== undefined ? result : defaultValue;
}

/**
 * Set nested property value
 */
export function setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let target = obj;

    for (const key of keys) {
        if (!(key in target) || typeof target[key] !== 'object') {
            target[key] = {};
        }
        target = target[key];
    }

    target[lastKey] = value;
}

/**
 * Clamp a number between min and max
 */
export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 */
export function lerp(start, end, t) {
    return start + (end - start) * t;
}

/**
 * Map value from one range to another
 */
export function mapRange(value, inMin, inMax, outMin, outMax) {
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

/**
 * Calculate distance between two points
 */
export function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate angle between two points
 */
export function angle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * Download data as file
 */
export function downloadFile(data, filename, type = 'text/plain') {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

/**
 * Read file as text
 */
export function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsText(file);
    });
}

/**
 * Read file as JSON
 */
export async function readFileAsJSON(file) {
    const text = await readFileAsText(file);
    return JSON.parse(text);
}

/**
 * Escape HTML to prevent XSS
 */
export function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Parse query string to object
 */
export function parseQueryString(queryString) {
    const params = {};
    const searchParams = new URLSearchParams(queryString);
    for (const [key, value] of searchParams) {
        params[key] = value;
    }
    return params;
}

/**
 * Build query string from object
 */
export function buildQueryString(params) {
    return new URLSearchParams(params).toString();
}

/**
 * Get random item from array
 */
export function randomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Shuffle array (Fisher-Yates)
 */
export function shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Group array by key
 */
export function groupBy(array, key) {
    return array.reduce((groups, item) => {
        const groupKey = typeof key === 'function' ? key(item) : item[key];
        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(item);
        return groups;
    }, {});
}

/**
 * Sort array by multiple keys
 */
export function sortBy(array, ...keys) {
    return [...array].sort((a, b) => {
        for (const key of keys) {
            const aVal = typeof key === 'function' ? key(a) : a[key];
            const bVal = typeof key === 'function' ? key(b) : b[key];
            if (aVal < bVal) return -1;
            if (aVal > bVal) return 1;
        }
        return 0;
    });
}

/**
 * Remove duplicates from array
 */
export function unique(array, key) {
    if (!key) {
        return [...new Set(array)];
    }

    const seen = new Set();
    return array.filter(item => {
        const k = typeof key === 'function' ? key(item) : item[key];
        if (seen.has(k)) {
            return false;
        }
        seen.add(k);
        return true;
    });
}

/**
 * Wait for specified milliseconds
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry async function with exponential backoff
 */
export async function retry(fn, maxAttempts = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (attempt === maxAttempts) throw error;
            await sleep(delay * Math.pow(2, attempt - 1));
        }
    }
}

/**
 * Create a cancelable promise
 */
export function makeCancelable(promise) {
    let hasCanceled = false;

    const wrappedPromise = new Promise((resolve, reject) => {
        promise.then(
            value => hasCanceled ? reject({ isCanceled: true }) : resolve(value),
            error => hasCanceled ? reject({ isCanceled: true }) : reject(error)
        );
    });

    return {
        promise: wrappedPromise,
        cancel() {
            hasCanceled = true;
        }
    };
}

export default {
    generateId,
    generateUUID,
    formatCurrency,
    formatNumber,
    formatDate,
    formatDuration,
    debounce,
    throttle,
    deepClone,
    isEqual,
    getNestedValue,
    setNestedValue,
    clamp,
    lerp,
    mapRange,
    distance,
    angle,
    downloadFile,
    readFileAsText,
    readFileAsJSON,
    escapeHTML,
    parseQueryString,
    buildQueryString,
    randomItem,
    shuffle,
    groupBy,
    sortBy,
    unique,
    sleep,
    retry,
    makeCancelable
};
