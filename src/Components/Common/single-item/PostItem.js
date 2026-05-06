import { createElement } from 'react';
import Excerpt from '../Layouts/grid/Excerpt';

const PostItem = (props) => {
    const { attributes, post, index, classNames = {} } = props;
    const { button } = attributes;
    const { text } = button;

    const { thumbnail, title: postTitle, link } = post || {};
    const btnLabel = text;

    return <div className={`item ${index === 0 ? 'active' : ''} ${classNames.item || ''}`}>
        <div className="img">
            {thumbnail?.url && <> <img loading="lazy" data-src={thumbnail.url} className="d-block w-100 lazyload" /></>}
        </div>

        <div className={classNames.contentArea || 'content-area'}>
            <div className={`captionContent ${classNames.captionContent || ''}`}>
                {postTitle && createElement("h5", {
                    className: `bsbTitle ${classNames.title || ''}`, dangerouslySetInnerHTML: { __html: postTitle }
                }, null)}

                <Excerpt attributes={attributes} classNames={classNames} post={post} />

                {btnLabel && <>
                    <div className={`carousel-button ${classNames.btn || ''}`}>
                        <a href={link} rel="noreferrer" dangerouslySetInnerHTML={{ __html: btnLabel }} />
                    </div>
                </>}
            </div>
        </div>
    </div>
}
export default PostItem;