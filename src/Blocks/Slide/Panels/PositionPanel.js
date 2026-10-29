import { __, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { Button, Flex, FlexBlock, __experimentalUnitControl as UnitControl, __experimentalNumberControl as NumberControl, __experimentalInputControlSuffixWrapper as SuffixWrapper } from '@wordpress/components';
import { ORDER_ACTIONS } from '../extensions/layerOrderActions';
import { desktopForBox, findBlockElement, layerArea, layoutBox, siblingZs, slidePad, writeZ, zAboveFlow, zFor, zOf } from '../extensions/layerGeometry';
import Label from '../../../../../bpl-tools/Components/Label/Label';
import { TipToggle } from '../../../Components/Panel/TipField';
import HelpTip from '../../../Components/Panel/HelpTip';
import { setLayerHidden, useLayerHidden } from '../extensions/hiddenLayers';
import ProNotice from '../../../Components/Panel/ProNotice';
import { PRO_FEATURES } from '../../../utils/pro-features';
import AnchorPicker from '../../../Components/Backend/Settings/General/AnchorPicker';

const UNITS = [
	{ value: 'px', label: 'px' },
	{ value: '%', label: '%' },
];

/** Absolute toggle, anchor, X/Y measured inward from that anchor of the content area, size, rotation and stacking order. */
const PositionPanel = ({ layer, update, clientId, device = 'desktop' }) => {
	const position = layer.position || {};
	const offset = position.desktop || {};

	/* Tablet and Mobile previews change their own place. */
	const onDevice = 'desktop' !== device;
	const above = 'mobile' === device && position.tablet ? 'tablet' : 'desktop';
	const DEVICE_NAMES = { desktop: __('Desktop', 'b-slider'), tablet: __('Tablet', 'b-slider'), mobile: __('Mobile', 'b-slider') };

	/* Gutenberg's own lock attribute, so its toolbar Lock and this toggle are one setting. */
	const lock = useSelect(select => select('core/block-editor').getBlockAttributes(clientId)?.lock, [clientId]);
	const { updateBlockAttributes } = useDispatch('core/block-editor');
	const setLocked = (move) => {
		const next = { ...(lock || {}), move };

		if (!move) {
			delete next.move;
		}

		updateBlockAttributes(clientId, { lock: Object.keys(next).length ? next : undefined });
	};

	const hiddenOnCanvas = useLayerHidden(clientId);

	/* Off removes the key, so the block saves exactly what it did before. */
	const setAbsolute = (absolute) => update('position', absolute ? { absolute: true, desktop: { x: 0, y: 0 } } : undefined, true);

	/* Number and unit kept apart so px values saved before units existed still read the same. */
	const setOffset = (axis, raw) => {
		const match = String(raw ?? '').trim().match(/^(-?\d*\.?\d+)?\s*(px|%)?$/);

		// A half-typed "-" is skipped rather than snapped to 0, so negative values can be typed.
		if (!match) {
			return;
		}

		const unit = match[2] || offset[`${axis}Unit`] || 'px';

		update('position', { desktop: { ...offset, [axis]: match[1] ? Number(match[1]) : 0, [`${axis}Unit`]: 'px' === unit ? undefined : unit } });
	};

	/* Top-left is the default and is not stored, so layers saved before anchors existed are unchanged. */
	const setAnchor = (anchor) => update('position', { desktop: { ...offset, anchor: 'top-left' === anchor ? undefined : anchor } });

	const valueOf = (axis) => `${offset[axis] ?? 0}${offset[`${axis}Unit`] || 'px'}`;

	/* An empty Width or Height is auto, and is removed rather than stored. */
	const setSize = (key, raw) => {
		const match = String(raw ?? '').trim().match(/^(\d*\.?\d+)?\s*(px|%)?$/);

		if (!match) {
			return;
		}

		if (!match[1]) {
			update('position', { desktop: { ...offset, [key]: undefined, [`${key}Unit`]: undefined } });
			return;
		}

		const unit = match[2] || offset[`${key}Unit`] || 'px';

		update('position', { desktop: { ...offset, [key]: Number(match[1]), [`${key}Unit`]: 'px' === unit ? undefined : unit } });
	};

	/* 0° is not stored; a half-typed "-" is skipped. */
	const setRotate = (raw) => {
		const deg = '' === raw || undefined === raw ? 0 : Number(raw);

		if (Number.isFinite(deg)) {
			update('position', { desktop: { ...offset, rotate: deg || undefined } });
		}
	};

	const sizeOf = (key) => (undefined === offset[key] ? '' : `${offset[key]}${offset[`${key}Unit`] || 'px'}`);

	/** This layer's box and its area, read off the canvas, so a re-measured place never moves it. */
	const measure = () => {
		const element = findBlockElement(clientId);
		const areaEl = layerArea(element);

		if (!element || !areaEl) {
			return null;
		}

		const areaRect = areaEl.getBoundingClientRect();

		return { areaRect, box: layoutBox(element, areaRect), area: { width: areaRect.width || 1, height: areaRect.height || 1 }, pad: slidePad(element) };
	};

	/* Only a layer placed in its slide (a plain group around it too) can go over every slide. */
	const inSlide = useSelect(select => {
		const editor = select('core/block-editor');
		const area = editor.getBlockParents(clientId, true).find(id => 'bsb/slide' === editor.getBlockName(id) || editor.getBlockAttributes(id)?.bsbLayer?.position?.absolute);

		return 'bsb/slide' === editor.getBlockName(area);
	}, [clientId]);

	const setStatic = (on) => update('position', { static: on || undefined });

	/* Content area or the slide's own edges; re-measured, so the layer stays where it is. */
	const setFullSlide = (full) => {
		const now = measure();
		const next = { ...offset, area: full ? 'slide' : undefined };

		update('position', { desktop: now ? desktopForBox(next, now.box, now.area, {}, now.pad) : next });
	};

	const setZ = (z) => update('position', { desktop: { ...offset, z: Number.isInteger(z) ? z : undefined } });

	/* The last order button pressed stays filled while its result holds; a z typed by hand clears it. */
	const [pressed, setPressed] = useState(null);
	const activeOrder = pressed && pressed.z === zOf(layer) ? pressed.action : null;

	/* Back means behind the other layers, never behind the slide's plain blocks: those layers are lifted instead. */
	const reorder = (action) => {
		const others = siblingZs(clientId);
		const zs = zAboveFlow({ [clientId]: zFor(action, zOf(layer), Object.values(others)) }, others);

		writeZ(zs);
		setPressed({ action, z: zs[clientId] });
	};

	/* Empty is auto; a half-typed "-" is skipped; below 0 would go behind the plain blocks. */
	const typeZ = (raw) => {
		if ('' === raw || undefined === raw) {
			setZ(undefined);
		} else if (Number.isInteger(Number(raw))) {
			setZ(Math.max(0, Number(raw)));
		}
	};

	return <>
		<TipToggle
			label={__('Absolute Position', 'b-slider')}
			checked={Boolean(position.absolute)}
			onChange={setAbsolute}
			tip={__('Takes the block out of the stack and places it by X and Y. The other blocks close up the gap.', 'b-slider')}
		/>

		{position.absolute && <>
			{inSlide && <TipToggle
				className='mt15'
				label={__('Show on all slides', 'b-slider')}
				checked={Boolean(position.static)}
				onChange={setStatic}
				tip={__('Shows this layer over every slide, in the same place; it stays still while the slides change.', 'b-slider')}
			/>}

			{onDevice && <Flex className='mt15 bsb-device-place' align='center'>
				<span className='bsb-device-badge'>
					{DEVICE_NAMES[device]}
					<HelpTip>{__('Anchor, X, Y, Width, Height and Full slide set here are for this device only. The rest is shared with every device.', 'b-slider')}</HelpTip>
				</span>

				{position[device] && <Button variant='link' onClick={() => update('position', { [device]: undefined })}>
					{/* translators: %s: Desktop or Tablet */}
					{sprintf(__('Same as %s', 'b-slider'), DEVICE_NAMES[above])}
				</Button>}
			</Flex>}

			{inSlide && <TipToggle
				className='mt15'
				label={__('Full slide (ignore padding)', 'b-slider')}
				checked={'slide' === offset.area}
				onChange={setFullSlide}
				tip={__('X and Y count from the slide\'s own edges instead of the content area inside the slide\'s padding. Good for a logo right in the corner.', 'b-slider')}
			/>}

			<div className='mt15'>
				<Label className='mb10'>{__('Anchor', 'b-slider')}</Label>
				{/* Named per block, or every layer's grid would form one radio group. */}
				<AnchorPicker
					name={`bsbLayerAnchor-${clientId}`}
					value={offset.anchor || 'top-left'}
					onChange={setAnchor}
				/>
			</div>

			<Flex className='mt15' align='flex-start'>
				<FlexBlock>
					<UnitControl
						label={__('X', 'b-slider')}
						value={valueOf('x')}
						onChange={val => setOffset('x', val)}
						units={UNITS}
					/>
				</FlexBlock>

				<FlexBlock>
					<UnitControl
						label={__('Y', 'b-slider')}
						value={valueOf('y')}
						onChange={val => setOffset('y', val)}
						units={UNITS}
					/>
				</FlexBlock>
			</Flex>

			<Flex className='mt15' align='flex-start'>
				<FlexBlock>
					<UnitControl
						label={__('Width', 'b-slider')}
						value={sizeOf('w')}
						onChange={val => setSize('w', val)}
						units={UNITS}
						min={0}
						placeholder={__('auto', 'b-slider')}
					/>
				</FlexBlock>

				<FlexBlock>
					<UnitControl
						label={__('Height', 'b-slider')}
						value={sizeOf('h')}
						onChange={val => setSize('h', val)}
						units={UNITS}
						min={0}
						placeholder={__('auto', 'b-slider')}
					/>
				</FlexBlock>
			</Flex>

			<Flex className='mt15' align='flex-start'>
				<FlexBlock>
					<NumberControl
						label={__('Rotation', 'b-slider')}
						value={offset.rotate ?? 0}
						onChange={setRotate}
						suffix={<SuffixWrapper>°</SuffixWrapper>}
						spinControls='native'
					/>
				</FlexBlock>

				<FlexBlock>
					<NumberControl
						label={__('Z-Index', 'b-slider')}
						value={Number.isInteger(offset.z) ? offset.z : ''}
						onChange={typeZ}
						min={0}
						placeholder={__('auto', 'b-slider')}
						spinControls='native'
					/>
				</FlexBlock>
			</Flex>

			<div className='mt15'>
				<Label className='mb10'>{__('Layer Order', 'b-slider')}</Label>
				<Flex justify='flex-start' gap={1}>
					{ORDER_ACTIONS.map(action => <Button
						key={action.key}
						icon={action.svg}
						label={action.label}
						showTooltip
						variant={action.key === activeOrder ? 'primary' : 'secondary'}
						onClick={() => reorder(action.key)}
					/>)}
				</Flex>
			</div>

			<TipToggle
				className='mt15'
				label={__('Lock position', 'b-slider')}
				checked={Boolean(lock?.move)}
				onChange={setLocked}
				tip={__('Stops the layer being dragged, resized or rotated on the canvas by accident. The numbers above still change it.', 'b-slider')}
			/>

			<TipToggle
				className='mt15'
				label={__('Hide on canvas', 'b-slider')}
				checked={hiddenOnCanvas}
				onChange={val => setLayerHidden(clientId, val)}
				tip={__('Hides the layer in the editor only, to reach the ones behind it. The page still shows it, and a reload brings it back.', 'b-slider')}
			/>

			<ProNotice className='mt15' features={PRO_FEATURES.layerPosition} />
		</>}
	</>;
};

export default PositionPanel;
