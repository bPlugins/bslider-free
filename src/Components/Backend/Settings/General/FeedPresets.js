/**
 * The ready-made feed looks — Premium, in whole.
 *
 * Every preset writes a layout the free build does not have for feeds (see `SelectLayout`), so
 * applying one here would leave the slider half-styled by a card it could not honour.
 */

import { __ } from '@wordpress/i18n';

import ProPanel from '../../../Panel/ProPanel';
import { PRO_FEATURES } from '../../../../utils/pro-features';

const FeedPresets = () => <ProPanel
    title={__('Presets', 'b-slider')}
    proTitle={__('Feed Presets', 'b-slider')}
    features={PRO_FEATURES.feedPresets}
    initialOpen={true}
/>;

export default FeedPresets;
