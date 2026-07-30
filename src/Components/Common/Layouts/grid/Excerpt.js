import { strLength, truncate } from '../../../../utils/functions';
import { resolveExcerpt } from '../../single-item/AcfFields';

const Excerpt = ({ post, attributes, classNames }) => {
    const { excerpt, content } = post;

    const { postsQuery } = attributes;
    const { isExcerptFromContent, excerptLength } = postsQuery;
    // An ACF field assigned to the description slot wins over the post's excerpt or content.
    const finalExcerpt = resolveExcerpt(post, attributes, (!isExcerptFromContent && excerpt) ? excerpt : content);
    const ellipsis = (strLength(finalExcerpt) > excerptLength) ? '...' : '';

    const excerptContent = -1 === excerptLength ? finalExcerpt : `${truncate(finalExcerpt, excerptLength)}${ellipsis}`;
    return finalExcerpt ? <p className={` ${classNames?.desc}`} dangerouslySetInnerHTML={{ __html: excerptContent }} /> : null;
};
export default Excerpt;