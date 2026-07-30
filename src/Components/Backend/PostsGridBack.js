import { createElement, useEffect } from 'react';
import { useState } from 'react';

import Pagination from '../Common/Layouts/grid/Pagination/Pagination';
import Excerpt from '../Common/Layouts/grid/Excerpt';
import AcfFields, { resolveSlideImage, resolveButtonLink, resolveButtonText, resolveTitle } from '../Common/single-item/AcfFields';

const PostsGridBack = ({ attributes, firstPosts, totalPosts, updateObject }) => {

    const [posts, setPosts] = useState(firstPosts);
    const [pageNumber, setPageNumber] = useState(1);
    const { columns, button, postsQuery, grid } = attributes;
    const { per_page } = postsQuery;
    const [loadMore, setLoadMore] = useState(firstPosts);
    const { paginationType } = grid;

    // Older blocks have no `isVisible` key, so only an explicit `false` hides the button.
    const btnLabel = button?.isVisible !== false ? button?.text : '';

    const { desktop, tablet, mobile } = columns;
    const dpPosts = (Array.isArray(posts) && posts?.length) ? posts : [];
    const shownPosts = pageNumber > 1 ? dpPosts : firstPosts;

    useEffect(() => {
        if (paginationType === 'loadMore') {
            setLoadMore({ ...loadMore, shownPosts });
        }
    }, [postsQuery, shownPosts]);

    return <div className="grid-wrapper">
        <div className={`grid bsbCarousel columns-${desktop} columns-tablet-${tablet} columns-mobile-${mobile}`}>
            {
                shownPosts?.map((post, index) => {
                    const { thumbnail } = post;
                    const postTitle = resolveTitle(post, attributes);
                    const slideImg = resolveSlideImage(post, attributes, thumbnail);
                    // Resolved per post, since an ACF field gives each one its own label.
                    const itemBtnLabel = btnLabel ? resolveButtonText(post, attributes, btnLabel) : '';
                    return <div key={index} className={`item ${index === 0 ? 'active' : ''} `}>
                        <div className="img">
                            {slideImg?.url && <><img src={slideImg.url} className="d-block w-100" /></>}
                        </div>

                        <div className={'content-area'}>
                            <div className={`captionContent`}>

                                {postTitle && createElement('h5', {
                                    className: `bsbTitle`, dangerouslySetInnerHTML: { __html: postTitle }
                                }, null)}

                                <Excerpt attributes={attributes} post={post} />

                                {itemBtnLabel && <>
                                    <div className={`carousel-button`}>
                                        <a href={resolveButtonLink(post, attributes)} rel="noreferrer" dangerouslySetInnerHTML={{ __html: itemBtnLabel }} />
                                    </div>
                                </>}
                            </div>
                        </div>

                        {/* Last, so the ACF layer paints over the image and caption. */}
                        <AcfFields post={post} attributes={attributes} />
                    </div>
                })
            }
        </div>

        {totalPosts > per_page && per_page > 0 && <Pagination attributes={attributes} totalCount={totalPosts} onChange={val => updateObject('postsQuery', 'paginationCurrentPage', val)} />}
    </div>
}
export default PostsGridBack;