import { __ } from '@wordpress/i18n';
import { Notice, RangeControl, SelectControl, TextControl, ToggleControl } from '@wordpress/components';
import { clickActionOpt, hoverEffectOpt } from '../../../utils/options';

/** How far each hover effect can sensibly go, and what its numbers mean. */
const HOVER_RANGE = {
	scale: { label: __('Amount', 'b-slider'), min: 1, max: 1.4, step: 0.01, initial: 1.05 },
	lift: { label: __('Distance (px)', 'b-slider'), min: 2, max: 24, step: 1, initial: 6 },
	fade: { label: __('Opacity', 'b-slider'), min: 0.2, max: 1, step: 0.05, initial: 0.7 },
};

/**
 * What the layer does when the visitor points at it or clicks it.
 *
 * Hover is entirely CSS — a transition rather than a keyframe animation, because a keyframe runs
 * once and leaves the element where it finished, so there is nothing to undo when the pointer
 * leaves. The rules live in style.scss and read the numbers set here.
 */
const InteractivityPanel = ({ layer, update, blockName }) => {
	const hover = layer.hover || {};
	const click = layer.click || {};
	const range = HOVER_RANGE[hover.effect];

	// A button already has a link, and a click action on top of it would be a second thing to
	// click inside the first — the browser picks one and it is not necessarily the one meant.
	const isAlreadyClickable = ['core/button', 'core/buttons'].includes(blockName);

	return <>
		<SelectControl
			label={__('On hover', 'b-slider')}
			value={hover.effect || ''}
			options={hoverEffectOpt}
			onChange={val => update('hover', { effect: val, amount: HOVER_RANGE[val]?.initial })}
		/>

		{range && <>
			<RangeControl
				label={range.label}
				value={hover.amount ?? range.initial}
				onChange={val => update('hover', { amount: val })}
				min={range.min}
				max={range.max}
				step={range.step}
			/>

			<RangeControl
				label={__('Speed (seconds)', 'b-slider')}
				value={hover.speed ?? 0.3}
				onChange={val => update('hover', { speed: val })}
				min={0.05}
				max={1.5}
				step={0.05}
			/>
		</>}

		{isAlreadyClickable
			? <Notice status="info" isDismissible={false} className="mt15">
				{__('A button carries its own link — set it on the button itself.', 'b-slider')}
			</Notice>
			: <>
				<SelectControl
					className="mt15"
					label={__('On click', 'b-slider')}
					value={click.action || ''}
					options={clickActionOpt}
					onChange={val => update('click', { action: val })}
				/>

				{'url' === click.action && <>
					<TextControl
						label={__('Link', 'b-slider')}
						value={click.url || ''}
						onChange={val => update('click', { url: val })}
						placeholder="https://"
					/>

					<ToggleControl
						label={__('Open in a new tab', 'b-slider')}
						checked={Boolean(click.newTab)}
						onChange={val => update('click', { newTab: val })}
					/>
				</>}

				{'scroll' === click.action && <TextControl
					label={__('Scroll to', 'b-slider')}
					value={click.selector || ''}
					onChange={val => update('click', { selector: val })}
					placeholder="#contact"
					help={__('The id or class of the section to scroll to, e.g. #contact', 'b-slider')}
				/>}
			</>}
	</>;
};

export default InteractivityPanel;
