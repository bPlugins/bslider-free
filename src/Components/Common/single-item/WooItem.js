import { createElement } from 'react';
import Excerpt from '../Layouts/grid/Excerpt';
import AcfFields, { resolveSlideImage, resolveButtonLink, resolveButtonText, resolveTitle } from './AcfFields';

const WooItem = (props) => {
    const { attributes, product, index, classNames = {} } = props;
    const { button } = attributes;
    const { thumbnail } = product || {};
    // Older blocks have no `isVisible` key, so only an explicit `false` hides the button.
    const btnLabel = button?.isVisible !== false ? resolveButtonText(product, attributes, button?.text) : '';
    const slideImg = resolveSlideImage(product, attributes, thumbnail);
    const btnLink = resolveButtonLink(product, attributes);
    const wooTitle = resolveTitle(product, attributes);

    return <div className={`item ${index === 0 ? 'active' : ''} ${classNames.item || ''}`}>
        <div className="img">
            {slideImg?.url && <><img src={slideImg?.url} className="d-block w-100" /></>}
        </div>

        <div className={classNames.contentArea || 'content-area'}>
            <div className={`captionContent ${classNames.captionContent || ''}`}>
                {wooTitle && createElement("h5", {
                    className: `bsbTitle ${classNames.title || ''}`, dangerouslySetInnerHTML: { __html: wooTitle }
                }, null)}

                <Excerpt attributes={attributes} post={product} classNames={classNames} />

                {btnLabel && <>
                    <div className={`carousel-button ${classNames.btn || ''}`}>
                        <a href={btnLink} rel="noreferrer" dangerouslySetInnerHTML={{ __html: btnLabel }} />
                    </div>
                </>}
            </div>
        </div>

        {/* Last, so the ACF layer paints over the image and caption rather than under them. */}
        <AcfFields post={product} attributes={attributes} classNames={classNames} />
    </div>
}
export default WooItem;
