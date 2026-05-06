import { useEffect, useRef } from 'react';
import ImageIndicators from './ImageIndicators/ImageIndicators';
import arrows from '../../utils/arrows';


const Sliders = (props) => {
	const { attributes, clientId, carousel = null, setCarousel, children, firstPosts, products } = props;
	const { options, arrow, arrowStyle, indicator, animation, direction, sourceType } = attributes;

	// Click any content slide quick slide 
	const sliderDom = useRef();
	// setting autoplay option
	useEffect(() => {
		if (sliderDom?.current) {
			if (carousel) carousel.dispose();

			// eslint-disable-next-line no-undef
			var initialize = new bootstrap.Carousel(sliderDom.current, {
				interval: options.interval,
				ride: options.ride === true ? 'carousel' : false,
				pause: options.pause === true ? 'hover' : false,
			});
			setCarousel && setCarousel(initialize);
		}
	}, [options]);



	// Return All Slider
	return <div className={`bsbCarousel slide carousel ${sourceType} ${animation === 'default' ? '' : animation} ${direction}`} ref={sliderDom} id="carousel-example-generic">
		{
			// sourceType !== 'video' && <>
			indicator.visibility && <>
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

				<button className={`carousel-control-prev`} id={`bsbCarousel-prev-${clientId}`} type="button" data-bs-target={`#bsbCarousel-${clientId} .carousel`} data-bs-slide="prev" aria-label='Carousel left arrow'>

					<div className="bsbArrowButton" dangerouslySetInnerHTML={{ __html: arrows[arrowStyle].left(arrow?.size, arrow?.color) }}>
					</div>
				</button>

				<button className="carousel-control-next" id={`bsbCarousel-next-${clientId}`} type="button" data-bs-target={`#bsbCarousel-${clientId} .carousel`} data-bs-slide="next" aria-label='Carousel right arrow'>

					<div className="bsbArrowButton" dangerouslySetInnerHTML={{ __html: arrows[arrowStyle].right(arrow?.size, arrow?.color) }}>
					</div>
				</button>
			</div>
		</>}
	</div>
}
export default Sliders;