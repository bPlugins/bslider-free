import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';

let globalKeyState = {
	hasKey: false,
	masked: '',
	inherited: false,
	canManage: false,
	maxItems: 15,
	loading: true,
	error: '',
	saving: false
};

const keyListeners = new Set();
let isKeyInitialLoadCalled = false;

const updateGlobalKeyState = (nextState) => {
	globalKeyState = { ...globalKeyState, ...nextState };
	keyListeners.forEach(listener => listener(globalKeyState));
};

const applyToGlobal = res => updateGlobalKeyState({
	hasKey: Boolean(res?.hasKey),
	masked: res?.masked || '',
	inherited: Boolean(res?.inherited),
	canManage: Boolean(res?.canManage),
	maxItems: res?.maxItems || 15,
	loading: false,
	saving: false,
	error: ''
});

const triggerKeyLoad = () => {
	updateGlobalKeyState({ loading: true });
	apiFetch({ path: '/bsb/v1/youtube-key' })
		.then(res => {
			applyToGlobal(res);
		})
		.catch(() => {
			updateGlobalKeyState({ loading: false });
		});
};

/**
 * The site's YouTube Data API key, as much of it as the editor is allowed to know.
 *
 * The key itself never comes back — the route answers with whether one is set, its last four
 * characters, and the item ceiling that follows from it. See `SocialFeed::get_key()` for why: the
 * editor runs in every author's browser, and a key is a site-wide credential.
 */
const useYouTubeKey = () => {
	const [state, setState] = useState(globalKeyState);

	useEffect(() => {
		keyListeners.add(setState);
		if (!isKeyInitialLoadCalled) {
			isKeyInitialLoadCalled = true;
			triggerKeyLoad();
		}
		return () => {
			keyListeners.delete(setState);
		};
	}, []);

	/** Store a key, or clear it by saving an empty one. Resolves to whether it went through. */
	const save = key => {
		updateGlobalKeyState({ saving: true, error: '' });

		return apiFetch({ path: '/bsb/v1/youtube-key', method: 'POST', data: { key } })
			.then(res => {
				applyToGlobal(res);
				return true;
			})
			.catch(err => {
				updateGlobalKeyState({
					saving: false,
					error: err?.message || __('The key could not be saved.', 'b-slider')
				});
				return false;
			});
	};

	return { ...state, save };
};

export default useYouTubeKey;
