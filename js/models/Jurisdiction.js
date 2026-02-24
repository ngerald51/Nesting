/**
 * Jurisdiction.js - Jurisdiction Data Model
 * Represents countries/jurisdictions with FATF ratings and risk scores
 */

export class Jurisdiction {
    constructor(config = {}) {
        this.code = config.code; // ISO 2-letter code
        this.name = config.name;
        this.fatfRating = config.fatfRating || 'compliant'; // compliant, enhanced, greylist, blacklisted
        this.fatfScore = config.fatfScore || 50; // 0-100
        this.region = config.region || 'OTHER';
        this.cpi = config.cpi || null; // Corruption Perception Index
        this.secrecyScore = config.secrecyScore || 50; // Financial Secrecy Score 0-100
        this.sanctioned = config.sanctioned || false;
    }

    /**
     * Calculate jurisdiction risk score
     * Higher score = higher risk
     */
    getRiskScore() {
        let score = 0;

        // FATF rating contribution (max 40 points)
        const fatfScores = {
            compliant: 0,
            enhanced: 15,
            greylist: 25,
            blacklisted: 40
        };
        score += fatfScores[this.fatfRating] || 0;

        // Secrecy score contribution (max 30 points)
        score += (this.secrecyScore / 100) * 30;

        // CPI contribution (lower CPI = higher corruption = higher risk, max 20 points)
        if (this.cpi !== null) {
            score += (1 - (this.cpi / 100)) * 20;
        } else {
            score += 10; // Default if no CPI data
        }

        // Sanctioned countries get maximum additional risk (10 points)
        if (this.sanctioned) {
            score += 10;
        }

        return Math.min(100, Math.round(score));
    }

    /**
     * Get risk level category
     */
    getRiskLevel() {
        const score = this.getRiskScore();
        if (score >= 70) return 'critical';
        if (score >= 50) return 'high';
        if (score >= 30) return 'medium';
        return 'low';
    }

    /**
     * Get FATF rating color
     */
    getFATFColor() {
        const colors = {
            compliant: '#4CAF50',
            enhanced: '#FFEB3B',
            greylist: '#FF9800',
            blacklisted: '#F44336'
        };
        return colors[this.fatfRating] || '#9E9E9E';
    }

    /**
     * Get flag emoji (if available)
     */
    getFlagEmoji() {
        if (!this.code || this.code.length !== 2) return '🏳';

        // Convert ISO code to regional indicator symbols
        const codePoints = this.code
            .toUpperCase()
            .split('')
            .map(char => 127397 + char.charCodeAt(0));

        return String.fromCodePoint(...codePoints);
    }

    /**
     * Check if jurisdiction is high risk
     */
    isHighRisk() {
        return this.getRiskLevel() === 'high' || this.getRiskLevel() === 'critical';
    }

    /**
     * Check if jurisdiction is FATF blacklisted
     */
    isBlacklisted() {
        return this.fatfRating === 'blacklisted';
    }

    /**
     * Check if jurisdiction is FATF greylisted
     */
    isGreylisted() {
        return this.fatfRating === 'greylist';
    }

    /**
     * Check if jurisdiction is tax haven (high secrecy score)
     */
    isTaxHaven(threshold = 70) {
        return this.secrecyScore >= threshold;
    }

    /**
     * Get jurisdiction description for tooltips
     */
    getDescription() {
        const parts = [this.name];

        if (this.fatfRating !== 'compliant') {
            const ratings = {
                enhanced: 'Enhanced FATF Monitoring',
                greylist: 'FATF Grey List',
                blacklisted: 'FATF Blacklisted'
            };
            parts.push(ratings[this.fatfRating]);
        }

        if (this.sanctioned) {
            parts.push('Sanctioned');
        }

        if (this.isTaxHaven()) {
            parts.push('Tax Haven');
        }

        if (this.cpi !== null && this.cpi < 50) {
            parts.push('High Corruption');
        }

        return parts.join(' • ');
    }

    /**
     * Serialize to JSON
     */
    toJSON() {
        return {
            code: this.code,
            name: this.name,
            fatfRating: this.fatfRating,
            fatfScore: this.fatfScore,
            region: this.region,
            cpi: this.cpi,
            secrecyScore: this.secrecyScore,
            sanctioned: this.sanctioned
        };
    }

    /**
     * Create from JSON
     */
    static fromJSON(json) {
        return new Jurisdiction(json);
    }
}

export default Jurisdiction;
