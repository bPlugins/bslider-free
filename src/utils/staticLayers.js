/** Layers marked "Show on all slides" leave their slide for one layer over every slide, so slide changes never move them. */

// Inherited from the slide they were written in, so their text looks the same out of it.
const INHERITED = ['color', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textAlign'];

// Placed in the slide itself, a plain group around them too, never in a layer group.
const ownStatics = (root) => [...root.querySelectorAll('.carousel-item > .bsb-slide-content [data-bsb-static]')]
	.filter(el => el.closest('.bsbCarousel') === root && el.parentElement.closest('.bsb-abs, .bsb-slide-content').parentElement.matches('.carousel-item'));

// A layer out of a plain group keeps the text styles it had there, in a wrapper that draws no box.
const keepLook = (el, content) => {
	if (el.parentElement === content) {
		return el;
	}

	const wrap = document.createElement('div');
	const look = getComputedStyle(el.parentElement);

	wrap.style.display = 'contents';
	INHERITED.forEach(key => {
		wrap.style[key] = look[key];
	});
	wrap.appendChild(el);

	return wrap;
};

/** Moves them into `.bsb-static-layers`, kept on the active slide's content box; returns a teardown that puts them back. */
export const liftStaticLayers = (root) => {
	const layers = root ? ownStatics(root) : [];

	if (!layers.length) {
		return () => { };
	}

	const origin = layers[0].closest('.bsb-slide-content');
	const homes = layers.map(el => [el, el.parentElement, el.nextSibling, el.closest('.carousel-item')]);
	const overlay = document.createElement('div');
	const look = getComputedStyle(origin);

	// The slide content's own classes keep its layout rules and the theme's slide typography.
	overlay.className = `${origin.className} bsb-static-layers`;
	INHERITED.forEach(key => {
		overlay.style[key] = look[key];
	});
	// Their slides keep the absolute layout they had with the layers in them.
	homes.forEach(([, , , item]) => item.classList.add('bsb-had-static'));
	layers.forEach(el => overlay.appendChild(keepLook(el, el.closest('.bsb-slide-content'))));
	root.appendChild(overlay);

	const originItem = origin.parentElement;
	let insets = null;

	// The box the layers were placed in, held to every slide: other slides' content areas can sit differently.
	const place = () => {
		const item = [...root.querySelectorAll('.carousel-item.active')].find(el => el.closest('.bsbCarousel') === root);

		if (!item) {
			return;
		}

		const ir = item.getBoundingClientRect();

		// Full slide layers read their slide's padding, which the overlay is outside of.
		['t', 'r', 'b', 'l'].forEach(side => overlay.style.setProperty(`--bsb-pad-${side}`, originItem.style.getPropertyValue(`--bsb-pad-${side}`) || '0px'));

		if (item === originItem || !insets) {
			const r = (item === originItem ? origin : item.querySelector(':scope > .bsb-slide-content') || item).getBoundingClientRect();
			const measured = { left: r.left - ir.left, top: r.top - ir.top, width: r.width - ir.width, height: r.height - ir.height };

			if (item === originItem) {
				insets = measured;
			} else {
				Object.assign(overlay.style, frame(ir, measured));
				return;
			}
		}

		Object.assign(overlay.style, frame(ir, insets));
	};

	const frame = (ir, inset) => {
		const box = root.getBoundingClientRect();

		return { left: `${ir.left - box.left + inset.left}px`, top: `${ir.top - box.top + inset.top}px`, width: `${ir.width + inset.width}px`, height: `${ir.height + inset.height}px` };
	};

	place();

	const observer = 'undefined' !== typeof ResizeObserver ? new ResizeObserver(place) : null;
	observer?.observe(root);
	root.addEventListener('slid.bs.carousel', place);

	return () => {
		observer?.disconnect();
		root.removeEventListener('slid.bs.carousel', place);
		homes.forEach(([el, parent, next]) => parent.insertBefore(el, next?.parentNode === parent ? next : null));
		homes.forEach(([, , , item]) => item.classList.remove('bsb-had-static'));
		overlay.remove();
	};
};
