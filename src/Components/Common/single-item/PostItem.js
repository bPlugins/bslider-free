import { createElement } from 'react';
import Excerpt from '../Layouts/grid/Excerpt';
import AcfFields, { resolveSlideImage, resolveButtonLink, resolveButtonText, resolveTitle } from './AcfFields';

const PostItem = (props) => {
    const { attributes, post, index, classNames = {} } = props;
    const { button } = attributes;

    const { thumbnail } = post || {};
    // Older blocks have no `isVisible` key, so only an explicit `false` hides the button.
    const btnLabel = button?.isVisible !== false ? resolveButtonText(post, attributes, button?.text) : '';
    const slideImg = resolveSlideImage(post, attributes, thumbnail);
    const btnLink = resolveButtonLink(post, attributes);
    const postTitle = resolveTitle(post, attributes);

    return <div className={`item ${index === 0 ? 'active' : ''} ${classNames.item || ''}`}>
        <div className="img">
            {slideImg?.url && <img src={slideImg.url} className="d-block w-100" />}
        </div>

        <div className={classNames.contentArea || 'content-area'}>
            <div className={`captionContent ${classNames.captionContent || ''}`}>
                {postTitle && createElement("h5", {
                    className: `bsbTitle ${classNames.title || ''}`, dangerouslySetInnerHTML: { __html: postTitle }
                }, null)}

                <Excerpt attributes={attributes} classNames={classNames} post={post} />

                {btnLabel && <>
                    <div className={`carousel-button ${classNames.btn || ''}`}>
                        <a href={btnLink} rel="noreferrer" dangerouslySetInnerHTML={{ __html: btnLabel }} />
                    </div>
                </>}
            </div>
        </div>

        {/* Last, so the ACF layer paints over the image and caption rather than under them. */}
        <AcfFields post={post} attributes={attributes} classNames={classNames} />
    </div>
}
export default PostItem;
