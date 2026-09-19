import { __ } from '@wordpress/i18n';
import { SelectControl, __experimentalUnitControl as UnitControl, __experimentalNumberControl as NumberControl, ToggleControl, PanelRow, RangeControl } from "@wordpress/components";
import { PanelBody } from '../../../Panel/AccordionPanel';
import { emUnit, perUnit, caroDirectionOpt, carouselStyOpt, contentPosition, animationFreeOptions, indicatorOption, indicatorOptions, vhUnit } from '../../../../utils/options';

import { BtnGroup, Label } from '../../../../../../bpl-tools/Components';
import { pxUnit } from '../../../../../../bpl-tools/utils/options';
import { BDevice } from '../../../../../../bpl-tools/Components/Deprecated';
import Controls from './Carousel/Controls';
import LightboxSettings from '../../../../Blocks/Slide/Panels/LightboxSettings';
import ProNotice from '../../../Panel/ProNotice';
import { PRO_FEATURES } from '../../../../utils/pro-features';
import { VideoHelpLink, videoLabels } from '../../../../utils/videos';

import { AlignmentMatrixControl } from '@wordpress/components';
import { checkDirection, isDefaultLayout } from '../../../../utils/functions';

const DefaultGeneral = ({ attributes, setAttributes, updateObject, device, setDevice }) => {

    const { layoutType, titleFCaption, options, arrow, indicator, carousel, columns, rowGap, columnGap, position, animation, sliderHeight, height, sourceType, image, lightbox } = attributes;
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

        {/* A slide's title, which a `blocks` slider does not have: its slides carry whatever
            blocks the user put in them, so there is no one element for a tag to apply to and no
            caption to import from. */}
        {'blocks' !== sourceType && <>
        <PanelBody className='bPlPanelBody' title={__('Title', 'b-slider')} initialOpen={false}>

            <ToggleControl className='mt10' label={__('Import Title From Media Caption', 'b-slider')} checked={titleFCaption} onChange={(val) => setAttributes({ titleFCaption: val })} />

            <ProNotice features={PRO_FEATURES.title} />

        </PanelBody>
        </>}

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

            {/* Not for `blocks`: it has no caption to place. Its slides return early in
                Default.js, before the `captionContent` class this writes is ever built, and a
                slide's own content is positioned by the Slide block's Align content / Vertical
                position instead. */}
            {'blocks' !== sourceType && <SelectControl label={__('Content Position:', 'b-slider')} labelPosition='left' value={position} options={contentPosition} onChange={(val) => { setAttributes({ position: val }) }} />}

            {/* Height define option  */}
            <PanelRow className='bsb_device_row mt20'>
                <Label className='mb0'>{layoutType === 'grid' ? __('Item Height:', 'b-slider') : __('Slider Height:', 'b-slider')}</Label>
                <BDevice device={device} onChange={val => setDevice(val)} />
            </PanelRow>

            {/* A `blocks` slider is as tall as the blocks in it until someone says otherwise, so
                the field starts empty and says so — showing `height`'s 450px default there would
                claim a value nobody chose and leave no way to ask for auto. Every other source
                crops a picture into a fixed box and has always had a height, so those keep the
                default in the field. */}
            <UnitControl className='mb0' value={sourceType === 'blocks' ? sliderHeight[device] : (sliderHeight[device] || height)} placeholder={sourceType === 'blocks' ? __('Auto', 'b-slider') : undefined} onChange={val => { setAttributes({ sliderHeight: { ...sliderHeight, [device]: val } }) }} units={[pxUnit(400), vhUnit(30)]} isResetValueOnUnitChange={true} beforeIcon='grid-view' />
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

        {/**
          * Everything the lightbox does, in one panel.
          *
          * **The toolbar switches are all on by default, which is not the usual rule for a new
          * setting.** Fancybox v5 ships its toolbar enabled, so every one of them is already in the
          * video lightbox before any of them was a switch — see `Toolbar` in `config.js`. Defaulting
          * them off would take working controls away from every site that has them rather than add
          * anything. Every read is `!== false`, so a slider saved before the keys existed keeps what
          * it had.
          *
          * `close` is deliberately not a switch — a lightbox with no close button is a trap on a touch
          * device, where Esc does not exist and the backdrop is a guess.
          *
          * **Not for `blocks`.** A slide built from blocks carries no `data-fancybox` of its own: its
          * lightbox exists only where an author set some layer to "On click → Open Lightbox" in
          * Hover & Click, so the settings live in that panel now, beside the dropdown that brings the
          * lightbox into being — see `InteractivityPanel`. They still write the attribute below;
          * only the controls moved.
          */}
        {'blocks' !== sourceType && <PanelBody className='bPlPanelBody' title={__('Lightbox', 'b-slider')} badge={__('New', 'b-slider')} initialOpen={false}>
            {/* At the head of the panel, above the switch that brings the lightbox into being, since
                the video covers the whole of it rather than any one toggle in it. */}
            <VideoHelpLink video='lightbox' label={videoLabels.lightbox()} />

            {/**
              * Whether a click on the picture opens the lightbox.
              *
              * `lightbox` is a value the removed `Clicking the picture` dropdown never wrote, so a
              * slider saved with `none` or `button` — or with nothing at all — reads as the link and
              * behaves exactly as it did. That is what keeps this off for every existing slider
              * without needing a `false` of its own.
              */}
            {['image', 'posts', 'woo'].includes(sourceType) && <ToggleControl
                className='mt10'
                label={__('Lightbox on click', 'b-slider')}
                checked={'lightbox' === image?.link}
                /* Off writes `link` rather than clearing the key: `none` is what the removed dropdown
                   wrote for "do nothing", and putting that back would name an outcome this switch
                   cannot produce. Anything that is not `lightbox` reads as the link. */
                onChange={val => updateObject('image', 'link', val ? 'lightbox' : 'link')}
            />}

            {/**
              * The rest of the panel, and only where a lightbox can actually open.
              *
              * An image, post or product slider opens one only when the picture is set to — so with
              * `Lightbox on click` off there is no lightbox and nothing for these to configure. A
              * video slider is the other case: its slides carry `data-fancybox` outright, so it never
              * asks that switch and its toolbar has to stay reachable.
              *
              * A free build has no per-slide override, so the slider's own switch is the whole answer
              * here — which is what lets this be a plain check rather than a search through the
              * slides.
              */}
            {(!['image', 'posts', 'woo'].includes(sourceType) || 'lightbox' === image?.link) && <LightboxSettings
                lightbox={lightbox}
                setLightbox={changes => setAttributes({ lightbox: { ...lightbox, ...changes } })}
                sourceType={sourceType}
            />}

            <ProNotice features={PRO_FEATURES.lightbox} />
        </PanelBody>}

        {(isDefault && indicator.visibility) && <PanelBody className='bPlPanelBody' title={__('Indicators', 'b-slider')} initialOpen={false}>

            {/* Not for `blocks`: the other type is `image`, a dot showing the slide's own picture,
                and a slide built from blocks has no one picture to stand for it — see
                ImageIndicators/SourceType/Blocks, which draws plain dots for that reason. Leaving
                the choice on show offered a type that rendered the same as Default. */}
            {'blocks' !== sourceType && <SelectControl className='mt10' label={__('Type', 'b-slider')} value={indicator?.type} labelPosition='left' onChange={(val) => setAttributes({
                indicator: {
                    ...indicator,
                    type: val,
                    width: 'image' === val ? '80px' : '30px',
                    height: 'image' === val ? '80px' : '3px',
                    radius: 'image' === val ? '50%' : '0px',
                    moveFromEdge: 'image' === val ? '50%' : '-15px',
                }
            })} options={indicatorOption} />}

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