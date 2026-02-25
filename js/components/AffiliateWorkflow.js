/**
 * AffiliateWorkflow.js - Affiliate Due Diligence Confirmation Workflow (F-05)
 * Checks for affiliate entities lacking DD confirmation after nesting analysis.
 */

import eventBus, { Events } from '../utils/eventBus.js';
import stateManager from '../core/StateManager.js';

class AffiliateWorkflow {
    constructor() {
        eventBus.on(Events.NESTING_ANALYSIS_COMPLETED, (result) => {
            this._checkAffiliateDd(result);
        });

        // Handle confirmation from summary panel buttons
        eventBus.on('affiliate:dd:confirmed', ({ entityId }) => {
            stateManager.updateEntity(entityId, {
                metadata:            { ddConfirmed: true },
                permissibilityStatus: 'permissible'
            });
        });
    }

    _checkAffiliateDd(result) {
        if (!result?.affiliateFlow?.hasAffiliate) return;

        const affiliateChainIds = result.affiliateFlow.affiliateChains.flat();
        const pendingEntities = affiliateChainIds
            .map(id => stateManager.getEntity(id))
            .filter(e => e && e.type === 'affiliate' && !e.metadata?.ddConfirmed);

        if (pendingEntities.length > 0) {
            eventBus.emit('affiliate:review:required', { pendingEntities });
        }
    }
}

export default AffiliateWorkflow;
