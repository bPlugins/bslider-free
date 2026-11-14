import { __ } from '@wordpress/i18n';
import { RangeControl } from '@wordpress/components';
import { TipToggle } from '../../../Components/Panel/TipField';
import { ColorControl } from '../../../../../bpl-tools/Components/ColorControl/ColorControl';

const DEFAULT_GLASS = { blur: 12, tint: '#ffffff26' };

/** Frosted glass: what sits behind the layer is blurred and tinted; saved as `--bsb-glass-*` (layerProps.js). */
const GlassPanel = ({ layer, update }) => {
	const glass = layer.glass ? { ...DEFAULT_GLASS, ...layer.glass } : null;

	return <>
		<TipToggle
			label={__('Frosted glass', 'b-slider')}
			checked={Boolean(glass)}
			onChange={val => update('glass', val ? DEFAULT_GLASS : undefined, true)}
			tip={__('Blurs whatever is behind this block, like frosted glass. Best on a group or box over a photo; the tint gives the glass its colour.', 'b-slider')}
		/>

		{glass && <>
			<RangeControl
				className='mt15'
				label={__('Blur (px)', 'b-slider')}
				value={glass.blur}
				onChange={val => update('glass', { blur: val ?? DEFAULT_GLASS.blur })}
				min={1}
				max={40}
			/>

			<ColorControl
				className='mt15'
				label={__('Tint', 'b-slider')}
				value={glass.tint}
				onChange={val => update('glass', { tint: val || '' })}
			/>
		</>}
	</>;
};

export default GlassPanel;
