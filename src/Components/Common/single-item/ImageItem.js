import { createElement } from 'react';

const ImageItem = (props) => {

    const { attributes, slide, index, classNames = {} } = props;
    const { titleFCaption } = attributes;


    const { img, title: slideTitle, desc, altText } = slide || {};
    const titleCheck = titleFCaption ?
        (img?.caption || img?.title) :
        ((slideTitle !== null || slideTitle !== undefined) ?
            slideTitle :
            img?.caption || img?.title);
    // const titleCheck = titleFCaption ? img?.caption || img?.title : slideTitle;
    // console.log({ titleFCaption, img, titleCheck });

    return <div className={`item ${index === 0 ? 'active' : ''} ${classNames.item || ''}`}>
        <div className="img">
            {img?.url && <> <img loading="lazy" data-src={img.url} className="d-block w-100 lazyload" alt={altText || img?.alt || img?.title} /></>}
        </div>

        <div className={classNames.contentArea || 'content-area'}>
            <div className={`captionContent ${classNames.captionContent || ''}`}>
                {(slideTitle || img?.caption || img?.title) && createElement('h5', {
                    className: `bsbTitle ${classNames.title || ''}`, dangerouslySetInnerHTML: { __html: titleCheck }
                }, null)}

                {desc && <>
                    <p className={classNames.desc || ''} dangerouslySetInnerHTML={{ __html: desc }} />
                </>}
            </div>
        </div>
    </div>
}
export default ImageItem;