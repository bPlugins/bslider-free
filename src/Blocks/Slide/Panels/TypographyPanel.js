import { __, sprintf } from '@wordpress/i18n';
import { useEffect } from '@wordpress/element';
import { Button, Flex, __experimentalUnitControl as UnitControl } from '@wordpress/components';
import Typography from '../../../../../bpl-tools/Components/Typography/Typography';
import Label from '../../../../../bpl-tools/Components/Label/Label';
import HelpTip from '../../../Components/Panel/HelpTip';

const SIZE_UNITS = [
	{ value: 'px', label: 'px', default: 16 },
	{ value: 'rem', label: 'rem', default: 1 },
	{ value: 'em', label: 'em', default: 1 },
	{ value: 'vw', label: 'vw', default: 1 },
];

const withUnit = (size) => ('number' === typeof size ? `${size}px` : size || '');
/**
 * Puts a Google font stylesheet into the editor, once per family.
 *
 * The front end does this in `render.php`, reading the families out of the rendered markup. The
 * canvas has no such pass — the block is a live React component — so the family is loaded here
 * as it is chosen, or a font picked in the sidebar would name itself correctly and still be
 * drawn in the theme's own face until the page was published.
 *
 * Appended to the document that owns the sidebar, and left there: the canvas is an iframe in
 * current WordPress, and a stylesheet added to the parent still reaches it through the editor's
 * own style-copying. Removing it on unmount would take the font away from any other layer using
 * it, so each family is added once and kept for the session.
 */
const loadEditorFont = (family) => {
	if (!family || 'Default' === family) {
		return;
	}

	const id = `bsb-font-${family.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

	if (document.getElementById(id)) {
		return;
	}

	const link = document.createElement('link');
	link.id = id;
	link.rel = 'stylesheet';
	link.href = `https://fonts.googleapis.com/css2?family=${family.split(' ').join('+')}&display=swap`;
	document.head.appendChild(link);
};

/**
 * A font for one layer's own text.
 *
 * The plugin's typography control already exists and already knows about Google Fonts — it is
 * the same one the slider's Title and Description panels use. What is different here is where
 * the answer goes: those write a `titleTypo` attribute that `Style.js` turns into a rule against
 * `.bsbTitle`, and a layer has no such selector. A block inside a slide is whatever block the
 * user reached for, so its styling has to travel with the block itself — as an inline style,
 * which is what `buildLayerProps` already does for every other layer setting.
 *
 * Offered only on blocks that carry text (see `TEXT_LAYER_BLOCKS`). Everything else inherits it
 * from the page as it always did.
 */
const TypographyPanel = ({ layer, update, device = 'desktop' }) => {
	const typo = layer.typo || {};

	/* The size follows the editor's preview device; an empty one takes the device above's. */
	const sizes = 'object' === typeof typo.fontSize && null !== typo.fontSize ? typo.fontSize : { desktop: typo.fontSize ?? null };
	const above = 'mobile' === device && withUnit(sizes.tablet) ? 'tablet' : 'desktop';
	const DEVICE_NAMES = { desktop: __('Desktop', 'b-slider'), tablet: __('Tablet', 'b-slider'), mobile: __('Mobile', 'b-slider') };
	const setSize = (val) => update('typo', { ...typo, fontSize: { desktop: null, tablet: null, mobile: null, ...sizes, [device]: val || null } }, true);

	// On every render rather than only on change, so a font already saved is loaded when the
	// block is selected again — `loadEditorFont` is a no-op once the link is there.
	useEffect(() => loadEditorFont(typo.fontFamily), [typo.fontFamily]);

	return <>
		<Typography
			label={__('Font', 'b-slider')}
			value={typo}
			onChange={val => {
				loadEditorFont(val?.fontFamily);
				update('typo', val, true);
			}}
		/>

		<Flex className='mt15 bsb-device-place' align='center'>
			<Label className=''>
				{__('Font size', 'b-slider')}
				<HelpTip>{__('Follows the device shown in the editor (Desktop, Tablet, Mobile). Empty takes the size of the device above. With Auto-scale on, a Tablet or Mobile size is the size seen on that screen.', 'b-slider')}</HelpTip>
			</Label>

			{'desktop' !== device && <span className='bsb-device-badge'>{DEVICE_NAMES[device]}</span>}
		</Flex>

		<UnitControl
			className='mt5'
			value={withUnit(sizes[device])}
			onChange={setSize}
			units={SIZE_UNITS}
			placeholder={'desktop' === device ? __('Theme', 'b-slider') : withUnit(sizes[above]) || __('Theme', 'b-slider')}
		/>

		{'desktop' !== device && withUnit(sizes[device]) && <Button className='mt5' variant='link' onClick={() => setSize(null)}>
			{/* translators: %s: Desktop or Tablet */}
			{sprintf(__('Same as %s', 'b-slider'), DEVICE_NAMES[above])}
		</Button>}
	</>;
};

export default TypographyPanel;
