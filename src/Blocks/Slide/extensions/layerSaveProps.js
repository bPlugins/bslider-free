import { __ } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { buildLayerProps, isEmptyLayer } from './layerProps';
import { canCarryLayer } from './allowedLayerBlocks';
import { useLayerHidden } from './hiddenLayers';
import { useLayerPicked } from './pickedLayers';
import { useLayerDevice } from './layerDevice';

/** Must be deterministic (attributes in, props out) or block validation fails on reload. */
addFilter('blocks.getSaveContent.extraProps', 'bsb/layer-save-props', (props, blockType, attributes) => {
	if (!canCarryLayer(blockType.name) || isEmptyLayer(attributes?.bsbLayer)) {
		return props;
	}

	const { className, style, dataAttrs } = buildLayerProps(attributes.bsbLayer, { legacyLightbox: Boolean(blockType.save?.bsbLegacyLightbox), imageUrl: 'core/image' === blockType.name ? attributes.url : '' });

	return {
		...props,
		...dataAttrs,
		className: [props.className, className].filter(Boolean).join(' '),
		style: { ...props.style, ...style },
	};
});

/** Older free releases saved lightbox layers with no lightbox data; this version accepts them, and the next save adds it. */
addFilter('blocks.registerBlockType', 'bsb/layer-legacy-lightbox', (settings, name) => {
	if (!canCarryLayer(name) || !settings.save) {
		return settings;
	}

	// Core's own save; the flag rides on `save` because Gutenberg drops other keys from a deprecation.
	const save = (props) => settings.save(props);
	save.bsbLegacyLightbox = true;

	const legacy = { attributes: settings.attributes, supports: settings.supports, save };

	return { ...settings, deprecated: [...(settings.deprecated || []), legacy] };
}, 20);

/** Same buildLayerProps on the editor wrapper so the canvas matches the site. */
addFilter('editor.BlockListBlock', 'bsb/layer-editor-props', createHigherOrderComponent((BlockListBlock) => (props) => {
	// Before the early return: a hook has to run on every render.
	const hiddenOnCanvas = useLayerHidden(props.clientId);
	const picked = useLayerPicked(props.clientId);
	const device = useLayerDevice();

	if (!canCarryLayer(props.name) || isEmptyLayer(props.attributes?.bsbLayer)) {
		return <BlockListBlock {...props} />;
	}

	const { className, style, dataAttrs } = buildLayerProps(props.attributes.bsbLayer, { live: true, device, imageUrl: 'core/image' === props.name ? props.attributes.url : '' });

	/* Editor-only label of hidden devices, read by editor.scss; must never reach post_content. */
	const hiddenOn = Object.entries(props.attributes.bsbLayer?.visibility?.hideOn || {})
		.filter(([, isHidden]) => isHidden)
		.map(([name]) => name.charAt(0).toUpperCase() + name.slice(1));

	return <BlockListBlock
		{...props}
		className={[props.className, className, hiddenOnCanvas && 'bsb-editor-hidden', picked && 'bsb-layer-picked'].filter(Boolean).join(' ')}
		wrapperProps={{
			...props.wrapperProps,
			...dataAttrs,
			...(hiddenOn.length ? { 'data-bsb-hidden-on': `${__('Hidden on', 'b-slider')} ${hiddenOn.join(', ')}` } : {}),
			...(props.attributes.bsbLayer?.position?.static ? { 'data-bsb-static-label': __('All slides', 'b-slider') } : {}),
			style: { ...props.wrapperProps?.style, ...style },
		}}
	/>;
}, 'withBsbLayerProps'));
