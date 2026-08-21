import { __, sprintf } from '@wordpress/i18n';
import { useState, useRef, useEffect } from 'react';
import { Navigation, Thumbs, FreeMode, Autoplay, Mousewheel, } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import "swiper/css/autoplay";
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import 'swiper/css/free-mode';
import { bsb_lightbox_config, plyrInt, plyrConfig, finishPlyr } from '../../../../utils/config';
import arrows from '../../../../utils/arrows';
import ImageItem from '../../single-item/ImageItem';
import PostItem from '../../single-item/PostItem';
import WooItem from '../../single-item/WooItem';
import { placeholderImg, play, loaderIcon } from '../../../../utils/icons';
import { getLocalizedDate } from '../../../../utils/functions';
import HoverPreview, { hoverPreviewOf, useHoverPreview } from '../../single-item/HoverPreview';

/**
 * A view count as a person would write it: 1.2K, 3.4M, and small numbers in full.
 *
 * The third copy of this in the plugin — `Layout` has one for followers and `ListRow` one for
 * views — each local to the file that needs it. Left that way rather than pulled into `functions`:
 * three short functions nobody has to look up beats one import that three unrelated components
 * share, and they have drifted apart before over how a round million should print.
 */
const compactViews = count => {
    const n = Number(count) || 0;

    if (n >= 1000000) {
        return `${(n / 1000000).toFixed(n % 1000000 ? 1 : 0).replace(/\.0$/, '')}M`;
    }

    if (n >= 1000) {
        return `${(n / 1000).toFixed(n % 1000 ? 1 : 0).replace(/\.0$/, '')}K`;
    }

    return `${n}`;
};

