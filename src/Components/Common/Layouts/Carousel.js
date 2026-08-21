
import { useEffect, useRef } from 'react';
import { Navigation, A11y, Autoplay, Mousewheel, EffectCards, EffectFlip, EffectCoverflow, EffectCube, EffectFade, Grid, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import "swiper/css/autoplay";
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-cards';
import 'swiper/css/grid';

import { bsb_lightbox_config, plyrInt } from '../../../utils/config';
import { placeholderImg, play } from '../../../utils/icons';
import arrows from '../../../utils/arrows';
import ImageItem from '../single-item/ImageItem';
import PostItem from '../single-item/PostItem';
import WooItem from '../single-item/WooItem';
import { getProvider, getYouTubeId, getVimeoId } from '../../../utils/functions';

const Carousel = (props) => {
    const { attributes, firstPosts, products, commonDeProps } = props;
    const videoRefs = useRef([]);
    const hiddenVideoRefs = useRef([]);
    const rootRef = useRef(null);
    const { sourceType, sliders, columns, carousel, columnGap, arrow, arrowStyle, videoConf, indicator, socialQuery } = attributes;
    const { loop, isAutoPlay, autoPlayDelay, mousewheel, effect, carouselStyle, grabCursor, reverseDirection, caroDirection, pagination, itemsPerSlide: rawItemsPerSlide = 1, groupColumns: rawGroupColumns = 1 } = carousel;
    const isSocialFeed = sourceType === 'social';
    const itemsPerSlide = isSocialFeed ? rawItemsPerSlide : 1;
    const groupColumns = isSocialFeed ? rawGroupColumns : 1;
    // See the note on the same line in Grid.
    const { clientId, isBackEnd = false, isSelected = false } = commonDeProps;
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

    const chunkArray = (arr, size) => {
        if (!arr) return [];
        const chunks = [];
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return chunks;
    };

    const totalSlidesRaw = (sourceType === 'image' || sourceType === 'video')
        ? (sliders?.length || 0)
        : (firstPosts?.length || products?.length || 0);

    const totalSlides = itemsPerSlide > 1 ? Math.ceil(totalSlidesRaw / itemsPerSlide) : totalSlidesRaw;

    const swiperSettings = {
        modules: [Navigation, A11y, Autoplay, Mousewheel, EffectCards, EffectFlip, EffectCoverflow, EffectCube, EffectFade, Grid, Pagination],
        loop: totalSlides > 1 ? loop : false,
        mousewheel: totalSlides > 1 ? mousewheel : false,
        autoplay: totalSlides > 1 ? autoplay : false,
        centeredSlides,
        breakpoints,
        navigation: arrow?.visibility && totalSlides > 1 ? {
            nextEl: '.bsbArrowButtonNext',
            prevEl: '.bsbArrowButtonPrev'
        } : false,
        allowTouchMove: totalSlides > 1 ? grabCursor : false,
        simulateTouch: totalSlides > 1 ? grabCursor : false,
        grabCursor: totalSlides > 1 ? grabCursor : false,
        effect: carouselStyle === 'grid' ? 'slide' : carouselStyle === '3dcarousel' ? 'coverflow' : effect,
        grid: carouselStyle === 'grid' ? { rows: 2, fill: 'row' } : undefined,
        coverflowEffect,
        direction: carouselStyle === 'standard' || carouselStyle === 'ticker' ? caroDirection : 'horizontal',
        pagination: pagination && totalSlides > 1 ? {
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
        // The root element tells the lightbox which document to work in — the editor's iframe
        // under apiVersion 3, the page itself on the front end.
        bsb_lightbox_config(clientId, attributes, rootRef.current);
    }, [clientId, videoConf]);

    /**
     * The players, re-applied when what they are made of changes.
     *
     * `Swiper`'s `onInit` calls this too, and until now that was the only call — which was enough
     * only by accident. The carousel was rebuilding itself on every render, so Swiper re-initialised
     * constantly and this ran again each time; a Player setting changed in the sidebar appeared to
     * take hold. With the rebuild gone, `onInit` fires once and nothing would have re-read
     * `videoConf` until the page was reloaded.
     *
     * The same effect `Default` and `Grid` already keep, with the same dependencies. Running twice on
     * first mount costs nothing: `plyrInt` destroys any player it finds on an element before it builds
     * a new one.
     */
    useEffect(() => {
        plyrInt(clientId, videoRefs, hiddenVideoRefs, attributes);
    }, [sliders, sourceType, videoConf]);

    const checkCarouselLayout = carouselStyle === 'ticker' ? tickerSettings : swiperSettings;

    /**
     * The carousel, as elements rather than as a component.
     *
     * This was `const SWIPER_ELE = () => <div…>` rendered as `<SWIPER_ELE />`, and that one pair of
     * angle brackets was the whole of the editor bug. A function declared inside a component is a new
     * function on every render, and React identifies a component by that function — so every render
     * was a *different* component type in the same slot, which React can only handle by throwing the
     * old tree away and building a new one. Swiper was destroyed and re-created from scratch on every
     * keystroke in the sidebar; `rootRef` pointed at an element no longer in the page, so the lightbox
     * stayed bound to the discarded one and clicking a slide did nothing; and `PostItem`'s `wasSelected`
     * ref — set on mousedown, read on click — was wiped by the remount that selecting the block caused,
     * between the two halves of the same interaction.
     *
     * Front end never saw it: the block renders once there and effectively never re-renders, so the
     * subtree was rebuilt no times instead of dozens.
     *
     * A plain value, not a function call, and not a component: these elements belong to `Carousel`'s own
     * tree, so React reconciles the `<div>` against the `<div>` and Swiper is left where it stands.
     */
    const swiperEle = <div ref={rootRef} className={`bsb-main-carousel-wrapper ${sourceType}`}>

        <div className="bsb-carousel-wrapper carousel-wrapper">
            {carouselStyle !== "ticker" && totalSlides > 1 && <>
                {
                    arrow?.visibility && (
                        <div className="bsbArrowWrapper bsbButtonDesign">

                            <button className="bsbArrowButtonPrev bsbArrowButton" dangerouslySetInnerHTML={{ __html: arrows[arrowStyle].left(arrow?.size, arrow?.color) }}></button>

                            <button className="bsbArrowButtonNext bsbArrowButton" dangerouslySetInnerHTML={{ __html: arrows[arrowStyle].right(arrow?.size, arrow?.color) }}></button>
                        </div>
                    )

                }
            </>}

            <Swiper {...checkCarouselLayout} onInit={() => {
                plyrInt(clientId, videoRefs, hiddenVideoRefs, attributes);
            }}>
                {(() => {
                    switch (sourceType) {
                        case 'image': {
                            if (itemsPerSlide > 1) {
                                const chunked = chunkArray(sliders || [], itemsPerSlide);
                                return chunked.map((group, groupIndex) => (
                                    <SwiperSlide className={carouselStyle} key={groupIndex}>
                                        <div className="bsb-carousel-group" style={{ display: 'grid', gridTemplateColumns: `repeat(${groupColumns}, 1fr)`, gap: columnGap, width: '100%', height: '100%' }}>
                                            {group.map((slide, index) => {
                                                const globalIndex = groupIndex * itemsPerSlide + index;
                                                return <ImageItem key={globalIndex} {...{
                                                    attributes, slide, index: globalIndex, classNames: {
                                                        contentArea: 'content-area'
                                                    }
                                                }} />;
                                            })}
                                        </div>
                                    </SwiperSlide>
                                ));
                            }
                            return sliders?.map((slide, index) => <SwiperSlide className={carouselStyle} key={index}>
                                <ImageItem {...{
                                    attributes, slide, index, classNames: {
                                        contentArea: 'content-area'
                                    }
                                }} />
                            </SwiperSlide>);
                        }

                        // A feed item arrives shaped like an arranged post, so it renders as one.
                        case 'posts':
                        case 'social': {
                            if (itemsPerSlide > 1) {
                                const chunked = chunkArray(firstPosts || [], itemsPerSlide);
                                return chunked.map((group, groupIndex) => (
                                    <SwiperSlide className={carouselStyle} key={groupIndex}>
                                        <div className="bsb-carousel-group" style={{ display: 'grid', gridTemplateColumns: `repeat(${groupColumns}, 1fr)`, gap: columnGap, width: '100%', height: '100%' }}>
                                            {group.map((post, index) => {
                                                const globalIndex = groupIndex * itemsPerSlide + index;
                                                return <PostItem key={globalIndex} {...{
                                                    attributes, post, index: globalIndex, clientId, isBackEnd, isSelected, classNames: {
                                                        contentArea: 'content-area'
                                                    }
                                                }} />;
                                            })}
                                        </div>
                                    </SwiperSlide>
                                ));
                            }
                            return firstPosts?.map((post, index) => <SwiperSlide className={carouselStyle} key={index}>
                                <PostItem {...{
                                    attributes, post, index, clientId, isBackEnd, isSelected, classNames: {
                                        contentArea: 'content-area'
                                    }
                                }} />
                            </SwiperSlide>);
                        }

                        case 'woo': {
                            if (itemsPerSlide > 1) {
                                const chunked = chunkArray(products || [], itemsPerSlide);
                                return chunked.map((group, groupIndex) => (
                                    <SwiperSlide className={carouselStyle} key={groupIndex}>
                                        <div className="bsb-carousel-group" style={{ display: 'grid', gridTemplateColumns: `repeat(${groupColumns}, 1fr)`, gap: columnGap, width: '100%', height: '100%' }}>
                                            {group.map((product, index) => {
                                                const globalIndex = groupIndex * itemsPerSlide + index;
                                                return <WooItem key={globalIndex} {...{
                                                    attributes, product, index: globalIndex, isBackEnd, isSelected, classNames: {
                                                        contentArea: 'content-area'
                                                    }
                                                }} />;
                                            })}
                                        </div>
                                    </SwiperSlide>
                                ));
                            }
                            return products?.map((product, index) => <SwiperSlide className={carouselStyle} key={index}>
                                <WooItem {...{
                                    attributes, product, index, isBackEnd, isSelected, classNames: {
                                        contentArea: 'content-area'
                                    }
                                }} />
                            </SwiperSlide>);
                        }

                        case 'video': {
                            if (itemsPerSlide > 1) {
                                const chunked = chunkArray(sliders || [], itemsPerSlide);
                                return chunked.map((group, groupIndex) => (
                                    <SwiperSlide className={carouselStyle} key={groupIndex}>
                                        <div className="bsb-carousel-group" style={{ display: 'grid', gridTemplateColumns: `repeat(${groupColumns}, 1fr)`, gap: columnGap, width: '100%', height: '100%' }}>
                                            {group.map((slide, index) => {
                                                const globalIndex = groupIndex * itemsPerSlide + index;
                                                const provider = getProvider(slide?.video?.url);
                                                return (
                                                    <div key={globalIndex} className="bsb-carousel-group-item">
                                                        {!isPopup ? (
                                                            <div ref={(el) => (videoRefs.current[globalIndex] = el)} className={`videoItem ${globalIndex === 0 ? 'active' : ''}`} >
                                                                {provider === 'youtube' ? (
                                                                    <div className="plyr__video-embed" data-plyr-provider="youtube" data-plyr-embed-id={getYouTubeId(slide?.video?.url)}></div>
                                                                ) : provider === 'vimeo' ? (
                                                                    <div className="plyr__video-embed" data-plyr-provider="vimeo" data-plyr-embed-id={getVimeoId(slide?.video?.url)}></div>
                                                                ) : (
                                                                    <video controls poster={slide?.img.url} className="bsbvid" id="player">
                                                                        <source src={slide?.video?.url} type="video/mp4" />
                                                                    </video>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <a data-fancybox={`${clientId}-video-gallery`} data-caption="" className={`lightboxArea videoItem db_carousel ${globalIndex === 0 ? 'active' : ''}`} href={slide?.video?.url} data-type={provider === 'html5' ? 'html5video' : ''}>
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
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </SwiperSlide>
                                ));
                            }
                            return sliders?.map((slide, index) => {
                                const provider = getProvider(slide?.video?.url);

                                return <SwiperSlide className={carouselStyle} key={index}>
                                    {!isPopup ? (
                                        <div ref={(el) => (videoRefs.current[index] = el)} key={index} className={`videoItem ${index === 0 ? 'active' : ''}`} >
                                            {provider === 'youtube' ? (
                                                <div className="plyr__video-embed" data-plyr-provider="youtube" data-plyr-embed-id={getYouTubeId(slide?.video?.url)}></div>
                                            ) : provider === 'vimeo' ? (
                                                <div className="plyr__video-embed" data-plyr-provider="vimeo" data-plyr-embed-id={getVimeoId(slide?.video?.url)}></div>
                                            ) : (
                                                <video controls poster={slide?.img.url} className="bsbvid" id="player">
                                                    <source src={slide?.video?.url} type="video/mp4" />
                                                </video>
                                            )}
                                        </div>
                                    ) : (
                                        <a data-fancybox={`${clientId}-video-gallery`} data-caption="" className={`lightboxArea videoItem db_carousel ${index === 0 ? 'active' : ''}`} href={slide?.video?.url} data-type={provider === 'html5' ? 'html5video' : ''}>
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
                                    )}
                                </SwiperSlide>;
                            });
                        }
                        default:
                            return null;
                    }
                })()}
            </Swiper>
        </div>

        {carouselStyle !== "ticker" && totalSlides > 1 && <> {
            indicator.visibility && <div className='indicatorsWrapper'>
                <div className="bsb-carousel-pagination carousel-indicators"></div>
            </div>
        }</>}
    </div>

    return swiperEle;
}
export default Carousel;