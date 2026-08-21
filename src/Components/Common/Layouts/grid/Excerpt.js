import { strLength, truncate } from '../../../../utils/functions';
import { resolveExcerpt } from '../../single-item/AcfFields';

const Excerpt = ({ post, attributes, classNames }) => {
    const { excerpt, content } = post;

    const { postsQuery } = attributes;
    const { isExcerptFromContent, excerptLength } = postsQuery;
    const finalExcerpt = resolveExcerpt(post, attributes, ((!isExcerptFromContent || attributes.sourceType === 'social') && excerpt) ? excerpt : (content || excerpt));
    const ellipsis = (strLength(finalExcerpt) > excerptLength) ? '...' : '';

    const excerptContent = -1 === excerptLength ? finalExcerpt : `${truncate(finalExcerpt, excerptLength)}${ellipsis}`;
    return finalExcerpt ? <p className={` ${classNames?.desc}`} dangerouslySetInnerHTML={{ __html: excerptContent }} /> : null;
};
export default Excerpt;