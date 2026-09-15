import { createElement, useEffect } from 'react';
import { useState } from 'react';

import Pagination from '../Common/Layouts/grid/Pagination/Pagination';
import Excerpt from '../Common/Layouts/grid/Excerpt';
import AcfFields, { resolveSlideImage, resolveButtonLink, resolveButtonText, resolveTitle } from '../Common/single-item/AcfFields';
import LinkedPicture from '../Common/single-item/LinkedPicture';
import SlideLink from '../Common/single-item/SlideLink';
import { bsb_lightbox_config } from '../../utils/config';
import { lightboxCaption } from '../../utils/functions';

const PostsGridBack = ({ attributes, firstPosts, totalPosts, updateObject, commonDeProps = {} }) => {

    const [posts, setPosts] = useState(firstPosts);
    const [pageNumber, setPageNumber] = useState(1);
    const { columns, button, title, desc, postsQuery, grid, image, lightbox } = attributes;
    // What tells every link on a slide that the first click belongs to the editor — see useEditorLink.
    const { clientId, isSelected = false } = commonDeProps;

    /* The same switch the four slider layouts read — see `PostItem`. A post grid draws its own slides
       rather than going through `PostItem`, so the setting has to be resolved here too. */
    const isLightboxOn = 'lightbox' === image?.link;
    const captionMode = 'custom' === lightbox?.caption ? 'title' : lightbox?.caption;
    const { per_page } = postsQuery;
    const [loadMore, setLoadMore] = useState(firstPosts);
    const { paginationType } = grid;

    // Older blocks have no `isVisible` key, so only an explicit `false` hides any of the three.
    const btnLabel = button?.isVisible !== false ? button?.text : '';
    const showTitle = title?.isVisible !== false;
    const showDesc = desc?.isVisible !== false;

    const { desktop, tablet, mobile } = columns;
    const dpPosts = (Array.isArray(posts) && posts?.length) ? posts : [];
    const shownPosts = pageNumber > 1 ? dpPosts : firstPosts;

    useEffect(() => {
        if (paginationType === 'loadMore') {
            setLoadMore({ ...loadMore, shownPosts });
        }
    }, [postsQuery, shownPosts]);

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
                    const buttonHref = resolveButtonLink(post, attributes) || '';
                    const imageHref = isLightbox ? slideImg.url : buttonHref;
                    const plainTitle = String(postTitle || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                    const lbCaption = isLightbox
                        ? lightboxCaption(captionMode, { imageCaption: slideImg?.alt || '', title: plainTitle })
                        : '';
                    return <div key={index} className={`item ${index === 0 ? 'active' : ''} ${imageHref ? 'is-linked' : ''} `}>
                        <div className="img">
                            {slideImg?.url && <LinkedPicture href={imageHref} linkTarget={image?.linkTarget} label={plainTitle || imageHref} lightbox={isLightbox} caption={lbCaption} clientId={clientId} attributes={attributes} isBackEnd isSelected={isSelected}>
                                <img src={slideImg.url} className="d-block w-100" />
                            </LinkedPicture>}
                        </div>

                        <div className={'content-area'}>
                            <div className={`captionContent`}>

                                {showTitle && postTitle && createElement('h5', {
                                    className: `bsbTitle`, dangerouslySetInnerHTML: { __html: postTitle }
                                }, null)}

                                {showDesc && <Excerpt attributes={attributes} post={post} />}

                                {itemBtnLabel && <>
                                    <div className={`carousel-button`}>
                                        {/* The same switch the picture follows. */}
                                        {/* `buttonHref`, not `imageHref`: in lightbox mode the picture
                                            points at the image file, and the button still goes to the post. */}
                                        <SlideLink href={buttonHref} linkTarget={image?.linkTarget} isBackEnd isSelected={isSelected} dangerouslySetInnerHTML={{ __html: itemBtnLabel }} />
                                    </div>
                                </>}
                            </div>
                        </div>

                        {/* Last, so the ACF layer paints over the image and caption. */}
                        <AcfFields post={post} attributes={attributes} isBackEnd isSelected={isSelected} />
                    </div>
                })
            }
        </div>

        {totalPosts > per_page && per_page > 0 && <Pagination attributes={attributes} totalCount={totalPosts} onChange={val => updateObject('postsQuery', 'paginationCurrentPage', val)} />}
    </div>
}
export default PostsGridBack;