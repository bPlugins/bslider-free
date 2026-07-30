import { __ } from '@wordpress/i18n';
import { SelectControl, __experimentalUnitControl as UnitControl, __experimentalNumberControl as NumberControl, ToggleControl, PanelRow, RangeControl } from "@wordpress/components";
import { PanelBody } from '../../../Panel/AccordionPanel';
import { emUnit, perUnit, caroDirectionOpt, carouselStyOpt, contentPosition, animationFreeOptions, indicatorOption, indicatorOptions, vhUnit } from '../../../../utils/options';

import { BtnGroup, Label } from '../../../../../../bpl-tools/Components';
import { pxUnit } from '../../../../../../bpl-tools/utils/options';
import { BDevice } from '../../../../../../bpl-tools/Components/Deprecated';
import Controls from './Carousel/Controls';
import ProNotice from '../../../Panel/ProNotice';
import { PRO_FEATURES } from '../../../../utils/pro-features';

import { AlignmentMatrixControl } from '@wordpress/components';
import { checkDirection, isDefaultLayout } from '../../../../utils/functions';

const DefaultGeneral = ({ attributes, setAttributes, updateObject, device, setDevice }) => {

    const { layoutType, titleFCaption, options, arrow, indicator, carousel, columns, rowGap, columnGap, position, animation, sliderHeight, height } = attributes;
    const { carouselStyle, reverseDirection, caroDirection } = carousel;

    /** The plain slider — the only layout that gets the autoplay, animation and indicator panels. */
    const isDefault = isDefaultLayout(layoutType);

    /**
     * Both toggles appear in the carousel panel and again in the plain slider's options panel; the
     * two differ only in how far the first one sits from the control above it.
     */
    const visibilityToggles = (topClass = 'mt10') => <>
        <ToggleControl className={topClass} label={__('Show Arrow/Navigation', 'b-slider')} checked={arrow.visibility} onChange={(value) => { updateObject('arrow', 'visibility', value) }} />

        <ToggleControl className='mt10' label={__('Show Indicators/Pagination', 'b-slider')} checked={indicator.visibility} onChange={(value) => updateObject('indicator', 'visibility', value)} />
    </>;

    return <>

        <PanelBody className='bPlPanelBody' title={__('Title', 'b-slider')} initialOpen={false}>

            <ToggleControl className='mt10' label={__('Import Title From Media Caption', 'b-slider')} checked={titleFCaption} onChange={(val) => setAttributes({ titleFCaption: val })} />

            <ProNotice features={PRO_FEATURES.title} />

        </PanelBody>

        {
            layoutType === "carousel" && <PanelBody className='bPlPanelBody' title={__('Controls', 'b-slider')} initialOpen={false}>

                <SelectControl label={__('Carousel Style', 'b-slider')} value={carouselStyle} options={carouselStyOpt} onChange={val => updateObject("carousel", "carouselStyle", val)} />

                {carouselStyle !== "ticker" && <>
                    <Controls attributes={attributes} updateObject={updateObject} />
                </>}

                {carouselStyle === "ticker" && <ToggleControl className='mt10' label={__("Reverse Direction", 'b-slider')} checked={reverseDirection} onChange={val => updateObject("carousel", "reverseDirection", val)} />}

                {(carouselStyle === "standard" || carouselStyle === "ticker") && <SelectControl className='mt10' label={__('Direction', 'b-slider')} value={caroDirection} options={caroDirectionOpt} onChange={val => updateObject("carousel", "caroDirection", val)} />}

                {carouselStyle !== "ticker" && visibilityToggles()}

                {/* One notice for the panel. `Controls` above no longer brings its own, which used
                    to sit here as a second notice repeating Mouse Wheel and Grab Cursor — and
                    offering Direction and Show Arrow/Navigation as Premium directly beneath the
                    free controls for both. */}
                <ProNotice features={PRO_FEATURES.carouselControls} />
            </PanelBody>
        }

        <PanelBody className='bPlPanelBody' title={__('Layout Settings', 'b-slider')} initialOpen={false}>
            {
                (layoutType === "grid" || layoutType === "carousel" || layoutType === "thumbnails") && <>
                    <PanelRow className='bsb_device_row mt10'>
                        <Label className='mb0'>{__('Columns:', 'b-slider')}</Label>
                        <BDevice device={device} onChange={val => setDevice(val)} />
                    </PanelRow>

                    <RangeControl value={columns[device]} onChange={val => { setAttributes({ columns: { ...columns, [device]: val } }) }} min={1} max={100} step={1} beforeIcon='grid-view' />
                    {/* Unlike the sizes below, each device reads its own count directly — there is no
                        fallback to desktop, so all three want setting. */}
                    <small className="bsb_field_hint">{__('Set a count for each device using the icons above.', 'b-slider')}</small>

                    {/* column Gap  */}
                    <UnitControl className='mt20' label={__('Column Gap:', 'b-slider')} labelPosition='left' value={columnGap} onChange={val => setAttributes({ columnGap: val })} units={[pxUnit(30), perUnit(3), emUnit(2)]} isResetValueOnUnitChange={true} />
                </>
            }

            {/* row Gap  */}
            {layoutType === 'grid' && <UnitControl className='mt20' label={__('Row Gap:', 'b-slider')} labelPosition='left' value={rowGap} onChange={val => setAttributes({ rowGap: val })} units={[pxUnit(40), perUnit(3), emUnit(2.5)]} isResetValueOnUnitChange={true} />}

            <SelectControl label={__('Content Position:', 'b-slider')} labelPosition='left' value={position} options={contentPosition} onChange={(val) => { setAttributes({ position: val }) }} />

            {/* Height define option  */}
            <PanelRow className='bsb_device_row mt20'>
                <Label className='mb0'>{layoutType === 'grid' ? __('Item Height:', 'b-slider') : __('Slider Height:', 'b-slider')}</Label>
                <BDevice device={device} onChange={val => setDevice(val)} />
            </PanelRow>

            <UnitControl className='mb0' value={sliderHeight[device] || height} onChange={val => { setAttributes({ sliderHeight: { ...sliderHeight, [device]: val } }) }} units={[pxUnit(400), vhUnit(30)]} isResetValueOnUnitChange={true} beforeIcon='grid-view' />
            <small className="bsb_field_hint">{__('Tablet falls back to desktop, and mobile to tablet, wherever a height is left unset.', 'b-slider')}</small>

            <ProNotice features={PRO_FEATURES.layoutSettings} />
        </PanelBody>

        {isDefault && <>
            <PanelBody className='bPlPanelBody' title={__('Slider Options', 'b-slider')} initialOpen={false}>

                {/* Label above the buttons rather than beside them. `PanelRow` is a no-wrap flex row
                    splitting its children apart, and `Animation/Effect:` next to two text buttons
                    runs past the inspector width — the label broke mid-word and the buttons were
                    squeezed. `BtnGroup` places its own label, so the row is not needed. */}
                <BtnGroup className='mb20' label={__('Animation/Effect:', 'b-slider')} labelPosition='top' value={animation} onChange={val => setAttributes({ animation: val })} options={animationFreeOptions} />

                <ToggleControl className='mt20' label={__('Autoplay', 'b-slider')} checked={options.ride} onChange={(value) => updateObject('options', 'ride', value)} />

                {options.ride && <>
                    <NumberControl className='mb10' label={__('Interval(ms)', 'b-slider')} labelPosition='left' value={options.interval} onChange={(value) => updateObject('options', 'interval', parseInt(value))} min={1000} max={10000} />
                    <small className="bsb_field_hint">{__('How long each slide holds before the next one comes in, in milliseconds. 1000 is one second.', 'b-slider')}</small>

                    <ToggleControl className='mt10' label={__('Pause on Mouse over', 'b-slider')} checked={options.pause} onChange={(value) => updateObject('options', 'pause', value)} />
                </>}

                {/* Already inside `isDefault`, so both toggles apply. */}
                {visibilityToggles('mt20')}

                <ProNotice features={PRO_FEATURES.sliderOptions} />
            </PanelBody>
        </>}

        {(isDefault && indicator.visibility) && <PanelBody className='bPlPanelBody' title={__('Indicators', 'b-slider')} initialOpen={false}>

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