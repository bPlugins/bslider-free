import { createElement } from 'react';
import Excerpt from '../Layouts/grid/Excerpt';
import AcfFields, { resolveSlideImage, resolveButtonLink, resolveButtonText, resolveTitle } from './AcfFields';
import LinkedPicture from './LinkedPicture';
import SlideLink from './SlideLink';
import { lightboxCaption } from '../../../utils/functions';

const WooItem = (props) => {
    const { attributes, product, index, clientId, isBackEnd = false, isSelected = false, classNames = {} } = props;
    const { title, desc, button, image, lightbox } = attributes;
    const { thumbnail } = product || {};
    // Older blocks have no `isVisible` key, so only an explicit `false` hides any of the three.
    const btnLabel = button?.isVisible !== false ? resolveButtonText(product, attributes, button?.text) : '';
    const showTitle = title?.isVisible !== false;
    const showDesc = desc?.isVisible !== false;
    const slideImg = resolveSlideImage(product, attributes, thumbnail);
    const btnLink = resolveButtonLink(product, attributes);
    const wooTitle = resolveTitle(product, attributes);

    /**
     * The whole picture as the link to the product — the same answer `PostItem` gives, for the same
     * reason: with the button hidden a product slide had nothing on it a click could reach. `btnLink`
     * rather than the product URL directly, so the picture and the button cannot lead to two places.
     *
     * When there is no image the picture anchor has zero height, so a full-slide overlay anchor
     * covers the item instead — see the same pattern in `PostItem`.
     */
    /**
     * Which of the two the picture's click is for — the product, or the picture itself.
     *
     * `lightbox` is the one value the removed `Clicking the picture` dropdown never wrote, so anything
     * else — a saved `none`, a saved `button`, or nothing at all — is the link, which is what every
     * product slider did before this setting came back. See `DefaultGeneral`, where the choice is offered.
     *
     * The lightbox needs the picture's own file, and a product image is already the full one:
     * `Posts.php` asks `get_the_post_thumbnail_url` for `fImgSize`, which is `full` and has no control
     * offering anything else.
     */
    const isLightbox = 'lightbox' === image?.link && !!slideImg?.url;

    /* The caption inside the lightbox. `wooTitle` is the title the slide already shows, so the two
       cannot disagree. A product has no custom caption field of its own — that mode yields nothing.

       `custom` has no per-slide field on a product slide — see the note in `PostItem`. */
    const captionMode = 'custom' === lightbox?.caption ? 'title' : lightbox?.caption;

    const accessibleLabel = String(wooTitle || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    const lbCaption = isLightbox
        ? lightboxCaption(captionMode, {
            imageCaption: slideImg?.alt || '',
            title: accessibleLabel
        })
        : '';

    const imageHref = isLightbox ? slideImg.url : (btnLink || '');

    return <div className={`item ${index === 0 ? 'active' : ''} ${imageHref ? 'is-linked' : ''} ${classNames.item || ''}`}>
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
                /* The picture carries no `alt`, so without this the link would have no accessible name. */
                label={accessibleLabel || imageHref}
                lightbox={isLightbox}
                caption={lbCaption}
                clientId={clientId}
                attributes={attributes}
                isBackEnd={isBackEnd}
                isSelected={isSelected}
            >
                <img src={slideImg?.url} className="d-block w-100" />
            </LinkedPicture>}
        </div>

        <div className={classNames.contentArea || 'content-area'}>
            <div className={`captionContent ${classNames.captionContent || ''}`}>
                {showTitle && wooTitle && createElement("h5", {
                    className: `bsbTitle ${classNames.title || ''}`, dangerouslySetInnerHTML: { __html: wooTitle }
                }, null)}

                {showDesc && <Excerpt attributes={attributes} post={product} classNames={classNames} />}

                {btnLabel && <>
                    <div className={`carousel-button ${classNames.btn || ''}`}>
                        {/* The same switch the picture follows — see `Open in a new tab` in the panel. */}
                        <SlideLink href={btnLink} linkTarget={image?.linkTarget} isBackEnd={isBackEnd} isSelected={isSelected} dangerouslySetInnerHTML={{ __html: btnLabel }} />
                    </div>
                </>}
            </div>
        </div>

        {/* Last, so the ACF layer paints over the image and caption rather than under them. */}
        <AcfFields post={product} attributes={attributes} classNames={classNames} isBackEnd={isBackEnd} isSelected={isSelected} />
    </div>
}
export default WooItem;
