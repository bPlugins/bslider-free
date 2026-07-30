import { createElement } from 'react';
import { useState, useEffect } from 'react';
import useAjaxPosts from '../../hooks/useAjaxPosts';
import Excerpt from '../Common/Layouts/grid/Excerpt';
import AcfFields, { resolveSlideImage, resolveButtonLink, resolveButtonText, resolveTitle } from '../Common/single-item/AcfFields';
import Pagination from '../Common/Layouts/grid/Pagination/Pagination';

const PostsGridFront = ({ attributes, firstPosts, totalPosts, nonce }) => {
    const [posts, setPosts] = useState(firstPosts);
    const [pageNumber, setPageNumber] = useState(1);
    const { columns, button, grid } = attributes;
    const { paginationType } = grid;

    const { posts: ajaxPosts, isLoading: isAPLoading } = useAjaxPosts(nonce, attributes, pageNumber);

    // Older blocks have no `isVisible` key, so only an explicit `false` hides the button.
    const btnLabel = button?.isVisible !== false ? button?.text : '';

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
                    const { thumbnail } = post;
                    const postTitle = resolveTitle(post, attributes);
                    const slideImg = resolveSlideImage(post, attributes, thumbnail);
                    // Resolved per post, since an ACF field gives each one its own label.
                    const itemBtnLabel = btnLabel ? resolveButtonText(post, attributes, btnLabel) : '';
                    return <div key={index} className={`item ${index === 0 ? 'active' : ''} `}>
                        <div className="img">
                            {slideImg?.url && <> <img src={slideImg.url} className="d-block w-100 " /></>}
                        </div>

                        <div className={'content-area'}>
                            <div className={`captionContent`}>
                                {postTitle && createElement("h5", {
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

        {<Pagination attributes={attributes} isLoading={isAPLoading} totalCount={totalPosts} onChange={val => setPageNumber(val)} />}
    </div>
}
export default PostsGridFront;