const Thumbnails = ({ attributes, firstPosts, commonDeProps, totalPosts, feedPageUrl = '' }) => {

    const videoRefs = useRef([]);
    const hiddenVideoRefs = useRef([]);
    const rootRef = useRef(null);

    const { sourceType, sliders, carousel, arrow, arrowStyle, columns, columnGap, thumbnails, videoConf } = attributes;
    // See the note on the same line in Grid.
    const { clientId, isBackEnd = false, isSelected = false } = commonDeProps;
    const { loop, isAutoPlay, autoPlayDelay, mousewheel, grabCursor, caroDirection } = carousel;
    const { isPopup, icon } = videoConf;
    const { position, mode = 'slider', showStage = true, showDuration = false, showPlay = false, navPosition = 'overlay' } = thumbnails;

    /**
     * Whether the pictures under the stage wrap into rows instead of scrolling in one.
     *
     * The strip has always been a Swiper: one row, as many as fit, the rest off the edge. That is the
     * right shape for a photo gallery and the wrong one for a channel, where the point is to show a
     * page of videos at once — so `grid` lays the same thumbnails out in `columns` and lets them wrap.
     *
     * Still driving the same stage either way. The grid is a plain list of buttons rather than a
     * second Swiper: `Thumbs` synchronises one row of slides with the main slider, and a wrapping
     * multi-row Swiper reports indices that no longer line up with the stage's.
     */
    const isThumbGrid = 'grid' === mode;

    /**
     * Whether the big picture above the thumbnails is drawn at all.
     *
     * With it off this layout becomes a page of thumbnails and nothing over them — a real thing to
     * want for a channel's videos, and previously only reachable by switching to the Grid layout and
     * setting every card option a second time.
     *
     * Only honoured in grid mode. The slider mode's strip is one Swiper paired to another: take the
     * stage away and the remaining row has nothing to drive and no way to show which item is chosen.
     */
    const hasStage = !isThumbGrid || false !== showStage;

    /** The stage's index, which the grid highlights. Swiper owns it in slider mode. */
    const [activeIndex, setActiveIndex] = useState(0);
    const mainSwiperRef = useRef(null);

    const { socialQuery = {} } = attributes;

    /**
     * Whether the stage is a player rather than a slider.
     *
     * The fourth answer to "clicking a slide" — see the control in `SocialSlides`. A thumbnail hands
     * its video to one Plyr instance above and nothing opens over the page, which is the arrangement
     * a channel page has. Only a feed carrying `videoId` can do it, so an image slider keeps the
     * Swiper stage whatever the setting says.
     *
     * `firstPosts` rather than a Swiper of slides: with a player in the stage there is nothing to
     * slide, and Swiper's own index would be a second source of truth for the same choice.
     */
    const isStagePlayer = hasStage
        && 'social' === sourceType
        && 'stage' === socialQuery?.playVideo
        // A YouTube id or an Instagram file — either is something the stage can play. A feed with
        // neither (an RSS publication, a JSON document, a page of Instagram stills) keeps the Swiper
        // stage, so the setting cannot leave a slider with a player that has nothing to show.
        && firstPosts?.some(post => !!post?.videoId || !!post?.videoUrl);

    /**
     * Load More for the grid mode, held here rather than in `ThumbnailsGrid` so the stage and the
     * grid never disagree about which item `activeIndex` names.
     *
     * The grid used to keep this itself, with the stage still reading `firstPosts` — which is what
     * Load More was for changing. Press it once and the grid had thirteen items while the stage
     * still had twelve; click the new one and `stagePosts[12]` was `undefined`. One list now, read
     * by both.
     *
     * Written on `Grid`'s own terms: `postsQuery.per_page` is how many of the fetched set to show at
     * once, `render.php` decides whether the rest live on the server (`feedPageUrl` set) or are
     * already in `firstPosts` and simply sliced further — see `serverPaged` there.
     */
    const { grid = {}, postsQuery = {} } = attributes;
    const { paginationType = 'none' } = grid;
    const { per_page } = postsQuery;

    const [items, setItems] = useState([]);
    const [visibleCount, setVisibleCount] = useState(parseInt(per_page) > 0 ? parseInt(per_page) : 0);
    const [loadingMore, setLoadingMore] = useState(false);

    const perPage = !(parseInt(per_page) > 0) ? (items?.length || 0) : parseInt(per_page);
    const serverPaged = 'social' === sourceType && !!feedPageUrl;
    const feedTotal = serverPaged ? (parseInt(totalPosts) || items?.length || 0) : (items?.length || 0);

    useEffect(() => {
        setItems(('social' === sourceType ? firstPosts : sliders) || []);
    }, [sourceType, firstPosts, sliders]);

    useEffect(() => {
        setVisibleCount(perPage);
    }, [perPage, items?.length]);

    const fetchPage = async page => {
        setLoadingMore(true);

        try {
            const res = await fetch(`${feedPageUrl}&page=${page}&per_page=${perPage}`, {
                headers: { Accept: 'application/json' }
            });
            const data = await res.json();

            if (Array.isArray(data?.items) && data.items.length) {
                setItems(prev => [...prev, ...data.items]);
            }
        } catch (e) {
            // Nothing to say to the visitor about it — what is already on screen stays there.
        }

        setLoadingMore(false);
    };

    const handleLoadMore = () => {
        if (serverPaged) {
            fetchPage(Math.floor(items.length / perPage) + 1);
            return;
        }

        setLoadingMore(true);
        setTimeout(() => {
            setVisibleCount(prev => Math.min(parseInt(prev) + parseInt(perPage), items?.length));
            setLoadingMore(false);
        }, 600);
    };

    /**
     * Paged only in grid mode. Slider mode's Swiper strip has no Load More of its own to reveal the
     * rest with, so cutting the set down here would leave the tail of a channel permanently out of
     * reach — clamped by a page size meant for a control that is not on screen.
     */
    /**
     * Cut down only where there is a control to reveal the rest with.
     *
     * Two ways that is false. Slider mode has no pager at all — its Swiper strip shows the whole set
     * and scrolls. And in grid mode with the pager switched off, slicing would hide the tail of the
     * feed behind a button that is not on the page: fetch fifteen, show twelve, and the last three
     * are unreachable by any means. Both cases show everything that was fetched.
     */
    const isPaged = isThumbGrid && 'none' !== paginationType;
    const visibleItems = !isPaged
        ? items
        : (serverPaged ? items : items?.slice(0, visibleCount > 0 ? visibleCount : perPage));
    const remainingCount = serverPaged ? (feedTotal - items?.length) : (items?.length - visibleCount);
    const canLoadMore = isThumbGrid
        && 'loadMore' === paginationType
        && (serverPaged ? items?.length < feedTotal : visibleCount < items?.length);

    // The stage and the grid both read this — see the note above.
    const stagePosts = visibleItems || [];
    const activePost = stagePosts[activeIndex] || stagePosts[0];

    /**
     * The player, built on the first press and never rebuilt — the arrangement `List` uses, and for
     * the same reasons: one Plyr for the whole set so choosing another video is a `source` swap
     * rather than a new iframe, and the Player panel governs this stage as it governs the popup.
     *
     * `started` gates it so nothing is fetched from YouTube until somebody asks. Autoplay is off on
     * that first press by design — the visitor pressed play, so the player has permission, but the
     * page has not started a video at anybody unasked.
     */
    const [started, setStarted] = useState(false);
    const stageMediaRef = useRef(null);
    const stagePlayerRef = useRef(null);

    /**
     * Hand the player a video. The only route to the stage, and there are two callers.
     *
     * Two kinds of video reach this. YouTube names one by id and Plyr builds the provider's iframe
     * from it; Instagram hands over the file itself — `videoUrl`, an MP4 — because Graph gives no
     * playable id. `openMiniPlayer` chooses between them the same way, and this follows it rather
     * than inventing a second rule for the same question.
     */
    const stageSource = post => {
        const id = String(post?.videoId || '').replace(/[^A-Za-z0-9_-]/g, '');

        if (id) {
            return {
                type: 'video',
                title: post?.title || '',
                sources: [{ src: id, provider: 'youtube' }]
            };
        }

        if (!post?.videoUrl) {
            return null;
        }

        return {
            type: 'video',
            title: post?.title || '',
            sources: [{ src: post.videoUrl, type: 'video/mp4' }],
            poster: post?.thumbnail?.url || ''
        };
    };

    const applyStageSource = (player, post) => {
        const source = stageSource(post);

        if (!player || !source) {
            return;
        }

        player.source = source;

        player.play()?.catch(() => { });
    };

    /**
     * The editor is left out on purpose — its canvas is a `blob:` document, which cannot give YouTube
     * the referrer it insists on, so a player built here would only ever show "Error 153". The same
     * wall `List` documents. The stage keeps its thumbnail there.
     */
    useEffect(() => {
        if (!isStagePlayer || !started || isBackEnd || stagePlayerRef.current || !stageMediaRef.current) {
            return;
        }

        const conf = { ...plyrConfig(attributes), autoplay: true };
        const player = finishPlyr(new Plyr(stageMediaRef.current, conf), conf);

        stagePlayerRef.current = player;

        // Built and given its video in the same breath: pressing play does not *change* the choice,
        // so an effect keyed on the choice would leave the new player with no source at all. That
        // exact bug is written up over `applySource` in `List`.
        applyStageSource(player, activePost);

        return () => {
            try {
                player.destroy();
            } catch (e) {
                // Already gone with the elements it was built on.
            }

            stagePlayerRef.current = null;
        };
        // `attributes` is deliberately not a dependency: a Player setting changed in the sidebar
        // should not tear a playing video down.
    }, [isStagePlayer, started, isBackEnd]);

    /** The stage following the choice — a `source` swap, not a new player. */
    useEffect(() => {
        applyStageSource(stagePlayerRef.current, activePost);
    }, [activePost?.videoId, activePost?.videoUrl]);
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
        // No `Thumbs` partner in grid mode — the grid drives the stage by index instead, through
        // `onSwiper` and `onSlideChange` below. Handing Swiper a thumbs swiper that is not a slider
        // is what would break the pairing, not the absence of one.
        thumbs: (!isThumbGrid && thumbsSwiper) ? { swiper: thumbsSwiper } : {},
        onSwiper: swiper => { mainSwiperRef.current = swiper; },
        onSlideChange: swiper => setActiveIndex(swiper.realIndex ?? swiper.activeIndex ?? 0),
        loop,
        mousewheel,
        autoplay: isAutoPlay ? { delay: autoPlayDelay } : false,
        className: "bsb-main-slider",
        direction: caroDirection,
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

    /**
     * Where the thumbnail strip sits relative to the stage — a slider-mode question only.
     *
     * **This is what put the grid above the player and the Load More button above both.** Those
     * classes drive `flex-direction` on the wrapper, and `bottom` means `column-reverse`: in slider
     * mode the strip is rendered *before* the stage in the DOM, so reversing is what moves it below.
     * Grid mode already renders in reading order — stage, then Prev/Next, then the page of
     * thumbnails — so reversing it stood the whole layout on its head.
     *
     * Grid mode gets neither class, and `position` is simply not its setting. `ThumbnailsGeneral`
     * hides the control there for the same reason.
     */
    const isSideBySide = !isThumbGrid && (position?.desktop === 'left' || position?.desktop === 'right');
    const stripClass = isThumbGrid
        ? ''
        : ` ${isSideBySide ? 'side-by-side' : 'top-by-bottom'} ${position?.desktop}`;
    const wrapperClass = `bsb-main-carousel-wrapper${stripClass}`;

    useEffect(() => {
        // The root element tells the lightbox which document to work in — the editor's iframe
        // under apiVersion 3, the page itself on the front end.
        bsb_lightbox_config(clientId, attributes, rootRef.current);
    }, [clientId, videoConf]);

    /** Move the stage to a thumbnail. `slideToLoop` is the one that means the same thing under `loop`. */
    const goToSlide = index => {
        setActiveIndex(index);

        // With a player in the stage there is no Swiper to move — the index is the whole of the
        // choice, and the effect above hands the new video to the player already running.
        if (isStagePlayer) {
            // Choosing a video *is* asking for it, so a thumbnail pressed before the poster has been
            // pressed starts the player rather than only swapping the still behind it.
            // If it is an image, we stop/reset the player and show the image poster instead.
            if (!isBackEnd) {
                const targetPost = stagePosts[index];
                const targetIsPlayable = !!targetPost?.videoId
                    || 'VIDEO' === targetPost?.mediaType
                    || !!targetPost?.videoUrl
                    || (Array.isArray(targetPost?.gallery) && targetPost.gallery.some(item => item?.isVideo));

                setStarted(targetIsPlayable);
            }

            return;
        }

        const swiper = mainSwiperRef.current;

        if (!swiper) {
            return;
        }

        if (swiper.params?.loop) {
            swiper.slideToLoop(index);
        } else {
            swiper.slideTo(index);
        }
    };

    /** Prev/Next with a player in the stage, where Swiper's own navigation has nothing to drive. */
    /**
     * Move the stage one item, whatever is on it.
     *
     * **The Prev/Next pair did nothing, and this is why.** They carried `bsbArrowButtonPrev` and
     * `bsbArrowButtonNext` and left the moving to Swiper, which is handed those class names as
     * `navigation.prevEl`/`nextEl` — but it looks them up when it initialises, and in this position
     * the buttons are rendered *after* the Swiper, outside its wrapper. There was nothing to find,
     * so nothing was ever bound. The overlay arrows work because they sit above the Swiper in the
     * same subtree and exist by the time it starts.
     *
     * Driving the instance directly removes the ordering question altogether, and it is the same
     * call `goToSlide` already makes for a thumbnail click. `loop` is why the bounds check is
     * skipped there: a looping Swiper is allowed to wrap from the last item back to the first.
     */
    /**
     * How many items the stage can step through — the same set the Swiper below builds its slides
     * from, which is `sliders` for an image or video source and the fetched posts for the rest.
     */
    // `stagePosts` already carries whichever source this slider reads from — see the paging state
    // above, which fills `items` from `sliders` or `firstPosts` the same way `Grid` does.
    const stageCount = stagePosts.length;

    const stepStage = step => {
        const looping = !isStagePlayer && !!loop;
        let at = activeIndex + step;

        if (looping && stageCount > 0) {
            at = (at + stageCount) % stageCount;
        } else if (at < 0 || at >= stageCount) {
            return;
        }

        goToSlide(at);
    };

    /** Whether stepping that way would run off the end — a looping Swiper never does. */
    const canLoop = !isStagePlayer && !!loop;
    const atStart = !canLoop && activeIndex <= 0;
    const atEnd = !canLoop && activeIndex >= stageCount - 1;

    const thumbGridProps = {
        attributes, items: stagePosts, isBackEnd, activeIndex, goToSlide, showDuration, showPlay, hasStage,
        canLoadMore, loadingMore, remainingCount, onLoadMore: handleLoadMore
    };

    // No `nav-below` class on the wrapper: the Prev/Next pair is a sibling of the stage rather than
    // something positioned over it, so it needs no hook — one was added and never styled.
    return <div ref={rootRef} className={`${wrapperClass}${isThumbGrid ? ' thumbs-as-grid' : ''}${hasStage ? '' : ' no-stage'}`}>
        {/* Above the stage in slider mode, exactly as before. In grid mode the order is the other way
            round — the stage, then the arrows, then the page of thumbnails — so the grid is rendered
            after the carousel below rather than here. */}
        {!isThumbGrid && <ThumbnailsSlider {...{ attributes, thumbnailsSliderEle, setThumbsSwiper, firstPosts, isBackEnd, showThumbDuration: showDuration, showThumbPlay: showPlay, activeIndex, goToSlide, isStagePlayer }} />}

        {hasStage && <div className="bsb-carousel-wrapper carousel-wrapper">

            {/* Over the picture, which is where arrows go on a slider. The other position draws them
                as a labelled pair between the stage and the thumbnails instead — see below.
                Not over a player: the arrows would sit on top of its own controls. */}
            {arrow?.visibility && 'below' !== navPosition && (
                isStagePlayer ? (
                    <div className="bsbArrowWrapper bsbButtonDesign">
                        <button
                            type="button"
                            className="bsbArrowButtonPrev bsbArrowButton"
                            onClick={() => stepStage(-1)}
                            disabled={atStart}
                            dangerouslySetInnerHTML={{ __html: arrows[arrowStyle].left(arrow?.size, arrow?.color) }}
                        ></button>
                        <button
                            type="button"
                            className="bsbArrowButtonNext bsbArrowButton"
                            onClick={() => stepStage(1)}
                            disabled={atEnd}
                            dangerouslySetInnerHTML={{ __html: arrows[arrowStyle].right(arrow?.size, arrow?.color) }}
                        ></button>
                    </div>
                ) : (
                    <div className="bsbArrowWrapper bsbButtonDesign">
                        <button className="bsbArrowButtonPrev bsbArrowButton" dangerouslySetInnerHTML={{ __html: arrows[arrowStyle].left(arrow?.size, arrow?.color) }}></button>
                        <button className="bsbArrowButtonNext bsbArrowButton" dangerouslySetInnerHTML={{ __html: arrows[arrowStyle].right(arrow?.size, arrow?.color) }}></button>
                    </div>
                )
            )}

            {isStagePlayer ? <div className="bsb-thumb-stage">
                {/* The `<video>` Plyr adopts. Handed a `source` naming a provider it builds the
                    provider's iframe itself, which is why one element serves every video here. */}
                <div
                    className="bsb-thumb-stage-video-container"
                    style={(!started || isBackEnd) ? { display: 'none' } : {}}
                >
                    <video
                        ref={stageMediaRef}
                        className="bsb-thumb-stage-video"
                        playsInline
                    />
                </div>

                {(!started || isBackEnd) && (() => {
                    const activeIsPlayable = !!activePost?.videoId
                        || 'VIDEO' === activePost?.mediaType
                        || !!activePost?.videoUrl
                        || (Array.isArray(activePost?.gallery) && activePost.gallery.some(item => item?.isVideo));

                    return <button
                        type="button"
                        className="bsb-thumb-stage-poster"
                        onClick={() => !isBackEnd && activeIsPlayable && setStarted(true)}
                        aria-label={sprintf(
                            /* translators: %s: a video title */
                            __('Play %s', 'b-slider'),
                            activePost?.title || __('this video', 'b-slider')
                        )}
                    >
                        {activePost?.thumbnail?.url && (
                            <img src={activePost.thumbnail.url} alt='' loading='lazy' decoding='async' />
                        )}

                        {activeIsPlayable && <span className="bsb-thumb-stage-play" aria-hidden="true" />}

                        {/* The editor cannot play — see the effect that builds the player. Saying so
                            beats a poster that looks broken when pressing it does nothing. */}
                        {isBackEnd && activeIsPlayable && <span className="bsb-thumb-stage-note">
                            {__('Plays on the front end', 'b-slider')}
                        </span>}
                    </button>;
                })()}
            </div> : <Swiper {...mainSlider} onInit={() => {
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
                        // A feed item arrives shaped like an arranged post, so it renders as one.
                        case 'posts':
                        case 'social':

                            return firstPosts?.map((post, index) => <SwiperSlide key={index}>
                                <PostItem {...{
                                    attributes, post, index, clientId, isBackEnd, isSelected, classNames: {
                                        contentArea: 'content-area'
                                    }
                                }} />
                            </SwiperSlide>);
                        case 'woo':
                            return firstPosts?.map((product, index) => <SwiperSlide key={index}>
                                <WooItem {...{
                                    attributes, product, index, isBackEnd, isSelected, classNames: {
                                        contentArea: 'content-area'
                                    }
                                }} />
                            </SwiperSlide>);

                        case 'video':

                            return sliders?.map((slide, index) => {
                                return (
                                    <SwiperSlide key={index}>
                                        {!isPopup ? <div ref={(el) => (videoRefs.current[index] = el)} key={index} className={`videoItem ${index === 0 ? 'active' : ''}`} >
                                            <video controls poster={slide?.img.url} className="bsbvid" id="player">
                                                <source src={slide?.video?.url} type="video/mp4" /></video>
                                        </div> :
                                            <a data-fancybox={`${clientId}-video-gallery`} data-caption="" className={`lightboxArea db_carousel ${index === 0 ? 'active' : ''}`} href={slide?.video?.url} data-type={'html5video'}> <div className={`contentArea popContentArea`}>
                                                <div className="img">
                                                    <img className="rounded" src={slide?.img.url || placeholderImg} alt={slide?.img?.caption || slide?.img?.alt || slide?.img?.title} />
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
            </Swiper>}
        </div>}

        {/* Labelled rather than chevrons, and outside the picture: over a video frame an arrow lands on
            whatever the thumbnail happens to show, and the stage here is a player whose own controls
            are already in that corner. The pair reads as page-through for the row below it. */}
        {hasStage && arrow?.visibility && 'below' === navPosition && (
            <div className="bsb-thumb-nav">
                {/* One handler for both stages — see `stepStage`. No Swiper class names on these:
                    that is what stopped them working here. */}
                <button
                    type="button"
                    className="bsb-thumb-nav-btn"
                    onClick={() => stepStage(-1)}
                    disabled={atStart}
                >{__('Prev', 'b-slider')}</button>

                <button
                    type="button"
                    className="bsb-thumb-nav-btn"
                    onClick={() => stepStage(1)}
                    disabled={atEnd}
                >{__('Next', 'b-slider')}</button>
            </div>
        )}

        {/* The page of thumbnails, under the stage it drives. */}
        {isThumbGrid && <ThumbnailsGrid {...thumbGridProps} />}
    </div>
}
export default Thumbnails;

/**
 * The thumbnails as a wrapping page rather than a scrolling row.
 *
 * Buttons, because that is what each one is: clicking moves the stage. The pairing that `Thumbs`
 * would do is done by hand here — `activeIndex` in, `goToSlide` out — for the reason given beside
 * `isThumbGrid`.
 */
export const ThumbnailsGrid = ({
    attributes, items, isBackEnd = false, activeIndex, goToSlide, showDuration, showPlay, hasStage = true,
    canLoadMore = false, loadingMore = false, remainingCount = 0, onLoadMore
}) => {
    const { sourceType, isLazyLoad, columns, columnGap, rowGap, thumbnails = {}, socialQuery = {} } = attributes;
    const isLazy = isLazyLoad && !isBackEnd;

    const {
        cardStyle = 'bare',
        showCardTitle = false,
        showCardMeta = false,
        showCardExcerpt = false
    } = thumbnails;

    /**
     * Whether a cell is a picture alone or a picture with words beside it.
     *
     * `bare` is the grid as it started — twelve stills under a stage, nothing written on them.
     * `stacked` puts the text under each picture and `beside` puts it to the right, which is the
     * shape a channel's "up next" list has and the reason a two-column grid of them reads at all.
     *
     * Only what the feed actually carries is drawn: `title`, `views`, `date` and `excerpt` are on
     * every feed item, but an image slider's `sliders` have none of them — so the toggles below are
     * hidden for those sources rather than printing blanks. See `canShowCardText` in the panel.
     */
    const isBare = 'bare' === cardStyle;
    const hasText = !isBare && (showCardTitle || showCardMeta || showCardExcerpt);

    const getImage = item => (('image' === sourceType || 'video' === sourceType) ? item?.img : item?.thumbnail);

    if (!items?.length) {
        return null;
    }

    return (
        <>
            <div
                className={`bsb-thumbnail-grid is-${cardStyle}${hasText ? ' has-text' : ''}`}
                style={{
                    '--bsb-thumb-cols': columns?.desktop || 3,
                    '--bsb-thumb-cols-tablet': columns?.tablet || 2,
                    '--bsb-thumb-cols-mobile': columns?.mobile || 1,
                    '--bsb-thumb-col-gap': columnGap,
                    '--bsb-thumb-row-gap': rowGap
                }}
            >
                {items.map((item, index) => (
                    <ThumbnailCell
                        key={index}
                        {...{
                            item, index, attributes, socialQuery, isLazy, isBackEnd, hasStage,
                            activeIndex, goToSlide, showDuration, showPlay, hasText,
                            showCardTitle, showCardMeta, showCardExcerpt,
                            image: getImage(item)
                        }}
                    />
                ))}
            </div>

            {/* Load More for the grid mode, on `Grid`'s own terms — see the paging state in
                `Thumbnails`, which this and the stage both read so the two never disagree about
                which item `activeIndex` names. */}
            {canLoadMore && (
                <div className="load-more button_area">
                    <button className="load-more__button" onClick={onLoadMore} disabled={loadingMore}>
                        {loadingMore ? (
                            <span className="loader" aria-label="Loading">
                                {loaderIcon}
                            </span>
                        ) : (
                            sprintf(
                                /* translators: %d: number of items still to load */
                                __('Load More (%d)', 'b-slider'),
                                remainingCount
                            )
                        )}
                    </button>
                </div>
            )}
        </>
    );
};

/**
 * One cell of the grid.
 *
 * Its own component because of `useHoverPreview`: a hook cannot be called inside `.map()`, and each
 * cell needs its own preview state — which cursor is where, which video is playing, whether the
 * sound is on. `ListRow` is the same arrangement for the same reason.
 */
const ThumbnailCell = ({
    item, index, attributes, socialQuery, isLazy, isBackEnd, hasStage,
    activeIndex, goToSlide, showDuration, showPlay, hasText,
    showCardTitle, showCardMeta, showCardExcerpt, image
}) => {
    const { videoConf } = attributes;
    const { url, alt, title, fallback } = image || {};
    const altText = item?.altText || alt || title || '';
    const duration = showDuration ? (item?.duration || '') : '';

    /**
     * Whether this cell comes alive under the cursor.
     *
     * The slider's own "Play a muted preview on hover" decides it, and `hoverPreviewOf` decides
     * whether this particular item has anything to play — a YouTube id, an Instagram file, or
     * neither. The grid had none of this when it was written, which is why the setting appeared to
     * do nothing on the presets that use it.
     *
     * Not in the editor: the canvas is a `blob:` document and YouTube refuses it the referrer it
     * insists on, the same wall the stage player meets.
     */
    const preview = isBackEnd ? null : hoverPreviewOf(item, socialQuery, videoConf);
    const hover = useHoverPreview(preview);

    const onError = event => {
        if (fallback && event.target.src !== fallback) {
            event.target.src = fallback;
        }
    };

    /**
     * A button while there is a stage for it to drive, and a link when there is not.
     *
     * With the stage hidden the grid is the whole slider, and a cell that moved a hidden highlight
     * would be a control with no visible effect — pressing it would look broken. The item's own
     * address is the honest thing a click can do instead.
     *
     * `isBackEnd` keeps the href off in the editor, where a click on a slide is how the block gets
     * selected — the same reason `LinkedPicture` takes that flag.
     */
    const asLink = !hasStage && !!item?.link;
    const Cell = asLink ? 'a' : 'button';
    const cellProps = asLink
        ? {
            href: isBackEnd ? undefined : item.link,
            target: socialQuery?.linkTarget || undefined,
            rel: '_blank' === socialQuery?.linkTarget ? 'noopener noreferrer' : undefined
        }
        : {
            type: 'button',
            onClick: () => goToSlide(index),
            'aria-current': index === activeIndex
        };

    const isPlayable = !!item?.videoId
        || 'VIDEO' === item?.mediaType
        || !!item?.videoUrl
        || (Array.isArray(item?.gallery) && item.gallery.some(g => g?.isVideo));

    return (
        <Cell
            className={`bsb-thumb-cell ${(hasStage && index === activeIndex) ? 'is-active' : ''}`}
            aria-label={altText || `${index + 1}`}
            {...cellProps}
        >
            {/* The handlers go on the picture box, not the cell: with the text beside it, a cursor
                resting on the description would otherwise start the video too. `hostRef` is what
                `useHoverPreview` measures the grace area from. */}
            <span className="img" ref={hover.hostRef} {...hover.handlers}>
                {url && (
                    isLazy
                        ? <img loading="lazy" data-src={url} onError={onError} className="lazyload" alt={altText} />
                        : <img src={url} onError={onError} alt={altText} />
                )}

                {hover.active && <HoverPreview
                    preview={preview}
                    imageFit="cover"
                    label={item?.title || __('Video preview', 'b-slider')}
                    mediaRef={hover.mediaRef}
                    sound={hover.sound}
                />}

                {!!duration && <span className="bsb-thumb-duration">{duration}</span>}
                {showPlay && isPlayable && <span className="bsb-thumb-play" aria-hidden="true" />}
            </span>

            {hasText && <span className="bsb-thumb-body">
                {/* `dangerouslySetInnerHTML` because a feed title arrives with its entities already
                    encoded — `&amp;` and the rest — and printing it as text would show the ampersand
                    spelled out. The readers strip tags. */}
                {showCardTitle && !!item?.title && (
                    <span className="bsb-thumb-title" dangerouslySetInnerHTML={{ __html: item.title }} />
                )}

                {showCardMeta && (!!item?.views || !!item?.date) && (
                    <span className="bsb-thumb-meta">
                        {!!item?.views && <span>{compactViews(item.views)} {__('Views', 'b-slider')}</span>}
                        {!!item?.date && <span>{getLocalizedDate(item, socialQuery)}</span>}
                    </span>
                )}

                {showCardExcerpt && !!item?.excerpt && (
                    <span className="bsb-thumb-excerpt" dangerouslySetInnerHTML={{ __html: item.excerpt }} />
                )}
            </span>}
        </Cell>
    );
};


export const ThumbnailsSlider = ({ attributes, thumbnailsSliderEle, setThumbsSwiper, firstPosts, isBackEnd = false, showThumbDuration = false, showThumbPlay = false, activeIndex, goToSlide, isStagePlayer }) => {
    const { sourceType, sliders, isLazyLoad } = attributes;
    const isLazy = isLazyLoad && !isBackEnd;

    const getSlides = (items, getImage) =>
        items?.map((item, index) => {
            const { url, alt, title, fallback } = getImage(item) || {};
            const altText = item?.altText || alt || title;

            // Only a feed carries `fallback` — see the note on `onImageError` in PostItem.
            const onError = event => {
                if (fallback && event.target.src !== fallback) {
                    event.target.src = fallback;
                }
            };

            /**
             * The video's length, over the corner of its picture.
             *
             * Carried on every feed item since the reader was written and rendered nowhere until now
             * — see the note beside `duration` in `YouTubeFeed::makeItem()`. Only the API path fills
             * it in, so a site with no key has none and the corner stays empty rather than showing a
             * `0:00` for a video whose length was never read.
             *
             * Behind `showThumbDuration` because the strip is also an image slider's and a product
             * grid's, and neither has a length to print.
             */
            const duration = showThumbDuration ? (item?.duration || '') : '';
            const isActive = isStagePlayer && index === activeIndex;

            return (
                <SwiperSlide key={index} className={isActive ? 'swiper-slide-thumb-active' : ''}>
                    <div className="single_thumbnails" onClick={isStagePlayer ? () => goToSlide(index) : undefined}>
                        <div className="img">
                            {url && (
                                isLazy ? (
                                    <img loading="lazy" data-src={url} onError={onError} className="d-block w-100 lazyload" alt={altText} />
                                ) : (
                                    <img src={url} onError={onError} className="d-block w-100" alt={altText} />
                                )
                            )}

                            {!!duration && <span className="bsb-thumb-duration">{duration}</span>}

                            {/* The play mark, so a thumbnail reads as a video rather than a picture.
                                Drawn in CSS from one span — a second <img> per slide for a triangle
                                would be a request each, on a grid that is already twelve pictures. */}
                            {showThumbPlay && <span className="bsb-thumb-play" aria-hidden="true" />}
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
        case 'social':
            slides = getSlides(firstPosts, item => item?.thumbnail);
            break;
        default:
            return null;
    }

    return <Swiper {...thumbnailsSliderEle} onSwiper={setThumbsSwiper}>{slides}</Swiper>;
};
