import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';

/**
 * The account, channel or publication behind a feed, when asked for.
 *
 * On demand rather than on mount: the Profile Header is filled in once and then edited by hand, so
 * fetching it every time the panel opens would spend a request to overwrite nothing — and would
 * quietly undo whatever the user had typed over it. The card itself needs none of this; it already
 * follows the account through the feed request — see `SocialFeed::profileFor()`.
 *
 * A saved channel is named by its id alone and the address is looked up on the other side, which for
 * Instagram is the only side that has it — the token is not passed in and never comes back. A slider
 * carrying a plain address sends that instead, since it is the same address the feed is read from.
 */
const useFeedProfile = () => {
	const [state, setState] = useState({ loading: false, error: '' });

	/** Resolves to the profile, or to `null` with the reason left on `error`. */
	const fetch = ({ channelId = '', feedType = '', source = '' } = {}) => {
		if (!channelId && !source) {
			setState({ loading: false, error: __('Pick a saved account, or paste the feed address first.', 'b-slider') });

			return Promise.resolve(null);
		}

		setState({ loading: true, error: '' });

		return apiFetch({ path: addQueryArgs('/bsb/v1/feed-profile', { channelId, feedType, source }) })
			.then(res => {
				// A reachable route that could not reach the service answers with the reason on a 200
				// — an expired token, or a missing API key, is an ordinary thing to be told rather
				// than a broken request.
				if (res?.error || !res?.profile) {
					setState({ loading: false, error: res?.error || __('The service sent nothing back.', 'b-slider') });

					return null;
				}

				setState({ loading: false, error: '' });

				return res.profile;
			})
			.catch(err => {
				setState({ loading: false, error: err?.message || __('The account could not be read.', 'b-slider') });

				return null;
			});
	};

	return { ...state, fetch };
};

export default useFeedProfile;
