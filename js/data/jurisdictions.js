/**
 * jurisdictions.js - Jurisdiction Reference Data
 * Country data with FATF ratings, corruption indices, and secrecy scores
 */

import Jurisdiction from '../models/Jurisdiction.js';

export const jurisdictionsData = [
    // Major Compliant Jurisdictions
    {
        code: 'US',
        name: 'United States',
        fatfRating: 'compliant',
        fatfScore: 95,
        region: 'AMERICAS',
        cpi: 67,
        secrecyScore: 60,
        sanctioned: false
    },
    {
        code: 'GB',
        name: 'United Kingdom',
        fatfRating: 'compliant',
        fatfScore: 93,
        region: 'EUROPE',
        cpi: 73,
        secrecyScore: 70,
        sanctioned: false
    },
    {
        code: 'DE',
        name: 'Germany',
        fatfRating: 'compliant',
        fatfScore: 96,
        region: 'EUROPE',
        cpi: 79,
        secrecyScore: 45,
        sanctioned: false
    },
    {
        code: 'FR',
        name: 'France',
        fatfRating: 'compliant',
        fatfScore: 94,
        region: 'EUROPE',
        cpi: 71,
        secrecyScore: 48,
        sanctioned: false
    },
    {
        code: 'JP',
        name: 'Japan',
        fatfRating: 'compliant',
        fatfScore: 92,
        region: 'ASIA',
        cpi: 73,
        secrecyScore: 35,
        sanctioned: false
    },
    {
        code: 'CA',
        name: 'Canada',
        fatfRating: 'compliant',
        fatfScore: 94,
        region: 'AMERICAS',
        cpi: 74,
        secrecyScore: 52,
        sanctioned: false
    },
    {
        code: 'AU',
        name: 'Australia',
        fatfRating: 'compliant',
        fatfScore: 93,
        region: 'ASIA_PACIFIC',
        cpi: 75,
        secrecyScore: 42,
        sanctioned: false
    },
    {
        code: 'CH',
        name: 'Switzerland',
        fatfRating: 'compliant',
        fatfScore: 92,
        region: 'EUROPE',
        cpi: 82,
        secrecyScore: 76,
        sanctioned: false
    },
    {
        code: 'SG',
        name: 'Singapore',
        fatfRating: 'compliant',
        fatfScore: 90,
        region: 'ASIA',
        cpi: 83,
        secrecyScore: 68,
        sanctioned: false
    },
    {
        code: 'HK',
        name: 'Hong Kong',
        fatfRating: 'compliant',
        fatfScore: 88,
        region: 'ASIA',
        cpi: 76,
        secrecyScore: 72,
        sanctioned: false
    },

    // Tax Havens / High Secrecy
    {
        code: 'KY',
        name: 'Cayman Islands',
        fatfRating: 'enhanced',
        fatfScore: 65,
        region: 'AMERICAS',
        cpi: null,
        secrecyScore: 88,
        sanctioned: false
    },
    {
        code: 'BM',
        name: 'Bermuda',
        fatfRating: 'enhanced',
        fatfScore: 68,
        region: 'AMERICAS',
        cpi: null,
        secrecyScore: 85,
        sanctioned: false
    },
    {
        code: 'VG',
        name: 'British Virgin Islands',
        fatfRating: 'enhanced',
        fatfScore: 62,
        region: 'AMERICAS',
        cpi: null,
        secrecyScore: 91,
        sanctioned: false
    },
    {
        code: 'PA',
        name: 'Panama',
        fatfRating: 'greylist',
        fatfScore: 55,
        region: 'AMERICAS',
        cpi: 36,
        secrecyScore: 82,
        sanctioned: false
    },
    {
        code: 'LU',
        name: 'Luxembourg',
        fatfRating: 'compliant',
        fatfScore: 89,
        region: 'EUROPE',
        cpi: 77,
        secrecyScore: 73,
        sanctioned: false
    },
    {
        code: 'LI',
        name: 'Liechtenstein',
        fatfRating: 'compliant',
        fatfScore: 86,
        region: 'EUROPE',
        cpi: null,
        secrecyScore: 78,
        sanctioned: false
    },
    {
        code: 'MC',
        name: 'Monaco',
        fatfRating: 'enhanced',
        fatfScore: 70,
        region: 'EUROPE',
        cpi: null,
        secrecyScore: 75,
        sanctioned: false
    },

    // FATF Grey List (Enhanced Monitoring)
    {
        code: 'AE',
        name: 'United Arab Emirates',
        fatfRating: 'greylist',
        fatfScore: 58,
        region: 'MENA',
        cpi: 68,
        secrecyScore: 70,
        sanctioned: false
    },
    {
        code: 'TR',
        name: 'Turkey',
        fatfRating: 'greylist',
        fatfScore: 52,
        region: 'MENA',
        cpi: 41,
        secrecyScore: 58,
        sanctioned: false
    },
    {
        code: 'PK',
        name: 'Pakistan',
        fatfRating: 'greylist',
        fatfScore: 45,
        region: 'ASIA',
        cpi: 27,
        secrecyScore: 52,
        sanctioned: false
    },
    {
        code: 'JM',
        name: 'Jamaica',
        fatfRating: 'greylist',
        fatfScore: 50,
        region: 'AMERICAS',
        cpi: 44,
        secrecyScore: 48,
        sanctioned: false
    },
    {
        code: 'YE',
        name: 'Yemen',
        fatfRating: 'greylist',
        fatfScore: 35,
        region: 'MENA',
        cpi: 16,
        secrecyScore: 45,
        sanctioned: false
    },

    // FATF Black List
    {
        code: 'IR',
        name: 'Iran',
        fatfRating: 'blacklisted',
        fatfScore: 10,
        region: 'MENA',
        cpi: 25,
        secrecyScore: 48,
        sanctioned: true
    },
    {
        code: 'KP',
        name: 'North Korea',
        fatfRating: 'blacklisted',
        fatfScore: 5,
        region: 'ASIA',
        cpi: 17,
        secrecyScore: 35,
        sanctioned: true
    },

    // Other Notable Jurisdictions
    {
        code: 'RU',
        name: 'Russia',
        fatfRating: 'enhanced',
        fatfScore: 48,
        region: 'EUROPE',
        cpi: 28,
        secrecyScore: 62,
        sanctioned: true
    },
    {
        code: 'CN',
        name: 'China',
        fatfRating: 'compliant',
        fatfScore: 75,
        region: 'ASIA',
        cpi: 42,
        secrecyScore: 58,
        sanctioned: false
    },
    {
        code: 'BR',
        name: 'Brazil',
        fatfRating: 'compliant',
        fatfScore: 78,
        region: 'AMERICAS',
        cpi: 38,
        secrecyScore: 50,
        sanctioned: false
    },
    {
        code: 'IN',
        name: 'India',
        fatfRating: 'compliant',
        fatfScore: 80,
        region: 'ASIA',
        cpi: 40,
        secrecyScore: 46,
        sanctioned: false
    },
    {
        code: 'MX',
        name: 'Mexico',
        fatfRating: 'compliant',
        fatfScore: 72,
        region: 'AMERICAS',
        cpi: 31,
        secrecyScore: 52,
        sanctioned: false
    },
    {
        code: 'ZA',
        name: 'South Africa',
        fatfRating: 'greylist',
        fatfScore: 55,
        region: 'AFRICA',
        cpi: 43,
        secrecyScore: 49,
        sanctioned: false
    },
    {
        code: 'NG',
        name: 'Nigeria',
        fatfRating: 'enhanced',
        fatfScore: 42,
        region: 'AFRICA',
        cpi: 24,
        secrecyScore: 54,
        sanctioned: false
    },
    {
        code: 'MY',
        name: 'Malaysia',
        fatfRating: 'compliant',
        fatfScore: 82,
        region: 'ASIA',
        cpi: 47,
        secrecyScore: 62,
        sanctioned: false
    },
    {
        code: 'TH',
        name: 'Thailand',
        fatfRating: 'compliant',
        fatfScore: 76,
        region: 'ASIA',
        cpi: 36,
        secrecyScore: 55,
        sanctioned: false
    },
    {
        code: 'AR',
        name: 'Argentina',
        fatfRating: 'compliant',
        fatfScore: 70,
        region: 'AMERICAS',
        cpi: 38,
        secrecyScore: 50,
        sanctioned: false
    },
];

// Create Jurisdiction instances
export const jurisdictions = jurisdictionsData.map(data => new Jurisdiction(data));

// Create a Map for quick lookup by code
export const jurisdictionsMap = new Map(
    jurisdictions.map(j => [j.code, j])
);

/**
 * Get jurisdiction by code
 */
export function getJurisdiction(code) {
    return jurisdictionsMap.get(code);
}

/**
 * Get all high-risk jurisdictions
 */
export function getHighRiskJurisdictions() {
    return jurisdictions.filter(j => j.isHighRisk());
}

/**
 * Get blacklisted jurisdictions
 */
export function getBlacklistedJurisdictions() {
    return jurisdictions.filter(j => j.isBlacklisted());
}

/**
 * Get greylisted jurisdictions
 */
export function getGreylistedJurisdictions() {
    return jurisdictions.filter(j => j.isGreylisted());
}

/**
 * Get tax havens
 */
export function getTaxHavens() {
    return jurisdictions.filter(j => j.isTaxHaven());
}

export default jurisdictions;
