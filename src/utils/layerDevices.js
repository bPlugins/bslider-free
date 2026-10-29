/** Tablet and Mobile can keep their own place for a layer; a device that sets none takes the one above it. */

export const DEVICES = ['desktop', 'tablet', 'mobile'];

// Kept together per device, so a change on Desktop never changes what another device's X/Y mean.
export const DEVICE_KEYS = ['x', 'y', 'xUnit', 'yUnit', 'anchor', 'area', 'w', 'wUnit', 'h', 'hUnit'];

/** The place a device shows: Desktop's, then Tablet's own values over it, then Mobile's; null is a value cleared there. */
export const placeFor = (position = {}, device = 'desktop') => {
	const place = { ...(position.desktop || {}) };

	DEVICES.slice(1, DEVICES.indexOf(device) + 1).forEach(name => {
		Object.entries(position[name] || {}).forEach(([key, value]) => {
			if (null === value) {
				delete place[key];
			} else {
				place[key] = value;
			}
		});
	});

	return place;
};

export const hasDevicePlaces = (position = {}) => Boolean(position.tablet || position.mobile);

/** A device's place written back: shared values go to Desktop; the device keeps its own only where it differs from the one above. */
export const placeWith = (position = {}, device, next) => {
	if (!device || 'desktop' === device) {
		return { ...position, desktop: next };
	}

	const desktop = { ...(position.desktop || {}) };

	Object.keys({ ...desktop, ...next }).filter(key => !DEVICE_KEYS.includes(key)).forEach(key => {
		if (undefined === next[key]) {
			delete desktop[key];
		} else {
			desktop[key] = next[key];
		}
	});

	const result = { ...position, desktop };
	const above = placeFor({ ...result, [device]: null }, device);

	delete result[device];

	if (DEVICE_KEYS.some(key => above[key] !== next[key])) {
		result[device] = Object.fromEntries(DEVICE_KEYS.map(key => [key, undefined === next[key] ? null : next[key]]));
	}

	return result;
};

/** Without Tablet and Mobile places, for changes whose X/Y those can no longer follow. */
export const withoutDevicePlaces = (position = {}) => {
	const rest = { ...position };

	delete rest.tablet;
	delete rest.mobile;

	return rest;
};
