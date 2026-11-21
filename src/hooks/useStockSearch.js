import { useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

const OPENVERSE = 'https://api.openverse.org/v1/images/';

// Same filters as the core Openverse inserter: public domain only, no mature results.
const OPENVERSE_QUERY = {
	mature: 'false',
	excluded_source: 'flickr,inaturalist,wikimedia',
	license: 'pdm,cc0',
	page_size: '20',
};

const fetchOpenverse = async (q, page) => {
	const url = new URL(OPENVERSE);
	Object.entries({ ...OPENVERSE_QUERY, q, page: String(page) }).forEach(([key, value]) => url.searchParams.set(key, value));

	const res = await window.fetch(url);
	if (!res.ok) {
		throw new Error(String(res.status));
	}
	const json = await res.json();

	return {
		pageCount: json?.page_count || 0,
		results: (json?.results || []).filter(r => r?.id && r?.thumbnail).map(r => ({
			id: r.id,
			thumbnail: r.thumbnail,
			title: r.title || '',
			creator: r.creator || '',
			creatorUrl: r.creator_url || '',
		})),
	};
};

const fetchProxied = (source, q, page) => apiFetch({ path: addQueryArgs('/bsb/v1/stock/search', { source, q, page }) });

const useStockSearch = () => {
	const [items, setItems] = useState([]);
	const [page, setPage] = useState(0);
	const [pageCount, setPageCount] = useState(0);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [term, setTerm] = useState('');
	const [source, setSource] = useState('openverse');
	const latest = useRef(0);

	const fetchPage = async (q, nextPage, from) => {
		const request = ++latest.current;
		setLoading(true);
		setError('');

		try {
			const json = 'openverse' === from ? await fetchOpenverse(q, nextPage) : await fetchProxied(from, q, nextPage);

			if (request !== latest.current) {
				return;
			}

			const results = json?.results || [];
			setItems(prev => 1 === nextPage ? results : [...prev, ...results]);
			setPage(nextPage);
			setPageCount(json?.pageCount || 0);
		} catch (e) {
			if (request === latest.current) {
				setItems(prev => 1 === nextPage ? [] : prev);
				setError(e?.message || __('Could not reach the photo service. Check your connection and try again.', 'b-slider'));
			}
		} finally {
			if (request === latest.current) {
				setLoading(false);
			}
		}
	};

	const search = (q, from = source) => {
		const clean = String(q || '').trim();
		setTerm(clean);
		setSource(from);

		if (!clean) {
			latest.current++;
			setItems([]);
			setPage(0);
			setPageCount(0);
			setLoading(false);
			setError('');
			return;
		}

		fetchPage(clean, 1, from);
	};

	const loadMore = () => {
		if (!loading && term && page < pageCount) {
			fetchPage(term, page + 1, source);
		}
	};

	return { items, loading, error, term, source, search, loadMore, hasMore: page < pageCount };
};

export default useStockSearch;
