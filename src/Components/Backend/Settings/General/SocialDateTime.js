/**
 * How a feed item's date is written — Premium, in whole.
 *
 * The free build prints the date in the format the Slides panel already carries; converting the
 * timezone, translating the month names and choosing a layout for it are what this adds.
 */

import { __ } from '@wordpress/i18n';

import ProPanel from '../../../Panel/ProPanel';
import { PRO_FEATURES } from '../../../../utils/pro-features';

const SocialDateTime = () => <ProPanel
    title={__('Date & Time Format', 'b-slider')}
    proTitle={__('Premium Date & Time Format', 'b-slider')}
    features={PRO_FEATURES.socialDateTime}
/>;

export default SocialDateTime;
