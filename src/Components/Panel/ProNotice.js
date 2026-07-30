/**
 * The one upsell notice a panel is allowed to show.
 *
 * Takes feature names rather than a finished sentence, so a panel that pulls in a shared control
 * group can hand over both its own list and the group's and still print a single notice — which is
 * what the carousel `Controls` and `Thumbnails` panels used to get wrong, showing two.
 *
 * @props features (required): (Array) names from `PRO_FEATURES`; nested arrays are flattened
 * @props className (optional): 'mt10' (String)
 */

import { Notice } from '../../../../bpl-tools/Components';
import { proFeatureSentence } from '../../utils/pro-features';

const ProNotice = ({ features = [], className }) => {
	const message = proFeatureSentence(features);

	if (!message) {
		return null;
	}

	return <Notice className={className} status='premium' isIcon={true}>{message}</Notice>;
};

export default ProNotice;
