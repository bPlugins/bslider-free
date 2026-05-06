import { createElement } from 'react';
import Excerpt from '../Layouts/grid/Excerpt';

const WooItem = (props) => {
    const { attributes, product, index, classNames = {} } = props;
    const { button } = attributes;
    const { text } = button;
    const { thumbnail, title: wooTitle, link } = product || {};
    const btnLabel = text;

    return <div className={`item ${index === 0 ? 'active' : ''} ${classNames.item || ''}`}>
        <div className="img">
            {thumbnail?.url && <> <img loading="lazy" data-src={thumbnail?.url} className="d-block w-100 lazyload" /></>}
        </div>

        <div className={classNames.contentArea || 'content-area'}>
            <div className={`captionContent ${classNames.captionContent || ''}`}>
                {wooTitle && createElement("h5", {
                    className: `bsbTitle ${classNames.title || ''}`, dangerouslySetInnerHTML: { __html: wooTitle }
                }, null)}

                <Excerpt attributes={attributes} post={product} classNames={classNames} />

                {btnLabel && <>
                    <div className={`carousel-button ${classNames.btn || ''}`}>
                        <a href={link} rel="noreferrer" dangerouslySetInnerHTML={{ __html: btnLabel }} />
                    </div>
                </>}
            </div>
        </div>
    </div>
}
export default WooItem;