import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import useAiStatus from '../../../hooks/useAiStatus';
import useAiSlides from '../../../hooks/useAiSlides';
import { MAX_SLIDES } from '../../../utils/aiSlides';

const Title = () => <h3>{__('Create with AI', 'b-slider')}</h3>;

const Intro = () => <div className='bsb_ai_create_desc'>{__('Say what the slider is for. The AI makes the slides. Everything stays editable.', 'b-slider')}</div>;

/** Without a connector, the way to set one up instead of a box that can only fail. */
const SetupCard = ({ supported }) => {
	const canManage = useSelect(select => select('core').canUser('update', 'settings'), []);

	return <div className='bsb_ai_create'>
		<Title />
		<div className='bsb_ai_create_desc'>
			{supported
				? __('To use this, set up an AI service under Settings → Connectors.', 'b-slider')
				: __('This uses the AI built into WordPress 7.0 and newer. Update WordPress, then set up an AI service under Settings → Connectors.', 'b-slider')}
		</div>
		{supported && canManage && <a className='bsb_ai_create_btn' href={`${window.location.origin}/wp-admin/options-connectors.php`} target='_blank' rel='noopener noreferrer'>{__('Set up AI', 'b-slider')}</a>}
	</div>;
};

/** Slides from one line through the site's WordPress AI connector. */
const CreateCard = ({ clientId, onCreated }) => {
	const [brief, setBrief] = useState('');
	const [count, setCount] = useState(3);
	const ai = useAiSlides({ clientId, onPlaced: onCreated });

	const create = () => brief.trim() && !ai.busy && ai.create(brief, count);

	return <div className='bsb_ai_create'>
		<Title />
		<Intro />

		<textarea
			value={brief}
			onChange={e => { setBrief(e.target.value); ai.clear(); }}
			onKeyDown={e => { if ('Enter' === e.key && (e.metaKey || e.ctrlKey)) { e.preventDefault(); create(); } }}
			placeholder={__('e.g. A coffee shop’s autumn menu', 'b-slider')}
			aria-label={__('What is this slider for?', 'b-slider')}
			rows={2}
			disabled={ai.busy}
		/>

		<div className='bsb_ai_create_row'>
			<label>
				{__('Slides', 'b-slider')}
				<select value={count} onChange={e => setCount(parseInt(e.target.value, 10))} disabled={ai.busy}>
					{Array.from({ length: MAX_SLIDES }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
				</select>
			</label>

			<button type='button' className='bsb_ai_create_btn' onClick={create} disabled={ai.busy || !brief.trim() || !!ai.pending}>
				{ai.busy ? __('Making slides…', 'b-slider') : __('Create', 'b-slider')}
			</button>
		</div>

		{ai.pending && <div className='bsb_ai_create_notice is-warning'>
			<div>{__('This slider already has slides. Replace them, or add the new ones at the end?', 'b-slider')}</div>
			<div className='bsb_ai_create_row'>
				<button type='button' onClick={ai.replace}>{__('Replace', 'b-slider')}</button>
				<button type='button' onClick={ai.append}>{__('Add to end', 'b-slider')}</button>
				<button type='button' onClick={ai.cancel}>{__('Cancel', 'b-slider')}</button>
			</div>
		</div>}

		{ai.error && <div className='bsb_ai_create_notice is-error' role='alert'>{ai.error}</div>}
	</div>;
};

const AiCreateCard = props => {
	const status = useAiStatus();

	// Hidden for roles below the AI capability (Contributors by default).
	if (status.loading || !status.allowed) {
		return null;
	}

	return <>
		{status.ready ? <CreateCard {...props} /> : <SetupCard supported={status.supported} />}
		<p className='bsb_ai_create_or'>{__('or choose a source yourself', 'b-slider')}</p>
	</>;
};

export default AiCreateCard;
