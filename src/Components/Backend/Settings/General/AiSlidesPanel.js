import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { Button, TextareaControl, RangeControl, Spinner, Notice } from '@wordpress/components';
import { PanelBody } from '../../../Panel/AccordionPanel';
import HelpTip from '../../../Panel/HelpTip';
import useAiStatus from '../../../../hooks/useAiStatus';
import useAiSlides from '../../../../hooks/useAiSlides';
import { MAX_SLIDES } from '../../../../utils/aiSlides';

const Title = __('Slides with AI', 'b-slider');

/** Without a connector, the way to set one up instead of a box that can only fail. */
const SetupNote = ({ supported }) => {
	const canManage = useSelect(select => select('core').canUser('update', 'settings'), []);

	return <>
		<small className='bsb_field_hint'>
			{supported
				? __('To use this, set up an AI service under Settings → Connectors.', 'b-slider')
				: __('This uses the AI built into WordPress 7.0 and newer. Update WordPress, then set up an AI service under Settings → Connectors.', 'b-slider')}
		</small>
		{supported && canManage && <Button className='mt10' variant='secondary' href={`${window.location.origin}/wp-admin/options-connectors.php`} target='_blank' rel='noopener noreferrer'>{__('Set up AI', 'b-slider')}</Button>}
	</>;
};

/** Add or replace a Blocks slider's slides from one line, through the site's WordPress AI connector. */
const AiSlidesPanel = ({ clientId }) => {
	const [brief, setBrief] = useState('');
	const [count, setCount] = useState(3);
	const status = useAiStatus();
	const ai = useAiSlides({ clientId });

	// Hidden for roles below the AI capability (Contributors by default).
	if (status.loading || !status.allowed) {
		return null;
	}

	return <PanelBody className='bPlPanelBody' title={Title} badge={__('New', 'b-slider')} initialOpen={false}>
		{!status.ready ? <SetupNote supported={status.supported} /> : <div className='bsbAiSlides'>
			<TextareaControl
				label={<>
					{__('What is this slider for?', 'b-slider')}
					<HelpTip label={__('About slides with AI', 'b-slider')}>
						{__('The AI writes a label, a headline, a short text and a button for each slide, and picks colours that suit the subject. Everything it makes is normal blocks you can edit.', 'b-slider')}
					</HelpTip>
				</>}
				value={brief}
				onChange={val => { setBrief(val); ai.clear(); }}
				placeholder={__('e.g. A coffee shop’s autumn menu', 'b-slider')}
				rows={3}
				disabled={ai.busy}
			/>

			<RangeControl
				label={__('How many slides', 'b-slider')}
				value={count}
				onChange={val => setCount(val || 1)}
				min={1}
				max={MAX_SLIDES}
				disabled={ai.busy}
			/>

			<div className='bsbAiActions mt10'>
				<Button variant='primary' onClick={() => ai.create(brief, count)} disabled={ai.busy || !brief.trim() || !!ai.pending}>
					{ai.busy ? <><Spinner /> {__('Making slides…', 'b-slider')}</> : __('Create slides', 'b-slider')}
				</Button>
			</div>

			{ai.pending && <Notice status='warning' isDismissible={false} className='mt10'>
				<p>{__('This slider already has slides. Replace them, or add the new ones at the end?', 'b-slider')}</p>
				<div className='bsbAiActions mt10'>
					<Button variant='primary' isDestructive onClick={ai.replace}>{__('Replace', 'b-slider')}</Button>
					<Button variant='secondary' onClick={ai.append}>{__('Add to end', 'b-slider')}</Button>
					<Button variant='tertiary' onClick={ai.cancel}>{__('Cancel', 'b-slider')}</Button>
				</div>
			</Notice>}

			{ai.message && <Notice status='success' isDismissible={false} className='mt10'>{ai.message}</Notice>}
			{ai.error && <Notice status='error' isDismissible={false} className='mt10'>{ai.error}</Notice>}
		</div>}
	</PanelBody>;
};

export default AiSlidesPanel;
