import { __ } from '@wordpress/i18n';
import { PanelBody, SelectControl, __experimentalUnitControl as UnitControl, __experimentalNumberControl as NumberControl, ToggleControl, PanelRow, RangeControl } from "@wordpress/components";
import { emUnit, perUnit, caroDirectionOpt, carouselStyOpt, contentPosition, animationFreeOptions, indicatorOption, indicatorOptions, vhUnit } from '../../../../utils/options';

import { BtnGroup, Label, Notice } from '../../../../../../bpl-tools/Components';
import { pxUnit } from '../../../../../../bpl-tools/utils/options';
import { BDevice } from '../../../../../../bpl-tools/Components/Deprecated';
import Controls from './Carousel/Controls';

import { AlignmentMatrixControl } from '@wordpress/components';
import { checkDirection } from '../../../../utils/functions';

const DefaultGeneral = ({ attributes, setAttributes, updateObject, device, setDevice }) => {

    const { layoutType, titleFCaption, options, arrow, indicator, carousel, columns, rowGap, columnGap, sourceType, position, animation, sliderHeight, height } = attributes;
    const { carouselStyle, reverseDirection, caroDirection } = carousel;


    return <>

        <PanelBody className='bPlPanelBody' title={__('Title', 'b-slider')} initialOpen={false}>

            <ToggleControl className='mt10' label={__('Import Title From Media Caption', 'b-slider')} checked={titleFCaption} onChange={(val) => setAttributes({ titleFCaption: val })} />

            <Notice status='premium' isIcon={true}>{__('Custom HTML wrapper tags (e.g., h1-h6) are available in the Premium version.', 'b-slider')}</Notice>

        </PanelBody>

        {
            layoutType === "carousel" && <PanelBody className='bPlPanelBody' title={__('Controls', 'b-slider')} initialOpen={false}>

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

                <Notice status='premium' isIcon={true}>{__('Carousel Style (Ticker, Grid, 3D Carousel), Effect(Default, Cards,Coverflow), Mouse Wheel, Grab Cursor settings are available in the Premium version.', 'b-slider')}</Notice>
            </PanelBody>
        }

        <PanelBody className='' title={__('Layout Settings', 'b-slider')} initialOpen={false}>
            {
                (layoutType === "grid" || layoutType === "carousel" || layoutType === "thumbnails") && <>
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
            {layoutType === 'grid' && <UnitControl className='mt20' label={__('Row Gap:', 'b-slider')} labelPosition='left' value={rowGap} onChange={val => setAttributes({ rowGap: val })} units={[pxUnit(40), perUnit(3), emUnit(2.5)]} isResetValueOnUnitChange={true} />}

            <SelectControl label={__('Content Position:', 'b-slider')} labelPosition='left' value={position} options={contentPosition} onChange={(val) => { setAttributes({ position: val }) }} />

            {/* Height define option  */}
            <PanelRow className='mt20'>
                <Label mt='0'>{__('Height:', 'b-slider')}</Label>
                <BDevice label={__('Slider Height')} device={device} onChange={val => setDevice(val)} />
            </PanelRow>

            <UnitControl className='mb20' label={`${layoutType === 'grid' ? 'Item' : 'Slider'} Height`} labelPosition='left' value={sliderHeight[device] || height} onChange={val => { setAttributes({ sliderHeight: { ...sliderHeight, [device]: val } }) }} units={[pxUnit(400), vhUnit(30)]} isResetValueOnUnitChange={true} beforeIcon='grid-view' />

            <Notice status='premium' isIcon={true}>{__('Slide Direction-(Horizontal and vertical), Arrow Styles, are available in the Premium version.', 'b-slider')}</Notice>
        </PanelBody>

        {(layoutType !== "carousel" && layoutType !== "grid" && layoutType !== "thumbnails") && <>
            <PanelBody className='' title={__('Slider Options', 'b-slider')} initialOpen={false}>

                <PanelRow>
                    <Label className='mb0'>{__('Animation/Effect:', 'b-slider')}</Label>
                    <BtnGroup value={animation} onChange={val => setAttributes({ animation: val })} options={animationFreeOptions} />
                </PanelRow>

                <ToggleControl className='mt20' label={__('Autoplay', 'b-slider')} checked={options.ride} onChange={(value) => updateObject('options', 'ride', value)} />

                {options.ride && <>
                    <NumberControl className='mb10' label={__('Interval(ms)', 'b-slider')} labelPosition='left' value={options.interval} onChange={(value) => updateObject('options', 'interval', parseInt(value))} min={1000} max={10000} />

                    <ToggleControl className='mt10' label={__('Pause on Mouse over', 'b-slider')} checked={options.pause} onChange={(value) => updateObject('options', 'pause', value)} />
                </>}

                <ToggleControl className='mt20' label={__('Show Arrow/Navigation', 'b-slider')} checked={arrow.visibility} onChange={(value) => { updateObject('arrow', 'visibility', value) }} />
                {
                    (layoutType !== "carousel" && layoutType !== "grid" && layoutType !== "thumbnails") && <ToggleControl className='mt10' label={__('Show Indicators/Pagination', 'b-slider')} checked={indicator.visibility} onChange={(value) => updateObject('indicator', 'visibility', value)} />
                }

                <Notice status='premium' isIcon={true}>{__('Slide On MouseWheel, Slide on Mouse Drag, Arrow Follow Mouse and Lazy Load Enable options are available in the Premium version.', 'b-slider')}</Notice>
            </PanelBody>
        </>}

        {((layoutType !== "carousel" && layoutType !== "grid" && layoutType !== "thumbnails") && indicator.visibility) && <PanelBody className='bPlPanelBody' title={__('Indicators', 'b-slider')} initialOpen={false}>

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

            <Notice status='premium' isIcon={true}>{__('Move From Edge option is available in the Premium version.', 'b-slider')}</Notice>
        </PanelBody>}
    </>
}
export default DefaultGeneral;