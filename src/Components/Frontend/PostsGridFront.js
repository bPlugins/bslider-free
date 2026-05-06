import { createElement } from 'react';
import { useState, useEffect } from 'react';
import useAjaxPosts from '../../hooks/useAjaxPosts';
import Excerpt from '../Common/Layouts/grid/Excerpt';
import Pagination from '../Common/Layouts/grid/Pagination/Pagination';

const PostsGridFront = ({ attributes, firstPosts, totalPosts, nonce }) => {
    const [posts, setPosts] = useState(firstPosts);
    const [pageNumber, setPageNumber] = useState(1);
    const { columns, button, grid } = attributes;
    const { paginationType } = grid;

    const { posts: ajaxPosts, isLoading: isAPLoading } = useAjaxPosts(nonce, attributes, pageNumber);

    const { text } = button;
    const btnLabel = text;

    const { desktop, tablet, mobile } = columns;
    const dpPosts = (Array.isArray(posts) && posts?.length) ? posts : [];
    const shownPosts = pageNumber > 1 ? dpPosts : firstPosts;

    useEffect(() => {
        if (!isAPLoading && pageNumber > 1 && paginationType === 'loadMore') {
            setPosts([...posts, ...ajaxPosts]);
        }

        if (Array.isArray(ajaxPosts) && !isAPLoading && pageNumber > 1 && paginationType === 'pagination') {
            setPosts(ajaxPosts);
        }
    }, paginationType === 'pagination' ? [ajaxPosts, isAPLoading, pageNumber] : [ajaxPosts]);

    return <div className="grid-wrapper">
        <div className={`grid bsbCarousel columns-${desktop} columns-tablet-${tablet} columns-mobile-${mobile}`}>
            {
                shownPosts?.map((post, index) => {
                    const { thumbnail, title: postTitle, link } = post;
                    return <div key={index} className={`item ${index === 0 ? 'active' : ''} `}>
                        <div className="img">
                            {thumbnail?.url && <> <img loading="lazy" data-src={thumbnail.url} className="d-block w-100 lazyload" /></>}
                        </div>

                        <div className={'content-area'}>
                            <div className={`captionContent`}>
                                {postTitle && createElement("h5", {
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

        {<Pagination attributes={attributes} isLoading={isAPLoading} totalCount={totalPosts} onChange={val => setPageNumber(val)} />}
    </div>
}
export default PostsGridFront;