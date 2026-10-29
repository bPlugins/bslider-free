/** Auto-scale: below the width they were placed at, a slider's layers shrink together through `--bsb-layer-scale`, read by `style.scss`. */

const contentOf = (root) => [...root.querySelectorAll('.carousel-item .bsb-slide-content')]
	.find(el => el.closest('.bsbCarousel') === root && el.offsetWidth);

/** The slide content's width over the design width, never above 1; returns a teardown that puts the layers back to full size. */
export const scaleLayersIn = (root, width) => {
	if (!root || !(Number(width) > 0)) {
		return () => { };
	}

	const sync = () => {
		const content = contentOf(root);

		if (content) {
			root.style.setProperty('--bsb-layer-scale', String(Math.min(1, Math.round(content.offsetWidth / Number(width) * 1000) / 1000)));
		}
	};

	root.classList.add('bsb-layer-scaled');
	sync();

	const observer = 'undefined' !== typeof ResizeObserver ? new ResizeObserver(sync) : null;
	observer?.observe(root);

	return () => {
		observer?.disconnect();
		root.classList.remove('bsb-layer-scaled');
		root.style.removeProperty('--bsb-layer-scale');
	};
};
