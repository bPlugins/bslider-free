import { __ } from '@wordpress/i18n';
import { SelectControl } from '@wordpress/components';
import ProNotice from '../../../Components/Panel/ProNotice';
import { PRO_FEATURES } from '../../../utils/pro-features';
import { loopEffectOpt, loopSpeedOpt, PRO_LOOP_EFFECTS } from '../../../utils/options';

/**
 * The animation that never stops — a pulsing button, a drifting badge.
 *
 * Pulse and Bounce are free; the rest stay in the list too, marked "- Pro" in the dropdown, so a
 * free user can see what picking Pro would give them without a separate control to compare.
 */
const LoopPanel = ({ layer, update }) => {
	const loop = layer.loop || {};

	const options = loopEffectOpt.map(o => PRO_LOOP_EFFECTS.includes(o.value) ? { ...o, label: `${o.label} - Pro` } : o);

	return <>
		<SelectControl
			label={__('Loop animation', 'b-slider')}
			value={loop.effect || ''}
			options={options}
			onChange={val => PRO_LOOP_EFFECTS.includes(val) ? null : update('loop', { effect: val })}
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
