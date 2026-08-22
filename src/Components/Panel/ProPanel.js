/**
 * A panel whose whole contents are Premium — badge in the title, upsell card inside.
 *
 * For a section that has no free half at all. Where a panel is drawn for both builds and only its
 * body changes, the card alone is what is wanted: that is `ProCard`, which this is built from, so the
 * pricing link is written once for both forms.
 *
 * @props title (required): (String) panel title, shown next to the badge
 * @props proTitle (optional): (String) heading inside the card; defaults to `Premium <title>`
 * @props features (required): (Array) names from `PRO_FEATURES`
 * @props initialOpen (optional): false (Boolean)
 */

import { __, sprintf } from '@wordpress/i18n';

import { PanelBody } from './AccordionPanel';
import ProCard from './ProCard';
import { PremiumBadge } from '../../../../bpl-tools/ProControls';
import { DEMO_URL } from '../../utils/functions';

const ProPanel = ({ title, proTitle, features = [], initialOpen = false }) => {
	/* `bPlPanelBody` carries the panel look — open border and title colour — like every other panel. */
	return <PanelBody className='bPlPanelBody' title={<> {title}<PremiumBadge /></>} initialOpen={initialOpen}>
		<ProCard
			title={proTitle || sprintf(
				/* translators: %s: the panel's title, e.g. "Button". */
				__('Premium %s', 'b-slider'), title)}
			features={features}
			demoUrl={DEMO_URL}
		/>
	</PanelBody>;
};

export default ProPanel;
