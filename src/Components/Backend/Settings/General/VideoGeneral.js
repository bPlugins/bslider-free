import { __ } from '@wordpress/i18n';
import { ToggleControl } from "@wordpress/components";
import { PanelBody } from '../../../Panel/AccordionPanel';
import PlayerGeneral from './PlayerGeneral';

/**
 * What only a video slider has, and then the player itself.
 *
 * The split is by what the setting belongs to. A popup and its icon are the slide's, and a feed slide
 * has its own answers for both — where its video opens is `playVideo` in the feed panel, and its play
 * badge is drawn by `PostItem`. Everything below the divide is Plyr's, which both sources share, so it
 * lives in `PlayerGeneral` and is offered to both.
 */
const VideoGeneral = (props) => {
    const { attributes, updateObject } = props;
    const { videoConf } = attributes;
    const { isPopup, icon, isAutoPlay } = videoConf;

    return <>
        <PanelBody className='bPlPanelBody' title={__('Video', 'b-slider')} initialOpen={false}>
            <ToggleControl className='mt10' label={__('Popup enable', 'b-slider')} checked={isPopup} onChange={val => updateObject('videoConf', 'isPopup', val)} />

            {isPopup && <ToggleControl className='mt10' label={__('Icon', 'b-slider')} checked={icon} onChange={val => updateObject('videoConf', 'icon', val)} />}

            {/* A slide's video starting on its own, which is a video-source idea: a feed slide's video
                only ever plays because somebody clicked it, and the popup autoplays that one — see the
                note on `autoplay` in `bsb_fancybox_options`. */}
            <ToggleControl className='mt10' label={__('Autoplay', 'b-slider')} checked={isAutoPlay} onChange={val => updateObject('videoConf', 'isAutoPlay', val)} />
            <small>{__('Autoplay might require muting based on the browser.', 'b-slider')}</small>
        </PanelBody>

        <PlayerGeneral {...props} />
    </>
}
export default VideoGeneral;
