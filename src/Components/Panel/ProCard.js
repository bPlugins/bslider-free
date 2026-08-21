/**
 * The upsell card that stands in for a section's controls, inside a panel that already exists.
 *
 * `ProPanel` is the whole-panel form: it makes its own `PanelBody`, badges the title and puts a card
 * inside. Six places wanted only the card — a panel drawn for both builds, whose body is the real
 * controls with a licence and this without one — so they each wrote `PremiumPanel` out with the same
 * `pricingUrl={adminUrl()}` and `buttonLabel` beside a description. That is the boilerplate
 * `ProPanel` was made to remove, and the reason it could not be used here is only that it brings a
 * panel with it.
 *
 * So the pricing link lives in one place for both forms now, and `ProPanel` is written in terms of
 * this rather than repeating it.
 *
 * The description is prose here rather than composed from `PRO_FEATURES`. A card has room for a
 * sentence that says what the feature is *for* — "prevent exceeding API rate limits" is the reason
 * to want a cache time, which a list of control names cannot say. `features` is offered for the
 * cards that would rather name controls, and `proFeatureSentence` composes those; a caller gives one
 * or the other.
 *
 * @props title (required): (String) heading inside the card
 * @props description (optional): (String) prose; used in preference to `features`
 * @props features (optional): (Array) names from `PRO_FEATURES`, composed when there is no prose
 * @props demoUrl (optional): (String) links the heading out; omitted means no link, as before
 */

import { __ } from '@wordpress/i18n';

import { PremiumPanel } from '../../../../bpl-tools/ProControls';
import { adminUrl } from '../../utils/functions';
import { proFeatureSentence } from '../../utils/pro-features';

const ProCard = ({ title, description, features = [], demoUrl = '' }) => {
	return <PremiumPanel
		title={title}
		description={description || proFeatureSentence(features)}
		pricingUrl={adminUrl()}
		demoUrl={demoUrl}
		buttonLabel={__('Get Pro', 'b-slider')}
	/>;
};

export default ProCard;
