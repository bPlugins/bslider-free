import { __ } from '@wordpress/i18n';
import { __experimentalNumberControl as NumberControl, ToggleControl, SelectControl } from "@wordpress/components";

/**
 * Loop and autoplay, shared by the carousel and thumbnails panels.
 *
 * It carries no upsell notice of its own, and draws no Premium control. Which of these Premium adds
 * depends on the panel it is dropped into — the carousel panel draws Direction and Show
 * Arrow/Navigation for free, the thumbnails panel does not — so each parent names its own list and
 * prints the single notice. Keeping one here is what put two notices in both panels, the carousel
 * one contradicting the controls sitting right above it.
 */

const Controls = ({ attributes, updateObject }) => {

    const { carousel, sourceType, socialQuery, layoutType } = attributes;
    const { loop, isAutoPlay, autoPlayDelay, itemsPerSlide = 1, groupColumns = 1 } = carousel;
    const isSocialFeed = sourceType === 'social';

    return <>
        <ToggleControl className='' label={__("Loop", 'b-slider')} checked={loop} onChange={val => updateObject("carousel", "loop", val)} />

        <ToggleControl className='mt10' label={__("Auto Play", 'b-slider')} checked={isAutoPlay} onChange={val => updateObject("carousel", "isAutoPlay", val)} />

        {isAutoPlay && <NumberControl className='mt10' label={__("Duration", 'b-slider')} isShiftStepEnabled={true} shiftStep={10} value={autoPlayDelay} onChange={val => updateObject("carousel", "autoPlayDelay", val)} />}

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