import { PanelBody } from './AccordionPanel';
import { PremiumBadge, PremiumPanel } from '../../../../bpl-tools/ProControls';
import { adminUrl } from '../../utils/functions';
import { TUTORIAL_VIDEOS } from '../../utils/videos';

/** A Pro AI feature: what it does in one sentence, the AI video on the title, and Get Pro. */
const AiProPanel = ({ title, description, initialOpen = false }) => <PanelBody className='bPlPanelBody' title={<>{title}<PremiumBadge /></>} initialOpen={initialOpen}>
	<PremiumPanel
		title={title}
		description={description}
		pricingUrl={adminUrl()}
		demoUrl={TUTORIAL_VIDEOS.styleWithAi}
	/>
</PanelBody>;

export default AiProPanel;
