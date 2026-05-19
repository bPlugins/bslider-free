import { __ } from '@wordpress/i18n';
import { PanelBody, ToggleControl } from "@wordpress/components";
import { Notice } from '../../../../../../bpl-tools/Components';

const VideoGeneral = ({ attributes, setAttributes, updateObject }) => {
    const { videoConf } = attributes;
    const { controls, isPopup, icon, repeat, isAutoPlay, muted } = videoConf;
    const { restart, rewind, play, progress, duration, mute } = controls;

    return <>
        <PanelBody className='bPlPanelBody' title={__('Video', 'b-slider')} initialOpen={false}>
            <ToggleControl className='mt10' label={__('Popup enable', 'b-slider')} checked={isPopup} onChange={val => updateObject('videoConf', 'isPopup', val)} />

            {isPopup && <ToggleControl className='mt10' label={__('Icon', 'b-slider')} checked={icon} onChange={val => updateObject('videoConf', 'icon', val)} />}

            <ToggleControl className='mt10' label={__('Repeat', 'b-slider')} checked={repeat} onChange={val => updateObject('videoConf', 'repeat', val)} />

            <ToggleControl className='mt10' label={__('Autoplay', 'b-slider')} checked={isAutoPlay} onChange={val => updateObject('videoConf', 'isAutoPlay', val)} />
            <small>{__('Autoplay might require muting based on the browser.', 'b-slider')}</small>

            <ToggleControl className='mt10' label={__('Muted', 'b-slider')} checked={muted} onChange={val => updateObject('videoConf', 'muted', val)} />

            <Notice status='premium' isIcon={true}>{__('Reset On End, Auto Hide Control settings are available in the Premium version.', 'b-slider')}</Notice>
        </PanelBody>

        <PanelBody className='bPlPanelBody' title={__('Controls', 'b-slider')} initialOpen={false}>

            <ToggleControl label={__('Play Large', 'video-player')} checked={controls['play-large']} onChange={val => setAttributes({ videoConf: { ...videoConf, controls: { ...controls, 'play-large': val } } })} />

            <ToggleControl className='mt10' label={__('Restart', 'video-player')} checked={restart} onChange={val => setAttributes({ videoConf: { ...videoConf, controls: { ...controls, 'restart': val } } })} />

            <ToggleControl className='mt10' label={__('Rewind', 'video-player')} checked={rewind} onChange={val => setAttributes({ videoConf: { ...videoConf, controls: { ...controls, 'rewind': val } } })} />

            <ToggleControl className='mt10' label={__('Play', 'video-player')} checked={play} onChange={val => setAttributes({ videoConf: { ...videoConf, controls: { ...controls, 'play': val } } })} />

            <ToggleControl className='mt10' label={__('Fast Forward', 'video-player')} checked={controls['fast-forward']} onChange={val => setAttributes({ videoConf: { ...videoConf, controls: { ...controls, 'fast-forward': val } } })} />

            <ToggleControl className='mt10' label={__('Progress', 'video-player')} checked={progress} onChange={val => setAttributes({ videoConf: { ...videoConf, controls: { ...controls, 'progress': val } } })} />

            <ToggleControl className='mt10' label={__('Current Time', 'video-player')} checked={controls['current-time']} onChange={val => setAttributes({ videoConf: { ...videoConf, controls: { ...controls, 'current-time': val } } })} />

            <ToggleControl className='mt10' label={__('Duration', 'video-player')} checked={duration} onChange={val => setAttributes({ videoConf: { ...videoConf, controls: { ...controls, 'duration': val } } })} />

            <ToggleControl className='mt10' label={__('Mute', 'video-player')} checked={mute} onChange={val => setAttributes({ videoConf: { ...videoConf, controls: { ...controls, 'mute': val } } })} />



            <Notice status='premium' isIcon={true}>{__('Volume, PIP, Airplay, Settings, Download, Fullscreen settings are available in the Premium version.', 'b-slider')}</Notice>
        </PanelBody>
    </>
}
export default VideoGeneral;