import { useState, useRef, useEffect } from 'react';
import { Navigation, Thumbs, FreeMode, Autoplay, Mousewheel } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import "swiper/css/autoplay";
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import 'swiper/css/free-mode';
import { bsb_lightbox_config, plyrInt } from '../../../../utils/config';
import arrows from '../../../../utils/arrows';
import ImageItem from '../../single-item/ImageItem';
import PostItem from '../../single-item/PostItem';
import WooItem from '../../single-item/WooItem';
import { placeholderImg, play } from '../../../../utils/icons';

const Thumbnails = ({ attributes, firstPosts, commonDeProps }) => {

    const videoRefs = useRef([]);
    const hiddenVideoRefs = useRef([]);
    const swiperRef = useRef(null);
    const prevRef = useRef(null);
    const nextRef = useRef(null);

    const { sourceType, sliders, carousel, arrow, arrowStyle, columns, columnGap, thumbnails, videoConf } = attributes;
    const { clientId, activeIndex, isBackEnd } = commonDeProps;

    useEffect(() => {
        if (isBackEnd && swiperRef.current) {
            swiperRef.current.slideTo(activeIndex || 0);
        }
    }, [activeIndex]);
    const { loop, isAutoPlay, autoPlayDelay, mousewheel, grabCursor, caroDirection } = carousel;
    const { isPopup, icon } = videoConf;
    const { position } = thumbnails;
    // const autoplay = isAutoPlay ? { delay: autoPlayDelay } : false;
    const [thumbsSwiper, setThumbsSwiper] = useState(null);

    const breakpoints = {
        0: {
            slidesPerView: columns?.mobile
        },
        577: {
            slidesPerView: columns?.tablet
        },
        // Small Desktop devices (769px to 1024px)
        769: {
            slidesPerView: columns?.desktop
        }
    };

    const mainSlider = {
        modules: [Navigation, FreeMode, Thumbs, Autoplay, Mousewheel],
        thumbs: thumbsSwiper ? { swiper: thumbsSwiper } : {},
        loop,
        mousewheel,
        autoplay: isAutoPlay ? { delay: autoPlayDelay } : false,
        className: "bsb-main-slider",
        direction: caroDirection,
        // navigation: arrow?.visibility,

        navigation: arrow?.visibility ? {
            nextEl: '.bsbArrowButtonNext',
            prevEl: '.bsbArrowButtonPrev'
        } : false,

    }

    const thumbnailsSliderEle = {
        modules: [FreeMode, Thumbs],
        direction: ['left', 'right'].includes(position?.desktop) ? 'vertical' : 'horizontal',
        freeMode: true,
        loop: true,
        grabCursor,
        spaceBetween: columnGap,
        breakpoints,
        watchSlidesProgress: true,
        className: `bsb-slider-thumbnail bsb-thumbnail-${position?.desktop}`
    }

    const isSideBySide = position?.desktop === 'left' || position?.desktop === 'right';
    const wrapperClass = `bsb-main-carousel-wrapper ${isSideBySide ? `side-by-side ${position?.desktop}` : `top-by-bottom ${position?.desktop}`}`;

    useEffect(() => {
        bsb_lightbox_config(clientId, attributes);
    }, [clientId, videoConf]);

    return <div className={wrapperClass}>
        <ThumbnailsSlider {...{ attributes, thumbnailsSliderEle, setThumbsSwiper, firstPosts }} />

        <div className="bsb-carousel-wrapper carousel-wrapper">

            {arrow?.visibility && (
                <div className="bsbArrowWrapper bsbButtonDesign">
                    <button ref={prevRef} className="bsbArrowButtonPrev bsbArrowButton" dangerouslySetInnerHTML={{ __html: arrows[arrowStyle].left(arrow?.size, arrow?.color) }}></button>
                    <button ref={nextRef} className="bsbArrowButtonNext bsbArrowButton" dangerouslySetInnerHTML={{ __html: arrows[arrowStyle].right(arrow?.size, arrow?.color) }}></button>
                </div>
            )}

            <Swiper {...mainSlider}
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
                            return sliders?.map((slide, index) => <SwiperSlide key={index}>
                                <ImageItem {...{
                                    attributes, slide, index, classNames: {
                                        contentArea: 'content-area'
                                    }
                                }} />
                            </SwiperSlide>);
                        case 'posts':
                            return firstPosts?.map((post, index) => <SwiperSlide key={index}>
                                <PostItem {...{
                                    attributes, post, index, classNames: {
                                        contentArea: 'content-area'
                                    }
                                }} />
                            </SwiperSlide>);
                        case 'woo':
                            return firstPosts?.map((product, index) => <SwiperSlide key={index}>
                                <WooItem {...{
                                    attributes, product, index, classNames: {
                                        contentArea: 'content-area'
                                    }
                                }} />
                            </SwiperSlide>);

                        case 'video':

                            return sliders?.map((slide, index) => {
                                return (
                                    <SwiperSlide key={index}>
                                        {!isPopup ? <div ref={(el) => (videoRefs.current[index] = el)} key={index} className={`videoItem ${index === 0 ? 'active' : ''}`} >
                                            <video controls poster={slide?.img?.url} className="bsbvid" id="player">
                                                <source src={slide?.video?.url} type="video/mp4" /></video>
                                        </div> :
                                            <a data-fancybox={`${clientId}-video-gallery`} data-caption="" className={`lightboxArea db_carousel ${index === 0 ? 'active' : ''}`} href={slide?.video?.url} data-type={'html5video'}> <div className={`contentArea popContentArea`}>
                                                <div className="img">
                                                    <img className="rounded" src={slide?.img?.url || placeholderImg} alt={slide?.img?.caption || slide?.img?.alt || slide?.img?.title} />
                                                    {icon && <div className="play">
                                                        <div className="icon">
                                                            {play}
                                                        </div>
                                                    </div>}
                                                </div>
                                            </div>
                                            </a>}
                                    </SwiperSlide>
                                );
                            })

                        default:
                            return null;
                    }
                })()}
            </Swiper>
        </div>
    </div>
}
export default Thumbnails;


export const ThumbnailsSlider = ({ attributes, thumbnailsSliderEle, setThumbsSwiper, firstPosts }) => {
    const { sourceType, sliders } = attributes;

    const getSlides = (items, getImage) =>
        items?.map((item, index) => {
            const { url, alt, title } = getImage(item) || {};
            const altText = item?.altText || alt || title;

            return (
                <SwiperSlide key={index}>
                    <div className="single_thumbnails">
                        <div className="img">
                            {url && (
                                <img src={url} className="d-block w-100" alt={altText} />
                            )}
                        </div>
                    </div>
                </SwiperSlide>
            );
        });

    let slides = null;
    switch (sourceType) {
        case 'image':
        case 'video':
            slides = getSlides(sliders, item => item?.img);
            break;
        case 'posts':
        case 'woo':
            slides = getSlides(firstPosts, item => item?.thumbnail);
            break;
        default:
            return null;
    }

    return <Swiper {...thumbnailsSliderEle} onSwiper={setThumbsSwiper}>{slides}</Swiper>;
};
