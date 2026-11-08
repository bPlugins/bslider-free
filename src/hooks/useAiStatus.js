import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

const NONE = { supported: false, ready: false, allowed: false };

/** One request at a time, shared by every card that asks. */
let asked = null;

/** The last answer, or null while unknown. */
let known = null;

const ask = () => {
	asked = asked || apiFetch({ path: '/bsb/v1/ai/status' })
		.then(res => (known = { supported: !!res?.supported, ready: !!res?.ready, allowed: !!res?.allowed }))
		.catch(() => { asked = null; known = NONE; return NONE; });

	return asked;
};

/** Whether a WordPress AI connector can write slides, as `{ supported, ready, allowed, loading }`. */
const useAiStatus = () => {
	const [status, setStatus] = useState({ ...(known || NONE), loading: !known });

	useEffect(() => {
		let cancelled = false;

		const check = () => ask().then(res => !cancelled && setStatus({ ...res, loading: false }));

		// Back from Settings → Connectors: a connector set up there shows without reloading.
		const onVisible = () => {
			if ('visible' !== document.visibilityState || !known || known.ready) {
				return;
			}

			asked = null;
			known = null;
			check();
		};

		check();
		document.addEventListener('visibilitychange', onVisible);

		return () => {
			cancelled = true;
			document.removeEventListener('visibilitychange', onVisible);
		};
	}, []);

	return status;
};

export default useAiStatus;
