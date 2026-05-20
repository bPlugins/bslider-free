
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
import { placeholderImg, play } from '../../../utils/icons';
import arrows from '../../../utils/arrows';
import ImageItem from '../single-item/ImageItem';
import PostItem from '../single-item/PostItem';
import WooItem from '../single-item/WooItem';

const Carousel = (props) => {
    const { attributes, firstPosts, products, commonDeProps } = props;
    const videoRefs = useRef([]);
    const hiddenVideoRefs = useRef([]);
    const swiperRef = useRef(null);
    const prevRef = useRef(null);
    const nextRef = useRef(null);
    const { sourceType, sliders, columns, carousel, columnGap, arrow, arrowStyle, videoConf, indicator } = attributes;
    const { loop, isAutoPlay, autoPlayDelay, mousewheel, effect, carouselStyle, grabCursor, reverseDirection, caroDirection, pagination } = carousel;

    const { clientId, activeIndex, isBackEnd } = commonDeProps;

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

    const checkCarouselLayout = carouselStyle === 'ticker' ? tickerSettings : swiperSettings;

    const SWIPER_ELE = () => <div className={`bsb-main-carousel-wrapper ${sourceType}`}>

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
                                    attributes, post, index, classNames: {
                                        contentArea: 'content-area'
                                    }
                                }} />
                            </SwiperSlide>);

                        case 'woo':
                            return products?.map((product, index) => <SwiperSlide className={carouselStyle} key={index}>
                                <WooItem {...{
                                    attributes, product, index, classNames: {
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