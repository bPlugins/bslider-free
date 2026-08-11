import { createElement } from 'react';

const ImageItem = (props) => {

    const { attributes, slide, index, classNames = {} } = props;
    const { titleFCaption, title, desc: descOptions } = attributes;

    // The same two switches the post source reads, so "hide the captions" means the same thing whatever
    // a slider is built from. Only an explicit `false` hides anything: a slider saved before these keys
    // existed has neither of them, and a missing key has to keep meaning "shown".
    const showTitle = title?.isVisible !== false;
    const showDesc = descOptions?.isVisible !== false;

    const { img, title: slideTitle, desc, altText } = slide || {};

    const titleCheck = titleFCaption ?
        (img?.caption || img?.title) :
        ((slideTitle !== null && slideTitle !== undefined) ?
            slideTitle :
            img?.caption || img?.title);

    return <div className={`item ${index === 0 ? 'active' : ''} ${classNames.item || ''}`}>
        <div className="img">
            {img?.url && <img src={img.url} className="d-block w-100" alt={altText || img?.alt || img?.title} />}
        </div>

        <div className={classNames.contentArea || 'content-area'}>
            <div className={`captionContent ${classNames.captionContent || ''}`}>
                {showTitle && (slideTitle || img?.caption || img?.title) && createElement('h5', {
                    className: `bsbTitle ${classNames.title || ''}`, dangerouslySetInnerHTML: { __html: titleCheck }
                }, null)}

                {showDesc && desc && <>
                    <p className={classNames.desc || ''} dangerouslySetInnerHTML={{ __html: desc }} />
                </>}
            </div>
        </div>
    </div>
}
export default ImageItem;