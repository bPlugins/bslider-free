import { __ } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { buildLayerProps, isEmptyLayer } from './layerProps';
import { canCarryLayer } from './allowedLayerBlocks';

/**
 * What a layer's settings add to the block's saved markup.
 *
 * Runs again on every page load as part of block validation, so it must return the same thing
 * every time for the same attributes or the block is marked invalid — hence no store reads, no
 * timestamps, nothing but `attributes` in and props out.
 */
addFilter('blocks.getSaveContent.extraProps', 'bsb/layer-save-props', (props, blockType, attributes) => {
	if (!canCarryLayer(blockType.name) || isEmptyLayer(attributes?.bsbLayer)) {
		return props;
	}

	const { className, style, dataAttrs } = buildLayerProps(attributes.bsbLayer);

	return {
		...props,
		...dataAttrs,
		className: [props.className, className].filter(Boolean).join(' '),
		style: { ...props.style, ...style },
	};
});

/**
 * The same props on the editor's own wrapper, so the canvas shows what the site will.
 *
 * Deliberately the same `buildLayerProps` call as above — two descriptions of one layer would
 * eventually disagree, and the disagreement would only show up after publishing.
 */
addFilter('editor.BlockListBlock', 'bsb/layer-editor-props', createHigherOrderComponent((BlockListBlock) => (props) => {
	if (!canCarryLayer(props.name) || isEmptyLayer(props.attributes?.bsbLayer)) {
		return <BlockListBlock {...props} />;
	}

	const { className, style, dataAttrs } = buildLayerProps(props.attributes.bsbLayer);

	/*
	 * The canvas-only label naming the devices this layer is hidden on.
	 *
	 * Editor-side and nowhere else: `editor.scss` shows it through `content: attr(...)`, because
	 * CSS cannot build one string out of several matched classes. It is not added in
	 * `buildLayerProps` on purpose — that function's output is what gets written into
	 * post_content, and a label meant for the author has no business on the published page.
	 */
	const hiddenOn = Object.entries(props.attributes.bsbLayer?.visibility?.hideOn || {})
		.filter(([, isHidden]) => isHidden)
		.map(([device]) => device.charAt(0).toUpperCase() + device.slice(1));

	return <BlockListBlock
		{...props}
		className={[props.className, className].filter(Boolean).join(' ')}
		wrapperProps={{
			...props.wrapperProps,
			...dataAttrs,
			...(hiddenOn.length ? { 'data-bsb-hidden-on': `${__('Hidden on', 'b-slider')} ${hiddenOn.join(', ')}` } : {}),
			style: { ...props.wrapperProps?.style, ...style },
		}}
	/>;
}, 'withBsbLayerProps'));
