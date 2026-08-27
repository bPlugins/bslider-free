import { __, sprintf } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { PremiumBadge, PremiumPanel } from '../../../../../bpl-tools/ProControls';
import { adminUrl, DEMO_URL } from '../../../utils/functions';
import { proFeatureSentence, PRO_FEATURES } from '../../../utils/pro-features';
import { canCarryLayer, WORD_STAGGER_BLOCKS } from './allowedLayerBlocks';
import EntryExitPanel from '../Panels/EntryExitPanel';
import LoopPanel from '../Panels/LoopPanel';
import InteractivityPanel from '../Panels/InteractivityPanel';

/**
 * The Animation & Interactivity controls, added to any block sitting inside a `bsb/slide`.
 *
 * The attribute itself is on every block of these types (see `layerAttributes.js`) because that
 * filter has no way to know where an instance lives. This one does — it is handed a clientId —
 * so the panel appears only where the settings can actually do something. A Heading in the page
 * body is left exactly as WordPress ships it.
 */
const withLayerControls = createHigherOrderComponent((BlockEdit) => (props) => {
	const { name, clientId, attributes, setAttributes, isSelected } = props;

	const isInsideSlide = useSelect(
		select => canCarryLayer(name)
			&& select('core/block-editor').getBlockParentsByBlockName(clientId, 'bsb/slide').length > 0,
		[name, clientId]
	);

	if (!isInsideSlide) {
		return <BlockEdit {...props} />;
	}

	const layer = attributes.bsbLayer || {};

	/** Merges one section's change into the layer, leaving the other sections alone. */
	const update = (section, changes) => setAttributes({
		bsbLayer: { ...layer, [section]: { ...(layer[section] || {}), ...changes } },
	});

	const panelProps = { layer, update, blockName: name };

	return <>
		<BlockEdit {...props} />

		{/* Only while this block is the selected one: the filter runs for every block in the
		    tree, and an InspectorControls rendered by an unselected block would pile its panels
		    into the sidebar of whichever block the user is actually looking at. */}
		{isSelected && <InspectorControls>
			<PanelBody className='bPlPanelBody' title={__('Animation', 'b-slider')} initialOpen={false}>
				<EntryExitPanel {...panelProps} />
			</PanelBody>

			<PanelBody className='bPlPanelBody' title={__('Loop Animation', 'b-slider')} initialOpen={false}>
				<LoopPanel {...panelProps} />
			</PanelBody>

			{/* Only on the two text blocks whose own content can be split into words — a Word by
			    Word panel on an Image or a Button would be a control with nothing to act on. */}
			{WORD_STAGGER_BLOCKS.includes(name) && <PanelBody className='bPlPanelBody' title={<>{__('Word by Word', 'b-slider')}<PremiumBadge /></>} initialOpen={false}>
				<PremiumPanel
					title={sprintf(__('Premium %s', 'b-slider'), __('Word by Word', 'b-slider'))}
					description={proFeatureSentence(PRO_FEATURES.wordStagger)}
					pricingUrl={adminUrl()}
					demoUrl={DEMO_URL}
				/>
			</PanelBody>}

			<PanelBody className='bPlPanelBody' title={__('Hover & Click', 'b-slider')} initialOpen={false}>
				<InteractivityPanel {...panelProps} />
			</PanelBody>
		</InspectorControls>}
	</>;
}, 'withBsbLayerControls');

addFilter('editor.BlockEdit', 'bsb/layer-controls', withLayerControls);
