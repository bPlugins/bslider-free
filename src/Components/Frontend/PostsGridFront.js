import { createElement } from 'react';
import { useState, useEffect } from 'react';
import useAjaxPosts from '../../hooks/useAjaxPosts';
import Excerpt from '../Common/Layouts/grid/Excerpt';
import AcfFields, { resolveSlideImage, resolveButtonLink, resolveButtonText, resolveTitle } from '../Common/single-item/AcfFields';
import LinkedPicture from '../Common/single-item/LinkedPicture';
import Pagination from '../Common/Layouts/grid/Pagination/Pagination';
import { bsb_lightbox_config } from '../../utils/config';
import { lightboxCaption } from '../../utils/functions';

const PostsGridFront = ({ attributes, firstPosts, totalPosts, nonce, commonDeProps = {} }) => {
    const [posts, setPosts] = useState(firstPosts);
    const [pageNumber, setPageNumber] = useState(1);
    const { columns, button, title, desc, grid, image, lightbox } = attributes;
    const { clientId } = commonDeProps;
    const { paginationType } = grid;

    /* The same switch the four slider layouts read — see `PostItem`. A post grid draws its own slides
       rather than going through `PostItem`, so the setting has to be resolved here too. */
    const isLightboxOn = 'lightbox' === image?.link;
    const captionMode = 'custom' === lightbox?.caption ? 'title' : lightbox?.caption;

    const { posts: ajaxPosts, isLoading: isAPLoading } = useAjaxPosts(nonce, attributes, pageNumber);

    // Older blocks have no `isVisible` key, so only an explicit `false` hides any of the three.
    const btnLabel = button?.isVisible !== false ? button?.text : '';
    const showTitle = title?.isVisible !== false;
    const showDesc = desc?.isVisible !== false;

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

    /* The other four layouts bind the lightbox from their own effect; this renderer replaces `Grid`
       for a post source, so without this its triggers are markup nothing is listening for. */
    useEffect(() => {
        bsb_lightbox_config(clientId, attributes);
    }, [clientId, isLightboxOn]);

    return <div className="grid-wrapper">
        <div className={`grid bsbCarousel columns-${desktop} columns-tablet-${tablet} columns-mobile-${mobile}`}>
            {
                shownPosts?.map((post, index) => {
                    const { thumbnail } = post;
                    const postTitle = resolveTitle(post, attributes);
                    const slideImg = resolveSlideImage(post, attributes, thumbnail);
                    // Resolved per post, since an ACF field gives each one its own label.
                    const itemBtnLabel = btnLabel ? resolveButtonText(post, attributes, btnLabel) : '';
                    // Mirrors PostItem: the whole picture is the link wherever the button points,
                    // and `LinkedPicture` renders the bare `<img>` when there is no link to make.
                    const isLightbox = isLightboxOn && !!slideImg?.url;
                    const imageHref = isLightbox ? slideImg.url : (resolveButtonLink(post, attributes) || '');
                    const plainTitle = String(postTitle || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                    const lbCaption = isLightbox
                        ? lightboxCaption(captionMode, { imageCaption: slideImg?.alt || '', title: plainTitle })
                        : '';
                    return <div key={index} className={`item ${index === 0 ? 'active' : ''} ${imageHref ? 'is-linked' : ''} `}>
                        <div className="img">
                            {slideImg?.url && <LinkedPicture href={imageHref} linkTarget={image?.linkTarget} label={plainTitle || imageHref} lightbox={isLightbox} caption={lbCaption} clientId={clientId} attributes={attributes}>
                                <img src={slideImg.url} className="d-block w-100 " />
                            </LinkedPicture>}
                        </div>

                        <div className={'content-area'}>
                            <div className={`captionContent`}>
                                {postTitle && createElement("h5", {
                                    className: `bsbTitle`, dangerouslySetInnerHTML: { __html: postTitle }
                                }, null)}

                                {showDesc && <Excerpt attributes={attributes} post={post} />}

                                {itemBtnLabel && <>
                                    <div className={`carousel-button`}>
                                        {/* The same switch the picture follows. */}
                                        <a href={resolveButtonLink(post, attributes)} rel={'_blank' === image?.linkTarget ? 'noopener noreferrer' : 'noreferrer'} target={image?.linkTarget || undefined} dangerouslySetInnerHTML={{ __html: itemBtnLabel }} />
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