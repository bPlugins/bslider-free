import { useState, useEffect } from 'react';

import useWPajax from '../../../bpl-tools/hooks/useWPAjax';

const useAjaxPosts = (nonce, attributes, pageNumber) => {
    const { postsQuery } = attributes;

    const { post_type, selectedTaxonomies = {}, selectedCategories, selectedTags, per_page, orderby, order, offset, include, exclude, isExcludeCurrent, isExcerptFromContent, excerptLength } = postsQuery;

    // Spread first, so the ACF picker and slot keys reach Posts::acfFieldsToFetch without this list
    // having to name each of them, while the destructured defaults above still win.
    const queryAttr = { ...postsQuery, post_type, selectedTaxonomies, selectedCategories, selectedTags, per_page, orderby, order, offset, include, exclude, isExcludeCurrent, isExcerptFromContent, excerptLength };

    const { data = null, refetch, isLoading } = useWPajax('bsbPosts', { _wpnonce: nonce, queryAttr, pageNumber });
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        if (pageNumber) {
            refetch({ pageNumber });
        }
    }, [pageNumber]);

    useEffect(() => {
        if (data) {
            setPosts(data);
        }
    }, [data]);

    return { posts, isLoading };
};
export default useAjaxPosts;