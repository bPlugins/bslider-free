import { __ } from '@wordpress/i18n';
import { __experimentalNumberControl as NumberControl } from '@wordpress/components';
import { TipRange } from '../../../Components/Panel/TipField';

/** Turn and stacking order for a layer in the normal flow; absolute layers have both in Position. */
const FlowPlace = ({ layer, update }) => {
	const flow = layer.flow || {};
	const set = (changes) => {
		const next = { ...flow, ...changes };

		Object.keys(next).forEach(key => undefined === next[key] && delete next[key]);
		update('flow', Object.keys(next).length ? next : undefined, true);
	};

	return <>
		<TipRange
			className='mt15'
			label={__('Rotation (°)', 'b-slider')}
			value={flow.rotate ?? 0}
			onChange={val => set({ rotate: val || undefined })}
			min={-180}
			max={180}
			step={1}
			tip={__('Turns the block where it stands; the blocks around it do not move.', 'b-slider')}
		/>

		<NumberControl
			className='mt15'
			label={__('Z-Index', 'b-slider')}
			value={flow.z ?? ''}
			onChange={raw => set({ z: '' === raw || undefined === raw ? undefined : Math.max(0, parseInt(raw, 10) || 0) })}
			min={0}
			placeholder={__('Auto', 'b-slider')}
		/>
	</>;
};

export default FlowPlace;
