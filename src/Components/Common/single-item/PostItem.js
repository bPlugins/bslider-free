import { createElement } from 'react';
import Excerpt from '../Layouts/grid/Excerpt';
import AcfFields, { resolveSlideImage, resolveButtonLink, resolveButtonText, resolveTitle } from './AcfFields';
import LinkedPicture from './LinkedPicture';

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
     * The anchor goes inside `.img` and not around it — the slide picture is sized by `.item > .img img`,
     * and a wrapper outside would put it beyond that rule's reach.
     */
    const imageHref = btnLink || '';

    return <div className={`item ${index === 0 ? 'active' : ''} ${imageHref ? 'is-linked' : ''} ${classNames.item || ''}`}>
        <div className="img">
            {slideImg?.url && <LinkedPicture
                href={imageHref}
                linkTarget={image?.linkTarget}
                /* The picture here carries no `alt`, so without this the link would have no accessible
                   name — an image inside a link is what names that link, and there is none to read. */
                label={String(postTitle || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || imageHref}
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
                        <a href={btnLink} rel={'_blank' === image?.linkTarget ? 'noopener noreferrer' : 'noreferrer'} target={image?.linkTarget || undefined} dangerouslySetInnerHTML={{ __html: btnLabel }} />
                    </div>
                </>}
            </div>
        </div>

        {/* Last, so the ACF layer paints over the image and caption rather than under them. */}
        <AcfFields post={post} attributes={attributes} classNames={classNames} />
    </div>
}
export default PostItem;
