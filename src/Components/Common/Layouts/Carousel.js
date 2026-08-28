
import { useEffect, useRef } from 'react';
import { Navigation, A11y, Autoplay, Mousewheel, EffectCards, EffectFlip, EffectCoverflow, EffectCube, EffectFade, Grid, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import "swiper/css/autoplay";
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-cards';
import 'swiper/css/grid';

import { bsb_lightbox_config, plyrInt, bsb_open_video_popup } from '../../../utils/config';
import { initLayerAnimations } from '../../../utils/layerAnimations';
import { reviveSlideScripts } from '../../../utils/reviveSlideScripts';
import { mountSlidersIn } from '../../../utils/sliderMounter';
import { placeholderImg, play } from '../../../utils/icons';
import arrows from '../../../utils/arrows';
import ImageItem from '../single-item/ImageItem';
import PostItem from '../single-item/PostItem';
import WooItem from '../single-item/WooItem';

/**
 * The slides of a `blocks` slider, cut out of the one string they arrive in.
 *
 * `render.php` hands this source over as a single blob of HTML — every slide already rendered,
 * each one a `.carousel-item`, because the Default layout gives that whole string to Bootstrap
 * and lets it do the rest. Swiper cannot work that way: it needs to be handed its slides one at
 * a time so it can measure them, lay several side by side and move between them.
 *
 * So the blob is parsed once and split back into the pieces it was built from. `DOMParser`
 * rather than a regular expression: a slide can hold anything a user put in it, including markup
 * that looks like the closing tag being searched for.
 *
 * `:scope > .carousel-item` keeps this to the slider's own slides — a slide can hold another
 * bSlider, and its slides are not ours to enumerate.
 */
const splitBlockSlides = (html) => {
	if (!html || 'string' !== typeof html) {
		return [];
	}

	const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
	const root = doc.body.firstElementChild;

	return [...(root?.querySelectorAll(':scope > .carousel-item') || [])].map(el => el.outerHTML);
};

const Carousel = (props) => {
    const { attributes, firstPosts, products, commonDeProps } = props;
    const videoRefs = useRef([]);
    const hiddenVideoRefs = useRef([]);
    const swiperRef = useRef(null);
    // The wrapper element, so the layer passes below have a scope to walk.
    const rootRef = useRef(null);
    const prevRef = useRef(null);
    const nextRef = useRef(null);
    const { sourceType, sliders, columns, carousel, columnGap, arrow, arrowStyle, videoConf, indicator } = attributes;
    const { loop, isAutoPlay, autoPlayDelay, mousewheel, effect, carouselStyle, grabCursor, reverseDirection, caroDirection, pagination } = carousel;

    const { clientId, activeIndex, isBackEnd, isSelected = false } = commonDeProps;

    useEffect(() => {
        if (isBackEnd && swiperRef.current) {
            swiperRef.current.slideTo(activeIndex || 0);
        }
    }, [activeIndex]);
    const { isPopup, icon } = videoConf;
    const autoplay = isAutoPlay ? { delay: autoPlayDelay } : false;
    const centeredSlides = (carouselStyle === 'center' || carouselStyle === '3dcarousel') ? true : false;

    const breakpoints = {
        0: {
            slidesPerView: columns?.mobile,
            spaceBetween: columnGap
        },
        577: {
            slidesPerView: columns?.tablet,
            spaceBetween: columnGap
        },
        // Small Desktop devices (769px to 1024px)
        769: {
            slidesPerView: columns?.desktop,
            spaceBetween: columnGap
        },
        // Large Desktop devices (1025px and above)
        1025: {
            slidesPerView: columns?.desktop,
            spaceBetween: columnGap
        }
    };

    const check3d = carouselStyle === '3dcarousel';
    const rotate = check3d ? 0 : 50;
    const stretch = check3d ? 100 : 0;
    const depth = check3d ? 150 : 100;
    const modifier = check3d ? 1.5 : 1;
    const slideShadows = check3d ? false : true;
    const coverflowEffect = { rotate, stretch, depth, modifier, slideShadows };

    const swiperSettings = {
        modules: [Navigation, A11y, Autoplay, Mousewheel, EffectCards, EffectFlip, EffectCoverflow, EffectCube, EffectFade, Grid, Pagination],
        loop,
        mousewheel,
        autoplay,
        centeredSlides,
        breakpoints,
        navigation: arrow?.visibility ? { prevEl: prevRef.current, nextEl: nextRef.current } : false,
        allowTouchMove: grabCursor,
        simulateTouch: grabCursor,
        grabCursor,
        effect: carouselStyle === 'grid' ? 'slide' : carouselStyle === '3dcarousel' ? 'coverflow' : effect,
        grid: carouselStyle === 'grid' ? { rows: 2, fill: 'row' } : undefined,
        coverflowEffect,
        direction: carouselStyle === 'standard' || carouselStyle === 'ticker' ? caroDirection : 'horizontal',
        pagination: pagination ? {
            el: '.bsb-carousel-pagination',
            clickable: true,
            bulletClass: 'bsb-bullet',
            bulletActiveClass: 'active',
            renderBullet: (index, className) => {
                return `<button class="${className}" aria-label="Go to slide ${index + 1}"></button>`;
            }
        } : false
    }

    const tickerSettings = {
        modules: [Autoplay],
        loop: true,
        breakpoints,
        speed: 9000,
        allowTouchMove: false,
        autoplay: {
            delay: 0,
            disableOnInteraction: true,
            reverseDirection,
            pauseOnMouseEnter: true
        },
        direction: caroDirection
    };

    useEffect(() => {
        bsb_lightbox_config(clientId, attributes);
    }, [clientId, videoConf]);

    /**
     * The layer system, for a `blocks` slider laid out as a carousel.
     *
     * The Default layout gets this from `Sliders`, which wraps its markup; Swiper does not go
     * through that component, so the same passes are made here over Swiper's own root. Without
     * them a carousel would show the slides and none of what was set on the blocks inside them —
     * no entry animation, no hover, no click action — with nothing to say why.
     *
     * Re-run when the rendered markup changes, which is what `_blocksHtml` is: on the front end
     * it is the string the server sent, and in the editor it changes as slides are edited.
     */
    useEffect(() => {
        const root = rootRef.current;

        if ('blocks' !== sourceType || !root) {
            return;
        }

        // A third-party block inside a slide arrived here as inert markup — its scripts never
        // ran, and the `DOMContentLoaded` they were waiting for fired long ago. Front end only:
        // in the editor those blocks are live React components that mount normally.
        if (!isBackEnd) {
            reviveSlideScripts(root, mountSlidersIn);
        }

        return initLayerAnimations(root, { isBackend: isBackEnd });
    }, [sourceType, isBackEnd, attributes._blocksHtml]);

    const checkCarouselLayout = carouselStyle === 'ticker' ? tickerSettings : swiperSettings;

    const SWIPER_ELE = () => <div ref={rootRef} className={`bsb-main-carousel-wrapper ${sourceType}`}>

        <div className="bsb-carousel-wrapper carousel-wrapper">
            {carouselStyle !== "ticker" && <>
                {
                    arrow?.visibility && (
                        <div className="bsbArrowWrapper bsbButtonDesign">

                            <button ref={prevRef} className="bsbArrowButtonPrev bsbArrowButton" dangerouslySetInnerHTML={{ __html: arrows[arrowStyle].left(arrow?.size, arrow?.color) }}></button>

                            <button ref={nextRef} className="bsbArrowButtonNext bsbArrowButton" dangerouslySetInnerHTML={{ __html: arrows[arrowStyle].right(arrow?.size, arrow?.color) }}></button>
                        </div>
                    )

                }
            </>}

            <Swiper {...checkCarouselLayout}
                onBeforeInit={(swiper) => {
                    if (arrow?.visibility) {
                        swiper.params.navigation.prevEl = prevRef.current;
                        swiper.params.navigation.nextEl = nextRef.current;
                    }
                }}
                onSwiper={(swiper) => { swiperRef.current = swiper; }}
                onInit={() => {
                    plyrInt(clientId, videoRefs, hiddenVideoRefs, attributes);
                }}>
                {(() => {
                    switch (sourceType) {
                        case 'blocks':
                            /*
                             * Each slide goes in as the markup it already is.
                             *
                             * `dangerouslySetInnerHTML` is the same bridge the Default layout
                             * uses, and for the same reason: these slides were rendered by
                             * WordPress on the server, so there are no React components here to
                             * build them from. The layer animations, the Lottie players and any
                             * third-party block's own script are all started afterwards by
                             * `Sliders`, which walks the DOM once it exists.
                             */
                            return splitBlockSlides(attributes._blocksHtml).map((slideHtml, index) => (
                                <SwiperSlide className={carouselStyle} key={index}>
                                    <div dangerouslySetInnerHTML={{ __html: slideHtml }} />
                                </SwiperSlide>
                            ));

                        case 'image':
                            return sliders?.map((slide, index) => <SwiperSlide className={carouselStyle} key={index}>
                                <ImageItem {...{
                                    attributes, slide, index, classNames: {
                                        contentArea: 'content-area'
                                    }
                                }} />
                            </SwiperSlide>);

                        case 'posts':
                            return firstPosts?.map((post, index) => <SwiperSlide className={carouselStyle} key={index}>
                                <PostItem {...{
                                    attributes, post, index, isBackEnd, isSelected, classNames: {
                                        contentArea: 'content-area'
                                    }
                                }} />
                            </SwiperSlide>);

                        case 'woo':
                            return products?.map((product, index) => <SwiperSlide className={carouselStyle} key={index}>
                                <WooItem {...{
                                    attributes, product, index, isBackEnd, isSelected, classNames: {
                                        contentArea: 'content-area'
                                    }
                                }} />
                            </SwiperSlide>);

                        case 'video':
                            return sliders?.map((slide, index) => <SwiperSlide className={carouselStyle} key={index}>
                                {!isPopup ? <div ref={(el) => (videoRefs.current[index] = el)} key={index} className={`videoItem ${index === 0 ? 'active' : ''}`} >
                                    <video controls poster={slide?.img.url} className="bsbvid" id="player">
                                        <source src={slide?.video?.url} type="video/mp4" /></video>
                                </div> :
                                    <a data-fancybox={`${clientId}-video-gallery`} data-caption="" className={`lightboxArea videoItem db_carousel ${index === 0 ? 'active' : ''}`} href={slide?.video?.url} data-type={'html5video'} onClick={isBackEnd ? (e) => { e.preventDefault(); e.stopPropagation(); bsb_open_video_popup(sliders, index, attributes); } : undefined}>
                                        <div className={`contentArea popContentArea`}>
                                            <div className="img">
                                                <img className="rounded" src={slide?.img.url || placeholderImg} alt={slide?.img?.caption || slide?.img?.alt || slide?.img?.title} />
                                                {icon && <div className="play">
                                                    <div className="icon">
                                                        {play}
                                                    </div>
                                                </div>}
                                            </div>
                                        </div>
                                    </a>
                                }
                            </SwiperSlide>)
                        default:
                            return null;
                    }
                })()}
            </Swiper>
        </div>

        {carouselStyle !== "ticker" && <> {
            indicator.visibility && <div className='indicatorsWrapper'>
                <div className="bsb-carousel-pagination carousel-indicators"></div>
            </div>
        }</>}
    </div>

    return <SWIPER_ELE />
}
export default Carousel;