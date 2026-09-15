import { useSelect, useDispatch } from '@wordpress/data';

/**
 * The ancestor slider's `lightbox` attribute, reachable from inside a layer.
 *
 * **Why the settings live up there and not on the layer.** A slider opens one lightbox, not one
 * per button — Fancybox is configured once per gallery (`config.js`) and painted once per slider
 * (`paintLightbox`), both of which read `bsb/slider`'s own `lightbox`. Writing these from the
 * layer panel into the layer's own attributes would mean a second read path through save, render
 * and config for values that can only ever have one winner, and two buttons on one slide could
 * then disagree about a backdrop colour that only one of them can have.
 *
 * So the controls move; the storage does not. `Hover & Click` becomes another door into the same
 * attribute the Lightbox panel writes, which is also what lets the panel simply be hidden for
 * `blocks` rather than kept in sync with this.
 *
 * Returns `null` for `sourceType` when there is no slider ancestor — a layer block that somehow
 * renders outside one — so callers can tell "not a blocks slider" from "not in a slider at all".
 */
const useSliderLightbox = (clientId) => {
	const { updateBlockAttributes } = useDispatch('core/block-editor');

	const { sliderId, lightbox, sourceType } = useSelect(select => {
		const { getBlockParentsByBlockName, getBlockAttributes } = select('core/block-editor');
		/* The nearest slider, not the first: `getBlockParentsByBlockName` returns them
		   outermost-first, and a slider nested inside another slider's slide should be the one
		   this layer belongs to. */
		const parents = getBlockParentsByBlockName(clientId, 'bsb/slider');
		const id = parents.length ? parents[parents.length - 1] : null;
		const attrs = id ? getBlockAttributes(id) : null;

		return {
			sliderId: id,
			lightbox: attrs?.lightbox || {},
			sourceType: attrs?.sourceType ?? null,
		};
	}, [clientId]);

	/**
	 * Merges one or more keys into the slider's `lightbox`, leaving the rest alone.
	 *
	 * Spread rather than replace, for the same reason the layer's own `update` merges: each
	 * control here owns one key and knows nothing about the others.
	 */
	const setLightbox = (changes) => {
		if (!sliderId) return;

		updateBlockAttributes(sliderId, { lightbox: { ...lightbox, ...changes } });
	};

	return { lightbox, setLightbox, sourceType, hasSlider: Boolean(sliderId) };
};

export default useSliderLightbox;
