import { __ } from '@wordpress/i18n';

/** Two stacked squares; the filled one is the layer being moved, drawn in front of or behind the outline. */
const icon = (front, arrow) => <svg viewBox='0 0 24 24' width='20' height='20' aria-hidden='true'>
	{front ? <>
		<rect x='9' y='9' width='11' height='11' rx='1.5' fill='none' stroke='currentColor' strokeWidth='1.5' />
		<rect x='4' y='4' width='11' height='11' rx='1.5' fill='currentColor' />
	</> : <>
		<rect x='4' y='4' width='11' height='11' rx='1.5' fill='currentColor' />
		<rect x='9' y='9' width='11' height='11' rx='1.5' fill='#fff' stroke='currentColor' strokeWidth='1.5' />
	</>}
	{arrow && <path d={arrow} fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />}
</svg>;

export const ORDER_ACTIONS = [
	{ key: 'front', label: __('Bring to front', 'b-slider'), svg: icon(true, 'M20 2v4M18 4h4') },
	{ key: 'forward', label: __('Bring forward', 'b-slider'), svg: icon(true) },
	{ key: 'backward', label: __('Send backward', 'b-slider'), svg: icon(false) },
	{ key: 'back', label: __('Send to back', 'b-slider'), svg: icon(false, 'M2 20h4') },
];
