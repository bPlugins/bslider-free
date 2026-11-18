import { __ } from '@wordpress/i18n';
import { SelectControl } from '@wordpress/components';
import { TipToggle } from '../../../Components/Panel/TipField';

/** Playback and on-slide buttons for a Cover block's background video; saved as `bsb-cv-*` classes (layerProps.js). */
const CoverVideoPanel = ({ layer, update }) => {
	const video = layer.coverVideo || {};
	const set = (changes) => {
		const next = { ...video, ...changes };

		Object.keys(next).forEach(key => (!next[key] || 'br' === next[key]) && delete next[key]);
		update('coverVideo', Object.keys(next).length ? next : undefined, true);
	};

	return <>
		<TipToggle
			label={__('Play on its slide only', 'b-slider')}
			checked={Boolean(video.slideOnly)}
			onChange={val => set({ slideOnly: val })}
			tip={__('The video starts from the beginning each time its slide shows and stops when the slide leaves. Off: it plays all the time, on every slide.', 'b-slider')}
		/>

		<TipToggle
			className='mt15'
			label={__('Sound button', 'b-slider')}
			checked={Boolean(video.sound)}
			onChange={val => set({ sound: val })}
			tip={__('The video starts muted, because browsers block sound until the visitor clicks. This button lets visitors turn the sound on.', 'b-slider')}
		/>

		<TipToggle
			className='mt15'
			label={__('Play/Pause button', 'b-slider')}
			checked={Boolean(video.playPause)}
			onChange={val => set({ playPause: val })}
		/>

		{(video.sound || video.playPause) && <SelectControl
			className='mt15'
			label={__('Button position', 'b-slider')}
			value={video.at || 'br'}
			options={[
				{ label: __('Bottom right', 'b-slider'), value: 'br' },
				{ label: __('Bottom left', 'b-slider'), value: 'bl' },
				{ label: __('Top right', 'b-slider'), value: 'tr' },
				{ label: __('Top left', 'b-slider'), value: 'tl' },
			]}
			onChange={val => set({ at: val })}
		/>}
	</>;
};

export default CoverVideoPanel;
