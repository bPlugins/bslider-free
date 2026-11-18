import { __, sprintf } from '@wordpress/i18n';
import { Button, Flex, FlexBlock, __experimentalNumberControl as NumberControl, __experimentalUnitControl as UnitControl } from '@wordpress/components';
import { TipToggle } from '../../../Panel/TipField';
import HelpTip from '../../../Panel/HelpTip';
import Label from '../../../../../../bpl-tools/Components/Label/Label';
import AnchorPicker from './AnchorPicker';
import { useLayerDevice } from '../../../../Blocks/Slide/extensions/layerDevice';
import { placeFor, placeWith } from '../../../../utils/layerDevices';

const UNITS = [
	{ value: 'px', label: 'px' },
	{ value: '%', label: '%' },
];

/** Absolute Position for one caption part: out of the caption box, at X/Y (px or % of the slide) inward from an anchor of the slide, the same on every slide. */
const PartPlacement = ({ part, name, place = {}, onChange }) => {
	// Tablet and Mobile previews change their own place; an empty one takes the device above's.
	const device = useLayerDevice();
	const onDevice = 'desktop' !== device;
	const above = 'mobile' === device && place.tablet ? 'tablet' : 'desktop';
	const DEVICE_NAMES = { desktop: __('Desktop', 'b-slider'), tablet: __('Tablet', 'b-slider'), mobile: __('Mobile', 'b-slider') };
	const desktop = placeFor(place, device);
	const write = (next) => onChange(placeWith(place, device, next));

	// Off removes it, so the slider saves exactly what it did before.
	const setOn = (on) => onChange(on ? { absolute: true, desktop: { x: 20, y: 20 } } : undefined);

	// Number and unit kept apart, px not stored; a half-typed "-" is skipped rather than snapped to 0.
	const setAxis = (axis, raw) => {
		const match = String(raw ?? '').trim().match(/^(-?\d*\.?\d+)?\s*(px|%)?$/);

		if (!match) {
			return;
		}

		const unit = match[2] || desktop[`${axis}Unit`] || 'px';

		write({ ...desktop, [axis]: match[1] ? Number(match[1]) : 0, [`${axis}Unit`]: '%' === unit ? '%' : undefined });
	};

	// Top-left is the default and is not stored.
	const setAnchor = (anchor) => write({ ...desktop, anchor: 'top-left' === anchor ? undefined : anchor });

	// Empty is auto and is not stored; never below 0, so a part cannot drop behind the picture.
	const setZ = (raw) => {
		if ('' === raw || undefined === raw) {
			write({ ...desktop, z: undefined });
		} else if (Number.isInteger(Number(raw))) {
			write({ ...desktop, z: Math.max(0, Number(raw)) });
		}
	};

	const sameAsAbove = () => {
		const next = { ...place };

		delete next[device];
		onChange(next);
	};

	const axisField = (axis, label) => <FlexBlock>
		<UnitControl
			label={label}
			value={`${desktop[axis] ?? 0}${desktop[`${axis}Unit`] || 'px'}`}
			onChange={val => setAxis(axis, val)}
			units={UNITS}
		/>
	</FlexBlock>;

	return <div className='bsb-part-place'>
		<TipToggle
			label={__('Absolute Position', 'b-slider')}
			checked={Boolean(place.absolute)}
			onChange={setOn}
			tip={`${name}: ${__('takes it out of the caption box and places it by X and Y, measured inward from the anchor you pick on the slide, in the same place on every slide. In % they are a share of the slide\'s width and height. In the Tablet or Mobile preview, Anchor, X and Y are for that device only.', 'b-slider')}`}
		/>

		{place.absolute && <>
			{onDevice && <Flex className='mt10 bsb-device-place' align='center'>
				<span className='bsb-device-badge'>{DEVICE_NAMES[device]}</span>

				{place[device] && <Button variant='link' onClick={sameAsAbove}>
					{/* translators: %s: Desktop or Tablet */}
					{sprintf(__('Same as %s', 'b-slider'), DEVICE_NAMES[above])}
				</Button>}
			</Flex>}

			<div className='mt10'>
				<Label className='mb5'>{__('Anchor', 'b-slider')}</Label>
				{/* Named per part, or the three grids would form one radio group. */}
				<AnchorPicker name={`bsbPartAnchor-${part}`} value={desktop.anchor || 'top-left'} onChange={setAnchor} />
			</div>

			<Flex className='mt10' align='flex-start'>
				{axisField('x', __('X', 'b-slider'))}
				{axisField('y', __('Y', 'b-slider'))}
			</Flex>

			<div className='mt10'>
				<Label className='mb5'>
					{__('Z-Index', 'b-slider')}
					<HelpTip>{__('Where placed parts overlap, the one with the higher number is on top. Empty keeps the usual order: Button over Description over Title. The same on every device.', 'b-slider')}</HelpTip>
				</Label>

				<NumberControl
					value={Number.isInteger(desktop.z) ? desktop.z : ''}
					onChange={setZ}
					min={0}
					placeholder={__('auto', 'b-slider')}
					spinControls='native'
				/>
			</div>
		</>}
	</div>;
};

export default PartPlacement;
