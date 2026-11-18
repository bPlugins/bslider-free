import { __, sprintf } from '@wordpress/i18n';
import { ToggleControl, __experimentalNumberControl as NumberControl } from '@wordpress/components';
import { TipToggle } from '../../../Components/Panel/TipField';
import HelpTip from '../../../Components/Panel/HelpTip';

/**
 * Which screens a layer appears on, and which of them it animates on.
 *
 * Two separate questions, deliberately kept apart. Hiding is about the layout — a caption that
 * has no room on a phone, a decorative shape that only earns its place on a wide screen. Turning
 * the motion off is about the motion alone: the layer still shows, it just arrives in place
 * rather than flying in, which is what a small screen usually wants when several layers would
 * otherwise animate over each other in a very short space.
 *
 * Both are plain classes read by `style.scss` rather than anything the runtime has to know
 * about, so a layer behaves the same whether or not the slider's script ever boots. The
 * breakpoints match the ones the rest of the plugin uses: tablet at 768px, mobile at 576px, both
 * `max-width` — see `Style.js`, where every device rule is written the same way.
 */
const ResponsivePanel = ({ layer, update }) => {
	const visibility = layer.visibility || {};
	const hideOn = visibility.hideOn || {};
	const stillOn = visibility.stillOn || {};

	const devices = [
		{ key: 'desktop', label: __('Desktop', 'b-slider') },
		{ key: 'tablet', label: __('Tablet', 'b-slider') },
		{ key: 'mobile', label: __('Mobile', 'b-slider') },
	];

	/** Writes one device's flag into one of the two maps, leaving the other map alone. */
	const setFlag = (map, key, value) => update('visibility', {
		[map]: { ...(visibility[map] || {}), [key]: value },
	});

	// Empty clears a device; Mobile left empty follows Tablet.
	const setOrder = (key, raw) => {
		const value = '' === raw || undefined === raw || null === raw ? undefined : parseInt(raw, 10);
		const next = { ...(layer.order || {}), [key]: Number.isInteger(value) ? value : undefined };

		Object.keys(next).forEach(name => undefined === next[name] && delete next[name]);
		update('order', Object.keys(next).length ? next : undefined, true);
	};

	// Nothing to switch off where nothing moves. Checked against the effects themselves rather
	// than a saved flag, so a layer that loses its animation stops offering the choice too.
	const hasMotion = Boolean(layer.entry?.effect || layer.loop?.effect || layer.hover?.effect);

	return <>
		{devices.map(({ key, label }, index) => <TipToggle
			key={key}
			className={index ? 'mt15' : ''}
			label={/* translators: %s is a device name — Desktop, Tablet or Mobile. */
				sprintf(__('Hide on %s', 'b-slider'), label)}
			checked={Boolean(hideOn[key])}
			onChange={val => setFlag('hideOn', key, val)}
			tip={sprintf(__('The layer is not drawn at all on %s.', 'b-slider'), label)}
		/>)}

		{!layer.position?.absolute && ['tablet', 'mobile'].map(key => <NumberControl
			key={`order-${key}`}
			className='mt15'
			label={<>
				{'tablet' === key ? __('Order on Tablet', 'b-slider') : __('Order on Mobile', 'b-slider')}
				<HelpTip>{__('1 comes first, then 2, and so on, among the blocks beside it; blocks with no number follow, in the order they are placed. For text before the photo on phones, give the text 1 on Mobile. Mobile left empty follows Tablet.', 'b-slider')}</HelpTip>
			</>}
			value={layer.order?.[key] ?? ''}
			onChange={raw => setOrder(key, raw)}
			placeholder={'mobile' === key && Number.isInteger(layer.order?.tablet) ? String(layer.order.tablet) : __('As placed', 'b-slider')}
		/>)}

		{hasMotion && devices.map(({ key, label }) => <ToggleControl
			key={`motion-${key}`}
			className='mt15'
			label={/* translators: %s is a device name — Desktop, Tablet or Mobile. */
				sprintf(__('Animate on %s', 'b-slider'), label)}
			checked={false !== stillOn[key]}
			onChange={val => setFlag('stillOn', key, val)}
			disabled={Boolean(hideOn[key])}
		/>)}
	</>;
};

export default ResponsivePanel;
