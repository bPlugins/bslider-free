import { __ } from '@wordpress/i18n';
import { __experimentalNumberControl as NumberControl, ToggleControl } from "@wordpress/components";
import { Notice } from '../../../../../../../bpl-tools/Components';

const Controls = ({ attributes, updateObject }) => {

    const { carousel } = attributes;
    const { loop, isAutoPlay, autoPlayDelay } = carousel;

    return <>
        <ToggleControl className='' label={__("Loop", 'b-slider')} checked={loop} onChange={val => updateObject("carousel", "loop", val)} />

        <ToggleControl className='mt10' label={__("Auto Play", 'b-slider')} checked={isAutoPlay} onChange={val => updateObject("carousel", "isAutoPlay", val)} />

        {isAutoPlay && <NumberControl className='mt10' label={__("Duration", 'b-slider')} isShiftStepEnabled={true} shiftStep={10} value={autoPlayDelay} onChange={val => updateObject("carousel", "autoPlayDelay", val)} />}

        <Notice status='premium' isIcon={true}>{__('Mouse Wheel, Grab Cursor, Direction(Horizontal, Vertical), Show Arrow/Navigation settings are available in the Premium version.', 'b-slider')}</Notice>

    </>
}
export default Controls;