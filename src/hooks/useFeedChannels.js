import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

let globalState = {
	channels: [],
	instagram: {},
	loading: true,
	saving: false,
	error: ''
};

const listeners = new Set();
let isInitialLoadCalled = false;

const updateGlobalState = (nextState) => {
	globalState = { ...globalState, ...nextState };
	listeners.forEach(listener => listener(globalState));
};

const triggerLoad = () => {
	updateGlobalState({ loading: true, error: '' });
	apiFetch({ path: '/bsb/v1/feed-channels' })
		.then(res => {
			updateGlobalState({
				channels: res?.channels || [],
				instagram: res?.instagram || {},
				loading: false,
				error: ''
			});
		})
		.catch(err => {
			updateGlobalState({
				loading: false,
				error: err?.message || __('The saved channels could not be loaded.', 'b-slider')
			});
		});
};

/**
 * The site's saved feeds.
 *
 * One hook for both places the library is used — the block's picker and the dashboard's management
 * screen — so adding a channel in either shows up in the other on its next read, and neither holds a
 * copy of the list that can drift from the option.
 */
const useFeedChannels = () => {
	const [state, setState] = useState(globalState);

	useEffect(() => {
		listeners.add(setState);
		if (!isInitialLoadCalled) {
			isInitialLoadCalled = true;
			triggerLoad();
		}
		return () => {
			listeners.delete(setState);
		};
	}, []);

	/**
	 * Add a channel, or update the one whose `id` is given.
	 *
	 * Resolves to the saved channel so a caller can point a slider at it straight away — which is
	 * what the block's "add" does, and why this returns the entry rather than just reloading.
	 */
	const save = channel => {
		updateGlobalState({ saving: true, error: '' });

		return apiFetch({ path: '/bsb/v1/feed-channels', method: 'POST', data: channel })
			.then(res => {
				updateGlobalState({ channels: res?.channels || [], saving: false, error: '' });

				return res?.saved || null;
			})
			.catch(err => {
				updateGlobalState({
					saving: false,
					error: err?.message || __('That channel could not be saved.', 'b-slider')
				});

				return null;
			});
	};

	const remove = id => {
		updateGlobalState({ saving: true, error: '' });

		return apiFetch({ path: '/bsb/v1/feed-channels', method: 'DELETE', data: { id } })
			.then(res => {
				updateGlobalState({ channels: res?.channels || [], saving: false, error: '' });

				return true;
			})
			.catch(err => {
				updateGlobalState({
					saving: false,
					error: err?.message || __('That channel could not be removed.', 'b-slider')
				});

				return false;
			});
	};

	return { ...state, reload: triggerLoad, save, remove };
};

export default useFeedChannels;
