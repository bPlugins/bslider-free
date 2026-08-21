import { getBoxValue } from '../../../../bpl-tools/utils/functions';
import { getTypoCSS, getColorsCSS } from '../../../../bpl-tools/utils/getCSS';
import arrows from '../../utils/arrows';
import { playerVars } from '../../utils/config';
import { isAutoGridHeight } from '../../utils/functions';

/**
 * What a slide falls back to when every height it could take is empty. The same 450px `block.json`
 * ships as the default, so a slider that has lost its height looks like a fresh one rather than
 * like a bug.
 */
const HEIGHT_FALLBACK = '450px';

const Style = ({ attributes, clientId, postsCount, products }) => {
	const { badgeStyle = {}, listLayout = {}, sliders, slideInnerGap, slideInnerGapDevice, titleTypo, titleColor, descTypo, descColor, titleMargin, descMargin, arrow, arrowStyle, indicator, SliderOverly, height, sliderHeight, borderRadius, margin, arrowWidth, deviceArrowWidth, arrowHeight, deviceArrowHeight, arrowRadius, btnColors, btnHovColors, btnTypo, btnPadding, btnBorder, btnRadius, direction, titleAnimation, descAnimation, btnAnimation, columnGap, rowGap, grid, arrowBorder, thumbnails, sourceType, carousel, caption, image, socialQuery, headerNameTypo, headerNameColor, headerBioTypo, headerBioColor, headerFollowersTypo, headerFollowersColor, headerBtnTypo, headerBtnColors, title, desc, button, layoutType, postsQuery = {}, likesCommentsColor, likesCommentsTypo, playIconColor, playIconBg, playIconHoverBg, cardLayout, cardBgColor, cardPadding, cardRadius } = attributes;
	const isPostSource = sourceType === 'posts' || sourceType === 'woo';
	const { loadMoreBtn } = grid;
	const { overly, height: thumbnailsHeight, width: thumbnailsWidth, active } = thumbnails;
	const { carouselStyle } = carousel;
	const isVertical = 'vertical' === indicator?.direction;

	/** A grid that sizes its cards from the column rather than from a height. See the helper. */
	const isAutoGrid = isAutoGridHeight(attributes);

	/**
	 * The shape those cards take.
	 *
	 * A ratio and not a length, which is the whole point: the column already fixes the width, so a ratio
	 * settles the height without anybody maintaining a pixel value per breakpoint. `original` opts out and
	 * lets each picture keep its own shape.
	 *
	 * Only ever read when `isAutoGrid` — a slider with a height set is in fixed frames and this says
	 * nothing about it.
	 */
	const gridRatio = attributes?.gridItemRatio || '4/3';

	/**
	 * The height a slide gets at each width.
	 *
	 * `auto` rather than a length for an automatic grid, and it is set here rather than overridden further
	 * down on purpose: the height is written into four rules, two of them inside media queries, and a
	 * later rule cannot undo a media query's value at a narrower width. Only one layout is ever on screen,
	 * so a grid's `auto` reaches nothing else.
	 */
	/**
	 * A last resort behind every one of them, because an empty string here is not a missing height —
	 * it is `height: ;`, which the browser throws away along with the rest of the declaration.
	 *
	 * That is what stacked the slides on top of each other. `.item` is absolutely positioned in the
	 * default and carousel layouts, so with no height on the box that contains them the box collapses
	 * to nothing and every slide draws over the last. It took a particular history to reach — a grid
	 * where the height control shows empty, a value typed and cleared, then a switch back to Default,
	 * which leaves `sliderHeight.desktop` as `''` — but nothing warned, nothing recovered, and the
	 * only cure was deleting the block.
	 *
	 * `'auto'` is deliberately not the fallback: it is right for a grid sizing from its ratio and
	 * wrong for a layout whose slides are stacked, which is the case this exists to catch.
	 */
	const heightOr = (...values) => values.find(value => value && String(value).trim()) || HEIGHT_FALLBACK;

	const itemHeight = {
		desktop: isAutoGrid ? 'auto' : heightOr(sliderHeight?.desktop, height),
		tablet: isAutoGrid ? 'auto' : heightOr(sliderHeight?.tablet, sliderHeight?.desktop, height),
		mobile: isAutoGrid ? 'auto' : heightOr(sliderHeight?.mobile, sliderHeight?.tablet, sliderHeight?.desktop, height)
	};


	const leftCursor = encodeURIComponent(arrows[arrowStyle].left(arrow?.size, arrow?.color, direction))
		.replace(/'/g, '%27')
		.replace(/"/g, '%22');

	const rightCursor = encodeURIComponent(arrows[arrowStyle].right(arrow?.size, arrow?.color, direction))
		.replace(/'/g, '%27')
		.replace(/"/g, '%22');

	/**
	 * Every `<p>` inside a slider is a slide description — except the plugin's own messages: the
	 * editor's empty state and the front end's no-posts line.
	 *
	 * They have to be excluded here rather than overridden in the stylesheet. This selector is an ID
	 * and everything in editor.scss is a class, so the description colour won every time: an empty
	 * state explaining how to set a feed up was painted in whatever colour the slide captions use,
	 * which for a white-on-image slider meant white text on a white panel.
	 */
	// Each exclusion is a plain class, not `:not(.bsbEmptyState p)`. A `:not()` holding a complex
	// selector is newer CSS, and a selector a browser cannot parse takes its whole rule down with
	// it — so the descriptions would lose their colour and type outright rather than degrade. These
	// three are every `<p>` NoPosts renders; there is nothing else to exclude.
	// `.bsb-profile-bio` joined the list when the Profile Header arrived: it is a `<p>` inside the
	// slider that is not a slide's description, so it was being painted in the caption colour and
	// its own `#666` in style.scss could not win against an ID. On a slider with white captions the
	// bio was white text on the header's own pale card — there, but unreadable.
	// `.bsb-profile-followers` is the second one, and it was missed when the stats line was added.
	// Same `<p>`, same header, same outcome — and it is also why the Stats Color control appeared to
	// do nothing: this selector carries an ID and five classes, so it beat the single-class rule that
	// control writes. Excluding it here is what lets that control reach the line at all.
	const descText = `#bsbCarousel-${clientId} p:not(.bsbEmptyBody):not(.bsbEmptyNote):not(.bsbNoPosts):not(.bsb-profile-bio):not(.bsb-profile-followers)`;

	/**
	 * Everything laid over a slide's picture.
	 *
	 * Three selectors and not one, because the caption's container is named by the layout: the
	 * default layout calls it `.carousel-caption` and every other layout `.content-area` — see the
	 * `classNames` each one passes to `PostItem`. The third is the badge layer, which holds the date
	 * and the author and is a sibling of the caption rather than part of it. Hiding the caption and
	 * leaving the date floating over the picture on its own looks like a bug, so they move together.
	 */
	const overlaid = [
		`#bsbCarousel-${clientId} .item .content-area`,
		`#bsbCarousel-${clientId} .item .carousel-caption`,
		`#bsbCarousel-${clientId} .item .bsb-acf-layer`,
	];

	/** The same, at the moment a slide is pointed at — or reached with a keyboard. */
	const overlaidShown = overlaid.flatMap(selector => [
		selector.replace(' .item ', ' .item:hover '),
		// A caption at `opacity: 0` still holds a focusable button. Without this, tabbing through a
		// slider moves focus into something nobody can see, and the page scrolls to nothing.
		selector.replace(' .item ', ' .item:focus-within '),
	]);

	/**
	 * The caption, shown always, on hover, or not at all.
	 *
	 * The hover rules sit inside `@media (hover: hover)` and that is not a nicety — it is the whole
	 * difference between a design choice and a bug report. A phone has no pointer, so `:hover` there
	 * either never fires or sticks after a tap; without the guard, every visitor on a phone would get
	 * a slider whose titles and buttons they can never see. Inside the guard, a touch device simply
	 * keeps the caption, which is the right answer and needs no second setting.
	 */
	/**
	 * Whether this slider has captions to reveal at all.
	 *
	 * A `video` slider renders a player, not a slide with words over it, and its settings panel says
	 * so by not offering any of this. Without the same check here, a slider switched from posts to
	 * video would carry its saved `caption.display` into rules the panel no longer shows a way to
	 * turn off — a setting still doing something with nothing left to change it.
	 */
	const hasCaption = 'video' !== sourceType;

	/**
	 * Where each entrance effect starts from, as a resting state rather than as keyframes.
	 *
	 * The values are animate.css's own first frames — `fadeInLeft` begins one width to the left at zero
	 * opacity, `zoomIn` at 30%, the `slideIn*` family travels without fading — so a caption revealed on
	 * hover arrives exactly as it does anywhere else. What changes is only how it is driven.
	 *
	 * Written as `translate` and `scale`, never `transform`: the whole reason the caption used to jump
	 * to a corner was one property being asked to do both positioning and motion.
	 */
	const restingFrom = {
		fadeInLeft: { opacity: 0, translate: '-100% 0' },
		fadeInRight: { opacity: 0, translate: '100% 0' },
		fadeInUp: { opacity: 0, translate: '0 100%' },
		fadeInDown: { opacity: 0, translate: '0 -100%' },
		fadeIn: { opacity: 0 },
		zoomIn: { opacity: 0, scale: '0.3' },
		slideInDown: { translate: '0 -100%' },
		slideInUp: { translate: '0 100%' },
		slideInLeft: { translate: '-100% 0' },
		slideInRight: { translate: '100% 0' },
	};

	/**
	 * The title, description and button, coming in when a slide is pointed at and leaving the same way.
	 *
	 * Driven by transitions here, and by the animate.css keyframes everywhere else — because an
	 * animation only knows how to arrive. It runs once when its element appears, which for a caption
	 * revealed on hover is while the slider is still loading behind `opacity: 0`: the animation somebody
	 * chose in the Style tab played out to nobody and `animation-fill-mode: both` held it on its last
	 * frame, so hovering revealed a caption already fully formed. And there is no honest way to play
	 * keyframes backwards on the way out — flipping `animation-direction` on a finished animation does
	 * not restart it, it simply jumps to the other end.
	 *
	 * A transition has no such problem: it is a rule about the distance between two states, so it is
	 * travelled in whichever direction the pointer moves. One declaration gets the arrival, the
	 * departure, and an interruption half way through either — hover away mid-entrance and it turns
	 * around from where it got to, which is the one thing keyframes cannot do at all.
	 *
	 * So no second set of options for leaving. The exit is the entrance read backwards, which is what
	 * "the same way it came" means; a separate exit effect would be a different feature, not this one.
	 *
	 * The delay lives on the hover rule alone, so the stagger somebody set up plays on the way in and
	 * the caption still leaves at once when the pointer goes. A 1.4s delay on the way out is not a
	 * stagger, it is a slider that looks stuck.
	 *
	 * The desc is reached as `p.animate__animated`: it is the only paragraph in a slide carrying that
	 * class, and unlike the title and the button it has no class of its own to name — the same reason
	 * `descText` above is written the way it is.
	 */
	/**
	 * The three, as `[selector, its animation settings]`.
	 *
	 * Scoped to `.carousel-caption`, which is the default layout's caption and the only place these
	 * animations exist at all: `Default` is the one layout that puts the animate.css classes on the
	 * title, the description and the button — see its `classProps`. The grid, thumbnail and carousel
	 * layouts have never animated them, and reaching into those from here would be inventing motion
	 * nothing in their own markup asked for. Their captions still reveal as a whole, through `overlaid`.
	 */
	const captionParts = [
		caption?.hoverTitle !== false && ['.carousel-caption .bsbTitle', titleAnimation],
		caption?.hoverDesc !== false && ['.carousel-caption p.animate__animated', descAnimation],
		caption?.hoverBtn !== false && ['.carousel-caption .carousel-button', btnAnimation],
	].filter(Boolean);

	const hoverMotionCSS = captionParts.map(([selector, animation]) => {
		/*
		 * A plain fade for anything the table does not name.
		 *
		 * The table covers every option the panel offers — `contentAniOption`, all ten of them — but an
		 * effect can reach here from outside that list: a slider saved when the list was different, or a
		 * value set in code. Falling through with nothing would put that slider back where this started,
		 * with keyframes playing to nobody behind a hidden caption. A fade is the one motion that is
		 * right for every effect name there could ever be, and it still reverses on the way out.
		 *
		 * An *empty* effect is a different answer: nothing was chosen, `Default` renders no animate class
		 * for it, and the caption's own reveal is the whole of what was asked for.
		 */
		const from = restingFrom[animation?.effect] || (animation?.effect ? { opacity: 0 } : null);

		if (! from) {
			return '';
		}

		// Read through `Number.isFinite` rather than with `||`: the panel's own minimum is 0, and a
		// duration of 0 means a caption that appears with no motion at all — it has to survive as itself
		// instead of being taken for missing and replaced by the default.
		const duration = Number.isFinite(Number(animation?.duration)) ? Number(animation.duration) : 0.7;
		const delay = Number(animation?.delay) || 0;

		const resting = [
			undefined === from.opacity ? '' : `opacity: ${from.opacity};`,
			from.translate ? `translate: ${from.translate};` : '',
			from.scale ? `scale: ${from.scale};` : '',
		].filter(Boolean).join('\n\t\t\t');

		return `		/* At rest, and the way back: no delay, so the caption leaves as soon as the pointer does. */
		#bsbCarousel-${clientId} .item ${selector} {
			animation: none;
			${resting}
			transition: opacity ${duration}s ease, translate ${duration}s ease, scale ${duration}s ease;
		}

		#bsbCarousel-${clientId} .item:hover ${selector},
		#bsbCarousel-${clientId} .item:focus-within ${selector} {
			opacity: 1;
			translate: none;
			scale: none;
			transition-delay: ${delay}s;
		}`;
	}).filter(Boolean).join('\n\n');

	/**
	 * The badges and ACF fields, revealed on hover.
	 */

	const selectedAcfFields = postsQuery?.selectedAcfFields || [];
	const acfFieldSettings = postsQuery?.acfFieldSettings || {};

	// Create a unique set of all possible active ACF field names
	const activeFieldNames = new Set([
		...selectedAcfFields,
		...Object.keys(acfFieldSettings)
	]);

	let hasAlwaysVisibleAcf = false;
	const hoverAcfSelectors = [];

	activeFieldNames.forEach(fieldName => {
		const fieldCfg = acfFieldSettings[fieldName] || {};
		if (fieldCfg.hoverOnly !== false) {
			hoverAcfSelectors.push(`#bsbCarousel-${clientId} .item .bsb-acf-field-${fieldName}`);
		} else {
			hasAlwaysVisibleAcf = true;
		}
	});

	const selectedBadges = (sourceType === 'social' ? socialQuery?.selectedBadges : postsQuery?.selectedBadges) || [];
	const badgeSettings = (sourceType === 'social' ? socialQuery?.badgeSettings : postsQuery?.badgeSettings) || {};

	/**
	 * Only for badges actually chosen.
	 *
	 * A badge's element carries `bsb-acf-field-<name>` and the four names — date, author, price,
	 * sale — are ordinary words a site may well have used for an ACF field, so these selectors match
	 * such a field too. Emitted for a badge that is not on the slide, the rule has nothing of its own
	 * to style and quietly takes the field instead, hiding it until the pointer arrives however its
	 * own panel was set.
	 *
	 * Read off `selectedBadges` above rather than `postsQuery` directly, so it answers for a feed's
	 * badges as well as a post slider's.
	 */
	const badgeOn = name => selectedBadges.includes(name);

	if ((sourceType === 'posts' || sourceType === 'social') && badgeOn('date') && badgeSettings?.date?.hoverOnly !== false) {
		hoverAcfSelectors.push(`#bsbCarousel-${clientId} .item .bsb-acf-field-date`);
	}
	if ((sourceType === 'posts' || sourceType === 'social') && badgeOn('author') && badgeSettings?.author?.hoverOnly !== false) {
		hoverAcfSelectors.push(`#bsbCarousel-${clientId} .item .bsb-acf-field-author`);
	}
	if (sourceType === 'woo' && badgeOn('price') && badgeSettings?.price?.hoverOnly !== false) {
		hoverAcfSelectors.push(`#bsbCarousel-${clientId} .item .bsb-acf-field-price`);
	}
	if (sourceType === 'woo' && badgeOn('sale') && badgeSettings?.sale?.hoverOnly !== false) {
		hoverAcfSelectors.push(`#bsbCarousel-${clientId} .item .bsb-acf-field-sale`);
	}

	const hasAlwaysVisibleField = 
		(title?.isVisible !== false && caption?.hoverTitle === false) ||
		(desc?.isVisible !== false && caption?.hoverDesc === false) ||
		((isPostSource || sourceType === 'social') && button?.isVisible !== false && caption?.hoverBtn === false) ||
		((sourceType === 'posts' || sourceType === 'social') && selectedBadges.includes('date') && badgeSettings?.date?.hoverOnly === false) ||
		((sourceType === 'posts' || sourceType === 'social') && selectedBadges.includes('author') && badgeSettings?.author?.hoverOnly === false) ||
		(sourceType === 'woo' && selectedBadges.includes('price') && badgeSettings?.price?.hoverOnly === false) ||
		(sourceType === 'woo' && selectedBadges.includes('sale') && badgeSettings?.sale?.hoverOnly === false) ||
		hasAlwaysVisibleAcf;

	const badgeFrom = restingFrom[attributes?.badgeAnimation?.effect] || { opacity: 0 };
	const badgeDuration = Number.isFinite(Number(attributes?.badgeAnimation?.duration))
		? Number(attributes.badgeAnimation.duration)
		: 0.6;

	const badgeResting = [
		undefined === badgeFrom.opacity ? '' : `opacity: ${badgeFrom.opacity};`,
		badgeFrom.translate ? `translate: ${badgeFrom.translate};` : '',
		badgeFrom.scale ? `scale: ${badgeFrom.scale};` : '',
	].filter(Boolean).join('\n\t\t\t');

	const layerMotionCSS = hoverAcfSelectors.length === 0 ? '' : `		/* At rest, and the way back: no delay, so they leave as soon as the pointer does. */
		${hoverAcfSelectors.join(',\n\t\t')} {
			animation: none;
			${badgeResting}
			transition: opacity ${badgeDuration}s ease, translate ${badgeDuration}s ease, scale ${badgeDuration}s ease;
		}

		${hoverAcfSelectors.map(sel => sel.replace(' .item ', ' .item:hover ')).join(',\n\t\t')},
		${hoverAcfSelectors.map(sel => sel.replace(' .item ', ' .item:focus-within ')).join(',\n\t\t')} {
			opacity: 1;
			translate: none;
			scale: none;
			transition-delay: var(--bsb-item-delay, 0s);
		}`;

	const hoverIndividualSelectors = [];
	if (caption?.hoverTitle !== false) {
		hoverIndividualSelectors.push(`#bsbCarousel-${clientId} .item .bsbTitle`);
	}
	if (caption?.hoverDesc !== false) {
		hoverIndividualSelectors.push(
			`#bsbCarousel-${clientId} .item .content-area p`,
			`#bsbCarousel-${clientId} .item .carousel-caption p`
		);
	}
	if (caption?.hoverBtn !== false) {
		hoverIndividualSelectors.push(`#bsbCarousel-${clientId} .item .carousel-button`);
	}

	const parentHidingCSS = hasAlwaysVisibleField ? '' : `
		${overlaid.join(',\n\t\t')} {
			opacity: 0;
			transition: opacity .35s ease;
		}

		${overlaidShown.join(',\n\t\t')} {
			opacity: 1;
		}

		/* The tint goes with the words. It is there to make them readable, so leaving it dimming a
		   picture that currently has no text over it is dimming for nothing. */
		#bsbCarousel-${clientId} .item::after {
			opacity: 0;
			transition: opacity .35s ease;
		}

		#bsbCarousel-${clientId} .item:hover::after,
		#bsbCarousel-${clientId} .item:focus-within::after {
			opacity: 1;
		}`;

	const isDefaultLayout = !layoutType || 'default' === layoutType;
	const individualHoverCSS = (isDefaultLayout || hoverIndividualSelectors.length === 0) ? '' : `
		${hoverIndividualSelectors.join(',\n\t\t')} {
			opacity: 0;
			transition: opacity .35s ease;
		}

		${hoverIndividualSelectors.map(sel => sel.replace(' .item ', ' .item:hover ')).join(',\n\t\t')},
		${hoverIndividualSelectors.map(sel => sel.replace(' .item ', ' .item:focus-within ')).join(',\n\t\t')} {
			opacity: 1;
		}`;

	const captionCSS = !hasCaption ? '' : 'hidden' === caption?.display
		? `${overlaid.join(',\n\t')} { display: none; }`
		: 'hover' === caption?.display
			? `@media (hover: hover) and (pointer: fine) {
${parentHidingCSS}
${individualHoverCSS}
${hoverMotionCSS}
${layerMotionCSS}
	}

	/* Somebody who has asked their system for less movement gets the fade and none of the travel —
	   the caption as a whole, the title, description and button inside it, and the badges over it. */
	@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: reduce) {
		${overlaid.join(',\n\t\t')},
		${captionParts.map(([selector]) => `#bsbCarousel-${clientId} .item ${selector}`).join(',\n\t\t')},
		#bsbCarousel-${clientId} .item .bsb-acf-item {
			translate: none;
			scale: none;
			transition: opacity .2s ease;
		}
	}`
			: '';

	/**
	 * The same colour at zero alpha, for the clear end of a gradient.
	 *
	 * Fading to the keyword `transparent` is the tempting shortcut and it is why so many gradients
	 * have a grey band through them: `transparent` means *black* at zero alpha, so a colour that is
	 * not black is interpolated towards black on its way out. Fading a colour to its own zero-alpha
	 * self keeps the hue all the way.
	 *
	 * Anything this cannot read comes back as `transparent`, which is the old behaviour and never
	 * worse than a rule the browser throws away.
	 */
	const fadeOut = colour => {
		const value = String(colour || '').trim();

		// #RGB, #RGBA, #RRGGBB and #RRGGBBAA — the alpha, where there is one, is replaced not appended.
		const hex = value.match(/^#([0-9a-f]{3,8})$/i)?.[1];

		if (hex) {
			const full = hex.length <= 4
				? hex.slice(0, 3).split('').map(c => c + c).join('')
				: hex.slice(0, 6);

			return `#${full}00`;
		}

		const parts = value.match(/^rgba?\(([^)]+)\)$/i)?.[1];

		if (parts) {
			const [r, g, b] = parts.split(/[,\s/]+/).filter(Boolean);

			return `rgba(${r}, ${g}, ${b}, 0)`;
		}

		return 'transparent';
	};

	/**
	 * What is painted over the picture to keep the caption readable.
	 *
	 * `solid` is what this always did: one flat tint across the whole slide, which reads the text
	 * out of the picture by dimming all of it — including the parts with no text over them.
	 *
	 * `gradient` puts the same colour only where the words are and lets it fade away, so a photo
	 * keeps its light and the caption still has something to sit on. It follows the caption: with
	 * the caption at the top the gradient comes from the top. Centred, there is no edge for it to
	 * come from, so that falls back to the flat tint rather than inventing a direction.
	 */
	const captionAtTop = String(attributes?.position || '').startsWith('top');
	const captionCentred = String(attributes?.position || '').startsWith('center');

	const overlayPaint = 'none' === caption?.background
		? 'transparent'
		: 'gradient' === caption?.background && ! captionCentred
			? `linear-gradient(to ${captionAtTop ? 'bottom' : 'top'}, ${SliderOverly} 0%, ${fadeOut(SliderOverly)} 65%)`
			: SliderOverly;

	/**
	 * What the picture does when a slide is pointed at.
	 *
	 * `overflow: hidden` on the wrapper is not decoration — it is what makes a zoom a zoom. The
	 * picture is sized to fill its slide already, so scaling it up without clipping pushes it out
	 * over the slide next to it. It is set only when an effect is chosen, so a slider that wants
	 * none of this keeps exactly the box it always had.
	 *
	 * Behind the same pointer guard as the caption: on a phone a `:hover` rule either never fires or
	 * sticks after a tap, and a picture stuck at 108% is a slide that looks broken with no way back.
	 */
	const imageEffect = {
		zoomIn: { rest: 'scale(1)', hover: 'scale(1.08)', filter: '' },
		zoomOut: { rest: 'scale(1.08)', hover: 'scale(1)', filter: '' },
		grayscale: { rest: 'scale(1)', hover: 'scale(1)', filter: 'grayscale(1)' },
	}[image?.hover];

	const imageCSS = ( ! imageEffect || ! hasCaption ) ? '' : `@media (hover: hover) and (pointer: fine) {
		#bsbCarousel-${clientId} .item > .img {
			overflow: hidden;
		}

		/* Every hover selector here excludes the blurred backdrop copy — see \`feedPicture\`. It carries
		   a \`transform\` and a \`filter\` of its own that are the whole of what it is, and a zoom effect
		   would overwrite both: the blur would snap off and the copy would shrink back inside the
		   slide, showing its own faded edges. The picture in front still zooms. */
		#bsbCarousel-${clientId} .item > .img img:not(.bsb-feed-blur) {
			transform: ${imageEffect.rest};
			${imageEffect.filter ? `filter: ${imageEffect.filter};` : ''}
			transition: transform .6s ease, filter .6s ease;
		}

		#bsbCarousel-${clientId} .item:hover > .img img:not(.bsb-feed-blur),
		#bsbCarousel-${clientId} .item:focus-within > .img img:not(.bsb-feed-blur) {
			transform: ${imageEffect.hover};
			${imageEffect.filter ? 'filter: none;' : ''}
		}
	}

	/* The colour change is not movement, so it stays; the scaling goes. */
	@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: reduce) {
		#bsbCarousel-${clientId} .item > .img img:not(.bsb-feed-blur),
		#bsbCarousel-${clientId} .item:hover > .img img:not(.bsb-feed-blur),
		#bsbCarousel-${clientId} .item:focus-within > .img img:not(.bsb-feed-blur) {
			transform: none;
		}
	}`;

	/**
	 * How a feed slide's picture is fitted to its slide — the Image Fit setting.
	 *
	 * A slide is sized by Slider Height against whatever width the layout gives it, so it is almost never
	 * the shape of the picture inside it: a YouTube frame is 16:9, an Instagram post is 1:1 or 4:5. One of
	 * three things has to happen, and the setting says which.
	 *
	 * `cover` fills the slide and crops the overflow. On a video thumbnail that crop takes the title text
	 * and the faces, which sit near the edges, so it is not the default here.
	 *
	 * `contain` fits the whole frame inside, centred, uncropped — and leaves bars where the shapes
	 * disagree. This is what the slider did before the setting existed.
	 *
	 * `blur` is `contain` with those bars filled: a second copy of the same picture sits behind it,
	 * covering the slide, enlarged and blurred. Nothing is cropped and nothing is empty. The copy is
	 * drawn by `PostItem` — see `.bsb-feed-blur` — with the same `src` and `srcset` as the picture in
	 * front of it, so the browser picks the same candidate and fetches it once.
	 *
	 * Only for a feed: an image or a post slider shows a picture chosen to fill its slide, and cropping
	 * one to the slide's shape is what filling it means. Those keep `cover` and never reach this.
	 *
	 * Two selectors for the fit, because the swiper layouts have a `cover` rule of their own and it is
	 * the more specific of the two. This is that selector again, further down the stylesheet, so it wins
	 * on order rather than with an `!important`.
	 */
	const imageFit = socialQuery?.imageFit || 'blur';

	/**
	 * The rules that let a picture set its own card's height — see `isAutoGrid`.
	 *
	 * The height itself is already `auto` by the time this is reached; what is left is everything that
	 * was holding the picture to a box it no longer has:
	 *
	 * - `.item > .img` and the popup anchor inside it are both `height: 100%` in the stylesheet, and
	 *   100% of an `auto` parent is `auto` anyway — written out because relying on that is the kind of
	 *   thing a later stylesheet change quietly breaks.
	 * - `.bsbCarousel .item > .img img` sets width and height to 100% with `!important`. An ID beats
	 *   any number of classes, so `!important` here is answering that one and nothing else.
	 * - `align-items: start` on the grid. `.item` *is* the grid child, and a grid stretches its children
	 *   to the tallest in the row by default — so a card would still be pulled to its neighbour's height,
	 *   with its picture sitting at the top of a taller box. This is what makes each card end where its
	 *   own picture ends.
	 *
	 * The blurred backdrop is excluded, as it is everywhere else. It has no work to do here — with the
	 * box the shape of the picture there is nothing left over to fill — and its own rules keep it
	 * covering the picture exactly, out of sight.
	 *
	 * `width`/`height` attributes on the `<img>` give the browser the ratio before the file lands, so the
	 * grid is laid out once rather than reflowing as each picture arrives. `PostItem` sets them wherever
	 * the feed reports dimensions.
	 */
	const autoGridPicture = ! isAutoGrid ? '' : `
	/**
	 * \`start\`, so the ratio below is the thing that decides a card's height.
	 *
	 * \`.item\` *is* the grid child, and a grid stretches its children to the tallest in the row by
	 * default — which hands the item a definite height and makes \`aspect-ratio\` a suggestion the
	 * browser then ignores. It is what made a card get pulled to its neighbour's height with its
	 * picture stranded at the top of a taller box.
	 */
	#bsbCarousel-${clientId} .grid {
		align-items: start;
	}

	${'original' === gridRatio ? `
	/* Every card its own picture's shape. Nothing is cropped and nothing is padded, and no two cards
	   need agree — the price is a ragged bottom edge where a feed mixes shapes. */
	#bsbCarousel-${clientId} .grid .item > .img,
	#bsbCarousel-${clientId} .grid .item > .img > a {
		height: auto;
	}

	#bsbCarousel-${clientId} .grid .item > .img img:not(.bsb-feed-blur) {
		width: 100% !important;
		height: auto !important;
		display: block;
	}` : `
	/**
	 * One shape for every card, and the height comes out of the column's own width.
	 *
	 * This is the answer to a grid whose cards were far shorter than the fixed height they replaced: a
	 * 16:9 thumbnail in a 380px column is 214px tall against the 450px it used to be, which is correct
	 * arithmetic and a worse-looking grid — and it left the caption, laid over the picture, almost no
	 * room. A ratio keeps what mattered about \`auto\` — no pixel height to maintain, and every card
	 * resizing with its column on every screen — while putting how tall back in somebody's hands.
	 *
	 * The picture fills the box, so Image Fit means exactly what it means everywhere else: \`cover\`
	 * crops to the shape, \`contain\` fits inside it, \`blur\` fills what is left with the picture itself.
	 * A feed whose shape differs from the chosen one is that setting's business, not this one's.
	 */
	#bsbCarousel-${clientId} .grid .item {
		aspect-ratio: ${gridRatio};
		height: auto;
	}

	#bsbCarousel-${clientId} .grid .item > .img,
	#bsbCarousel-${clientId} .grid .item > .img > a {
		height: 100%;
	}`}`;

	const feedPicture = 'social' !== sourceType || 'cover' === imageFit ? '' : `
	#bsbCarousel-${clientId} .item > .img img:not(.bsb-feed-blur),
	#bsbCarousel-${clientId} .swiper .swiper-wrapper .swiper-slide .item > .img img:not(.bsb-feed-blur) {
		object-fit: contain;
	}

	${'blur' !== imageFit ? '' : `
	/* The wrapper the copy is positioned against. It is the picture's own box in every layout, which
	   the slide is not: a caption laid over the slide is a sibling of this, and a backdrop sized to
	   the slide would paint over nothing else but would still be the wrong box to reason about. */
	#bsbCarousel-${clientId} .item > .img {
		position: relative;
		overflow: hidden;
		/* A stacking context, and that is the whole reason the \`z-index\` is here rather than left at
		   \`auto\`. The backdrop and the picture are ordered against each other below with 0 and 1, and
		   without a context of their own to sit in those numbers are measured against the slide's —
		   where the 1 lifts the picture over the slider's overlay colour, which is \`.item::after\` at
		   \`auto\`. The overlay vanished behind the picture. Held in here, the pair keep their order
		   and the whole \`.img\` stays a single layer the overlay still paints on top of. */
		z-index: 0;
	}

	#bsbCarousel-${clientId} .item > .img > img.bsb-feed-blur {
		position: absolute;
		inset: 0;
		width: 100% !important;
		height: 100% !important;
		/* Beats the \`contain\` above, which matches this element too by way of the layouts' own
		   \`.img img\` rules — the copy is the one picture here that must fill its box. */
		object-fit: cover !important;
		/* Scaled up before it is blurred: a blur samples past the edges of what it is given and fades
		   out there, so an unscaled copy would show a soft transparent border all the way round. */
		transform: scale(1.15);
		filter: blur(22px) saturate(1.3) brightness(0.85);
		z-index: 0;
		pointer-events: none;
	}

	/* Above the backdrop. The popup's anchor is already positioned — see \`.bsbFeedPlay\` — but a slide
	   that only shows a picture puts a bare, unpositioned \`<img>\` here, and an unpositioned element
	   paints below a positioned one however they are ordered in the markup. */
	#bsbCarousel-${clientId} .item > .img > img:not(.bsb-feed-blur),
	#bsbCarousel-${clientId} .item > .img > a {
		position: relative;
		z-index: 1;
	}`}`;

	/**
	 * The player's colours, for the players that live inside the slider.
	 *
	 * Two custom properties Plyr's own stylesheet already reads, so this feeds its rules rather than
	 * fighting them — see `playerVars`. Set on the slider's root, because a property set there is
	 * inherited by every player under it however the layouts nest them.
	 *
	 * The lightbox's player is not under here and cannot be reached this way. It is handed the same two
	 * values on the overlay element instead, from the same function, in `bsb_fancybox_options`.
	 */
	/**
	 * Every List layout setting, as custom properties on the slider's own root.
	 *
	 * Properties rather than rules, so the stylesheet holds the shapes once and this holds only the
	 * numbers. Changing "rows in view" then costs one variable instead of a new selector — and because
	 * the list reads them through `var()`, nothing in the layout re-renders to pick a change up.
	 *
	 * Only written for the layout it belongs to: a grid slider carrying a dozen unread variables would
	 * be a dozen lines in every page's head for nothing.
	 */
	const listCSS = 'list' !== attributes?.layoutType ? '' : `
	#bsbCarousel-${clientId} .bsbList {
		--bsb-list-rows: ${listLayout.rows ?? 4};
		--bsb-list-thumb-w: ${listLayout.thumbWidth ?? 168}px;
		--bsb-list-thumb-ratio: ${listLayout.thumbRatio || '16/9'};
		--bsb-list-row-gap: ${listLayout.rowGap ?? 8}px;
		--bsb-list-row-pad: ${listLayout.rowPadding ?? 8}px;
		--bsb-list-row-radius: ${listLayout.rowRadius ?? 10}px;
		--bsb-list-title-lines: ${listLayout.titleLines ?? 2};
		--bsb-list-stage-ratio: ${listLayout.stageRatio || '16/9'};
		--bsb-list-row-bg: ${listLayout.rowBg || 'transparent'};
		--bsb-list-row-hover: ${listLayout.rowHoverBg || 'rgba(0,0,0,0.05)'};
		--bsb-list-row-active: ${listLayout.rowActiveBg || 'rgba(24,108,245,0.10)'};
		--bsb-list-title: ${listLayout.rowTitleColor || '#111827'};
		--bsb-list-meta: ${listLayout.rowMetaColor || '#6b7280'};
		--bsb-list-bar: ${listLayout.activeBarColor || '#ff0000'};
		--bsb-list-watched: ${listLayout.watchedColor || '#16a34a'};
	}`;

	/**
	 * The overlay's look: one set of values for everything drawn on it.
	 *
	 * **Both badges and ACF fields.** It used to name `.bsb-acf-item--badge` so a badge colour could not
	 * reach a feature nobody was editing. In practice the two are the same row of chips over the same
	 * slide — a date badge beside a price field — and styling half of them was not caution, it was a
	 * slider with two typefaces on one line and no second panel to fix it with. So the rule names
	 * `.bsb-acf-item`, which both wear. The `--badge` class stays for anything that really is badge-only.
	 *
	 * Written after the preset rules in `style.scss` and with the slider's id in front of them, so a
	 * chosen colour beats the preset's own — which is what "the user picked this" has to mean. The
	 * background is left out when it is empty rather than written as `none`, so a preset that draws no chip
	 * keeps its own answer.
	 */
	const badgeItem = `#bsbCarousel-${clientId} .bsb-acf-item`;

	const badgeCSS = `
	${getTypoCSS('', badgeStyle?.typo)?.googleFontLink || ''}
	${getTypoCSS(badgeItem, badgeStyle?.typo)?.styles || ''}

	${badgeItem} {
		${badgeStyle?.colors?.color ? `color: ${badgeStyle.colors.color};` : ''}
		${badgeStyle?.colors?.bg ? `background: ${badgeStyle.colors.bg};` : ''}
	}

	#bsbCarousel-${clientId} .item .bsb-acf-field-price del {
		${postsQuery?.badgeSettings?.price?.showSaleOnly === true ? 'display: none !important;' : ''}
	}`;

	const playerColors = Object.entries(playerVars(attributes?.videoConf))
		.filter(([, value]) => value)
		.map(([prop, value]) => `\t\t${prop}: ${value};`)
		.join('\n');

	return <style dangerouslySetInnerHTML={{
		__html: `
	${getTypoCSS('', loadMoreBtn?.typo)?.googleFontLink}
	${getTypoCSS('', titleTypo)?.googleFontLink}
	${getTypoCSS('', descTypo)?.googleFontLink}
	${getTypoCSS('', btnTypo)?.googleFontLink}
	${getTypoCSS(`#bsbCarousel-${clientId} .grid-wrapper .load-more button`, loadMoreBtn?.typo)?.styles}
	${getTypoCSS(`#bsbCarousel-${clientId} .bsbTitle`, titleTypo)?.styles}
	${getTypoCSS(descText, descTypo)?.styles}
	${getTypoCSS(`#bsbCarousel-${clientId} .carousel-button a`, btnTypo)?.styles}

	#bsbCarousel-${clientId} {
${playerColors}
	}
	${listCSS}
	${badgeCSS}

	#bsbCarousel-${clientId} .bsbCarousel {
		margin:${getBoxValue(margin)};
	}

	#bsbCarousel-${clientId} .grid {
		grid-gap: ${rowGap} ${columnGap};
	}

	${getTypoCSS(`#bsbCarousel-${clientId} .bsb-profile-name`, headerNameTypo)?.styles}
	${getTypoCSS(`#bsbCarousel-${clientId} .bsb-profile-bio`, headerBioTypo)?.styles}
	${getTypoCSS(`#bsbCarousel-${clientId} .bsb-profile-followers`, headerFollowersTypo)?.styles}
	${getTypoCSS(`#bsbCarousel-${clientId} .bsb-follow-btn`, headerBtnTypo)?.styles}

	/*
	 * The profile header's own colours.
	 *
	 * Written through the same ID selector the captions use, and that is the point: the caption
	 * rule reaches every paragraph in the slider, so the header's bio had to be excluded from it —
	 * see descText — and then needed a colour of its own to fall back to. A class in style.scss
	 * could never have provided one, because an ID beats a class wherever the two meet.
	 *
	 * The name is left alone when nothing is chosen. An unset colour inherits the page, which suits
	 * a header sitting on the site's own background better than any value that could be guessed.
	 */
	${headerNameColor ? `#bsbCarousel-${clientId} .bsb-profile-name { color: ${headerNameColor}; }` : ''}

	#bsbCarousel-${clientId} .bsb-profile-bio {
		color: ${headerBioColor || '#666666'};
	}

	/**
	 * The stats line: "199K Subscribers, 1.1K Videos, 4.6M Views".
	 *
	 * Written only when the user has picked a colour. Printing the grey fallback unconditionally is
	 * what made the card style's accented figures both unreachable and undefeatable at once: this
	 * rule is ID-scoped, so it beat the stylesheet's dark-mode grey even on a slider nobody had
	 * touched, while the figures inside kept their own accent rule and ignored it. Silent here means
	 * the stylesheet decides, which is what the two header styles are for.
	 *
	 * The custom property is read by those figures — see the strong rule under
	 * .bsb-profile-followers in style.scss. Without it the card style goes on painting them accent.
	 */
	${headerFollowersColor ? `#bsbCarousel-${clientId} .bsb-profile-followers { color: ${headerFollowersColor}; --bsb-stats-color: ${headerFollowersColor}; }` : ''}

	#bsbCarousel-${clientId} .bsb-follow-btn {
		${getColorsCSS(headerBtnColors)};
	}

	#bsbCarousel-${clientId} .bsbTitle{
		color: ${titleColor};
		margin: ${getBoxValue(titleMargin)};
		animation-delay: ${titleAnimation?.delay}s;
		animation-duration: ${titleAnimation?.duration}s;
	}

	${descText} {
		color: ${descColor};
		margin: ${getBoxValue(descMargin)};
		animation-delay: ${descAnimation?.delay}s;
		animation-duration: ${descAnimation?.duration}s;
	}

	#bsbCarousel-${clientId} .carousel-button {
		animation-delay: ${btnAnimation?.delay}s;
		animation-duration: ${btnAnimation?.duration}s;
	}

	#bsbCarousel-${clientId} .carousel-button a {
		${getColorsCSS(btnColors)};
		padding: ${getBoxValue(btnPadding || {})};
		border: ${getBoxValue(btnBorder || {})};
		border-radius: ${btnRadius};
		transition:0.3s;
	}

	#bsbCarousel-${clientId} .carousel-button a:hover {
		${getColorsCSS(btnHovColors)};
		transition:0.3s;
	}

	#bsbCarousel-${clientId} .item, 
	#bsbCarousel-${clientId} .videoItem,
	#bsbCarousel-${clientId} .thumbnails .side-by-side .bsb-slider-thumbnail{
		position:relative;
		height: ${itemHeight.desktop};
		border-radius: ${getBoxValue(borderRadius)};
		box-sizing: border-box;
		overflow: hidden;
	}

	#bsbCarousel-${clientId} .thumbnails .side-by-side .bsb-slider-thumbnail{
		width:100%;
	}

	#bsbCarousel-${clientId} .thumbnails .bsb-slider-thumbnail {
		height: ${thumbnailsHeight?.desktop};
	}

	#bsbCarousel-${clientId} .thumbnails .bsb-slider-thumbnail .swiper-wrapper .swiper-slide .single_thumbnails .img {
		border-radius: ${getBoxValue(borderRadius)};
	}

	#bsbCarousel-${clientId} .thumbnails .bsb-slider-thumbnail .swiper-wrapper .swiper-slide .single_thumbnails .img::after{
		background: ${overly?.color};
	}

	#bsbCarousel-${clientId} .thumbnails .bsb-slider-thumbnail .swiper-wrapper .swiper-slide.swiper-slide-thumb-active .img::after{
		background: ${active?.color};
	}

	#bsbCarousel-${clientId} .thumbnails .bsb-slider-thumbnail .swiper-wrapper .swiper-slide.swiper-slide-thumb-active .img{
		border: ${getBoxValue(active?.border || {})};
	}

	#bsbCarousel-${clientId} .swiper .swiper-wrapper .swiper-slide .item {
		height:100%;
	}

	/* The slide's own picture. This was .item img, which also caught an image placed in the title
	   or the description and sized it to the whole slide. */
	#bsbCarousel-${clientId} .swiper .swiper-wrapper .swiper-slide .item > .img img{
		width:100%;
		height:100%;
		object-fit:cover;
	}

	${feedPicture}

	${autoGridPicture}

	#bsbCarousel-${clientId} .item,
	#bsbCarousel-${clientId} .videoItem,
	#bsbCarousel-${clientId} .carousel .swiper,
	#bsbCarousel-${clientId} .thumbnails .bsb-main-carousel-wrapper .bsb-main-slider{
		height: ${itemHeight.desktop};
	}

	#bsbCarousel-${clientId} .bsbButtonDesign .bsbArrowButton {
		${getColorsCSS(arrow)};
		font-size:${arrow?.size}px;
		width:${deviceArrowWidth?.desktop || arrowWidth};
		height:${deviceArrowHeight?.desktop || arrowHeight};
		border-radius:${getBoxValue(arrowRadius)};
		border: ${getBoxValue(arrowBorder)}
	}	

	@media (max-width: 768px) {
		#bsbCarousel-${clientId} .bsbButtonDesign .bsbArrowButton {
			width:${deviceArrowWidth?.tablet || deviceArrowWidth?.desktop || arrowWidth};
			height:${deviceArrowHeight?.tablet || deviceArrowHeight?.desktop || arrowHeight};
		}

		#bsbCarousel-${clientId} .bsb-main-carousel-wrapper .carousel .swiper,
		#bsbCarousel-${clientId} .carousel .bsb-main-carousel-wrapper .bsb-main-slider {
			width:calc(100% - (${deviceArrowWidth?.tablet} + ${deviceArrowWidth?.tablet} + 10px));
		}

		#bsbCarousel-${clientId} .thumbnails .bsb-slider-thumbnail {
			height: ${thumbnailsHeight?.tablet};
		}
	}

	@media (max-width: 576px) { 
		#bsbCarousel-${clientId} .bsbButtonDesign .bsbArrowButton { 
			width:${deviceArrowWidth?.mobile || deviceArrowWidth?.tablet || deviceArrowWidth?.desktop || arrowWidth};
			height:${deviceArrowHeight?.mobile || deviceArrowHeight?.tablet || deviceArrowHeight?.desktop || arrowHeight};
		}

		#bsbCarousel-${clientId} .bsb-main-carousel-wrapper .carousel .swiper,
		#bsbCarousel-${clientId} .carousel .bsb-main-carousel-wrapper .bsb-main-slider {
			width:calc(100% - (${deviceArrowWidth?.mobile} + ${deviceArrowWidth?.mobile} + 10px));
		}

		#bsbCarousel-${clientId} .thumbnails .bsb-slider-thumbnail {
			height: ${thumbnailsHeight?.mobile};
		}
	}

	#bsbCarousel-${clientId} .default .bsbButtonDesign button{
		width:calc(40px + ${deviceArrowWidth?.desktop || arrowWidth});
	}

	@media (max-width: 768px) {
		#bsbCarousel-${clientId} .default .bsbButtonDesign button {
			width:calc(40px + ${deviceArrowWidth?.tablet || deviceArrowWidth?.desktop || arrowWidth});	 
		}
	}

	@media (max-width: 576px) { 
		#bsbCarousel-${clientId} .default .bsbButtonDesign button { 
			width:calc(40px + ${deviceArrowWidth?.mobile || deviceArrowWidth?.tablet || deviceArrowWidth?.desktop || arrowWidth});
		}
	}

	#bsbCarousel-${clientId} .item:after{
		content: '';
		width: 100%;
		height: 100%;
		position: absolute;
		top: 0;
		left: 0;
		background: ${overlayPaint};
	}

	${captionCSS}

	${imageCSS}

	#bsbCarousel-${clientId} .mainLayout .lightboxArea .contentArea .img .play{
		background:${SliderOverly};
	}

	#bsbCarousel-${clientId} .video .item:after {
		content: '';
		width: 0;
		height: 0;
		position: absolute;
		top: 0;
		left: 0;
	}

	#bsbCarousel-${clientId} .carousel-indicators {
    	grid-template-${isVertical ? 'rows' : 'columns'}: repeat(${("posts" === sourceType || "social" === sourceType) ? postsCount : sourceType === "woo" ? products?.length : sliders?.length}, minmax(auto, ${isVertical ? indicator?.height : indicator?.width}));
		padding: ${isVertical ? '5% 0' : '0 5%'};
	}

	#bsbCarousel-${clientId} .horizontal button {
		transform: translateY(${indicator?.moveFromEdge});
	}
	#bsbCarousel-${clientId} .vertical button {
		transform: translateX(${indicator?.moveFromEdge});
	}

	#bsbCarousel-${clientId} .carousel-indicators {
		flex-direction: ${"vertical" === indicator?.direction ? 'column' : 'row'};
	}

	#bsbCarousel-${clientId} .carousel-indicators button{
		max-width: ${indicator?.width} !important;
		max-height: ${indicator?.height} !important;
		background-color:${indicator.color};
		border: ${indicator?.border?.width || '0px'} solid transparent;
		border-radius: ${indicator?.radius};
		padding:0;
	}

	#bsbCarousel-${clientId} .carousel-indicators .bsb-bullet{
		width: ${indicator?.width} !important;
		height: ${indicator?.height} !important;
	}

	#bsbCarousel-${clientId} .carousel-indicators button.active{
		background-color:${indicator?.activeColor};
		border: ${getBoxValue(indicator?.activeBorder || {})};
	}

	#bsbCarousel-${clientId} .arrowMouseEffect .carousel-control-prev:hover {
		cursor: url("data:image/svg+xml,${leftCursor}"), default;
	}

	#bsbCarousel-${clientId} .arrowMouseEffect .carousel-control-next:hover {
		cursor: url("data:image/svg+xml,${rightCursor}"), default;
	}

	@media (max-width: 768px) {
		#bsbCarousel-${clientId} .item, #bsbCarousel-${clientId} .videoItem {
			height: ${itemHeight.tablet};
		}
	}

	@media (max-width: 576px) { 
		#bsbCarousel-${clientId} .item, #bsbCarousel-${clientId} .videoItem { 
			height: ${itemHeight.mobile};
		}
	}

	#bsbCarousel-${clientId} .item .carousel-caption {
		width:calc(100% - ${slideInnerGapDevice?.desktop || slideInnerGap});
	}

	@media (max-width: 768px) { 
		#bsbCarousel-${clientId} .item .carousel-caption {
			width:calc(100% - ${slideInnerGapDevice?.tablet || slideInnerGapDevice?.desktop || slideInnerGap});
		}

		#bsbCarousel-${clientId} .bsb-main-carousel-wrapper.side-by-side .bsb-thumbnail-left{
			width: ${thumbnailsWidth?.tablet};
		}

		#bsbCarousel-${clientId} .bsb-main-carousel-wrapper.side-by-side .carousel-wrapper{
			width: calc( 100% - ${thumbnailsWidth?.tablet} );
		}
	}

	@media (max-width: 576px) { 
		#bsbCarousel-${clientId} .item .carousel-caption {
			width:calc(100% - ${slideInnerGapDevice?.mobile || slideInnerGapDevice?.tablet || slideInnerGapDevice?.desktop || slideInnerGap});
		}

		#bsbCarousel-${clientId} .bsb-main-carousel-wrapper.side-by-side .bsb-thumbnail-left{
			width: ${thumbnailsWidth?.mobile};
		}

		#bsbCarousel-${clientId} .bsb-main-carousel-wrapper.side-by-side .carousel-wrapper{
			width: calc( 100% - ${thumbnailsWidth?.mobile} );
		}
	}

	#bsbCarousel-${clientId} .carousel .bsb-main-carousel-wrapper .swiper {
		${(arrow?.visibility && carouselStyle !== "ticker") ? `width:calc(100% - (${deviceArrowWidth?.desktop} + ${deviceArrowWidth?.desktop} + 10px));` : ''}
	}

	#bsbCarousel-${clientId} .grid-wrapper .pagination button, #bsbCarousel-${clientId} .grid-wrapper .load-more button, #bsbCarousel-${clientId} .thumbs-as-grid .load-more button{
 		${getColorsCSS(loadMoreBtn?.colors)};
		padding: ${getBoxValue(loadMoreBtn?.padding || {})};
		border: ${getBoxValue(loadMoreBtn?.border || {})};
		border-radius:${getBoxValue(loadMoreBtn?.radius)};
	}

	#bsbCarousel-${clientId} .grid-wrapper .button_area, #bsbCarousel-${clientId} .thumbs-as-grid .button_area{
		text-align: ${loadMoreBtn?.align};
		justify-content: ${loadMoreBtn?.align};
	}

	#bsbCarousel-${clientId} .grid-wrapper .pagination button:hover, #bsbCarousel-${clientId} .grid-wrapper .load-more button:hover, #bsbCarousel-${clientId} .thumbs-as-grid .load-more button:hover{
		${getColorsCSS(loadMoreBtn?.hovColors)};
	}

	#bsbCarousel-${clientId} .grid-wrapper .pagination button.active {
		${getColorsCSS(loadMoreBtn?.hovColors)};
	}

	#bsbCarousel-${clientId} .bsb-main-carousel-wrapper.side-by-side .bsb-thumbnail-left{
		width: ${thumbnailsWidth?.desktop};
	}

	#bsbCarousel-${clientId} .bsb-main-carousel-wrapper.side-by-side .carousel-wrapper{
		width: calc( 100% - ${thumbnailsWidth?.desktop} );
	}

	${'social' !== sourceType ? '' : `
	#bsbCarousel-${clientId} .bsb-social-post-stats {
		${likesCommentsColor ? `color: ${likesCommentsColor};` : ''}
	}
	${getTypoCSS(`#bsbCarousel-${clientId} .bsb-social-post-stats .bsb-stat-count`, likesCommentsTypo)?.styles}

	#bsbCarousel-${clientId} .bsbFeedPlayIcon,
	#bsbCarousel-${clientId} .bsb-thumb-play {
		${playIconColor ? `color: ${playIconColor} !important;` : ''}
		${playIconBg ? `background: ${playIconBg} !important;` : ''}
	}
	#bsbCarousel-${clientId} .bsbFeedPlayIcon svg,
	#bsbCarousel-${clientId} .bsb-thumb-play::after {
		${playIconColor ? `stroke: ${playIconColor} !important; fill: ${playIconColor} !important;` : ''}
	}
	#bsbCarousel-${clientId} .bsbFeedPlay:hover .bsbFeedPlayIcon,
	#bsbCarousel-${clientId} .bsb-thumb-cell:hover .bsb-thumb-play,
	#bsbCarousel-${clientId} .single_thumbnails:hover .bsb-thumb-play {
		${playIconHoverBg ? `background: ${playIconHoverBg} !important;` : ''}
	}

	#bsbCarousel-${clientId} .bsbSlideActions {
		${(() => {
			const pos = socialQuery?.hoverActionsPosition || 'top-right';
			if (pos === 'top-left') {
				return 'top: 10px !important; left: 10px !important; right: auto !important; bottom: auto !important;';
			} else if (pos === 'bottom-right') {
				return 'bottom: 10px !important; right: 10px !important; top: auto !important; left: auto !important;';
			} else if (pos === 'bottom-left') {
				return 'bottom: 10px !important; left: 10px !important; top: auto !important; right: auto !important;';
			}
			return 'top: 10px !important; right: 10px !important; left: auto !important; bottom: auto !important;';
		})()}
	}
	`}

	${'hover' === caption?.display ? `
	#bsbCarousel-${clientId} .item .content-area {
		display: flex !important;
		align-items: center !important;
		justify-content: center !important;
		background: rgba(0, 0, 0, 0.75) !important;
	}
	` : ''}

	${(cardLayout && caption?.display !== 'hover') ? `
	#bsbCarousel-${clientId} .item {
		display: flex !important;
		flex-direction: column !important;
		height: auto !important;
		aspect-ratio: auto !important;
		${cardBgColor ? `background-color: ${cardBgColor} !important;` : 'background-color: #f3f4f6 !important;'}
		${cardRadius ? `
			border-radius: ${cardRadius.top || '0px'} ${cardRadius.right || '0px'} ${cardRadius.bottom || '0px'} ${cardRadius.left || '0px'} !important;
		` : ''}
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03) !important;
		overflow: hidden !important;
	}

	#bsbCarousel-${clientId} .carousel-item:not(.active):not(.carousel-item-next):not(.carousel-item-prev):not(.carousel-item-start):not(.carousel-item-end) {
		display: none !important;
	}

	#bsbCarousel-${clientId} .item > .img,
	#bsbCarousel-${clientId} .item > .img > a {
		height: auto !important;
		aspect-ratio: 1/1 !important;
		width: 100% !important;
	}

	#bsbCarousel-${clientId} .item .content-area {
		position: static !important;
		display: flex !important;
		flex-direction: column !important;
		align-items: center !important;
		justify-content: center !important;
		width: 100% !important;
		height: auto !important;
		text-align: center !important;
		${cardPadding ? `
			padding: ${cardPadding.top || '16px'} ${cardPadding.right || '16px'} ${cardPadding.bottom || '16px'} ${cardPadding.left || '16px'} !important;
		` : 'padding: 16px !important;'}
	}

	#bsbCarousel-${clientId} .item .captionContent {
		position: static !important;
		transform: none !important;
		width: 100% !important;
		max-width: 100% !important;
	}
	` : ''}

	`.replace(/\s+/g, ' ')
	}} />
}
export default Style;