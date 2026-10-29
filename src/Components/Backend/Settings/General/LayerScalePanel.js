import { __ } from '@wordpress/i18n';
import { Button, __experimentalNumberControl as NumberControl, __experimentalInputControlSuffixWrapper as SuffixWrapper } from '@wordpress/components';
import { PanelBody } from '../../../Panel/AccordionPanel';
import { TipToggle } from '../../../Panel/TipField';
import HelpTip from '../../../Panel/HelpTip';
import Label from '../../../../../../bpl-tools/Components/Label/Label';
import { findBlockElement } from '../../../../Blocks/Slide/extensions/layerGeometry';
import { useLayerDevice } from '../../../../Blocks/Slide/extensions/layerDevice';
import ProNotice from '../../../Panel/ProNotice';
import { PRO_FEATURES } from '../../../../utils/pro-features';

/** Blocks source: the slides' layers shrink together on screens narrower than the one they were placed on. */
const LayerScalePanel = ({ attributes, setAttributes, clientId }) => {
	const { layerScale = {} } = attributes;
	const device = useLayerDevice();
	const onDesktop = 'desktop' === device;

	// The slide content's width on the canvas now, which is what the layers were placed against.
	const measure = () => {
		const content = [...(findBlockElement(clientId)?.querySelectorAll('.carousel-item .bsb-slide-content') || [])].find(el => el.offsetWidth);

		return content ? Math.round(content.offsetWidth) : undefined;
	};

	// Off removes it, so the slider saves exactly what it did before.
	const setOn = (on) => setAttributes({ layerScale: on ? { on: true, width: layerScale.width || measure() } : {} });

	return <PanelBody className='bPlPanelBody' title={__('Layers', 'b-slider')} badge={__('New', 'b-slider')} initialOpen={false}>
		<TipToggle
			label={__('Auto-scale layers', 'b-slider')}
			checked={Boolean(layerScale.on)}
			disabled={!layerScale.on && !onDesktop}
			onChange={setOn}
			tip={onDesktop || layerScale.on
				? __('On screens narrower than the design width, all absolute layers shrink together, keeping their places and sizes in step. They never grow.', 'b-slider')
				: __('Turn this on in the Desktop view, so the design width is the width you placed the layers at.', 'b-slider')}
		/>

		{layerScale.on && <div className='mt15'>
			<Label className='mb10'>
				{__('Design width', 'b-slider')}
				<HelpTip>{__('The slide width the layers were placed at. Narrower screens scale them down by the same share.', 'b-slider')}</HelpTip>
			</Label>

			<NumberControl
				value={layerScale.width ?? ''}
				min={100}
				onChange={val => Number(val) > 0 && setAttributes({ layerScale: { ...layerScale, width: Math.round(Number(val)) } })}
				suffix={<SuffixWrapper>px</SuffixWrapper>}
				spinControls='native'
			/>

			<Button
				className='mt10'
				variant='link'
				disabled={!onDesktop}
				title={onDesktop ? undefined : __('In the Desktop view', 'b-slider')}
				onClick={() => measure() && setAttributes({ layerScale: { ...layerScale, width: measure() } })}
			>
				{__('Use current width', 'b-slider')}
			</Button>
		</div>}

		<ProNotice className='mt15' features={PRO_FEATURES.layerMotion} />
	</PanelBody>;
};

export default LayerScalePanel;
