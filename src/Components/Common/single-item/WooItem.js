import { createElement } from 'react';
import Excerpt from '../Layouts/grid/Excerpt';
import AcfFields, { resolveSlideImage, resolveButtonLink, resolveButtonText, resolveTitle } from './AcfFields';
import LinkedPicture from './LinkedPicture';

const WooItem = (props) => {
    const { attributes, product, index, isBackEnd = false, isSelected = false, classNames = {} } = props;
    const { title, desc, button, image } = attributes;
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
    const imageHref = btnLink || '';
    const accessibleLabel = String(wooTitle || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || imageHref;

    return <div className={`item ${index === 0 ? 'active' : ''} ${imageHref ? 'is-linked' : ''} ${classNames.item || ''}`}>
        {imageHref && !slideImg?.url && <a
            className='bsbSlideOverlay'
            href={imageHref}
            target={image?.linkTarget || undefined}
            rel={'_blank' === image?.linkTarget ? 'noopener noreferrer' : undefined}
            aria-hidden='true'
            tabIndex='-1'
        />}
        <div className="img">
            {slideImg?.url && <LinkedPicture
                href={imageHref}
                linkTarget={image?.linkTarget}
                /* The picture carries no `alt`, so without this the link would have no accessible name. */
                label={accessibleLabel}
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
                        <a href={btnLink} rel={'_blank' === image?.linkTarget ? 'noopener noreferrer' : 'noreferrer'} target={image?.linkTarget || undefined} dangerouslySetInnerHTML={{ __html: btnLabel }} />
                    </div>
                </>}
            </div>
        </div>

        {/* Last, so the ACF layer paints over the image and caption rather than under them. */}
        <AcfFields post={product} attributes={attributes} classNames={classNames} />
    </div>
}
export default WooItem;
