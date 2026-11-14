import { __ } from '@wordpress/i18n';
import { GradientPicker, RangeControl, SelectControl, ToggleControl } from '@wordpress/components';
import { TipRange } from '../../../Components/Panel/TipField';
import { ColorControl } from '../../../../../bpl-tools/Components/ColorControl/ColorControl';

const DEFAULT_GRADIENT = 'linear-gradient(90deg, #ff6a00 0%, #ee0979 100%)';
const DEFAULT_SHADOW = { x: 0, y: 2, blur: 8, color: '#00000080' };

/** Gradient-filled text and a text shadow for a text layer; saved as `--bsb-*` vars (layerProps.js). */
const TextEffectsPanel = ({ layer, update }) => {
	const fx = layer.textFx || {};
	const shadow = { ...DEFAULT_SHADOW, ...(fx.shadow || {}) };
	const setShadow = (changes) => update('textFx', { shadow: { ...shadow, ...changes } });

	return <>
		<ToggleControl
			label={__('Gradient text', 'b-slider')}
			checked={Boolean(fx.gradient)}
			onChange={val => update('textFx', { gradient: val ? DEFAULT_GRADIENT : undefined })}
		/>

		{fx.gradient && <GradientPicker
			className='mt10'
			value={fx.gradient}
			onChange={val => update('textFx', { gradient: val || DEFAULT_GRADIENT })}
			gradients={[]}
			clearable={false}
		/>}

		<SelectControl
			className='mt20'
			label={__('Text direction', 'b-slider')}
			value={fx.direction || ''}
			options={[
				{ label: __('Normal', 'b-slider'), value: '' },
				{ label: __('Vertical, top to bottom', 'b-slider'), value: 'down' },
				{ label: __('Vertical, bottom to top', 'b-slider'), value: 'up' },
			]}
			onChange={val => update('textFx', { direction: val || undefined, ...(val ? { curve: undefined } : {}) })}
		/>

		{!fx.direction && <TipRange
			className='mt15'
			label={__('Curve (°)', 'b-slider')}
			value={fx.curve ?? 0}
			onChange={val => update('textFx', { curve: val || undefined })}
			min={-359}
			max={359}
			step={1}
			tip={__('Bends the text along an arc: plus arches it up, minus bends it down, 359 nearly closes a circle. It shows on the page; the editor keeps the text straight so you can type. Curved text uses a plain colour, not the gradient.', 'b-slider')}
		/>}

		<ToggleControl
			className='mt20'
			label={__('Text shadow', 'b-slider')}
			checked={Boolean(fx.shadow)}
			onChange={val => update('textFx', { shadow: val ? DEFAULT_SHADOW : undefined })}
		/>

		{fx.shadow && <>
			<ColorControl
				className='mt10'
				label={__('Shadow colour', 'b-slider')}
				value={shadow.color}
				onChange={val => setShadow({ color: val || DEFAULT_SHADOW.color })}
			/>

			<RangeControl
				className='mt15'
				label={__('Horizontal (px)', 'b-slider')}
				value={shadow.x}
				onChange={val => setShadow({ x: val ?? 0 })}
				min={-30}
				max={30}
			/>

			<RangeControl
				className='mt15'
				label={__('Vertical (px)', 'b-slider')}
				value={shadow.y}
				onChange={val => setShadow({ y: val ?? 0 })}
				min={-30}
				max={30}
			/>

			<RangeControl
				className='mt15'
				label={__('Blur (px)', 'b-slider')}
				value={shadow.blur}
				onChange={val => setShadow({ blur: val ?? 0 })}
				min={0}
				max={40}
			/>
		</>}
	</>;
};

export default TextEffectsPanel;
