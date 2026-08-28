import { __, sprintf } from '@wordpress/i18n';
import { useBlockProps, InnerBlocks, InspectorControls } from '@wordpress/block-editor';
import { SelectControl, TabPanel, BorderControl, __experimentalBoxControl as BoxControl } from '@wordpress/components';
import { AccordionGroup, PanelBody } from '../../Components/Panel/AccordionPanel';
import { TipRange, TipToggle } from '../../Components/Panel/TipField';
import { Background, ColorControl } from '../../../../bpl-tools/Components';
import { PremiumBadge, PremiumPanel } from '../../../../bpl-tools/ProControls';
import { adminUrl, DEMO_URL } from '../../utils/functions';
import { proFeatureSentence, PRO_FEATURES } from '../../utils/pro-features';
import { alignBtnOpt, pxUnit, perUnit, tabs } from '../../utils/options';
import VisualTimelinePanel from './Panels/VisualTimelinePanel';
import { slideStyles } from './slideStyles';
import { slideContentClass } from './slideContentClass';
import SlideOverlay from './SlideOverlay';

const Edit = ({ attributes, setAttributes, clientId }) => {
	const { bsbStagger = 0, background = {}, overlay, border = {}, radius = {}, padding = {}, contentAlign, verticalAlign, wordWrap = true } = attributes;

	return <>
		{/* The same two tabs the slider itself carries, and the same one-panel-at-a-time
		    accordion inside them — a slide's settings should not be arranged differently from
		    the settings of the slider around it. */}
		<InspectorControls>
			<TabPanel className="bPlTabPanel bsb-tab-panel" activeClass="activeTab" tabs={tabs}>
				{(tab) => <AccordionGroup key={tab.name}>
					{'General' === tab.name && <>
						{/* Ahead of the stagger control, because it decides what the slide is
						    showing — the timing of how it arrives is the smaller question. */}
						<PanelBody className='bPlPanelBody' title={<>{__('Dynamic Content', 'b-slider')}<PremiumBadge /></>} initialOpen={false}>
							<PremiumPanel
								title={sprintf(__('Premium %s', 'b-slider'), __('Dynamic Content', 'b-slider'))}
								description={proFeatureSentence(PRO_FEATURES.dynamicContent)}
								pricingUrl={adminUrl()}
								demoUrl={DEMO_URL}
							/>
						</PanelBody>

						<PanelBody className='bPlPanelBody' title={<>{__('Lottie Animation', 'b-slider')}<PremiumBadge /></>} initialOpen={false}>
							<PremiumPanel
								title={sprintf(__('Premium %s', 'b-slider'), __('Lottie Animation', 'b-slider'))}
								description={proFeatureSentence(PRO_FEATURES.lottie)}
								pricingUrl={adminUrl()}
								demoUrl={DEMO_URL}
							/>
						</PanelBody>

						<PanelBody className='bPlPanelBody' title={__('Slide', 'b-slider')} initialOpen={false}>
							{/* Lives on the slide rather than on each block inside it, because it
							    is a fact about the sequence, not about any one layer: each layer
							    with an entry animation waits this much longer than the one before
							    it. A layer that sets its own delay keeps it — see playEntry in
							    utils/layerAnimations.js. */}
							<TipRange
								label={__('Stagger layers (seconds)', 'b-slider')}
								value={bsbStagger}
								onChange={val => setAttributes({ bsbStagger: val ?? 0 })}
								min={0}
								max={1}
								step={0.05}
								tip={__('The gap between one layer starting and the next. A layer only moves if it has an Entry animation set.', 'b-slider')}
							/>
						</PanelBody>

						{/* After the stagger control, because it is the picture of what that
						    number does: the bars move as it changes, and a layer given a delay
						    of its own here steps out of that rhythm. */}
						<PanelBody className='bPlPanelBody' title={__('Timeline', 'b-slider')} initialOpen={false}>
							<VisualTimelinePanel clientId={clientId} stagger={bsbStagger} />
						</PanelBody>
					</>}

					{'style' === tab.name && <>
						<PanelBody className='bPlPanelBody' title={__('Background', 'b-slider')} initialOpen={false}>
							<Background
								label={__('Background', 'b-slider')}
								value={background}
								onChange={val => setAttributes({ background: val })}
							/>

							{/* Over the background and under the content, which is what makes white
							    text readable on a photograph — the commonest thing a slide needs,
							    and the one thing a plain background colour cannot do. */}
							<ColorControl
								className='mt20'
								label={__('Overlay', 'b-slider')}
								value={overlay}
								onChange={val => setAttributes({ overlay: val })}
							/>
						</PanelBody>

						<PanelBody className='bPlPanelBody' title={__('Border', 'b-slider')} initialOpen={false}>
							<BorderControl
								label={__('Border', 'b-slider')}
								value={border}
								onChange={val => setAttributes({ border: val })}
								withSlider
							/>

							<BoxControl
								className='mt10'
								label={__('Corner radius', 'b-slider')}
								values={radius}
								onChange={val => setAttributes({ radius: val })}
								units={[pxUnit(), perUnit()]}
							/>
						</PanelBody>

						<PanelBody className='bPlPanelBody' title={__('Spacing & Alignment', 'b-slider')} initialOpen={false}>
							<BoxControl
								label={__('Padding', 'b-slider')}
								values={padding}
								onChange={val => setAttributes({ padding: val })}
								units={[pxUnit(), perUnit()]}
							/>

							<SelectControl
								className='mt20'
								label={__('Align content', 'b-slider')}
								value={contentAlign}
								options={[{ label: __('Default', 'b-slider'), value: '' }, ...alignBtnOpt]}
								onChange={val => setAttributes({ contentAlign: val })}
							/>

							{/* Only has room to do anything on a slider taller than its content,
							    which is the usual case — the height is set on the slider. */}
							<SelectControl
								className='mt20'
								label={__('Vertical position', 'b-slider')}
								value={verticalAlign}
								options={[
									{ label: __('Default', 'b-slider'), value: '' },
									{ label: __('Top', 'b-slider'), value: 'flex-start' },
									{ label: __('Middle', 'b-slider'), value: 'center' },
									{ label: __('Bottom', 'b-slider'), value: 'flex-end' },
								]}
								onChange={val => setAttributes({ verticalAlign: val })}
							/>

							{/* On by default, and left that way in all but one case: a long
							    unbroken string — a URL, a hashtag, a pasted token — has nowhere
							    to go in a fixed-width slide and spills past its edge. Turning it
							    off is for the slide built around a phrase that must stay on one
							    line, a headline or a price, where a break would read as a
							    mistake; the text may then overflow, which is the trade.

							    The tip names the one case it applies to on purpose. Ordinary
							    prose already wraps at its spaces and looks identical either
							    way, so a toggle described only by what it does reads as a
							    toggle that does nothing — the setting is invisible until
							    someone happens to paste a URL into a narrow slide. */}
							<TipToggle
								className='mt20'
								label={__('Wrap long words', 'b-slider')}
								checked={wordWrap}
								onChange={val => setAttributes({ wordWrap: val })}
								tip={__('Breaks a long link or other unspaced text to fit the slide.', 'b-slider')}
							/>
						</PanelBody>
					</>}
				</AccordionGroup>}
			</TabPanel>
		</InspectorControls>

		{/* The same shape `save` writes — same styles, same overlay, same content wrapper — so
		    the canvas shows what the site will draw. */}
		<div {...useBlockProps({
			className: 'carousel-item',
			style: slideStyles(attributes),
			'data-bsb-stagger': bsbStagger || undefined,
		})}>
			<SlideOverlay overlay={overlay} />

			<div className={slideContentClass(attributes)} style={overlay ? { position: 'relative', zIndex: 1 } : undefined}>
				{/*
				  * An empty `InnerBlocks` otherwise draws Gutenberg's own "Type / to choose a
				  * block" line — a paragraph waiting to be typed in, which is the right offer for
				  * a page and the wrong one for a slide: a slide is more often opened with a
				  * heading or a picture, and the line gives no hint that anything else is
				  * available. The `+` opens the picker on the first click instead.
				  */}
				<InnerBlocks renderAppender={InnerBlocks.ButtonBlockAppender} />
			</div>
		</div>
	</>;
};

export default Edit;
