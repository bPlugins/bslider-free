import { useEffect, useRef } from 'react';
import ImageIndicators from './ImageIndicators/ImageIndicators';
import { ensureActiveCarouselItem } from '../../utils/functions';
import { initLayerAnimations } from '../../utils/layerAnimations';
import { reviveSlideScripts } from '../../utils/reviveSlideScripts';
import { mountSlidersIn } from '../../utils/sliderMounter';
import arrows from '../../utils/arrows';


const Sliders = (props) => {
	const { attributes, clientId, carousel = null, setCarousel, isBackend = false, children, firstPosts, products } = props;
	const { options, arrow, arrowStyle, indicator, animation, direction, sourceType } = attributes;

	const sliderDom = useRef();
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

			// eslint-disable-next-line no-undef
			var initialize = new bootstrap.Carousel(sliderDom.current, {
				interval: options.interval,
				ride: options.ride === true ? 'carousel' : false,
				pause: options.pause === true ? 'hover' : false,
			});
			setCarousel && setCarousel(initialize);
		}
	}, [options, attributes._blocksHtml]);

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
		return initLayerAnimations(sliderDom.current, { isBackend });
	}, [sourceType, isBackend, attributes._blocksHtml, carousel]);

	// Return All Slider
	return <div className={`bsbCarousel slide carousel ${sourceType} ${animation === 'default' ? '' : animation} ${direction}`} ref={sliderDom} id={`bsbCarouselInner-${clientId}`}>
		{
			/* Not for a `blocks` slider. The dots are drawn off the `sliders` attribute, which
			   that source never fills, so the wrapper would render with nothing inside it — and
			   Bootstrap, on the first arrow click, reaches into it for the dot it has to move
			   the active class off and finds nothing there. Leaving the element out entirely is
			   what tells Bootstrap there are no indicators to keep in step. */
			indicator.visibility && 'blocks' !== sourceType && <>
				<div className='indicatorsWrapper'>
					<div className={`carousel-indicators ${indicator?.type} ${indicator.direction} bsbDynamicPosition ${indicator.position?.split(' ')?.join('-')}`}>

						<ImageIndicators {...{ attributes, clientId, firstPosts, products }} />
					</div>
				</div>
			</>
			// </>
		}
		{children}
		{arrow.visibility && <>
			<div className={`bsbButtonDesign`}>

				<button className={`carousel-control-prev`} id={`bsbCarousel-prev-${clientId}`} type="button" onClick={(e) => { e.stopPropagation(); carousel && carousel.prev(); }} aria-label='Carousel left arrow'>

					<div className="bsbArrowButton" dangerouslySetInnerHTML={{ __html: arrows[arrowStyle].left(arrow?.size, arrow?.color) }}>
					</div>
				</button>

				<button className="carousel-control-next" id={`bsbCarousel-next-${clientId}`} type="button" onClick={(e) => { e.stopPropagation(); carousel && carousel.next(); }} aria-label='Carousel right arrow'>

					<div className="bsbArrowButton" dangerouslySetInnerHTML={{ __html: arrows[arrowStyle].right(arrow?.size, arrow?.color) }}>
					</div>
				</button>
			</div>
		</>}
	</div>
}
export default Sliders;