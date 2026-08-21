/**
 * Keeping a feed's pictures and videos on this site — Premium, in whole.
 *
 * Not the Premium panel with its controls hidden: that panel drives `useFeedMedia`, which posts to
 * `/bsb/v1/feed-media`, and this build does not register that route — `FeedStore` and `FeedMedia`,
 * the classes behind it, are Premium and not shipped. `SocialFeed::storesLocally()` answers false
 * whatever a block asks for, so there is nothing here to switch on.
 *
 * So the panel states what the feature is and stops, rather than offering a toggle that would save
 * a setting the server then ignores.
 */

import { __ } from '@wordpress/i18n';

import ProPanel from '../../../Panel/ProPanel';
import { PRO_FEATURES } from '../../../../utils/pro-features';

const SocialStore = () => <ProPanel
    title={__('Store Locally', 'b-slider')}
    proTitle={__('Store media assets locally', 'b-slider')}
    features={PRO_FEATURES.socialStore}
/>;

export default SocialStore;
