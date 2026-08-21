import { useState, useEffect, useRef } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
import feedQuery from './feedQuery';

/**
 * How long to sit on a change before asking the server.
 *
 * The address is typed into a text field, so every keystroke would otherwise be a request — and
 * a half-typed handle is a request that goes out to YouTube and comes back "no channel found".
 */
const DEBOUNCE = 700;


/**
 * The editor's preview of an external feed.
 *
 * The front end has PHP fetch and cache the feed before it renders, but the editor has only the
 * attributes — so the same reader is reached through `/bsb/v1/social-feed`, which answers with the
 * items in exactly the shape `Posts::arrangedPosts()` returns. That is why the preview can be
 * handed straight to the layouts as `firstPosts`.
 *
 * `items` starts as `null` rather than `[]`, which is what `Layout` reads as "still loading" — an
 * empty array there means the feed answered and had nothing.
 */
const useSocialFeed = (attributes) => {
	const { sourceType } = attributes || {};
	const isSocial = 'social' === sourceType;

	const query = feedQuery(attributes);
	// A string, so the effect re-runs when a value inside changes rather than whenever
	// `setAttributes` hands back a new object with the same contents.
	const key = JSON.stringify(query);
	/** Whether there is an address to ask about at all — a typed one, or a saved channel holding one. */
	const hasQuery = isSocial && !!(query.source || query.channelId);

	/**
	 * Which query the state in hand belongs to.
	 *
	 * `loading` alone could not be trusted for the moment that matters most. It is raised inside the
	 * effect, which runs *after* the browser has painted — so the render between choosing a channel
	 * and the effect firing had the new address, the old empty `items`, and `loading` still false.
	 * `Layout` read that as "the feed answered and had nothing" and drew the warn card saying so, for
	 * that frame and then for the whole 700ms debounce underneath it.
	 *
	 * Holding the key the state was fetched for turns the question around: the state is stale the
	 * instant the query changes, which is knowable during the render itself rather than one paint
	 * later. The initial value is deliberately not `key` — a social slider is loading from its first
	 * render, before any effect has run.
	 */
	/*
	 * `items` starts as `null` only where something is actually being fetched. A feed slider that has
	 * no address yet is not waiting on anything, and starting it at `null` meant `Layout` drew its
	 * "Loading…" line for the one frame before the effect could say so — which is the flash somebody
	 * sees on arriving at the address step, before the form itself has even settled.
	 */
	const [state, setState] = useState({ items: hasQuery ? null : [], error: '', loading: false, media: null, profile: null, key: isSocial ? null : key });
	const [attempt, setAttempt] = useState(0);
	// Set by `refresh()` and read once: a refresh skips the debounce and tells the server to drop
	// its cached copy, which a re-render caused by anything else must not do.
	const isForced = useRef(false);

	useEffect(() => {
		if (!isSocial) {
			setState({ items: [], error: '', loading: false, media: null, profile: null, key });
			return;
		}

		const query = JSON.parse(key);

		// Nothing to ask for yet. Answering with an empty set rather than an error keeps the
		// wizard's freshly chosen feed looking unconfigured instead of broken. A named channel counts
		// as something to ask for — its address lives on the channel, not here.
		if (!query.source && !query.channelId) {
			setState({ items: [], error: '', loading: false, media: null, profile: null, key });
			return;
		}

		const forced = isForced.current;
		isForced.current = false;

		let cancelled = false;
		setState(prev => ({ ...prev, loading: true }));

		const timer = setTimeout(() => {
			apiFetch({ path: addQueryArgs('/bsb/v1/social-feed', forced ? { ...query, refresh: 1 } : query) })
				.then(res => {
					if (!cancelled) {
						setState({
							items: res?.items || [],
							error: res?.error || '',
							loading: false,
							// How many of this set's pictures are already in the Media Library.
							media: res?.media || null,
							// The account behind the feed, so the canvas draws the same header the
							// front end will — see `SocialFeed::profileFor()`.
							profile: res?.profile || null,
							key
						});
					}
				})
				.catch(err => {
					if (!cancelled) {
						setState({
							items: [],
							error: err?.message || __('The feed could not be loaded.', 'b-slider'),
							loading: false,
							media: null,
							profile: null,
							key
						});
					}
				});
		}, forced ? 0 : DEBOUNCE);

		return () => {
			cancelled = true;
			clearTimeout(timer);
		};
	}, [isSocial, key, attempt]);

	return {
		...state,
		/**
		 * Whether an answer for the query as it stands now is on its way.
		 *
		 * Either the request is out, or the query has changed since the state in hand was fetched and
		 * the effect has not caught up yet — see the note on `key`. Both mean the same thing to
		 * anything drawing a placeholder: what is on screen does not describe the current address.
		 *
		 * `hasQuery` guards it, because a slider with no address yet is not waiting on anything — its
		 * key never matches either, and without this a fresh feed slider would open on a skeleton
		 * instead of on the form asking which channel to read.
		 */
		loading: state.loading || (hasQuery && state.key !== key),
		/** Fetch again, past both the debounce and the server's cached copy. */
		refresh: () => {
			isForced.current = true;
			setAttempt(n => n + 1);
		}
	};
};

export default useSocialFeed;
