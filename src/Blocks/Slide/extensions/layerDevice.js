import { select as selectStore, useSelect } from '@wordpress/data';
import { placeFor } from '../../../utils/layerDevices';

const deviceIn = (select) => (select('core/editor')?.getDeviceType?.() || select('core/edit-post')?.__experimentalGetPreviewDeviceType?.() || 'Desktop').toLowerCase();

/** The editor's preview device: the one whose layer places the canvas shows and the controls change. */
export const useLayerDevice = () => useSelect(deviceIn, []);

export const layerDeviceNow = () => deviceIn(selectStore);

/** The layer as that device shows it, its place in `position.desktop`, so every control reads one shape. */
export const layerOn = (layer, device) => (layer?.position && 'desktop' !== device
	? { ...layer, position: { ...layer.position, desktop: placeFor(layer.position, device) } }
	: layer);
