/**
 * A panel whose whole contents are Premium — badge in the title, upsell card inside.
 *
 * The pricing and demo links used to be written out at each call site; they live in one place now,
 * and the description is composed from the same `PRO_FEATURES` lists the notices use.
 *
 * @props title (required): (String) panel title, shown next to the badge
 * @props proTitle (optional): (String) heading inside the card; defaults to `Premium <title>`
 * @props features (required): (Array) names from `PRO_FEATURES`
 * @props initialOpen (optional): false (Boolean)
 */

import { __, sprintf } from '@wordpress/i18n';

import { PanelBody } from './AccordionPanel';
import { PremiumBadge, PremiumPanel } from '../../../../bpl-tools/ProControls';
import { adminUrl, DEMO_URL } from '../../utils/functions';
import { proFeatureSentence } from '../../utils/pro-features';

const ProPanel = ({ title, proTitle, features = [], initialOpen = false }) => {
	/* `bPlPanelBody` carries the panel look — open border and title colour — like every other panel. */
	return <PanelBody className='bPlPanelBody' title={<> {title}<PremiumBadge /></>} initialOpen={initialOpen}>
		<PremiumPanel
			title={proTitle || sprintf(__('Premium %s', 'b-slider'), title)}
			description={proFeatureSentence(features)}
			pricingUrl={adminUrl()}
			demoUrl={DEMO_URL}
		/>
	</PanelBody>;
};

export default ProPanel;
