import { sanitizeHref } from '../../../utils/functions';
import { anchorName, insetFrom, ownShift, pointSides } from '../../../utils/layerAttach';
import { DEVICES, hasDevicePlaces, placeFor } from '../../../utils/layerDevices';

/** `rgb()`/`rgba()` as `#rrggbbaa`: kses drops custom properties whose value holds `rgba(`. */
const hexColor = (color) => {
	const m = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:[\s,/]+([\d.]+)(%?))?\s*\)$/i.exec(String(color).trim());

	if (!m) {
		return color;
	}

	const alpha = undefined === m[4] ? 1 : Number(m[4]) / ('%' === m[5] ? 100 : 1);
	const hex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');

	return `#${hex(m[1])}${hex(m[2])}${hex(m[3])}${1 === alpha ? '' : hex(alpha * 255)}`;
};

/** Nothing has been set on this layer, so its block must emit exactly what it always did. */
export const isEmptyLayer = (layer) => !layer || 0 === Object.keys(layer).length;

/** The style and data attributes one place (X/Y, anchor, size, turn, stacking) comes to; `depth` adds the parallax shift. */
const placeLook = (place, live, depth = 0) => {
	const { x, y, xUnit, yUnit, w, wUnit, h, hUnit, rotate, z, anchor = 'top-left', to, toPoint, area } = place;
	const num = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);
	const length = (value, unit) => `${num(value)}${'%' === unit ? '%' : 'px'}`;
	const [vertical, horizontal] = anchor.split('-');
	const style = {};
	const dataAttrs = {};

	// Attached: X/Y run right and down from the target's point to this layer's own anchor point.
	if (to) {
		const sides = pointSides(toPoint);

		dataAttrs['data-bsb-to'] = to;

		if (toPoint && 'top-left' !== toPoint) {
			dataAttrs['data-bsb-to-point'] = toPoint;
		}

		// `live` is the canvas; saved markup keeps plain offsets for attachLayersIn, as kses strips anchor().
		style.left = live ? insetFrom(to, sides.x, length(x, xUnit)) : length(x, xUnit);
		style.top = live ? insetFrom(to, sides.y, length(y, yUnit)) : length(y, yUnit);

		if (ownShift(anchor)) {
			style.translate = ownShift(anchor);
		}

		// Its text keeps its width wherever the target takes it, rather than wrapping near the slide's edge.
		if (undefined === w) {
			style.width = 'max-content';
			style.maxWidth = '100%';
		}
	} else {
		// Full slide: counted from the slide's edges, so its padding (`--bsb-pad-*`, set at runtime) comes off.
		const full = 'slide' === area;
		const pad = (side) => `var(--bsb-pad-${side}, 0px)`;
		const less = (value, side) => (full ? `calc(${value} - ${pad(side)})` : value);
		const centreShift = `(${pad('r')} - ${pad('l')}) / 2`;

		if (full) {
			dataAttrs['data-bsb-area'] = 'slide';
		}

		if ('right' === horizontal) {
			style.right = less(length(x, xUnit), 'r');
		} else if ('center' === horizontal) {
			// Both sides shifted by X with auto margins: centred without halving the width a long line may take.
			style.left = full ? `calc(${length(x, xUnit)} + ${centreShift})` : length(x, xUnit);
			style.right = full ? `calc(-1 * (${length(x, xUnit)} + ${centreShift}))` : length(-num(x), xUnit);
			style.marginLeft = 'auto';
			style.marginRight = 'auto';
			style.width = 'fit-content';
		} else {
			style.left = less(length(x, xUnit), 'l');
		}

		if ('bottom' === vertical) {
			style.bottom = less(length(y, yUnit), 'b');
		} else if ('middle' === vertical) {
			// `translate` is its own property, so it does not fight the animations that use `transform`.
			style.top = full ? `calc(50% + ${length(y, yUnit)} + (${pad('b')} - ${pad('t')}) / 2)` : `calc(50% + ${length(y, yUnit)})`;
			style.translate = '0 -50%';
		} else {
			style.top = less(length(y, yUnit), 't');
		}
	}

	// Parallax: a share of the pointer or scroll shift the slider sets as `--bsb-plx-*`, on top of the anchor's own shift.
	if (depth) {
		const [shiftX = '0px', shiftY = '0px'] = (style.translate || '').split(' ').filter(Boolean).map(part => ('0' === part ? '0px' : part));
		const share = depth / 100;

		style.translate = `calc(${shiftX} + var(--bsb-plx-x, 0px) * ${share}) calc(${shiftY} + var(--bsb-plx-y, 0px) * ${share})`;
	}

	// Unset is auto; a set size counts padding and border in, matching the box the canvas handles drag.
	if (undefined !== w) {
		style.width = length(w, wUnit);
	}

	if (undefined !== h) {
		style.height = length(h, hUnit);
	}

	if (undefined !== w || undefined !== h) {
		style.boxSizing = 'border-box';
	}

	// Its own property, like `translate`, so animations on `transform` leave it alone.
	if (num(rotate)) {
		style.rotate = `${num(rotate)}deg`;
	}

	// Unset is auto (block order decides); the content area isolates it, so a negative value stays above the slide background.
	if (Number.isInteger(z)) {
		style.zIndex = z;
	}

	return { style, dataAttrs };
};

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
 * The entry/exit/loop effect names go out as `data-` attributes rather than as animate.css
 * classes, because a keyframe animation only plays once per element — the class has to be taken
 * off and put back to replay when the visitor returns to a slide, which is `layerAnimations.js`'s
 * job at runtime. Only a loop with no entry animation is baked in as a class here (see below).
 */
