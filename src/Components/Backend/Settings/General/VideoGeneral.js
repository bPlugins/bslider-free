import { __ } from '@wordpress/i18n';
import { ToggleControl } from "@wordpress/components";
import { PanelBody } from '../../../Panel/AccordionPanel';
import ProNotice from '../../../Panel/ProNotice';
import { PRO_FEATURES } from '../../../../utils/pro-features';
import { videoControlOpt } from '../../../../utils/options';

const VideoGeneral = ({ attributes, setAttributes, updateObject }) => {
    const { videoConf } = attributes;
    const { controls, isPopup, icon, repeat, isAutoPlay, muted } = videoConf;

    /** `controls` is one attribute holding every button, so a toggle rewrites the object around it. */
    const updateControl = (key, val) => setAttributes({ videoConf: { ...videoConf, controls: { ...controls, [key]: val } } });

    return <>
        <PanelBody className='bPlPanelBody' title={__('Video', 'b-slider')} initialOpen={false}>
            <ToggleControl className='mt10' label={__('Popup enable', 'b-slider')} checked={isPopup} onChange={val => updateObject('videoConf', 'isPopup', val)} />

            {isPopup && <ToggleControl className='mt10' label={__('Icon', 'b-slider')} checked={icon} onChange={val => updateObject('videoConf', 'icon', val)} />}

            <ToggleControl className='mt10' label={__('Repeat', 'b-slider')} checked={repeat} onChange={val => updateObject('videoConf', 'repeat', val)} />

            <ToggleControl className='mt10' label={__('Autoplay', 'b-slider')} checked={isAutoPlay} onChange={val => updateObject('videoConf', 'isAutoPlay', val)} />
            <small>{__('Autoplay might require muting based on the browser.', 'b-slider')}</small>

            <ToggleControl className='mt10' label={__('Muted', 'b-slider')} checked={muted} onChange={val => updateObject('videoConf', 'muted', val)} />

            <ProNotice features={PRO_FEATURES.video} />
        </PanelBody>

        <PanelBody className='bPlPanelBody' title={__('Controls', 'b-slider')} initialOpen={false}>
            {/* Nine near-identical toggles, so the list of buttons lives in `videoControlOpt` and
                the panel draws whatever is in it. */}
            {videoControlOpt.map(({ key, label }, index) => <ToggleControl
                key={key}
                className={index ? 'mt10' : ''}
                label={label}
                checked={controls[key]}
                onChange={val => updateControl(key, val)}
            />)}

            <ProNotice features={PRO_FEATURES.videoControls} />
        </PanelBody>
    </>
}
export default VideoGeneral;
