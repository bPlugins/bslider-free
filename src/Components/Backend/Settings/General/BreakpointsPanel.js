import { __, sprintf } from '@wordpress/i18n';
import { Button, __experimentalNumberControl as NumberControl, __experimentalInputControlSuffixWrapper as SuffixWrapper } from '@wordpress/components';
import { PanelBody } from '../../../Panel/AccordionPanel';
import HelpTip from '../../../Panel/HelpTip';
import Label from '../../../../../../bpl-tools/Components/Label/Label';
import { BREAKPOINTS, breakpointsOf } from '../../../../utils/breakpoints';

/** Custom Breakpoints: the widths where this slider's Tablet and Mobile settings take over; empty keeps the plugin's. */
const BreakpointsPanel = ({ attributes, setAttributes }) => {
	const own = attributes.breakpoints || {};
	const used = breakpointsOf(attributes);

	// An empty field drops its key, so an untouched slider saves nothing.
	const setWidth = (key, raw) => {
		const next = { ...own };
		const width = Math.round(Number(raw));

		if ('' === raw || undefined === raw || !Number.isFinite(width) || width <= 0) {
			delete next[key];
		} else {
			next[key] = width;
		}

		setAttributes({ breakpoints: next });
	};

	const field = (key, label, tip) => <div className={'mobile' === key ? 'mt15' : ''}>
		<Label className='mb5'>
			{label}
			<HelpTip>{tip}</HelpTip>
		</Label>

		<NumberControl
			value={own[key] ?? ''}
			placeholder={String(BREAKPOINTS[key])}
			min={'tablet' === key ? 320 : 240}
			max={2560}
			onChange={val => setWidth(key, val)}
			suffix={<SuffixWrapper>px</SuffixWrapper>}
			spinControls='native'
		/>
	</div>;

	const unused = (own.tablet && own.tablet !== used.tablet) || (own.mobile && own.mobile !== used.mobile);

	return <PanelBody className='bPlPanelBody' title={__('Breakpoints', 'b-slider')} badge={__('New', 'b-slider')} initialOpen={false}>
		{field('tablet', __('Tablet up to', 'b-slider'), __('Screens this wide or narrower use the slider\'s Tablet settings: height, columns, arrows, text sizes, and the layers\' Tablet places and fonts.', 'b-slider'))}
		{field('mobile', __('Mobile up to', 'b-slider'), __('Screens this wide or narrower use the Mobile settings. It must be smaller than the Tablet width.', 'b-slider'))}

		{unused && <p className='mt10 bsb-attach-note'>
			{/* translators: 1: tablet width in px, 2: mobile width in px */}
			{sprintf(__('Out of range, so the slider uses Tablet %1$dpx and Mobile %2$dpx. Tablet takes 320–2560px; Mobile from 240px and below Tablet.', 'b-slider'), used.tablet, used.mobile)}
		</p>}

		{Object.keys(own).length > 0 && <Button className='mt10' variant='link' onClick={() => setAttributes({ breakpoints: {} })}>
			{/* translators: 1: tablet width in px, 2: mobile width in px */}
			{sprintf(__('Back to %1$dpx and %2$dpx', 'b-slider'), BREAKPOINTS.tablet, BREAKPOINTS.mobile)}
		</Button>}
	</PanelBody>;
};

export default BreakpointsPanel;
