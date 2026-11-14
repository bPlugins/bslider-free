import { useEffect, useRef, useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import AutoplayToggle, { isKeyboardFocusIn, prefersReducedMotion } from './AutoplayToggle';
import ImageIndicators from './ImageIndicators/ImageIndicators';
import { bindSlideWheel, ensureActiveCarouselItem, isRtlSlider, ownCarouselItems, slideSpeedMs } from '../../utils/functions';
import { initLayerAnimations } from '../../utils/layerAnimations';
import { liftStaticLayers } from '../../utils/staticLayers';
import { watchSlidePads } from '../../utils/slidePads';
import { scaleLayersIn } from '../../utils/layerScale';
import { reviveSlideScripts } from '../../utils/reviveSlideScripts';
import { mountSlidersIn } from '../../utils/sliderMounter';
import arrows from '../../utils/arrows';


const Sliders = (props) => {
	const { attributes, clientId, carousel = null, setCarousel, isBackend = false, children, firstPosts, products } = props;
	const { options, arrow, arrowStyle, indicator, animation, direction, sourceType, isMouseWheel } = attributes;

	const sliderDom = useRef();
	const rtl = isRtlSlider(attributes);
	const autoplays = !isBackend && options.ride === true;
	/* Reduced motion starts paused; the toggle can still start it. */
	const [playing, setPlaying] = useState(() => !prefersReducedMotion());
	const playingRef = useRef(playing);
	playingRef.current = playing;
	const [liveText, setLiveText] = useState('');
	const [slideCount, setSlideCount] = useState(0);
	/*
	 * Bootstrap is given the slider once its slides are actually there.
	 *
	 * `_blocksHtml` is in the deps for the `blocks` source: those slides arrive as a string that
	 * this component's own render inserts, so on the first pass there is nothing under
	 * `sliderDom` yet — `ensureActiveCarouselItem` would find no slides to mark, and Bootstrap
	 * would be handed an empty carousel and remember it that way. Every slide then stays at its
	 * default `display: none`, which is a slider that renders as a blank space.
	 */
	useEffect(() => {
		if (sliderDom?.current) {
			if (carousel) carousel.dispose();

			ensureActiveCarouselItem(sliderDom.current);

			// A `blocks` slider stands still in the editor: no autoplay, and no arrow keys or swipes
			// moving it while someone types in a slide. The tab bar picks the slide there.
			const isStill = isBackend && 'blocks' === sourceType;

			// eslint-disable-next-line no-undef
			var initialize = new bootstrap.Carousel(sliderDom.current, isStill ? {
				interval: false,
				ride: false,
				pause: false,
				keyboard: false,
				touch: false,
			} : {
				interval: options.interval,
				ride: options.ride === true && (isBackend || playingRef.current) ? 'carousel' : false,
				pause: options.pause === true ? 'hover' : false,
			});
			// Bootstrap reads the page's dir for keys and swipes; follow this slider's instead.
			if (rtl) {
				initialize._directionToOrder = dir => ('left' === dir ? 'prev' : 'next');
			}
			setCarousel && setCarousel(initialize);
		}
	}, [options, attributes._blocksHtml, rtl]);

	/* Mousewheel slide, front end only: in the editor the wheel scrolls the canvas. */
	const carouselRef = useRef(null);
	carouselRef.current = carousel;
	const wheelSpeed = slideSpeedMs(attributes) || 600;
	useEffect(() => {
		if (!isMouseWheel || isBackend || !sliderDom?.current) return;

		return bindSlideWheel(sliderDom.current, { step: dir => (dir > 0 ? carouselRef.current?.next() : carouselRef.current?.prev()), rtl, lockMs: Math.max(800, wheelSpeed + 200) });
	}, [isMouseWheel, isBackend, rtl, wheelSpeed]);

	/**
	 * Exactly one slide starts out visible, however late the slides themselves arrive.
	 *
	 * In the editor they come from `<InnerBlocks>`'s own template insertion, which goes through
	 * the block-editor store and so lands after this component's first mount effect has already
	 * looked and found nothing — leaving every slide at Bootstrap's default `display: none` with
	 * no `.active` on any of them.
	 *
	 * Only slides being added or removed, though. A moment into every transition Bootstrap has
	 * taken `.active` off the outgoing slide and not yet put it on the incoming one; watching
	 * attributes as well would see that gap, decide nothing was active, and hand `.active` back
	 * to the first slide — which is why the arrows moved the carousel to a slide that never
	 * appeared.
	 */
	useEffect(() => {
		if (!sliderDom?.current) return;

		const observer = new MutationObserver(mutations => {
			// A slide arriving or leaving is the only thing worth reacting to. Bootstrap moves
			// nodes around mid-transition too, so the test is specifically for a `.carousel-item`
			// having appeared or gone, not for the DOM having changed at all.
			const slidesChanged = mutations.some(m =>
				[...m.addedNodes, ...m.removedNodes].some(node =>
					node.nodeType === Node.ELEMENT_NODE
					&& (node.classList?.contains('carousel-item') || node.querySelector?.('.carousel-item'))
				)
			);

			if (slidesChanged) ensureActiveCarouselItem(sliderDom.current);
		});

		observer.observe(sliderDom.current, { childList: true, subtree: true });
		return () => observer.disconnect();
	}, []);

	/* `ride` off while paused, or Bootstrap restarts the timer after a dot click or mouse leave. */
	useEffect(() => {
		if (!carousel || !autoplays) return;

		carousel._config.ride = playing ? 'carousel' : false;

		if (playing) {
			carousel.cycle();
		} else {
			carousel.pause();
		}
	}, [carousel, autoplays, playing]);

	/* Keyboard focus inside stops autoplay for good, so a focused link never slides away. */
	useEffect(() => {
		const root = sliderDom?.current;
		if (!root || !autoplays) return;

		const onFocus = e => isKeyboardFocusIn(e) && setPlaying(false);

		root.addEventListener('focusin', onFocus);
		return () => root.removeEventListener('focusin', onFocus);
	}, [autoplays]);

	/* Slide semantics and the "Slide 2 of 3" message, front end only (the editor has its own roles). */
	useEffect(() => {
		const root = sliderDom?.current;
		if (!root || isBackend) return;

		const label = () => {
			const items = ownCarouselItems(root);

			items.forEach((item, i) => {
				item.setAttribute('role', 'group');
				item.setAttribute('aria-roledescription', __('slide', 'b-slider'));
				/* translators: 1: slide number, 2: how many slides. */
				item.setAttribute('aria-label', sprintf(__('%1$d of %2$d', 'b-slider'), i + 1, items.length));
			});

			setSlideCount(items.length);
		};

		const onSlid = e => {
			if (e.target !== root) return;
			/* translators: 1: slide number, 2: how many slides. */
			setLiveText(sprintf(__('Slide %1$d of %2$d', 'b-slider'), e.to + 1, ownCarouselItems(root).length));
		};

		label();

		const observer = new MutationObserver(label);
		observer.observe(root, { childList: true, subtree: true });
		root.addEventListener('slid.bs.carousel', onSlid);

		return () => {
			observer.disconnect();
			root.removeEventListener('slid.bs.carousel', onSlid);
		};
	}, [isBackend, attributes._blocksHtml]);

	/**
	 * Anything a third-party block inside a slide needs to run for itself.
	 *
	 * Front end only. In the editor those blocks are live React components that mount normally;
	 * it is only here that their markup arrives as a string, with its scripts inert and every
	 * `DOMContentLoaded` listener long since fired. See reviveSlideScripts for what that costs.
	 */
	useEffect(() => {
		if ('blocks' !== sourceType || isBackend || !sliderDom?.current) return;

		// A slide can hold another bSlider, which arrived in this markup as an empty div with
		// its attributes on it and nothing running behind it — view.js finished its pass over
		// the page before this content existed. It is started from the callback rather than
		// left to the re-fired `DOMContentLoaded`, because view.js's own listener for that
		// event will never run again once the real one has fired. A slider already mounted has
		// had its attributes removed, so a second pass cannot start it twice.
		reviveSlideScripts(sliderDom.current, mountSlidersIn);
	}, [sourceType, isBackend, attributes._blocksHtml]);

	/**
	 * Layer animations, hover and click actions for the blocks inside a `blocks` slider.
	 *
	 * This component is the one place both sides meet: the editor renders its children as real
	 * blocks, the front end as a string put into the page with `dangerouslySetInnerHTML`, and
	 * either way the markup is in the DOM under `sliderDom` by the time an effect runs — React
	 * commits a child's DOM before a parent's effect fires. Re-run when the slide markup changes,
	 * which on the front end means when that string does.
	 */
	useEffect(() => {
		if ('blocks' !== sourceType || !sliderDom?.current) return;
		/* Left on the node for the layer click handler to find: a layer's "Open Lightbox" opens
		   from a DOM listener with no props to read. `view.js` does the same on the front end. */
		sliderDom.current._bsbAttributes = attributes;
		// No layer animations in the editor; the published page plays them.
		if (isBackend) return;
		const stopPads = watchSlidePads(sliderDom.current);
		const dropStatics = liftStaticLayers(sliderDom.current);
		const stopAnimations = initLayerAnimations(sliderDom.current, { isBackend });
		return () => {
			stopAnimations?.();
			dropStatics();
			stopPads();
		};
		/* `lightbox` is in the list so the editor's own lightbox picks up a setting as it is
		   changed, rather than at the next unrelated re-render. */
	}, [sourceType, isBackend, attributes._blocksHtml, carousel, attributes?.lightbox]);

	/** Auto-scale on the canvas too, so the Tablet and Mobile previews show what the page does. */
	useEffect(() => {
		if ('blocks' !== sourceType || !sliderDom?.current) return;

		return scaleLayersIn(sliderDom.current, attributes.layerScale?.on ? attributes.layerScale.width : 0);
	}, [sourceType, attributes.layerScale?.on, attributes.layerScale?.width]);

	/* tabIndex -1: a click anywhere focuses the slider so ← → work, without adding a Tab stop. */
	const carouselProps = isBackend ? {} : { role: 'region', 'aria-roledescription': __('carousel', 'b-slider'), 'aria-label': __('Slider', 'b-slider'), tabIndex: -1 };

	// Return All Slider
	return <div className={`bsbCarousel slide carousel ${sourceType} ${animation === 'default' ? '' : animation} ${direction}`} ref={sliderDom} id={`bsbCarouselInner-${clientId}`} {...carouselProps}>
		{
			/* A `blocks` slider draws its dots from the DOM — see `SourceType/Blocks`. It has no
			   `sliders` attribute to count, so for a while it had no indicators at all: the
			   wrapper would have rendered empty, and Bootstrap, on the first slide change,
			   reaches into `.carousel-indicators` for the dot to move the active class off and
			   fails when there is nothing there. Counting the slides themselves gives it real
			   buttons to find; a count of zero still renders no element at all, which is what
			   tells Bootstrap there are no indicators to keep in step. */
			indicator.visibility && <>
				<div className='indicatorsWrapper'>
					<div className={`carousel-indicators ${indicator?.type} ${indicator.direction} bsbDynamicPosition ${indicator.position?.split(' ')?.join('-')}`}>

						<ImageIndicators {...{ attributes, clientId, firstPosts, products, sliderRef: sliderDom, blocksHtml: attributes._blocksHtml }} />
					</div>
				</div>
			</>
			// </>
		}
		{children}
		{arrow.visibility && <>
			{/* Grouped arrows sit together at one spot. */}
			<div className={`bsbButtonDesign ${'group' === attributes?.arrowPlacement ? 'bsbArrowsGrouped' : ''}`}>

				<button className={`carousel-control-prev`} id={`bsbCarousel-prev-${clientId}`} type="button" onClick={(e) => { e.stopPropagation(); carousel && carousel.prev(); }} aria-label={__('Previous slide', 'b-slider')}>

					<div className="bsbArrowButton" dangerouslySetInnerHTML={{ __html: arrows[arrowStyle][rtl ? 'right' : 'left'](arrow?.size, arrow?.color) }}>
					</div>
				</button>

				<button className="carousel-control-next" id={`bsbCarousel-next-${clientId}`} type="button" onClick={(e) => { e.stopPropagation(); carousel && carousel.next(); }} aria-label={__('Next slide', 'b-slider')}>

					<div className="bsbArrowButton" dangerouslySetInnerHTML={{ __html: arrows[arrowStyle][rtl ? 'left' : 'right'](arrow?.size, arrow?.color) }}>
					</div>
				</button>
			</div>
		</>}

		{autoplays && attributes.autoplayToggle && slideCount > 1 && <AutoplayToggle playing={playing} onToggle={() => setPlaying(!playing)} />}

		{/* Quiet while autoplay runs, so a screen reader is not interrupted every few seconds. */}
		{!isBackend && <div className='bsb-sr-only' aria-live={autoplays && playing ? 'off' : 'polite'} aria-atomic='true'>{liveText}</div>}
	</div>
}
export default Sliders;