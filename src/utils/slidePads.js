/** Each slide's padding as `--bsb-pad-*`, in px, so "Full slide" layers count from the slide's edges; kept out of saved markup. */

const SIDES = [['t', 'paddingTop'], ['r', 'paddingRight'], ['b', 'paddingBottom'], ['l', 'paddingLeft']];

export const syncSlidePads = (item) => {
	if (!item) {
		return;
	}

	const look = getComputedStyle(item);

	// Over the layer scale, so a scaled-down layer still takes off the slide's full padding.
	SIDES.forEach(([side, key]) => item.style.setProperty(`--bsb-pad-${side}`, `calc(${look[key]} / var(--bsb-layer-scale, 1))`));
};

/** Front end: every slide of this slider, again when its size changes (a % padding follows the width). */
export const watchSlidePads = (root) => {
	if (!root?.querySelector('[data-bsb-area="slide"]')) {
		return () => { };
	}

	const items = [...root.querySelectorAll('.carousel-item')].filter(el => el.closest('.bsbCarousel') === root);
	const sync = () => items.forEach(syncSlidePads);

	sync();

	const observer = 'undefined' !== typeof ResizeObserver ? new ResizeObserver(sync) : null;
	observer?.observe(root);

	return () => observer?.disconnect();
};
