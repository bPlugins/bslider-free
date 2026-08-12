import { createElement } from 'react';
import Excerpt from '../Layouts/grid/Excerpt';
import AcfFields, { resolveSlideImage, resolveButtonLink, resolveButtonText, resolveTitle } from './AcfFields';
import LinkedPicture from './LinkedPicture';
import SlideLink from './SlideLink';

const PostItem = (props) => {
    const { attributes, post, index, isBackEnd = false, isSelected = false, classNames = {} } = props;
    const { title, desc, button, image } = attributes;

    const { thumbnail } = post || {};
    // Older blocks have no `isVisible` key, so only an explicit `false` hides any of the three.
    const btnLabel = button?.isVisible !== false ? resolveButtonText(post, attributes, button?.text) : '';
    const showTitle = title?.isVisible !== false;
    const showDesc = desc?.isVisible !== false;
    const slideImg = resolveSlideImage(post, attributes, thumbnail);
    const btnLink = resolveButtonLink(post, attributes);
    const postTitle = resolveTitle(post, attributes);

    /**
     * The whole picture as the link to the post, on every layout and without being asked.
     *
     * A slide whose button is hidden had nothing on it a click could reach: the caption laid over it is
     * `pointer-events: none` so the arrows underneath stay usable, and only the anchors inside it take
     * clicks back. `btnLink` rather than the permalink directly, so the picture and the button can never
     * lead to two different places.
     *
     * When there is no image the picture anchor has zero height and cannot be clicked — so a full-slide
     * overlay anchor (`bsbSlideOverlay`) covers the whole item instead. It sits below the caption in
     * z-order, so the button and any links inside the caption still take their own clicks.
     */
    const imageHref = btnLink || '';
    const accessibleLabel = String(postTitle || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || imageHref;

    return <div className={`item ${index === 0 ? 'active' : ''} ${imageHref ? 'is-linked' : ''} ${classNames.item || ''}`}>
        {/* Overlay anchor — only when there is a link but no image to carry it. The picture anchor
            handles the image case; this one handles the no-image case so the whole slide is still
            reachable without a visible image. Hidden from assistive technology because the button
            below already names the destination. */}
        {imageHref && !slideImg?.url && <SlideLink
            className='bsbSlideOverlay'
            href={imageHref}
            linkTarget={image?.linkTarget}
            rel={'_blank' === image?.linkTarget ? 'noopener noreferrer' : undefined}
            isBackEnd={isBackEnd}
            isSelected={isSelected}
            aria-hidden='true'
            tabIndex='-1'
        />}
        <div className="img">
            {slideImg?.url && <LinkedPicture
                href={imageHref}
                linkTarget={image?.linkTarget}
                /* The picture here carries no `alt`, so without this the link would have no accessible
                   name — an image inside a link is what names that link, and there is none to read. */
                label={accessibleLabel}
                isBackEnd={isBackEnd}
                isSelected={isSelected}
            >
                <img src={slideImg.url} className="d-block w-100" />
            </LinkedPicture>}
        </div>

        <div className={classNames.contentArea || 'content-area'}>
            <div className={`captionContent ${classNames.captionContent || ''}`}>
                {showTitle && postTitle && createElement("h5", {
                    className: `bsbTitle ${classNames.title || ''}`, dangerouslySetInnerHTML: { __html: postTitle }
                }, null)}

                {showDesc && <Excerpt attributes={attributes} classNames={classNames} post={post} />}

                {btnLabel && <>
                    <div className={`carousel-button ${classNames.btn || ''}`}>
                        {/* The same switch the picture follows — see `Open in a new tab` in the panel.
                            One setting, both links, so the two ways off a slide cannot open differently. */}
                        <SlideLink href={btnLink} linkTarget={image?.linkTarget} isBackEnd={isBackEnd} isSelected={isSelected} dangerouslySetInnerHTML={{ __html: btnLabel }} />
                    </div>
                </>}
            </div>
        </div>

        {/* Last, so the ACF layer paints over the image and caption rather than under them. */}
        <AcfFields post={post} attributes={attributes} classNames={classNames} isBackEnd={isBackEnd} isSelected={isSelected} />
    </div>
}
export default PostItem;
