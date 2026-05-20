import { useState, useEffect, useRef } from "react";
import { bsb_lightbox_config, plyrInt, bsb_open_video_popup } from '../../../../utils/config';
import ImageItem from '../../single-item/ImageItem';
import PostItem from '../../single-item/PostItem';
import WooItem from '../../single-item/WooItem';
import { loaderIcon, placeholderImg, play } from '../../../../utils/icons';

const Grid = ({ attributes, commonDeProps }) => {
    const { sliders, columns, grid, sourceType, postsQuery, videoConf, layoutType } = attributes;
    const { clientId, isBackEnd } = commonDeProps;
    const { isPopup, icon } = videoConf;
    const { per_page } = postsQuery;
    const { desktop, tablet, mobile } = columns;
    const { paginationType } = grid;
    const [items, setItems] = useState([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [visibleCount, setVisibleCount] = useState(parseInt(per_page));
    const [loading, setLoading] = useState(false);

    const videoRefs = useRef([]);
    const hiddenVideoRefs = useRef([]);
    const perPage = parseInt(per_page);

    useEffect(() => {
        setItems(sliders);
    }, [sliders]);

    useEffect(() => {
        if (paginationType === 'loadMore') {
            setVisibleCount(perPage);
        }
    }, [perPage, paginationType, items?.length]);

    const paginatedItems = () => {
        if (paginationType === 'pagination') {
            const start = (currentPage - 1) * perPage;
            return items?.slice(start, start + perPage);

        } else {
            return items?.slice(0, visibleCount);
        }
    };

    useEffect(() => {
        plyrInt(clientId, videoRefs, hiddenVideoRefs, attributes);

    }, [items, sourceType, layoutType, videoConf]);

    useEffect(() => {
        bsb_lightbox_config(clientId, attributes);
    }, [clientId, videoConf]);

    const totalPages = Math.ceil(items?.length / perPage);

    // Load More
    const handleLoadMore = () => {
        setLoading(true);
        setTimeout(() => {
            setVisibleCount((prev) => Math.min(parseInt(prev) + parseInt(perPage), items?.length));
            setLoading(false);
        }, 600);
    };

    // Handle Page Change 
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const remainingCount = items?.length - visibleCount;

    return (
        <div className="grid-wrapper">
            <div className={`grid bsbCarousel columns-${desktop} columns-tablet-${tablet} columns-mobile-${mobile}`}>
                {(() => {
                    switch (sourceType) {
                        case 'image':
                            return paginatedItems()?.map((slide, index) => <ImageItem key={index} {...{
                                attributes, slide, index, classNames: {
                                    contentArea: 'content-area'
                                }
                            }} />);
                        case 'posts':
                            return paginatedItems()?.map((post, index) => <PostItem key={index} {...{
                                attributes, post, index, classNames: {
                                    contentArea: 'content-area'
                                }
                            }} />);

                        case 'woo':
                            return paginatedItems()?.map((product, index) => <WooItem key={index} {...{
                                attributes, product, index, classNames: {
                                    contentArea: 'content-area'
                                }
                            }} />);
                        case 'video':
                            return paginatedItems()?.map((slide, index) => !isPopup ? <div ref={(el) => (videoRefs.current[index] = el)} key={index} className={`videoItem ${index === 0 ? 'active' : ''}`} >
                                <video controls poster={slide?.img.url} className="bsbvid" id="player">
                                    <source src={slide?.video?.url} type="video/mp4" /></video>
                            </div> :
                                <a data-fancybox={`${clientId}-video-gallery`} data-caption="" key={index} className={`lightboxArea videoItem ${index === 0 ? 'active' : ''}`} href={slide?.video?.url} data-type={'html5video'} onClick={isBackEnd ? (e) => { e.preventDefault(); e.stopPropagation(); const realIdx = sliders.indexOf(slide); bsb_open_video_popup(sliders, realIdx >= 0 ? realIdx : index, attributes); } : undefined}>
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

            {(paginationType === 'pagination' && perPage < items?.length) && (
                <div className="pagination button_area">
                    {/* Prev Button */}
                    <button onClick={() => handlePageChange(Math.max(currentPage - 1, 1))} className={`pagination__button prev ${currentPage === 1 ? 'disabled' : ''}`} >Prev</button>

                    {/* Numbered Pagination */}
                    {Array.from({ length: totalPages }, (_, i) => (
                        <button key={i} onClick={() => handlePageChange(i + 1)} className={`pagination__button ${currentPage === i + 1 ? "active" : ""}`} > {i + 1} </button>
                    ))}

                    {/* Next Button */}
                    <button onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))} className={`pagination__button next ${currentPage === totalPages ? 'disabled' : ''}`} > Next </button>
                </div>
            )}


            {paginationType === 'loadMore' && visibleCount < items?.length && (
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