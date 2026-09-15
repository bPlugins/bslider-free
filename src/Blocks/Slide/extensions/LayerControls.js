import { __, sprintf } from '@wordpress/i18n';
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { InspectorControls } from '@wordpress/block-editor';
import { AccordionGroup, PanelBody } from '../../../Components/Panel/AccordionPanel';
import { PremiumBadge, PremiumPanel } from '../../../../../bpl-tools/ProControls';
import { adminUrl, DEMO_URL } from '../../../utils/functions';
import { proFeatureSentence, PRO_FEATURES } from '../../../utils/pro-features';
import { canCarryCounter, canCarryLayer, canCarryTypography, WORD_STAGGER_BLOCKS } from './allowedLayerBlocks';
import EntryExitPanel from '../Panels/EntryExitPanel';
import LoopPanel from '../Panels/LoopPanel';
import InteractivityPanel from '../Panels/InteractivityPanel';
import LightboxPanel from '../Panels/LightboxPanel';
import TypographyPanel from '../Panels/TypographyPanel';
import ResponsivePanel from '../Panels/ResponsivePanel';
import { TipToggle } from '../../../Components/Panel/TipField';

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

	/* The source of the slider this layer sits in. Only a `blocks` slider is offered the Lightbox
	   panel: every other source keeps those settings in the slider's own sidebar, where the
	   picture being clicked belongs to the slider rather than to one layer. */
	const isBlocksSource = useSelect(select => {
		const { getBlockParentsByBlockName, getBlockAttributes } = select('core/block-editor');
		const parents = getBlockParentsByBlockName(clientId, 'bsb/slider');
		const sliderId = parents.length ? parents[parents.length - 1] : null;

		return sliderId ? 'blocks' === getBlockAttributes(sliderId)?.sourceType : false;
	}, [clientId]);

	/* And only once this layer is actually set to open one. The settings themselves belong to the
	   slider, but the panel is only worth a slot in the sidebar where the author has just asked
	   for a lightbox — on a layer that does nothing on click, it describes something that cannot
	   happen. Read from the layer's own attributes rather than the store, so it appears the moment
	   the dropdown in Hover & Click changes. */
	const opensLightbox = 'lightbox' === attributes?.bsbLayer?.click?.action;

	if (!isInsideSlide) {
		return <BlockEdit {...props} />;
	}

	const layer = attributes.bsbLayer || {};

	/**
	 * Merges one section's change into the layer, leaving the other sections alone.
	 *
	 * `replace` is for the sections owned by a control that hands back its whole value rather
	 * than the one field that changed — `Typography` is the case: merging its object would keep
	 * a font size the user had just cleared, because a cleared field comes back as absent, not
	 * as null.
	 */
	const update = (section, changes, replace = false) => setAttributes({
		bsbLayer: { ...layer, [section]: replace ? changes : { ...(layer[section] || {}), ...changes } },
	});

	/* `clientId` travels with the rest so a panel can reach the blocks around it — `Hover & Click`
	   uses it to find the ancestor slider and write its lightbox settings. */
	const panelProps = { layer, update, blockName: name, clientId };

	return <>
		<BlockEdit {...props} />

		{/* Only while this block is the selected one: the filter runs for every block in the
		    tree, and an InspectorControls rendered by an unselected block would pile its panels
		    into the sidebar of whichever block the user is actually looking at. */}
		{/* The panels are grouped, so opening one closes the last — the same one-at-a-time
		    behaviour the slider's own sidebar has. It needs both halves: this group, and the
		    `PanelBody` imported above from `Components/Panel/AccordionPanel` rather than from
		    `@wordpress/components`. With WordPress's own, each panel keeps its own state and
		    four open panels push the rest of the sidebar out of reach. */}
		{isSelected && <InspectorControls>
			<AccordionGroup>
			{/* Ahead of the animation panels, because a font is a fact about the layer itself
			    and the rest is about how it arrives. Only where there is text to set. */}
			{canCarryTypography(name) && <PanelBody className='bPlPanelBody' title={__('Typography', 'b-slider')} badge={__('New', 'b-slider')} initialOpen={false}>
				<TypographyPanel {...panelProps} />
			</PanelBody>}

			<PanelBody className='bPlPanelBody' title={__('Animation', 'b-slider')} badge={__('New', 'b-slider')} initialOpen={false}>
				<EntryExitPanel {...panelProps} />
			</PanelBody>

			<PanelBody className='bPlPanelBody' title={__('Loop Animation', 'b-slider')} badge={__('New', 'b-slider')} initialOpen={false}>
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

			{/* Premium throughout, like Word by Word above, so it is shown the same way: the panel
			    is here and named, with the upsell inside it rather than a row of dead controls.
			    Only on the blocks whose text is a figure — see `COUNTER_BLOCKS`. */}
			{canCarryCounter(name) && <PanelBody className='bPlPanelBody' title={<>{__('Number Counter', 'b-slider')}<PremiumBadge /></>} initialOpen={false}>
				<PremiumPanel
					title={sprintf(__('Premium %s', 'b-slider'), __('Number Counter', 'b-slider'))}
					description={proFeatureSentence(PRO_FEATURES.numberCounter)}
					pricingUrl={adminUrl()}
					demoUrl={DEMO_URL}
				/>
			</PanelBody>}

			<PanelBody className='bPlPanelBody' title={__('Hover & Click', 'b-slider')} badge={__('New', 'b-slider')} initialOpen={false}>
				<InteractivityPanel {...panelProps} />
			</PanelBody>

			{/* Its own panel rather than a tail on Hover & Click: that panel answers what the layer
			    does, and this one answers how the thing it opens is dressed — long enough on its own
			    that the two read as separate subjects under one title. */}
			{isBlocksSource && opensLightbox && <PanelBody className='bPlPanelBody' title={__('Lightbox', 'b-slider')} badge={__('New', 'b-slider')} initialOpen={false}>
				<LightboxPanel clientId={clientId} />
			</PanelBody>}

			<PanelBody className='bPlPanelBody' title={__('Layout & Sizing', 'b-slider')} badge={__('New', 'b-slider')} initialOpen={false}>
				<TipToggle
					label={__('Fit to Content', 'b-slider')}
					checked={Boolean(layer.fitContent)}
					onChange={val => update('fitContent', val, true)}
					tip={__('Shrinks the block background and container width to hug the inner content instead of stretching full width.', 'b-slider')}
				/>
			</PanelBody>

			{/* Last, because it qualifies everything above it: which screens any of this applies
			    on. Nothing here is per-device *values* — a layer has one delay and one duration
			    wherever it plays — only whether the layer is drawn at all, and whether it moves
			    when it is. */}
			<PanelBody className='bPlPanelBody' title={__('Responsive', 'b-slider')} badge={__('New', 'b-slider')} initialOpen={false}>
				<ResponsivePanel {...panelProps} />
			</PanelBody>
			</AccordionGroup>
		</InspectorControls>}
	</>;
}, 'withBsbLayerControls');

addFilter('editor.BlockEdit', 'bsb/layer-controls', withLayerControls);
