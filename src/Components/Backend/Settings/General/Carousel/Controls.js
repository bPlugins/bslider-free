import { __ } from '@wordpress/i18n';
import { __experimentalNumberControl as NumberControl, ToggleControl, SelectControl } from "@wordpress/components";
import { BControlPro } from '../../../../../../../bpl-tools/ProControls';

const Controls = ({ attributes, updateObject, premiumProps }) => {

    const { carousel, sourceType, socialQuery, layoutType } = attributes;
    const { loop, isAutoPlay, autoPlayDelay, mousewheel, grabCursor, itemsPerSlide = 1, groupColumns = 1 } = carousel;
    const isSocialFeed = sourceType === 'social';

    return <>
        <ToggleControl className='' label={__("Loop", 'b-slider')} checked={loop} onChange={val => updateObject("carousel", "loop", val)} />

        <ToggleControl className='mt10' label={__("Auto Play", 'b-slider')} checked={isAutoPlay} onChange={val => updateObject("carousel", "isAutoPlay", val)} />

        {isAutoPlay && <NumberControl className='mt10' label={__("Duration", 'b-slider')} isShiftStepEnabled={true} shiftStep={10} value={autoPlayDelay} onChange={val => updateObject("carousel", "autoPlayDelay", val)} />}

        <BControlPro className='mt10' label={__("Mouse Wheel", 'b-slider')} checked={mousewheel} onChange={val => updateObject("carousel", "mousewheel", val)} {...premiumProps} Component={ToggleControl} />

        <BControlPro className='mt10' label={__("Grab Cursor", 'b-slider')} checked={grabCursor} onChange={val => updateObject("carousel", "grabCursor", val)} {...premiumProps} Component={ToggleControl} />

        {isSocialFeed && layoutType === 'carousel' && (
            <>
                <SelectControl
                    className='mt10'
                    label={__("Items Per Slide (Group)", 'b-slider')}
                    value={itemsPerSlide}
                    options={[
                        { label: __('1 Item', 'b-slider'), value: 1 },
                        { label: __('2 Items', 'b-slider'), value: 2 },
                        { label: __('3 Items', 'b-slider'), value: 3 },
                        { label: __('4 Items', 'b-slider'), value: 4 }
                    ]}
                    onChange={val => updateObject("carousel", "itemsPerSlide", parseInt(val))}
                />
                {itemsPerSlide > 1 && (
                    <SelectControl
                        className='mt10'
                        label={__("Group Columns", 'b-slider')}
                        value={groupColumns}
                        options={[
                            { label: __('1 Column (Vertical Stack)', 'b-slider'), value: 1 },
                            { label: __('2 Columns', 'b-slider'), value: 2 },
                            { label: __('3 Columns', 'b-slider'), value: 3 },
                            { label: __('4 Columns', 'b-slider'), value: 4 }
                        ]}
                        onChange={val => updateObject("carousel", "groupColumns", parseInt(val))}
                    />
                )}
            </>
        )}
    </>
}
export default Controls;