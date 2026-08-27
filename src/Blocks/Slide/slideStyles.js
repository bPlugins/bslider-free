/**
 * A slide's own look, as a React style object.
 *
 * An object rather than a `<style>` block, and deliberately so: a slide is a static block, so
 * whatever `save` writes has to come back byte for byte on every reload or WordPress calls the
 * block invalid. A stylesheet assembled from a dozen optional settings never survives that — one
 * changed helper and every slide already saved is broken. An inline `style` attribute is a flat
 * list of properties React serialises the same way every time.
 *
 * Shared by `edit.js` and `save.js` so the canvas and the site are styled from one description.
 * The one thing an inline style cannot express — the overlay, which needs a pseudo-element — is
 * handled with a real element in the markup instead. See `SlideOverlay`.
 */
export const slideStyles = (attributes) => {
	const { background = {}, border = {}, radius = {}, padding = {}, contentAlign, verticalAlign } = attributes;
	const style = {};

	const { type = 'solid', color, gradient, image, position, size, repeat, attachment } = background;

	if ('image' === type && image?.url) {
		style.backgroundImage = `url(${image.url})`;
		if (position) style.backgroundPosition = position;
		if (size) style.backgroundSize = size;
		if (repeat) style.backgroundRepeat = repeat;
		if (attachment) style.backgroundAttachment = attachment;
	} else if ('gradient' === type && gradient) {
		style.background = gradient;
	} else if (color) {
		style.backgroundColor = color;
	}

	if (border.width && 0 !== parseInt(border.width)) {
		style.border = `${border.width} ${border.style || 'solid'} ${border.color || 'currentColor'}`;
	}

	const formatValue = (val) => {
		if (val === undefined || val === null || val === '') return '0';
		const str = String(val).trim();
		if (str === '0') return '0';
		if (/^-?\d+(\.\d+)?$/.test(str)) {
			return `${str}px`;
		}
		return str;
	};

	const box = (values) => ['top', 'right', 'bottom', 'left']
		.map(side => formatValue(values[side]))
		.join(' ');

	if (Object.keys(radius).length) {
		style.borderRadius = box(radius);
	}

	if (Object.keys(padding).length) {
		style.padding = box(padding);
		// Or the padding would be added to the height the slider set, and a slide with padding
		// would stand taller than the one beside it.
		style.boxSizing = 'border-box';
	}

	if (contentAlign) {
		style.textAlign = contentAlign;
	}

	// Only when asked for: a stray `display: flex` changes how every block inside the slide
	// sizes itself, so a slide nobody has positioned should lay out exactly as the page would.
	if (verticalAlign) {
		style.display = 'flex';
		style.flexDirection = 'column';
		style.justifyContent = verticalAlign;
	}

	// The overlay needs something to sit against.
	if (attributes.overlay) {
		style.position = 'relative';
	}

	return style;
};
