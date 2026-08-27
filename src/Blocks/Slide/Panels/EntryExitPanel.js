import { __, sprintf } from '@wordpress/i18n';
import { SelectControl } from '@wordpress/components';
import { PanelBody } from '../../../Components/Panel/AccordionPanel';
import ProNotice from '../../../Components/Panel/ProNotice';
import { PremiumBadge, PremiumPanel } from '../../../../../bpl-tools/ProControls';
import { adminUrl, DEMO_URL } from '../../../utils/functions';
import { proFeatureSentence, PRO_FEATURES } from '../../../utils/pro-features';
import { entryDelayOpt, entryEffectOpt } from '../../../utils/options';

/**
 * When the layer arrives, and when it leaves.
 *
 * Entry is free, with a handful of preset delays — enough to put one layer after another.
 * Fine-tuned timing (an exact delay/duration instead of a preset) and Exit animation are both
 * Premium — named in a plain notice under the preset rather than as a control of their own,
 * since there is nothing here for such a control to do. Exit sits in its own badged sub-panel so
 * a user who never touches Entry still sees that it exists and is a Pro feature.
 */
const EntryExitPanel = ({ layer, update }) => {
	const entry = layer.entry || {};

	return <>
		<SelectControl
			label={__('Entry animation', 'b-slider')}
			value={entry.effect || ''}
			options={entryEffectOpt}
			onChange={val => update('entry', { effect: val })}
		/>

		{entry.effect && <>
			<SelectControl
				label={__('Start after', 'b-slider')}
				value={String(entry.delay ?? 0)}
				options={entryDelayOpt.map(o => ({ ...o, value: String(o.value) }))}
				onChange={val => update('entry', { delay: parseFloat(val) })}
			/>

			<ProNotice className='mt10' features={PRO_FEATURES.layerTiming} />
		</>}

		<PanelBody className='bPlPanelBody mt10' title={<>{__('Exit Animation', 'b-slider')}<PremiumBadge /></>} initialOpen={false}>
			<PremiumPanel
				title={sprintf(__('Premium %s', 'b-slider'), __('Exit Animation', 'b-slider'))}
				description={proFeatureSentence(PRO_FEATURES.layerTiming)}
				pricingUrl={adminUrl()}
				demoUrl={DEMO_URL}
			/>
		</PanelBody>
	</>;
};

export default EntryExitPanel;
