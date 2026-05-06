import { strLength, truncate } from '../../../../utils/functions';

const Excerpt = ({ post, attributes, classNames }) => {
    const { excerpt, content } = post;

    const { postsQuery } = attributes;
    const { isExcerptFromContent, excerptLength } = postsQuery;
    const finalExcerpt = (!isExcerptFromContent && excerpt) ? excerpt : content;
    const ellipsis = (strLength(finalExcerpt) > excerptLength) ? '...' : '';

    const excerptContent = -1 === excerptLength ? finalExcerpt : `${truncate(finalExcerpt, excerptLength)}${ellipsis}`;
    return finalExcerpt ? <p className={` ${classNames?.desc}`} dangerouslySetInnerHTML={{ __html: excerptContent }} /> : null;
};
export default Excerpt;