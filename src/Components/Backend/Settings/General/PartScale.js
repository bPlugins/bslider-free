import { __ } from '@wordpress/i18n';
import { Button, __experimentalNumberControl as NumberControl, __experimentalInputControlSuffixWrapper as SuffixWrapper } from '@wordpress/components';
import { TipToggle } from '../../../Panel/TipField';
import HelpTip from '../../../Panel/HelpTip';
import Label from '../../../../../../bpl-tools/Components/Label/Label';
import { findBlockElement } from '../../../../Blocks/Slide/extensions/layerGeometry';
import { useLayerDevice } from '../../../../Blocks/Slide/extensions/layerDevice';

/** Image, Posts and Woo: placed parts' px X/Y shrink with the slide below the width they were placed at (Style.js). */
const PartScale = ({ layerScale = {}, setAttributes, clientId }) => {
	const device = useLayerDevice();
	const onDesktop = 'desktop' === device;

	// The slide's width on the canvas now, which is what the parts were placed against.
	const measure = () => {
		const frame = [...(findBlockElement(clientId)?.querySelectorAll('.bsb-free-parts') || [])].find(el => el.offsetWidth);

		return frame ? Math.round(frame.offsetWidth) : undefined;
	};

	// Off removes it, so the slider saves exactly what it did before.
	const setOn = (on) => setAttributes({ layerScale: on ? { on: true, width: layerScale.width || measure() } : {} });

	return <div className='mt15'>
		<TipToggle
			label={__('Auto-scale placed parts', 'b-slider')}
			checked={Boolean(layerScale.on)}
			disabled={!layerScale.on && !onDesktop}
			onChange={setOn}
			tip={onDesktop || layerScale.on
				? __('On slides narrower than the design width, the px X and Y of the placed Title, Description and Button shrink by the same share, so they keep their places together. They never grow. Text size still follows Typography for each device.', 'b-slider')
				: __('Turn this on in the Desktop view, so the design width is the width you placed the parts at.', 'b-slider')}
		/>

		{layerScale.on && <div className='mt10'>
			<Label className='mb10'>
				{__('Design width', 'b-slider')}
				<HelpTip>{__('The slide width the parts were placed at. Narrower slides scale their X and Y down by the same share.', 'b-slider')}</HelpTip>
			</Label>

			<NumberControl
				value={layerScale.width ?? ''}
				min={100}
				onChange={val => Number(val) > 0 && setAttributes({ layerScale: { ...layerScale, width: Math.round(Number(val)) } })}
				suffix={<SuffixWrapper>px</SuffixWrapper>}
				spinControls='native'
			/>

			<Button
				className='mt10'
				variant='link'
				disabled={!onDesktop}
				title={onDesktop ? undefined : __('In the Desktop view', 'b-slider')}
				onClick={() => measure() && setAttributes({ layerScale: { ...layerScale, width: measure() } })}
			>
				{__('Use current width', 'b-slider')}
			</Button>
		</div>}
	</div>;
};

export default PartScale;
