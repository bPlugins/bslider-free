import { __ } from '@wordpress/i18n';
import { SelectControl } from '@wordpress/components';
import ProNotice from '../../../Components/Panel/ProNotice';
import { PRO_FEATURES } from '../../../utils/pro-features';
import { loopEffectOpt, loopSpeedOpt, PRO_LOOP_EFFECTS } from '../../../utils/options';

/**
 * The animation that never stops — a pulsing button, a drifting badge.
 *
 * Only the free effects are listed. The Premium ones are named in the notice below rather than
 * sitting in the dropdown as options that cannot be picked — WordPress.org does not allow a free
 * plugin to show a control that does nothing but advertise the paid version.
 */
const LoopPanel = ({ layer, update }) => {
	const loop = layer.loop || {};

	/**
	 * A layer saved under an active licence keeps its Premium effect after the licence lapses —
	 * the CSS still ships, so it still plays. Its option has to stay in the list or the control
	 * would show an empty box and overwrite the effect the moment anything else here is touched.
	 */
	const options = loopEffectOpt.filter(o => !PRO_LOOP_EFFECTS.includes(o.value) || o.value === loop.effect);

	return <>
		<SelectControl
			label={__('Loop animation', 'b-slider')}
			value={loop.effect || ''}
			options={options}
			onChange={val => update('loop', { effect: val })}
		/>

		{loop.effect && <SelectControl
			label={__('Speed', 'b-slider')}
			value={String(loop.speed ?? 2)}
			options={loopSpeedOpt.map(o => ({ ...o, value: String(o.value) }))}
			onChange={val => update('loop', { speed: parseFloat(val) })}
		/>}

		<ProNotice className='mt10' features={PRO_FEATURES.loopAnimation} />
	</>;
};

export default LoopPanel;