/** `legacyLightbox`: the markup older free releases saved, with no lightbox data (see layerSaveProps). */
/** `imageUrl`: an Image block's own picture, which Recolour masks. */
export const buildLayerProps = (layer, { live = false, device, legacyLightbox = false, imageUrl = '' } = {}) => {
	if (isEmptyLayer(layer)) {
		return { className: '', style: {}, dataAttrs: {} };
	}

	const { entry = {}, exit = {}, loop = {}, hover = {}, click = {}, words = {}, visibility = {}, typo = {}, count = {}, play = {}, fitContent, position = {} } = layer;

	const classNames = ['bsb-layer'];
	const style = {};
	const dataAttrs = {};

	if (fitContent) {
		classNames.push('bsb-fit-content');
		style.display = 'inline-block';
		style.maxWidth = '100%';
	}

	// A container that clips what spills out of it, e.g. a picture zooming inside a group.
	if (layer.clip) {
		classNames.push('bsb-clip');
	}

	// Turn and stacking for a layer in the normal flow; absolute layers set theirs in Position. The turn rides in a var: kses drops `rotate`.
	if (!position.absolute && layer.flow) {
		const turn = Number(layer.flow.rotate);
		const z = Number(layer.flow.z);

		if (Number.isFinite(turn) && turn) {
			style['--bsb-turn'] = `${Math.max(-360, Math.min(360, turn))}deg`;
			classNames.push('bsb-turned');
		}

		if (Number.isInteger(z)) {
			style.zIndex = z;
			classNames.push('bsb-z');
		}
	}

	// Absolute: X/Y measured inward from the anchor of the content area, which `style.scss` makes fill the slide.
	if (position.absolute) {
		classNames.push('bsb-abs');
		style.position = 'absolute';

		// Lifted out of its slide on the page, over every slide.
		if (position.static) {
			dataAttrs['data-bsb-static'] = '1';
		}

		// A layer others attach to is named for them.
		if (position.id) {
			dataAttrs['data-bsb-layer-id'] = position.id;

			if (live) {
				style.anchorName = anchorName(position.id);
			}
		}

		// Moves on the page only; the canvas stays still so layers can be placed.
		const depth = live ? 0 : Math.min(100, Math.max(0, Math.round(Number(position.depth) || 0)));

		if (depth) {
			dataAttrs['data-bsb-depth'] = String(depth);
		}

		// The canvas draws the previewed device's place; saved markup carries every device's, picked by `style.scss`.
		if (live || !hasDevicePlaces(position)) {
			const look = placeLook(device ? placeFor(position, device) : position.desktop || {}, live, depth);

			Object.assign(style, look.style);
			Object.assign(dataAttrs, look.dataAttrs);
		} else {
			const looks = DEVICES.map(name => placeLook(placeFor(position, name), live, depth));

			[...new Set(looks.flatMap(look => Object.keys(look.style)))].forEach(key => {
				const values = looks.map(look => look.style[key]);

				if (values.every(value => value === values[0])) {
					style[key] = values[0];
					return;
				}

				// A device without the property keeps what came before, e.g. Fit to Content's max width.
				const name = `--bsb-${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`;
				const before = style[key] ?? 'initial';

				style[key] = `var(${name})`;
				DEVICES.forEach((on, i) => {
					style[`${name}-${on}`] = values[i] ?? before;
				});
			});

			looks.forEach(look => Object.assign(dataAttrs, look.dataAttrs));
			dataAttrs['data-bsb-devices'] = '1';
		}
	}

	// Entry
	if (entry.effect) {
		dataAttrs['data-bsb-entry'] = entry.effect;

		if (entry.duration) {
			style['--bsb-anim-duration'] = `${entry.duration}s`;
			// animate.css reads its own property for duration; setting ours alone would be
			// ignored, and setting only theirs would leave the exit animation without one.
			style['--animate-duration'] = `${entry.duration}s`;
		}

		if (entry.delay) {
			style['--bsb-anim-delay'] = `${entry.delay}s`;
		}

		if (entry.early) {
			dataAttrs['data-bsb-early'] = '1';
		}

		if (entry.once) {
			dataAttrs['data-bsb-once'] = '1';
		}

		// A key, not CSS: layerAnimations.js maps it to the curve.
		if (['easeOutQuart', 'easeOutExpo', 'spring'].includes(entry.easing)) {
			dataAttrs['data-bsb-ease'] = entry.easing;
		}

		// How far the layer travels before it lands. Only the fade/slide families read it — the
		// zoom, bounce, flip and hinge keyframes have no translation to scale — so a distance
		// set alongside one of those is carried but has nothing to act on, which is why the
		// control that writes it is only offered for the directional effects.
		if (entry.distance) {
			style['--bsb-anim-distance'] = `${entry.distance}px`;
		}

		// Scale In's start size, and the point Scale In / Zoom In grow from.
		if (undefined !== entry.scale && '' !== entry.scale) {
			style['--bsb-anim-scale'] = String(entry.scale);
		}

		if (entry.origin) {
			style['--bsb-anim-origin'] = entry.origin;
		}

		// Rotate / Tilt / Skew start angle, and Custom's start offset.
		if (Number.isFinite(entry.rotate)) {
			style['--bsb-anim-rotate'] = `${entry.rotate}deg`;
		}

		if (Number.isFinite(entry.x)) {
			style['--bsb-anim-x'] = `${entry.x}px`;
		}

		if (Number.isFinite(entry.y)) {
			style['--bsb-anim-y'] = `${entry.y}px`;
		}
	}

	// Exit
	if (exit.effect) {
		dataAttrs['data-bsb-exit'] = exit.effect;

		if (exit.duration) {
			style['--bsb-exit-duration'] = `${exit.duration}s`;
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
	}

	/*
	 * Hover colour, which is deliberately not one of the effects above.
	 *
	 * The effects are mutually exclusive — a layer cannot grow and lift at once — but colour
	 * combines with any of them, so it gets its own flag and its own class. That is also why
	 * the speed below sits outside both blocks: one `transition` covers whatever is switched on.
	 *
	 * Emitted only where a colour was actually picked. `colorOn` with an empty palette would put
	 * `background: none` over a themed button on hover, which reads as the button breaking.
	 */
	if (hover.colorOn) {
		const { color, bgType, bg, gradient } = hover.colors || {};
		const isGradient = 'gradient' === bgType;
		const background = isGradient ? gradient : bg;

		if (color) {
			style['--bsb-hover-color'] = color;
			classNames.push('bsb-hover--has-color');
		}

		if (background) {
			// A gradient is a `background-image`, a flat colour is a `background-color`; the two
			// are set separately so switching between them clears the other rather than leaving
			// a gradient sitting on top of the colour that replaced it.
			if (isGradient) {
				style['--bsb-hover-bg-image'] = background;
			} else {
				style['--bsb-hover-bg'] = background;
			}

			classNames.push('bsb-hover--has-bg');
		}

		// Border colour on hover; hex so kses keeps it.
		if (hover.borderColor) {
			style['--bsb-hover-border'] = hexColor(hover.borderColor);
			classNames.push('bsb-hover--has-border');
		}

		if (color || background || hover.borderColor) {
			classNames.push('bsb-hover--colour');
		}

		// The picture itself takes the hover colour (opt-in, so older image layers save as before).
		if (hover.recolor && color && imageUrl) {
			classNames.push('bsb-hover--recolor');
		}
	}

	if (hover.speed && (hover.effect || hover.colorOn)) {
		style['--bsb-hover-speed'] = `${hover.speed}s`;
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

		if ('lightbox' === click.action && !legacyLightbox) {
			dataAttrs['data-bsb-lightbox-source'] = click.lightboxSource || 'slide';

			/* The layer's own caption, for the single picture or film it opens. A gallery does
			   not use this — each of its images carries its own below. Written whenever there is
			   text, and read back only if the slider's Caption setting asks for `custom`. */
			if (click.lightboxCaption) {
				dataAttrs['data-bsb-lightbox-caption'] = click.lightboxCaption;
			}
			if (click.lightboxImages && click.lightboxImages.length > 0) {
				dataAttrs['data-bsb-lightbox-images'] = JSON.stringify(
					/* Both captions travel: the one typed here and the one that came off the
					   attachment. Which of them a visitor sees is the slider's `caption` setting,
					   and that is resolved at click time — `buildLayerProps` is handed the layer
					   alone and cannot see the slider's `lightbox` from here. */
					/* `imageCaption` only where the item has one, even an empty one. 2.2.1 wrote
					   `{ src, caption }` and nothing else, and its galleries carry no such key in
					   their attributes — emitting `""` for them changed the saved string and marked
					   every one of those blocks invalid. The runtime already reads a missing key as
					   that older shape, so leaving it off is also what keeps their captions right. */
					click.lightboxImages.map(item => ({
						src: item.url || item.src || '',
						caption: item.caption || '',
						...(undefined !== item.imageCaption ? { imageCaption: item.imageCaption || '' } : {}),
					}))
				);
			}

			// A URL rather than a JSON item like the gallery above: there is only ever one, and
			// the runtime is the place that knows how to describe it to Fancybox — an MP4 needs
			// `type: 'html5video'` while a YouTube link must be left untyped for Fancybox to
			// recognise it. Deciding that here would bake today's answer into saved markup.
			if ('video' === click.lightboxSource && click.lightboxVideo) {
				// `sanitizeHref` answers '#' for anything it will not allow through, and '#' is
				// not a video — writing it would give the runtime a URL to try and fail on.
				const src = sanitizeHref(click.lightboxVideo);

				if ('#' !== src) {
					dataAttrs['data-bsb-lightbox-video'] = src;
				}
			}
		}
	}

	/*
	 * The play button: a Button block redrawn as a disc or a ring with a triangle in it.
	 *
	 * Only the shape changes, which is why this is a class on an ordinary Button rather than a
	 * block of its own — the link, the colours and every other layer setting still apply. All the
	 * drawing lives in `style.scss`; what is written here is only which variant and what size.
	 *
	 * `is-style-ring` is the name the stylesheet already answers to and the name the shipped
	 * demos carry, so it is kept rather than renamed into a `bsb-` prefix: a rename would leave
	 * every page already using it drawing a plain pill.
	 *
	 * The colours are written only when the author actually picked one. Each variable has a
	 * fallback in the stylesheet, and emitting an empty value would override the fallback with
	 * nothing — a triangle with no colour is an invisible triangle.
	 */
	if (play.enabled) {
		classNames.push('bsb-play-button');

		if ('ring' === play.style) {
			classNames.push('is-style-ring');
		}

		if (play.size) {
			style['--bsb-play-size'] = `${play.size}px`;
		}

		if ('ring' === play.style) {
			// One colour draws both the rim and the triangle inside it, which is what makes a
			// ring read as one object rather than an outline with a mark in it.
			if (play.ringColor) {
				style['--bsb-play-ring'] = play.ringColor;
			}
		} else {
			if (play.bg) {
				style['--bsb-play-bg'] = play.bg;
			}

			if (play.color) {
				style['--bsb-play-color'] = play.color;
			}
		}
	}

	// Word stagger — the words themselves are split by `wordStagger.js`; this only carries the
	// spacing between them.
	if (words.enabled && words.offset) {
		style['--bsb-word-offset'] = `${words.offset}s`;
	}

	// Line by line: the same word spans, grouped into visual lines at play time (layerAnimations.js).
	if (words.enabled && 'line' === words.by) {
		dataAttrs['data-bsb-split'] = 'line';
	}

	/*
	 * Count-up — a statistic that tallies to its figure as the slide arrives.
	 *
	 * `to` is the destination only; the finished number stays in the block's own text, so the
	 * figure is right for a reader whose scripts never ran and for a search engine reading the
	 * saved HTML. `layerAnimations.js` reads these back and drives the tween.
	 */
	if (count.enabled) {
		/*
		 * The class is what the runtime actually looks for. `wp_kses` strips unknown `data-*`
		 * attributes from post content for any author without `unfiltered_html`, so the
		 * attributes below reach the page only sometimes — the class always does, and the
		 * figure the count ends on is read from the layer's own text when they are missing.
		 */
		classNames.push('bsb-count');

		/*
		 * How the count runs, as opposed to where it ends. These belong to the count itself and
		 * not to `to` below: an author sets a duration or a prefix through the panel, but `to`
		 * has no field at all — the figure is read from the layer's own text. Nesting these
		 * under `to` would mean a duration nobody could ever set took effect.
		 */
		if (count.duration) {
			dataAttrs['data-bsb-count-duration'] = String(count.duration);
		}

		if (count.delay) {
			dataAttrs['data-bsb-count-delay'] = String(count.delay);
		}

		/*
		 * Written whenever the author typed one, and — unlike the pair above — also written as
		 * an empty string when they cleared it. The runtime falls back to the text either side
		 * of the figure only when the attribute is absent, so a missing attribute means "read it
		 * off the text" and an empty one means "the author asked for nothing here". Without the
		 * empty case, clearing a prefix in the panel would silently restore the one in the text.
		 */
		if (undefined !== count.prefix) {
			dataAttrs['data-bsb-count-prefix'] = String(count.prefix);
		}

		if (undefined !== count.suffix) {
			dataAttrs['data-bsb-count-suffix'] = String(count.suffix);
		}
	}

	if (count.enabled && undefined !== count.to && '' !== count.to) {
		dataAttrs['data-bsb-count'] = String(count.to);
	}

	/*
	 * The progress ring, as measurements rather than as markup.
	 *
	 * `getSaveContent.extraProps` can only add a class, a style or a data attribute to the
	 * block's own root element — it cannot put an `<svg>` inside one. So the ring is described
	 * here and drawn by `layerAnimations.js` at runtime, which is also what keeps the saved
	 * HTML honest: a visitor whose scripts never ran sees the finished number with no empty
	 * circle around it, rather than a ring that never fills.
	 *
	 * Written as separate attributes rather than one JSON blob so `wp_kses` strips at most a
	 * single measurement for an author without `unfiltered_html`; the class is what the runtime
	 * keys on, and every value below has a fallback in the drawing code.
	 */
	if (count.enabled && count.ring?.enabled) {
		classNames.push('bsb-count-ring');

		const { value, size, thickness, color, trackColor } = count.ring;

		if (undefined !== value && '' !== value) {
			dataAttrs['data-bsb-ring-value'] = String(value);
		}

		if (size) {
			dataAttrs['data-bsb-ring-size'] = String(size);
		}

		if (thickness) {
			dataAttrs['data-bsb-ring-thickness'] = String(thickness);
		}

		if (color) {
			dataAttrs['data-bsb-ring-color'] = color;
		}

		if (trackColor) {
			dataAttrs['data-bsb-ring-track'] = trackColor;
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

	// Block order on Tablet / Mobile (style.scss, deviceRules.js); the canvas shows the previewed device's directly.
	const order = layer.order || {};

	if (!position.absolute) {
		['tablet', 'mobile'].forEach(device => {
			if (Number.isInteger(order[device])) {
				style[`--bsb-order-${device}`] = String(order[device]);
				classNames.push(`bsb-order-${device}`);
			}
		});

		const shown = 'mobile' === device ? order.mobile ?? order.tablet : order.tablet;

		if (live && device && 'desktop' !== device && Number.isInteger(shown)) {
			style.order = shown;
			classNames.push('bsb-order-live');
		}
	}

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

	// The canvas shows the previewed device's size, Mobile falling back to Tablet, then Desktop.
	if (live && device && 'desktop' !== device) {
		const own = withUnit(sizes.mobile && 'mobile' === device ? sizes.mobile : sizes.tablet);

		if (own) {
			style.fontSize = own;
			style['--bsb-font-device'] = own;
			classNames.push('bsb-font-device');
		} else if (withUnit(sizes.desktop)) {
			style.fontSize = withUnit(sizes.desktop);
		}
	} else if (withUnit(sizes.desktop)) {
		style.fontSize = withUnit(sizes.desktop);
	}

	// The smaller screens go out as custom properties for `style.scss` to pick up in its own
	// media queries — an inline style cannot carry one of its own. The canvas has its size already.
	if (!live || !device) {
		if (withUnit(sizes.tablet)) {
			style['--bsb-font-size-tablet'] = withUnit(sizes.tablet);
		}

		if (withUnit(sizes.mobile)) {
			style['--bsb-font-size-mobile'] = withUnit(sizes.mobile);
		}
	}

	if (style.fontFamily || style['--bsb-font-size-tablet'] || style['--bsb-font-size-mobile']) {
		classNames.push('bsb-layer-typo');
	}

	// Text effects as custom properties: kses keeps `--*` (gradients included), not `text-shadow` or `background-clip`.
	const { gradient, shadow } = layer.textFx || {};

	if ('string' === typeof gradient && /^(repeating-)?(linear|radial|conic)-gradient\(/.test(gradient)) {
		style['--bsb-text-gradient'] = gradient;
		classNames.push('bsb-text-gradient');
	}

	// Image filters on the layer's picture; the `filter` itself lives in style.scss (kses drops `brightness(`).
	if (layer.imgFilter) {
		const pct = (value) => (Number.isFinite(Number(value)) ? Math.max(0, Math.min(200, Number(value))) / 100 : 1);

		if (undefined !== layer.imgFilter.brightness) {
			style['--bsb-img-brightness'] = String(pct(layer.imgFilter.brightness));
		}

		if (undefined !== layer.imgFilter.saturate) {
			style['--bsb-img-saturate'] = String(pct(layer.imgFilter.saturate));
		}

		if (layer.imgFilter.recolor && imageUrl) {
			style['--bsb-recolor'] = hexColor(layer.imgFilter.recolor);
			classNames.push('bsb-recolor');
		}

		classNames.push('bsb-img-filter');
	}

	// Cover background video: playback and buttons, run by coverVideo.js.
	const { slideOnly, sound, playPause, at } = layer.coverVideo || {};

	if (slideOnly) classNames.push('bsb-cv-slide');
	if (sound) classNames.push('bsb-cv-sound');
	if (playPause) classNames.push('bsb-cv-play');
	if ((sound || playPause) && ['bl', 'tr', 'tl'].includes(at)) classNames.push(`bsb-cv-at-${at}`);

	// The Image block's picture as a mask, for either recolour.
	if (classNames.includes('bsb-recolor') || classNames.includes('bsb-hover--recolor')) {
		const safe = String(imageUrl).replace(/["\\()\s]/g, char => `%${char.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`);

		style['--bsb-mask'] = `url("${safe}")`;
	}

	// Frosted glass: blur behind the layer plus an optional tint; `backdrop-filter` itself lives in style.scss.
	if (layer.glass) {
		const blur = Number(layer.glass.blur);

		style['--bsb-glass-blur'] = `${Number.isFinite(blur) ? Math.max(0, Math.min(40, blur)) : 12}px`;

		if (layer.glass.tint) {
			style['--bsb-glass-tint'] = hexColor(layer.glass.tint);
		}

		classNames.push('bsb-glass');
	}

	// Vertical writing, or a curve drawn at runtime (curvedText.js); the two do not mix.
	const { direction, curve } = layer.textFx || {};

	if ('down' === direction || 'up' === direction) {
		classNames.push('down' === direction ? 'bsb-text-vertical' : 'bsb-text-vertical-up');
	} else if (Number.isFinite(curve) && curve) {
		dataAttrs['data-bsb-curve'] = String(Math.max(-359, Math.min(359, Math.round(curve))));
	}

	if (shadow) {
		const px = (value) => `${Number.isFinite(Number(value)) ? Number(value) : 0}px`;

		style['--bsb-ts-x'] = px(shadow.x);
		style['--bsb-ts-y'] = px(shadow.y);
		style['--bsb-ts-blur'] = px(shadow.blur);

		if (shadow.color) {
			style['--bsb-ts-color'] = hexColor(shadow.color);
		}

		classNames.push('bsb-text-shadow');
	}

	return { className: classNames.join(' '), style, dataAttrs };
};
