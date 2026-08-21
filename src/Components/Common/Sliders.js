import { useEffect, useRef } from 'react';
import ImageIndicators from './ImageIndicators/ImageIndicators';
import { slideEnd, slideStart, whileEvent } from '../../utils/functions';
import arrows from '../../utils/arrows';
const $ = jQuery;

const Sliders = (props) => {
	const { attributes, clientId, carousel = null, setCarousel, isBackend = false, children, firstPosts, products } = props;
	const { options, arrow, arrowStyle, indicator, animation, direction, isMouseWheel, isArrowFollowSlide, isMouseDrag, sourceType, sliders } = attributes;

	// Click any content slide quick slide 
	const sliderDom = useRef();
	// setting autoplay option
	useEffect(() => {
		let initialize = null;
		if (sliderDom?.current) {
			if (carousel) {
				try {
					carousel.dispose();
				} catch (e) {
					// Ignore disposal error for old instance
				}
			}

			// eslint-disable-next-line no-undef
			initialize = new bootstrap.Carousel(sliderDom.current, {
				interval: options.interval,
				ride: options.ride === true ? 'carousel' : false,
				pause: options.pause === true ? 'hover' : false,
			});
			setCarousel && setCarousel(initialize);
		}

		return () => {
			if (initialize) {
				try {
					initialize.dispose();
				} catch (e) {
					// Ignore disposal error on unmount
				}
			}
			setCarousel && setCarousel(null);
		};
	}, [options]);

	// Slide on Mousewheel
	useEffect(() => {
		if (isMouseWheel) {
			$(sliderDom?.current).bind('mousewheel', whileEvent);
		} else {
			$(sliderDom?.current).unbind('mousewheel', whileEvent);
		}
		return () => {
			$(sliderDom?.current).unbind('mousewheel', whileEvent);
		};
	}, [isMouseWheel]);

	// slide mouse drag 
	useEffect(() => {
		if (isMouseDrag) {
			$(sliderDom?.current).on('mousedown touchstart', slideStart);
			$(sliderDom?.current).on('mouseup touchend', slideEnd);
		}
		else {
			$(sliderDom?.current).off('mousedown touchstart', slideStart);
			$(sliderDom?.current).off('mouseup touchend', slideEnd);
		}
		return () => {
			$(sliderDom?.current).off('mousedown touchstart', slideStart);
			$(sliderDom?.current).off('mouseup touchend', slideEnd);
		};
	}, [isMouseDrag]);

	const totalSlides = (sourceType === 'image' || sourceType === 'video')
		? (sliders?.length || 0)
		: (firstPosts?.length || products?.length || 0);

	// Return All Slider
	return <div className={`bsbCarousel slide carousel ${sourceType} ${isMouseDrag && 'mouseDrag'} ${animation === 'default' ? '' : animation} ${direction}`} ref={sliderDom} id="carousel-example-generic">
		{
			indicator.visibility && totalSlides > 1 && <>
				<div className='indicatorsWrapper'>
					<div className={`carousel-indicators ${indicator?.type} ${indicator.direction} bsbDynamicPosition ${indicator.position?.split(' ')?.join('-')}`}>

						<ImageIndicators {...{ attributes, clientId, firstPosts, products }} />
					</div>
				</div>
			</>
		}
		{children}
		{arrow.visibility && totalSlides > 1 && <>
			{/**
			 * The arrows drive the carousel instance directly. They used to carry `data-bs-target` and
			 * `data-bs-slide` and leave the work to Bootstrap, and in the editor that did nothing at
			 * all: Bootstrap's data-API is one delegated listener on `document`, and since block.json
			 * moved to apiVersion 3 the editor draws the block inside an iframe — so the listener sits
			 * in the outer document and the click happens in another one, where it is never heard. The
			 * same reason `bsb_lightbox_config` has to be handed an element to find its document from.
			 *
			 * Calling `prev()`/`next()` on the instance needs no listener and no selector, so it works
			 * in the iframe and on the front end alike. `stopPropagation` is part of the fix rather
			 * than tidiness: the editor wraps this in a div whose own click selects the block, and
			 * without it every arrow press would reselect the block as well as move the slide.
			 */
			}
			<div className={`bsbButtonDesign ${(!isBackend && sourceType !== "video") && isArrowFollowSlide ? 'arrowMouseEffect' : ''}`}>

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