import { getBoxValue } from '../../../../bpl-tools/utils/functions';
import { getTypoCSS, getColorsCSS } from '../../../../bpl-tools/utils/getCSS';
import arrows from '../../utils/arrows';

const Style = ({ attributes, clientId, postsCount, products }) => {
	const { badgeStyle = {}, sliders, slideInnerGap, slideInnerGapDevice, titleTypo, titleColor, descTypo, descColor, titleMargin, descMargin, arrow, arrowStyle, indicator, SliderOverly, height, sliderHeight, borderRadius, arrowWidth, deviceArrowWidth, arrowHeight, deviceArrowHeight, arrowRadius, btnColors, btnHovColors, btnPadding, btnBorder, btnRadius, direction, columnGap, rowGap, grid, arrowBorder, thumbnails, sourceType, carousel, caption, image, title, desc, button, postsQuery, layoutType } = attributes;
	const { loadMoreBtn } = grid;
	const { overly, height: thumbnailsHeight, width: thumbnailsWidth, active } = thumbnails;
	const { carouselStyle } = carousel;
	const isVertical = 'vertical' === indicator?.direction;


	const leftCursor = encodeURIComponent(arrows[arrowStyle].left(arrow?.size, arrow?.color, direction))
		.replace(/'/g, '%27')
		.replace(/"/g, '%22');

	const rightCursor = encodeURIComponent(arrows[arrowStyle].right(arrow?.size, arrow?.color, direction))
		.replace(/'/g, '%27')
		.replace(/"/g, '%22');

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
	 * Whether this slider has captions to reveal at all.
	 *
	 * A `video` slider renders a player, not a slide with words over it, and its settings panel says
	 * so by not offering any of this. Without the same check here, a slider switched from posts to
	 * video would carry its saved `caption.display` into rules the panel no longer shows a way to
	 * turn off — a setting still doing something with nothing left to change it.
	 */
	const hasCaption = 'video' !== sourceType;

	/**
	 * The title, description and button, coming in when a slide is pointed at and leaving the same way.
	 *
	 * **The timings are fixed here, and that is deliberate.** Choosing the caption's effect, delay and
	 * duration is a Pro setting — this build writes the same three animate.css classes on every slider
	 * (`fadeInLeft`, `fadeInRight`, `zoomIn`, see `classProps` in Default) and the same delays into the
	 * rules above. The values below are those, so a caption revealed on hover arrives exactly as it does
	 * anywhere else, and no control leaks in that this build does not offer.
	 *
	 * **Why transitions rather than the keyframes.** An animation only knows how to arrive. It runs once
	 * when its element appears, which for a caption revealed on hover is while the slider is still
	 * loading behind `opacity: 0`: it plays out to nobody and `animation-fill-mode: both` holds it on its
	 * last frame, so hovering would reveal a caption already fully formed. A transition is a rule about
	 * the distance between two states, so it is travelled in whichever direction the pointer moves — one
	 * declaration gets the arrival, the departure, and an interruption half way through either.
	 *
	 * The delay lives on the hover rule alone, so the stagger plays on the way in and the caption still
	 * leaves at once when the pointer goes. A 1.4s delay on the way out is not a stagger, it is a slider
	 * that looks stuck.
	 *
	 * Scoped to `.carousel-caption`, the default layout's caption and the only place these animations
	 * exist at all — the grid, thumbnail and carousel layouts have never animated the caption's parts.
	 * Their captions still reveal as a whole, through `overlaid`.
	 */
	const captionParts = [];
	if (caption?.hoverTitle !== false) {
		captionParts.push(['.carousel-caption .bsbTitle', 'opacity: 0; translate: -100% 0;', 0]);
	}
	if (caption?.hoverDesc !== false) {
		captionParts.push(['.carousel-caption p.animate__animated', 'opacity: 0; translate: 100% 0;', 0.7]);
	}
	if (caption?.hoverBtn !== false) {
		captionParts.push(['.carousel-caption .carousel-button', 'opacity: 0; scale: 0.3;', 1.4]);
	}

	const hoverMotionCSS = captionParts.map(([selector, resting, delay]) => `		/* At rest, and the way back: no delay, so the caption leaves as soon as the pointer does. */
		#bsbCarousel-${clientId} .item ${selector} {
			animation: none;
			${resting}
			transition: opacity 0.7s ease, translate 0.7s ease, scale 0.7s ease;
		}

		#bsbCarousel-${clientId} .item:hover ${selector},
		#bsbCarousel-${clientId} .item:focus-within ${selector} {
			opacity: 1;
			translate: none;
			scale: none;
			transition-delay: ${delay}s;
		}`).join('\n\n');

	/**
	 * Where an animate.css effect begins, as a resting state rather than as keyframes.
	 *
	 * These are the effects' own first frames — `fadeInUp` starts one height below at zero opacity,
	 * `zoomIn` at 30% — so an element revealed on hover arrives exactly as it does anywhere else. What
	 * changes is only how it is driven.
	 *
	 * Written as `translate` and `scale`, never `transform`: one property asked to do both positioning
	 * and motion is how a caption ends up jumping to a corner.
	 */
	const restingFrom = {
		fadeInLeft: 'opacity: 0; translate: -100% 0;',
		fadeInRight: 'opacity: 0; translate: 100% 0;',
		fadeInUp: 'opacity: 0; translate: 0 100%;',
		fadeInDown: 'opacity: 0; translate: 0 -100%;',
		fadeIn: 'opacity: 0;',
		zoomIn: 'opacity: 0; scale: 0.3;',
		slideInDown: 'translate: 0 -100%;',
		slideInUp: 'translate: 0 100%;',
		slideInLeft: 'translate: -100% 0;',
		slideInRight: 'translate: 100% 0;',
	};

	/**
	 * The badges and ACF fields, revealed on hover the same way the caption's parts are.
	 *
	 * **The bug this fixes.** Everything on `.bsb-acf-layer` arrived with an animate.css class and an
	 * inline `animation-delay`, which is a keyframe animation — and a keyframe animation runs once, when
	 * its element appears. `.animate__animated` also carries `animation-fill-mode: both`, so it is held
	 * on its last frame afterwards. On a slider revealing its caption on hover that means the first hover
	 * looked right (the animation was still playing) and every hover after it showed the badges simply
	 * appearing, already in place. The caption's own title, description and button never had this problem
	 * because `hoverMotionCSS` above had already replaced their keyframes with transitions; the badge
	 * layer was left out.
	 *
	 * So the keyframes go here too, and the same transition takes over. A transition is a rule about the
	 * distance between two states, so it is travelled in whichever direction the pointer moves — every
	 * hover, in both directions, and interruptible half way through either.
	 *
	 * **The delay comes in on a custom property**, because only `AcfFields` knows it: the stagger that
	 * makes three badges cascade is `base + index × step`, counted per badge as they are rendered. The
	 * value is set inline there and read here, so the cascade survives the change of mechanism.
	 */
	const badgeEffect = attributes?.badgeAnimation?.effect;
	const badgeDuration = Number.isFinite(Number(attributes?.badgeAnimation?.duration))
		? Number(attributes.badgeAnimation.duration)
		: 0.6;

	const isPostSource = sourceType === 'posts' || sourceType === 'woo';

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

	if (sourceType === 'posts' && caption?.hoverDate !== false) {
		hoverAcfSelectors.push(`#bsbCarousel-${clientId} .item .bsb-acf-field-date`);
	}
	if (sourceType === 'posts' && caption?.hoverAuthor !== false) {
		hoverAcfSelectors.push(`#bsbCarousel-${clientId} .item .bsb-acf-field-author`);
	}
	if (sourceType === 'woo' && caption?.hoverPrice !== false) {
		hoverAcfSelectors.push(`#bsbCarousel-${clientId} .item .bsb-acf-field-price`);
	}
	if (sourceType === 'woo' && caption?.hoverSale !== false) {
		hoverAcfSelectors.push(`#bsbCarousel-${clientId} .item .bsb-acf-field-sale`);
	}

	const hasAlwaysVisibleField = 
		(title?.isVisible !== false && caption?.hoverTitle === false) ||
		(desc?.isVisible !== false && caption?.hoverDesc === false) ||
		(isPostSource && button?.isVisible !== false && caption?.hoverBtn === false) ||
		(sourceType === 'posts' && postsQuery?.selectedBadges?.includes('date') && caption?.hoverDate === false) ||
		(sourceType === 'posts' && postsQuery?.selectedBadges?.includes('author') && caption?.hoverAuthor === false) ||
		(sourceType === 'woo' && postsQuery?.selectedBadges?.includes('price') && caption?.hoverPrice === false) ||
		(sourceType === 'woo' && postsQuery?.selectedBadges?.includes('sale') && caption?.hoverSale === false) ||
		hasAlwaysVisibleAcf;

	const layerMotionCSS = hoverAcfSelectors.length === 0 ? '' : `		/* At rest, and the way back: no delay, so they leave as soon as the pointer does. */
		${hoverAcfSelectors.join(',\n\t\t')} {
			animation: none;
			${restingFrom[badgeEffect] || 'opacity: 0;'}
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

	const reducedSelectors = [
		...overlaid,
		...captionParts.map(([selector]) => `#bsbCarousel-${clientId} .item ${selector}`),
		`#bsbCarousel-${clientId} .item .bsb-acf-item`
	];

	/**
	 * The caption, shown always, on hover, or not at all.
	 *
	 * The hover rules sit inside `@media (hover: hover)` and that is not a nicety — it is the whole
	 * difference between a design choice and a bug report. A phone has no pointer, so `:hover` there
	 * either never fires or sticks after a tap; without the guard, every visitor on a phone would get
	 * a slider whose titles and buttons they can never see. Inside the guard, a touch device simply
	 * keeps the caption, which is the right answer and needs no second setting.
	 */
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
		${reducedSelectors.join(',\n\t\t')} {
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
		: 'gradient' === caption?.background && !captionCentred
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

	const imageCSS = (!imageEffect || !hasCaption) ? '' : `@media (hover: hover) and (pointer: fine) {
		#bsbCarousel-${clientId} .item > .img {
			overflow: hidden;
		}

		#bsbCarousel-${clientId} .item > .img img {
			transform: ${imageEffect.rest};
			${imageEffect.filter ? `filter: ${imageEffect.filter};` : ''}
			transition: transform .6s ease, filter .6s ease;
		}

		#bsbCarousel-${clientId} .item:hover > .img img,
		#bsbCarousel-${clientId} .item:focus-within > .img img {
			transform: ${imageEffect.hover};
			${imageEffect.filter ? 'filter: none;' : ''}
		}
	}

	/* The colour change is not movement, so it stays; the scaling goes. */
	@media (hover: hover) and (pointer: fine) and (prefers-reduced-motion: reduce) {
		#bsbCarousel-${clientId} .item > .img img,
		#bsbCarousel-${clientId} .item:hover > .img img,
		#bsbCarousel-${clientId} .item:focus-within > .img img {
			transform: none;
		}
	}`;

	/**
	 * The badges' own look: one set of values for every badge on the slider.
	 *
	 * **Only `--badge`.** An ACF field is drawn by the same component and wears the same `.bsb-acf-item`,
	 * so a rule written against that class would restyle a feature the user was not editing. The class is
	 * added in `AcfFields` for exactly this.
	 *
	 * Written after the preset rules in `style.scss` and with the slider's id in front of them, so a
	 * chosen colour beats the preset's own — which is what "the user picked this" has to mean. The
	 * background is left out when it is empty rather than written as `none`, so a preset that draws no chip
	 * keeps its own answer.
	 */
	const bStyle = {
		typo: {
			fontSize: {
				desktop: 12,
				tablet: 12,
				mobile: 11,
				...(badgeStyle?.typo?.fontSize || {})
			},
			fontWeight: 500,
			lineHeight: '150%',
			...(badgeStyle?.typo || {})
		},
		colors: {
			color: '#ffffff',
			bg: 'rgba(0,0,0,0.65)',
			...(badgeStyle?.colors || {})
		}
	};

	const badgeItem = `#bsbCarousel-${clientId} .bsb-acf-item--badge`;

	const badgeCSS = `
	${getTypoCSS('', bStyle.typo)?.googleFontLink || ''}
	${getTypoCSS(badgeItem, bStyle.typo)?.styles || ''}

	${badgeItem} {
		color: ${bStyle.colors.color};
		background: ${bStyle.colors.bg};
	}

	#bsbCarousel-${clientId} .item .bsb-acf-field-price del {
		${postsQuery?.badgeSettings?.price?.showSaleOnly === true ? 'display: none !important;' : ''}
	}`;

	return <style dangerouslySetInnerHTML={{
		__html: `
	${getTypoCSS('', loadMoreBtn?.typo)?.googleFontLink}
	${getTypoCSS('', titleTypo)?.googleFontLink}
	${getTypoCSS('', descTypo)?.googleFontLink}
	 
	${getTypoCSS(`#bsbCarousel-${clientId} .grid-wrapper .load-more button`, loadMoreBtn?.typo)?.styles}
	${getTypoCSS(`#bsbCarousel-${clientId} .bsbTitle`, titleTypo)?.styles}
	${getTypoCSS(`#bsbCarousel-${clientId} p`, descTypo)?.styles}
	${badgeCSS}

	#bsbCarousel-${clientId} .grid {
		grid-gap: ${rowGap} ${columnGap};
	}

	#bsbCarousel-${clientId} .bsbTitle{
		color: ${titleColor};
		margin: ${getBoxValue(titleMargin)};
		animation-delay: 0s;
		animation-duration: 0.7s;
	}

	#bsbCarousel-${clientId} p {
		color: ${descColor};
		margin: ${getBoxValue(descMargin)};
		animation-delay: 0.7s;
		animation-duration: 0.7s;
	}

	#bsbCarousel-${clientId} .carousel-button {
		animation-delay: 1.4s;
		animation-duration: 0.7s;
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
		height: ${sliderHeight?.desktop || height};
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

	#bsbCarousel-${clientId} .swiper .swiper-wrapper .swiper-slide .item img{
		width:100%;
		height:100%;
		object-fit:cover;
	}

	#bsbCarousel-${clientId} .item, 
	#bsbCarousel-${clientId} .videoItem,
	#bsbCarousel-${clientId} .carousel .swiper,
	#bsbCarousel-${clientId} .thumbnails .bsb-main-carousel-wrapper .bsb-main-slider{
		height: ${sliderHeight?.desktop || height};
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
    	grid-template-${isVertical ? 'rows' : 'columns'}: repeat(${sourceType === "posts" ? postsCount : sourceType === "woo" ? products?.length : sliders?.length}, minmax(auto, ${isVertical ? indicator?.height : indicator?.width}));
		padding: ${isVertical ? '5% 0' : '0 5%'};
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
			height: ${sliderHeight?.tablet || sliderHeight?.desktop || height};
		}
	}

	@media (max-width: 576px) { 
		#bsbCarousel-${clientId} .item, #bsbCarousel-${clientId} .videoItem { 
			height: ${sliderHeight?.mobile || sliderHeight?.tablet || sliderHeight?.desktop || height};
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

	#bsbCarousel-${clientId} .grid-wrapper .pagination button, #bsbCarousel-${clientId} .grid-wrapper .load-more button{
 		${getColorsCSS(loadMoreBtn?.colors)};
		padding: ${getBoxValue(loadMoreBtn?.padding || {})};
		border: ${getBoxValue(loadMoreBtn?.border || {})};
		border-radius:${getBoxValue(loadMoreBtn?.radius)};
	}

	#bsbCarousel-${clientId} .grid-wrapper .button_area{
		text-align: ${loadMoreBtn?.align};
		justify-content: ${loadMoreBtn?.align};
	}

	#bsbCarousel-${clientId} .grid-wrapper .pagination button:hover, #bsbCarousel-${clientId} .grid-wrapper .load-more button:hover{
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

	`.replace(/\s+/g, ' ')
	}} />
}
export default Style;