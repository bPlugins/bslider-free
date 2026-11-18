import { __ } from '@wordpress/i18n';
import { adminUrl } from '../../../utils/functions';
import { crown } from '../../../utils/icons';
import { VideoHelpLink, videoLabels } from '../../../utils/videos';

/** After Create with AI: the slides are in, and Pro's next step (styling from one line) is shown here. */
const AiStyleStepPromo = ({ onDone }) => <div className='bsb_ai_style_step is-promo'>
	<div className='bsb_ai_style_step_head'>
		<h3>{__('Your slides are ready. Want AI to style the slider too?', 'b-slider')}</h3>
		<span className='bsb_step_badge is-pro'>{__('Pro', 'b-slider')}</span>
	</div>

	<div className='bsb_ai_create_desc'>{__('With bSlider Pro, describe the look in one line, for example “minimal, thin round arrows, small white dots”, and the AI sets the arrows, dots, corners, height and slide transition for you.', 'b-slider')}</div>

	<VideoHelpLink video='styleWithAi' label={videoLabels.styleWithAi()} />

	<div className='bsb_ai_create_row'>
		<a className='bsb_ai_create_btn' href={adminUrl()} target='_blank' rel='noopener noreferrer'>{crown(14, 14)} {__('Get Pro', 'b-slider')}</a>
		<button type='button' onClick={onDone}>{__('Done', 'b-slider')}</button>
	</div>
</div>;

export default AiStyleStepPromo;
