import { __ } from '@wordpress/i18n';
import { Button, RangeControl } from '@wordpress/components';
import { ColorControl } from '../../../../../bpl-tools/Components/ColorControl/ColorControl';

/** Brightness and saturation for a picture layer, in percent (100 = as is); saved as `--bsb-img-*` (layerProps.js). */
const ImageFilterPanel = ({ layer, update, blockName }) => {
	const filter = layer.imgFilter || {};
	const set = (changes) => {
		const next = { ...filter, ...changes };

		Object.keys(next).forEach(key => (undefined === next[key] || 100 === next[key] || '' === next[key]) && delete next[key]);
		update('imgFilter', Object.keys(next).length ? next : undefined, true);
	};

	return <>
		<RangeControl
			label={__('Brightness (%)', 'b-slider')}
			value={filter.brightness ?? 100}
			onChange={val => set({ brightness: val ?? 100 })}
			min={0}
			max={200}
		/>

		<RangeControl
			className='mt15'
			label={__('Saturation (%)', 'b-slider')}
			value={filter.saturate ?? 100}
			onChange={val => set({ saturate: val ?? 100 })}
			min={0}
			max={200}
		/>

		{/* Only the Image block: the mask needs its picture's address. */}
		{'core/image' === blockName && <ColorControl
			className='mt15'
			label={__('Recolour', 'b-slider')}
			value={filter.recolor}
			onChange={val => set({ recolor: val || undefined })}
		/>}

		{layer.imgFilter && <Button className='mt5' variant='link' onClick={() => update('imgFilter', undefined, true)}>
			{__('Reset', 'b-slider')}
		</Button>}
	</>;
};

export default ImageFilterPanel;
