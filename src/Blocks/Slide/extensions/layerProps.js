import { sanitizeHref } from '../../../utils/functions';

/** Nothing has been set on this layer, so its block must emit exactly what it always did. */
export const isEmptyLayer = (layer) => !layer || 0 === Object.keys(layer).length;

/**
 * The class, style and data attributes one layer's settings come to.
 *
 * Called from both `blocks.getSaveContent.extraProps` (what is written into post_content) and
 * `editor.BlockListBlock` (what the canvas shows), so the two cannot drift apart — a layer that
 * animates in the editor animates the same way on the site, from one description of it.
 *
 * Must stay a pure function of `layer`: `extraProps` runs again during block validation on every
 * page load, and output that varies between the save and the check marks the block invalid.
 *
 * The entry/loop effect names go out as `data-` attributes rather than as animate.css classes,
 * because a keyframe animation only plays once per element — the class has to be taken off and
 * put back to replay when the visitor returns to a slide, which is `layerAnimations.js`'s job at
 * runtime. Only a loop with no entry animation is baked in as a class here (see below).
 */
export const buildLayerProps = (layer) => {
	if (isEmptyLayer(layer)) {
		return { className: '', style: {}, dataAttrs: {} };
	}

	const { entry = {}, loop = {}, hover = {}, click = {}, visibility = {}, typo = {} } = layer;

	const classNames = ['bsb-layer'];
	const style = {};
	const dataAttrs = {};

	// Entry
	if (entry.effect) {
		dataAttrs['data-bsb-entry'] = entry.effect;

		if (entry.duration) {
			style['--bsb-anim-duration'] = `${entry.duration}s`;
			// animate.css reads its own property for duration; setting ours alone would be
			// ignored, and setting only theirs would leave the loop animation without one.
			style['--animate-duration'] = `${entry.duration}s`;
		}

		if (entry.delay) {
			style['--bsb-anim-delay'] = `${entry.delay}s`;
		}
	}

	// Loop
	if (loop.effect) {
		if (loop.speed) {
			style['--bsb-loop-duration'] = `${loop.speed}s`;
		}

		if (entry.effect) {
			// Both want to own `animation-name` on the same element, and no wrapper can be put
			// between them — a core block's markup is its own. So the loop waits: the runtime
			// starts it when the entry animation's `animationend` fires.
			dataAttrs['data-bsb-loop'] = loop.effect;
		} else {
			// Nothing to wait for, so it can be pure CSS — and then it runs even where the
			// slider's own script never boots.
			classNames.push('animate__animated', 'animate__infinite', `animate__${loop.effect}`);

			if (loop.speed) {
				style['--animate-duration'] = `${loop.speed}s`;
			}
		}
	}

	// Hover — plain CSS, no runtime involved. `style.scss` holds the rules; these only carry the
	// numbers, so a value can change without a stylesheet knowing every value it might be.
	if (hover.effect) {
		classNames.push(`bsb-hover--${hover.effect}`);

		if (undefined !== hover.amount && '' !== hover.amount) {
			style['--bsb-hover-amount'] = hover.amount;
		}

		if (hover.speed) {
			style['--bsb-hover-speed'] = `${hover.speed}s`;
		}
	}

	// Click — one delegated listener on the slider root reads these back.
	if (click.action) {
		classNames.push('bsb-click');
		dataAttrs['data-bsb-click'] = click.action;

		if ('url' === click.action && click.url) {
			// Checked here so a bad URL never reaches the page, and checked again at click time
			// because what is in the DOM by then is not necessarily what was written.
			dataAttrs['data-bsb-click-url'] = sanitizeHref(click.url);

			if (click.newTab) {
				dataAttrs['data-bsb-click-newtab'] = 'true';
			}
		}

		if ('scroll' === click.action && click.selector) {
			dataAttrs['data-bsb-click-selector'] = click.selector;
		}
	}

	/*
	 * Responsive: which screens the layer appears on, and which it animates on.
	 *
	 * Classes rather than data attributes, because both are answered entirely in CSS — no
	 * runtime involved, so they hold even where the slider's script never boots. `hideOn` is
	 * only written when true; `stillOn` only when explicitly false, so a layer that has never
	 * been near this panel emits nothing and keeps its markup byte-identical to before the
	 * setting existed. That matters here: `extraProps` runs again on every page load as part of
	 * block validation, and output that drifts marks the block invalid.
	 */
	const { hideOn = {}, stillOn = {} } = visibility;

	['desktop', 'tablet', 'mobile'].forEach(device => {
		if (hideOn[device]) {
			classNames.push(`bsb-hide-${device}`);
		}

		if (false === stillOn[device]) {
			classNames.push(`bsb-still-${device}`);
		}
	});

	/*
	 * Typography, as inline style rather than a stylesheet rule.
	 *
	 * `getTypoCSS` — what the slider's own Title and Description panels use — builds a rule
	 * against a selector, and a layer has none: it is whatever block the user reached for, so
	 * the styling has to ride on the element itself. The properties are written out here in the
	 * same order that function writes them, so the two agree on what a typography value means.
	 *
	 * `fontSize` is per-device in the control, and an inline style has no media queries. The
	 * desktop value is the one taken; tablet and mobile are handled by the `--bsb-*` custom
	 * properties below, which `style.scss` reads inside its own breakpoints.
	 */
	const { fontFamily, fontCategory = 'sans-serif', fontWeight, fontSize, fontStyle, textTransform, textDecoration, lineHeight, letterSpace } = typo;
	const withUnit = (size) => ('number' === typeof size ? `${size}px` : size || '');

	if (fontFamily && 'Default' !== fontFamily) {
		style.fontFamily = `'${fontFamily}', ${fontCategory}`;
	}

	if (fontWeight) style.fontWeight = fontWeight;
	if (fontStyle) style.fontStyle = fontStyle;
	if (textTransform) style.textTransform = textTransform;
	if (textDecoration) style.textDecoration = textDecoration;
	if (lineHeight) style.lineHeight = lineHeight;
	if (letterSpace) style.letterSpacing = letterSpace;

	const sizes = 'object' === typeof fontSize && null !== fontSize ? fontSize : { desktop: fontSize };

	if (withUnit(sizes.desktop)) {
		style.fontSize = withUnit(sizes.desktop);
	}

	// The smaller screens go out as custom properties for `style.scss` to pick up in its own
	// media queries — an inline style cannot carry one of its own.
	if (withUnit(sizes.tablet)) {
		style['--bsb-font-size-tablet'] = withUnit(sizes.tablet);
	}

	if (withUnit(sizes.mobile)) {
		style['--bsb-font-size-mobile'] = withUnit(sizes.mobile);
	}

	if (style.fontFamily || style['--bsb-font-size-tablet'] || style['--bsb-font-size-mobile']) {
		classNames.push('bsb-layer-typo');
	}

	return { className: classNames.join(' '), style, dataAttrs };
};
