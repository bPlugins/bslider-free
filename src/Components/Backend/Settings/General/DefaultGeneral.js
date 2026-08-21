import { __ } from '@wordpress/i18n';
import { SelectControl, __experimentalUnitControl as UnitControl, __experimentalNumberControl as NumberControl, ToggleControl, PanelRow, __experimentalAlignmentMatrixControl as AlignmentMatrixControl, RangeControl } from "@wordpress/components";
import { PanelBody } from '../../../Panel/AccordionPanel';
import { animationFreeOptions, animationOptions, contentPosition, emUnit, indicatorOption, indicatorOptions, perUnit, caroDirectionOpt, carouselStyOpt } from '../../../../utils/options';

import { BtnGroup, Label } from '../../../../../../bpl-tools/Components';
import { pxUnit, vhUnit } from '../../../../../../bpl-tools/utils/options';
import { BDevice } from '../../../../../../bpl-tools/Components/Deprecated';

import { checkDirection, isAutoGridHeight } from '../../../../utils/functions';

import Controls from './Carousel/Controls';
import ProNotice from '../../../Panel/ProNotice';
import ProPanel from '../../../Panel/ProPanel';
import { PRO_FEATURES } from '../../../../utils/pro-features';
import Notice from '../../Notice';

const DefaultGeneral = ({ attributes, setAttributes, premiumProps, updateObject, device, setDevice }) => {

    const { layoutType, gridItemRatio, titleFCaption, options, height, sliderHeight, animation, position, arrow, indicator, carousel, columns, rowGap, columnGap, sourceType, socialQuery } = attributes;
    const { carouselStyle, reverseDirection, caroDirection } = carousel;
    const isSingleVideo = sourceType === 'social' && socialQuery?.feedType === 'youtube_video';
    /* The same answer `Style` writes the CSS from, so the field and the page cannot disagree. */
    const autoGrid = isAutoGridHeight(attributes);

    return <>

        <PanelBody className='bPlPanelBody' title={__('Title', 'b-slider')} initialOpen={false}>

            {sourceType !== 'social' && (
                <ToggleControl className='mt10' label={__('Import Title From Media Caption', 'b-slider')} checked={titleFCaption} onChange={(val) => setAttributes({ titleFCaption: val })} />
            )}

            <ProNotice features={PRO_FEATURES.title} />
        </PanelBody>

        {
            layoutType === "carousel" && <PanelBody className='bPlPanelBody' title={__('Carousel Settings', 'b-slider')} badge={__('New', 'b-slider')} initialOpen={false}>

                {/* `carouselStyOpt` carries only the styles this build can draw — Ticker, Grid and
                    3D Carousel are named in the notice below rather than offered and refused. */}
                <SelectControl label={__('Carousel Style', 'b-slider')} value={carouselStyle} options={carouselStyOpt} onChange={val => updateObject("carousel", "carouselStyle", val)} />

                {carouselStyle !== "ticker" && <>
                    <Controls attributes={attributes} updateObject={updateObject} />
                </>}

                {carouselStyle === "ticker" && <ToggleControl className='mt10' label={__("Reverse Direction", 'b-slider')} checked={reverseDirection} onChange={val => updateObject("carousel", "reverseDirection", val)} />}

                {(carouselStyle === "standard" || carouselStyle === "ticker") && <SelectControl className='mt10' label={__('Direction', 'b-slider')} value={caroDirection} options={caroDirectionOpt} onChange={val => updateObject("carousel", "caroDirection", val)} />}

                {carouselStyle !== "ticker" && <>
                    <ToggleControl className='mt10' label={__('Show Arrow/Navigation', 'b-slider')} checked={arrow.visibility} onChange={(value) => { updateObject('arrow', 'visibility', value) }} />

                    <ToggleControl className='mt10' label={__('Show Indicators/Pagination', 'b-slider')} checked={indicator.visibility} onChange={(value) => updateObject('indicator', 'visibility', value)} />
                </>}

                {/* One notice for the panel. `Controls` above no longer brings its own, which used
                    to sit here as a second notice repeating Mouse Wheel and Grab Cursor. */}
                <ProNotice features={PRO_FEATURES.carouselControls} />
            </PanelBody>
        }

        <PanelBody className='' title={__('Layout Settings', 'b-slider')} initialOpen={false}>


            {
                (!isSingleVideo && (layoutType === "grid" || layoutType === "carousel" || layoutType === "thumbnails")) && <>
                    <PanelRow className='mt10'>
                        <Label mt='0'>{__('Columns:', 'b-slider')}</Label>
                        <BDevice device={device} onChange={val => setDevice(val)} />
                    </PanelRow>

                    <RangeControl value={columns[device]} onChange={val => { setAttributes({ columns: { ...columns, [device]: val } }) }} min={1} max={100} step={1} beforeIcon='grid-view' />
                    {
                        sourceType === "thumbnails" && <Notice />
                    }

                    {/* column Gap  */}
                    <UnitControl className='mt20' label={__('Column Gap:', 'b-slider')} labelPosition='left' value={columnGap} onChange={val => setAttributes({ columnGap: val })} units={[pxUnit(30), perUnit(3), emUnit(2)]} isResetValueOnUnitChange={true} />
                </>
            }

            {/* row Gap  */}
            {(!isSingleVideo && layoutType === 'grid') && <UnitControl className='mt20' label={__('Row Gap:', 'b-slider')} labelPosition='left' value={rowGap} onChange={val => setAttributes({ rowGap: val })} units={[pxUnit(40), perUnit(3), emUnit(2.5)]} isResetValueOnUnitChange={true} />}


            {/* Height define option  */}
            <PanelRow className='mt20'>
                <Label mt='0'>{__('Height:', 'b-slider')}</Label>
                <BDevice device={device} onChange={val => setDevice(val)} />
            </PanelRow>

            {/* Empty, with "Auto" in its place, while a grid is sizing itself to its pictures. The field
                showed `450px` there — the fallback the CSS no longer uses — so it named a height that
                was not in force and could not be cleared, since clearing it produced the same reading.

                Typing one is how somebody opts out of the automatic sizing, and emptying it again is how
                they get it back. Both already worked; only what the field said about them was wrong. */}
            <UnitControl className={autoGrid ? '' : 'mb20'} label={`${layoutType === 'grid' ? 'Item' : 'Slider'} Height`} labelPosition='left' value={autoGrid ? '' : (sliderHeight[device] || height)} placeholder={autoGrid ? ('original' === (gridItemRatio || '4/3') ? __('From the picture', 'b-slider') : __('From the ratio', 'b-slider')) : undefined} onChange={val => { setAttributes({ sliderHeight: { ...sliderHeight, [device]: val } }) }} units={[pxUnit(400), vhUnit(30)]} isResetValueOnUnitChange={true} beforeIcon='grid-view' />

            {/* Offered instead of the height, not beside it — and only while no height is set, because a
                slider in fixed frames has no use for a ratio.

                A ratio rather than a second height field: the column already fixes the width, so this
                settles how tall a card is without a pixel value to keep up to date at every breakpoint,
                and every card resizes with its column on every screen. `original` is the one that keeps
                each picture's own shape, which is what a grid did before this control existed. */}
            {autoGrid && <>
                <SelectControl
                    className='mb0'
                    label={__('Item Ratio', 'b-slider')}
                    labelPosition='left'
                    value={gridItemRatio || '4/3'}
                    options={[
                        { label: __('4:3 — landscape', 'b-slider'), value: '4/3' },
                        { label: __('16:9 — widescreen', 'b-slider'), value: '16/9' },
                        { label: __('1:1 — square', 'b-slider'), value: '1/1' },
                        { label: __('4:5 — portrait', 'b-slider'), value: '4/5' },
                        { label: __('9:16 — tall', 'b-slider'), value: '9/16' },
                        { label: __('Original — each picture’s own', 'b-slider'), value: 'original' }
                    ]}
                    onChange={val => setAttributes({ gridItemRatio: val })}
                />

                <p className='bsb_feed_note mb20'>
                    {'original' === (gridItemRatio || '4/3')
                        ? __('Each card is as tall as its own picture — nothing cropped, nothing padded, and a ragged bottom edge where the feed mixes shapes.', 'b-slider')
                        : __('Every card this shape, its height taken from the column’s width — so it follows the screen with no pixel height to maintain. Where a picture is a different shape, Image Fit under Slides decides what happens.', 'b-slider')}
                </p>
            </>}

            {(!isSingleVideo && sourceType !== "video" && (layoutType !== "carousel" && layoutType !== "grid" && layoutType !== "thumbnails")) && <PanelRow>
                {premiumProps?.isPremium ?
                    <><Label>{__('Content Position:', 'b-slider')}</Label>
                        <AlignmentMatrixControl value={position?.top || position} onChange={val => setAttributes({ position: val })} />
                    </> :
                    <SelectControl label={__('Content Position:', 'b-slider')} labelPosition='left' value={position} options={contentPosition} onChange={(val) => { setAttributes({ position: val }) }} />
                }
            </PanelRow>}

            <ProNotice features={PRO_FEATURES.layoutSettings} />
        </PanelBody>

        {(!isSingleVideo && layoutType !== "carousel" && layoutType !== "grid" && layoutType !== "thumbnails") && (
            <PanelBody className='' title={__('Slider Options', 'b-slider')} initialOpen={false}>
                {premiumProps?.isPremium ?
                    <SelectControl label={__('Animation/Effect:', 'b-slider')} labelPosition='side' value={animation} onChange={(val) => setAttributes({ animation: val })} options={animationOptions} />
                    :
                    <PanelRow>
                        <Label className='mb0'>{__('Animation/Effect:', 'b-slider')}</Label>
                        <BtnGroup value={animation} onChange={val => setAttributes({ animation: val })} options={animationFreeOptions} />
                    </PanelRow>
                }

                <ToggleControl className='mt20' label={__('Autoplay', 'b-slider')} checked={options.ride} onChange={(value) => updateObject('options', 'ride', value)} />

                {options.ride && <>
                    <NumberControl className='mb10' label={__('Interval(ms)', 'b-slider')} labelPosition='left' value={options.interval} onChange={(value) => updateObject('options', 'interval', parseInt(value))} min={1000} max={10000} />

                    <ToggleControl className='mt10' label={__('Pause on Mouse over', 'b-slider')} checked={options.pause} onChange={(value) => updateObject('options', 'pause', value)} />
                </>}

                <ToggleControl className='mt20' label={__('Show Arrow/Navigation', 'b-slider')} checked={arrow.visibility} onChange={(value) => { updateObject('arrow', 'visibility', value) }} />

                <ToggleControl className='mt10' label={__('Show Indicators/Pagination', 'b-slider')} checked={indicator.visibility} onChange={(value) => updateObject('indicator', 'visibility', value)} />

                <ProNotice features={PRO_FEATURES.sliderOptions} />
            </PanelBody>
        )}

        {/* "Lazy Load Video" stood here too, beside a toggle that applies to every source, asking a
            question this panel had no other reason to ask — it is one parameter of a native YouTube
            iframe, and lives in `PlayerGeneral`'s YouTube Native Controls panel now, which is that
            iframe's own panel and already carried the `isNativeYouTube` this used a second copy of. */}
        {/* The panel's only control is Premium, so the panel itself is the upsell. */}
        {!isSingleVideo && (
            <ProPanel title={__('Lazy Load', 'b-slider')} proTitle={__('Premium Lazy Load', 'b-slider')} features={PRO_FEATURES.lazyLoad} />
        )}

        {(!isSingleVideo && (layoutType !== "carousel" && layoutType !== "grid" && layoutType !== "thumbnails") && indicator.visibility) && <PanelBody className='bPlPanelBody' title={__('Indicators', 'b-slider')} initialOpen={false}>
            {/* Type, Position and Direction are free, as they are on the released build — only
                `Move From Edge` is held back, and the notice below is what says so. */}
            <SelectControl className='mt10' label={__('Type', 'b-slider')} value={indicator?.type} labelPosition='left' onChange={(val) => setAttributes({
                indicator: {
                    ...indicator,
                    type: val,
                    width: 'image' === val ? '80px' : '30px',
                    height: 'image' === val ? '80px' : '3px',
                    radius: 'image' === val ? '50%' : '0px',
                    moveFromEdge: 'image' === val ? '50%' : '-15px',
                }
            })} options={indicatorOption} />

            <PanelRow className='mt20 mb10'>
                <Label className='mb0'>{__('Position:', 'b-slider')}</Label>
                <AlignmentMatrixControl value={indicator.position}
                    onChange={val => {
                        setAttributes({
                            indicator: { ...indicator, position: val, ...checkDirection(val) },
                        })
                    }}
                />
            </PanelRow>

            <SelectControl label={__('Direction', 'b-slider')} labelPosition='side' value={indicator.direction} onChange={(val) => { updateObject('indicator', 'direction', val) }} options={indicatorOptions} />

            <ProNotice features={PRO_FEATURES.indicators} />
        </PanelBody>}
    </>
}
export default DefaultGeneral;