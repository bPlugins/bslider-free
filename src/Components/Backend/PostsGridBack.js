import { createElement, useEffect } from 'react';
import { useState } from 'react';

import Pagination from '../Common/Layouts/grid/Pagination/Pagination';
import Excerpt from '../Common/Layouts/grid/Excerpt';

const PostsGridBack = ({ attributes, firstPosts, totalPosts, updateObject }) => {

    const [posts, setPosts] = useState(firstPosts);
    const [pageNumber, setPageNumber] = useState(1);
    const { columns, button, postsQuery, grid } = attributes;
    const { per_page } = postsQuery;
    const [loadMore, setLoadMore] = useState(firstPosts);
    const { paginationType } = grid;

    const { text } = button;
    const btnLabel = text;

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
                    const { thumbnail, title: postTitle, link } = post;
                    return <div key={index} className={`item ${index === 0 ? 'active' : ''} `}>
                        <div className="img">
                            {thumbnail?.url && <><img src={thumbnail.url} className="d-block w-100" /></>}
                        </div>

                        <div className={'content-area'}>
                            <div className={`captionContent`}>

                                {postTitle && createElement('h5', {
                                    className: `bsbTitle`, dangerouslySetInnerHTML: { __html: postTitle }
                                }, null)}

                                <Excerpt attributes={attributes} post={post} />

                                {btnLabel && <>
                                    <div className={`carousel-button`}>
                                        <a href={link} rel="noreferrer" dangerouslySetInnerHTML={{ __html: btnLabel }} />
                                    </div>
                                </>}
                            </div>
                        </div>
                    </div>
                })
            }
        </div>

        {totalPosts > per_page && per_page > 0 && <Pagination attributes={attributes} totalCount={totalPosts} onChange={val => updateObject('postsQuery', 'paginationCurrentPage', val)} />}
    </div>
}
export default PostsGridBack;