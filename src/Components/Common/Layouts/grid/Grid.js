import { useState, useEffect, useRef } from "react";
import { bsb_lightbox_config, plyrInt } from '../../../../utils/config';
import { usePagination, DOTS } from './Pagination/usePagination';
import ImageItem from '../../single-item/ImageItem';
import PostItem from '../../single-item/PostItem';
import WooItem from '../../single-item/WooItem';
import { loaderIcon, placeholderImg, play } from '../../../../utils/icons';

const Grid = ({ attributes, commonDeProps, firstPosts, totalPosts, feedPageUrl = '' }) => {
    const { sliders, columns, grid, sourceType, postsQuery, videoConf, layoutType } = attributes;
    // `isBackEnd` is set by Edit and nothing else, and it is what tells a feed slide to open its popup
    // itself rather than leave the click to Fancybox — see `onPlayClick` in PostItem.
    const { clientId, isBackEnd = false, isSelected = false } = commonDeProps;
    const { isPopup, icon } = videoConf;
    const { per_page } = postsQuery;
    const { desktop, tablet, mobile } = columns;
    const { paginationType } = grid;
    const [items, setItems] = useState([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [visibleCount, setVisibleCount] = useState(parseInt(per_page) > 0 ? parseInt(per_page) : 0);
    const [loading, setLoading] = useState(false);

    const videoRefs = useRef([]);
    const hiddenVideoRefs = useRef([]);
    const rootRef = useRef(null);
    const isFeed = 'social' === sourceType;

    /**
     * How many items one page of the grid holds.
     *
     * **A feed's fetch count and the grid's page size are two different numbers.** This used to read
     * `isFeed || ...`, on the reasoning that a feed is asked for its own count when it is fetched, so
     * what came back is what the grid shows. That is true of the fetch and wrong about the grid: asking
     * a channel for 30 videos is not the same as wanting all thirty stacked on the page at once. With
     * `isFeed` in here the page size was always the whole set, so `perPage < items.length` was never
     * true and neither the pager nor the Load More button could ever render — for any feed type.
     *
     * The two counts now sit in the two panels they belong to: how many to *fetch* under Social
     * Filtering, how many to *show at a time* under Pagination. A feed is paged from what is already in
     * memory, exactly as an image slider is — there is no second request behind a page change, and
     * there should not be, since the whole set arrived in the first one.
     *
     * `-1` — or anything below 1 — still means show everything, which is what leaves a slider that has
     * never touched the setting looking exactly as it did.
     */
    const perPage = !(parseInt(per_page) > 0) ? (items?.length || 0) : parseInt(per_page);

    /**
     * Whether the rest of this feed lives on the server rather than in the page.
     *
     * `feedPageUrl` is printed only where `render.php` decided to send one page instead of the whole
     * feed — a paging grid over a feed with more items than fit on a page. Everywhere else it is empty
     * and everything below falls back to slicing what is already in hand, which is what the editor
     * always does and what every other layout does.
     *
     * The distinction matters for one number: how many items there are. In the page-held case that is
     * `items.length`, because the page holds them all. Here `items` is one page, and the count comes
     * from the server — `data-totalposts`, which `render.php` sets from the full set.
     */
    const serverPaged = !!feedPageUrl;
    const total = serverPaged ? (parseInt(totalPosts) || items?.length || 0) : (items?.length || 0);

    /**
     * One page from the server.
     *
     * A plain `fetch`, because the address arrived finished — `render.php` built it with `rest_url()`,
     * so there is no REST root to discover and no reason to load `wp-api-fetch` onto the front end.
     * The route is a read of a cache this feed already filled; it never goes out to the service, so
     * this is a local request however many videos the slider holds.
     *
     * A failure leaves what is on screen alone. The visitor asked for page 4 and is still looking at
     * page 3, which is a better answer than an empty grid.
     */
    const fetchPage = async (page, append) => {
        setLoading(true);

        try {
            const res = await fetch(`${feedPageUrl}&page=${page}&per_page=${perPage}`, {
                headers: { Accept: 'application/json' }
            });
            const data = await res.json();

            if (Array.isArray(data?.items) && data.items.length) {
                setItems(prev => append ? [...prev, ...data.items] : data.items);
                setCurrentPage(data.page || page);
            }
        } catch (e) {
            // Nothing to say to the visitor about it — see above.
        }

        setLoading(false);
    };

    /* Declared with `perPage` rather than further down beside the pager it feeds. The clamp effect
       below lists it as a dependency, and a dependency array is read during the render itself — from
       under its own `const` that would be the temporal dead zone, and a ReferenceError. */
    const totalPages = perPage > 0 ? Math.ceil(total / perPage) : 1;

    /**
     * Which page numbers the pager actually draws.
     *
     * A window rather than every page: first, last, the current one with a sibling either side, and
     * `DOTS` standing in for the runs between. 200 videos at 6 a page is 34 pages, and 34 buttons in one
     * centred row simply overflowed the slider in both directions.
     *
     * The same hook the post and product grids use, so the two pagers cannot drift apart. It is a hook,
     * so it is called unconditionally here and the result is only read when the pager renders — calling
     * it inside that branch would break the rule that hooks run in the same order every render.
     */
    const paginationRange = usePagination({
        currentPage,
        // `total`, not `items.length`. Server-paged, `items` is the one page on screen — handed that,
        // the pager would work out that there is a single page and draw a single button.
        totalCount: total,
        pageSize: perPage > 0 ? perPage : 1,
        siblingCount: 1
    });

    useEffect(() => {
        setItems(isFeed ? (firstPosts || []) : sliders);
    }, [sliders, firstPosts, isFeed]);

    useEffect(() => {
        setVisibleCount(perPage);
    }, [perPage, paginationType, items?.length]);

    /**
     * Never leave the reader on a page that no longer exists.
     *
     * `visibleCount` above is reset whenever the set changes; `currentPage` was not, and it is the one
     * that can point past the end. Nothing forced the issue while a feed was a single page — now that
     * a feed grid pages like any other, the set moves under it constantly: "how many videos" refetches,
     * a keyword filter drops half the items, "per page" is dragged upward. Standing on page 4 of what
     * is now a two-page set renders an empty grid with a pager under it that looks broken.
     */
    useEffect(() => {
        setCurrentPage(page => Math.min(page, Math.max(1, totalPages)));
    }, [totalPages]);

    const paginatedItems = () => {
        /* Server-paged: `items` *is* the page — replaced on a page change, grown by Load More — so
           slicing it again would cut the page down to a page of itself. */
        if (serverPaged) {
            return items;
        }

        if (paginationType === 'pagination') {
            const start = (currentPage - 1) * perPage;
            return items?.slice(start, start + perPage);

        } else {
            return items?.slice(0, visibleCount > 0 ? visibleCount : perPage);
        }
    };

    useEffect(() => {
        plyrInt(clientId, videoRefs, hiddenVideoRefs, attributes);

    }, [items, sourceType, layoutType, videoConf]);

    useEffect(() => {
        // The root element tells the lightbox which document to work in — the editor's iframe
        // under apiVersion 3, the page itself on the front end.
        bsb_lightbox_config(clientId, attributes, rootRef.current);
    }, [clientId, videoConf]);

    // Load More
    const handleLoadMore = () => {
        if (serverPaged) {
            fetchPage(currentPage + 1, true);
            return;
        }

        setLoading(true);
        setTimeout(() => {
            setVisibleCount((prev) => Math.min(parseInt(prev) + parseInt(perPage), items?.length));
            setLoading(false);
        }, 600);
    };

    // Handle Page Change 
    const handlePageChange = (page) => {
        if (serverPaged) {
            fetchPage(page, false);
            return;
        }

        setCurrentPage(page);
    };

    const remainingCount = serverPaged ? (total - items?.length) : (items?.length - visibleCount);

    return (
        <div ref={rootRef} className="grid-wrapper">
            <div className={`grid bsbCarousel columns-${desktop} columns-tablet-${tablet} columns-mobile-${mobile}`}>
                {(() => {
                    switch (sourceType) {
                        case 'image':
                            return paginatedItems()?.map((slide, index) => <ImageItem key={index} {...{
                                attributes, slide, index, classNames: {
                                    contentArea: 'content-area'
                                }
                            }} />);
                        // A feed item arrives shaped like an arranged post, so it renders as one.
                        case 'posts':
                        case 'social':
                            return paginatedItems()?.map((post, index) => <PostItem key={index} {...{
                                attributes, post, index, clientId, isBackEnd, isSelected, classNames: {
                                    contentArea: 'content-area'
                                }
                            }} />);

                        case 'woo':
                            return paginatedItems()?.map((product, index) => <WooItem key={index} {...{
                                attributes, product, index, isBackEnd, isSelected, classNames: {
                                    contentArea: 'content-area'
                                }
                            }} />);
                        case 'video':
                            return paginatedItems()?.map((slide, index) => !isPopup ? <div ref={(el) => (videoRefs.current[index] = el)} key={index} className={`videoItem ${index === 0 ? 'active' : ''}`} >
                                <video controls poster={slide?.img.url} className="bsbvid" id="player">
                                    <source src={slide?.video?.url} type="video/mp4" /></video>
                            </div> :
                                <a data-fancybox={`${clientId}-video-gallery`} data-caption="" key={index} className={`lightboxArea videoItem ${index === 0 ? 'active' : ''}`} href={slide?.video?.url} data-type={'html5video'}>
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
                                </a>)

                        default:
                            return null;
                    }
                })()}
            </div>

            {(paginationType === 'pagination' && perPage < total) && (
                <div className="pagination button_area">
                    {/* Prev Button */}
                    <button onClick={() => handlePageChange(Math.max(currentPage - 1, 1))} className={`pagination__button prev ${currentPage === 1 ? 'disabled' : ''}`} >Prev</button>

                    {/* Numbered Pagination — a window, not the whole list.
                        This was `Array.from({ length: totalPages })`, one button per page and no upper
                        bound on how many that could be: 200 videos at 6 a page is 34 buttons in a row
                        that `justify-content: center` cannot fold, so the pager ran off both edges of
                        the slider.
                        `usePagination` is the plugin's own answer to this, already in use by the post
                        and product grids — first page, last page, the current one with a sibling either
                        side, and dots across whatever is skipped. Reused rather than rewritten so the
                        two grids cannot start paging differently from each other. */}
                    {(paginationRange || []).map((pageNumber, index) => pageNumber === DOTS
                        ? <button key={index} className='pagination__button dots' disabled aria-hidden='true'>&#183;&#183;&#183;&#183;&#183;</button>
                        : <button key={index} onClick={() => handlePageChange(pageNumber)} className={`pagination__button ${currentPage === pageNumber ? "active" : ""}`} aria-current={currentPage === pageNumber ? 'page' : undefined}> {pageNumber} </button>
                    )}

                    {/* Next Button */}
                    <button onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))} className={`pagination__button next ${currentPage === totalPages ? 'disabled' : ''}`} > Next </button>
                </div>
            )}


            {paginationType === 'loadMore' && (serverPaged ? items?.length < total : visibleCount < items?.length) && (
                <div className="load-more button_area">
                    <button className="load-more__button" onClick={handleLoadMore} disabled={loading}>
                        {loading ? (
                            <span className="loader" aria-label="Loading">
                                {loaderIcon}
                            </span>
                        ) : (
                            `Load More (${remainingCount})`
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};
export default Grid;