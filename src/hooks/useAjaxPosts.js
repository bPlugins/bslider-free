import { useState, useEffect } from 'react';

import useWPajax from '../../../bpl-tools/hooks/useWPAjax';

const useAjaxPosts = (nonce, attributes, pageNumber) => {
    const { postsQuery } = attributes;

    const { post_type, selectedTaxonomies = {}, selectedCategories, selectedTags, per_page, orderby, order, offset, include, exclude, isExcludeCurrent, isExcerptFromContent, excerptLength } = postsQuery;

    const queryAttr = { post_type, selectedTaxonomies, selectedCategories, selectedTags, per_page, orderby, order, offset, include, exclude, isExcludeCurrent, isExcerptFromContent, excerptLength };

    const { data = null, refetch, isLoading } = useWPajax('bsbPosts', { _wpnonce: nonce, queryAttr, pageNumber });
    const [posts, setPosts] = useState([]);
    console
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