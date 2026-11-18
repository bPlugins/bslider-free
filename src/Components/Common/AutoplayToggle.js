import { __ } from '@wordpress/i18n';

/** Whether the visitor asked for less motion. */
export const prefersReducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** True when keyboard focus (not a mouse click) lands inside the slider, outside the toggle itself. */
export const isKeyboardFocusIn = e => !e.target.closest?.('.bsbAutoplayToggle') && !!e.target.matches?.(':focus-visible');

/** Pause and play for a slider that moves on its own (WCAG 2.2.2). */
const AutoplayToggle = ({ playing, onToggle }) => <button
	type='button'
	className='bsbAutoplayToggle'
	aria-label={playing ? __('Pause slideshow', 'b-slider') : __('Play slideshow', 'b-slider')}
	onClick={e => { e.stopPropagation(); onToggle(); }}
>
	{playing
		? <svg viewBox='0 0 24 24' width='14' height='14' aria-hidden='true' focusable='false'><path fill='currentColor' d='M6 4h4v16H6zM14 4h4v16h-4z' /></svg>
		: <svg viewBox='0 0 24 24' width='14' height='14' aria-hidden='true' focusable='false'><path fill='currentColor' d='M7 4v16l13-8z' /></svg>}
</button>;

export default AutoplayToggle;
