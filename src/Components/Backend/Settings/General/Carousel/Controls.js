import { __ } from '@wordpress/i18n';
import { __experimentalNumberControl as NumberControl, ToggleControl } from "@wordpress/components";

/**
 * Loop and autoplay, shared by the carousel and thumbnails panels.
 *
 * It carries no upsell notice of its own. Which of these controls Premium adds depends on the panel
 * it is dropped into — the carousel panel draws Direction and Show Arrow/Navigation for free, the
 * thumbnails panel does not — so each parent names its own list and prints the single notice.
 * Keeping one here is what put two notices in both panels, the carousel one contradicting the
 * controls sitting right above it.
 */
const Controls = ({ attributes, updateObject }) => {

    const { carousel } = attributes;
    const { loop, isAutoPlay, autoPlayDelay } = carousel;

    return <>
        <ToggleControl className='' label={__("Loop", 'b-slider')} checked={loop} onChange={val => updateObject("carousel", "loop", val)} />

        <ToggleControl className='mt10' label={__("Auto Play", 'b-slider')} checked={isAutoPlay} onChange={val => updateObject("carousel", "isAutoPlay", val)} />

        {isAutoPlay && <NumberControl className='mt10' label={__("Duration", 'b-slider')} isShiftStepEnabled={true} shiftStep={10} value={autoPlayDelay} onChange={val => updateObject("carousel", "autoPlayDelay", val)} />}
    </>
}
export default Controls;
