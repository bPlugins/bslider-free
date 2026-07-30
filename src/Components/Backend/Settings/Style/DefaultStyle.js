import { __ } from '@wordpress/i18n';
import { produce } from 'immer';
import { __experimentalUnitControl as UnitControl, __experimentalBoxControl as BoxControl, RangeControl, BorderControl, SelectControl, PanelRow } from "@wordpress/components";
import { PanelBody } from '../../../Panel/AccordionPanel';
import { useState } from 'react';

import { ColorControl, ColorsControl, Label, Typography } from '../../../../../../bpl-tools/Components';
import { emUnit, perUnit, pxUnit, styles, vhUnit } from '../../../../utils/options';
import ProNotice from '../../../Panel/ProNotice';
import ProPanel from '../../../Panel/ProPanel';
import { PRO_FEATURES } from '../../../../utils/pro-features';

import { BDevice } from '../../../../../../bpl-tools/Components/Deprecated';

const DefaultStyle = ({ attributes, setAttributes, updateObject }) => {

    const [DArrowWidth, setDArrowWidth] = useState('desktop');
    const [DArrowHeight, setDArrowHeight] = useState('desktop');

    const { layoutType, titleTypo, titleColor, descTypo, descColor, titleMargin, descMargin, SliderOverly, borderRadius, arrowRadius, arrow, indicator, arrowBorder, deviceArrowWidth, arrowHeight, deviceArrowHeight, arrowWidth } = attributes;

    return <>
        <PanelBody className='bPlPanelBody' title={__('Slider', 'b-slider')} initialOpen={false}>
            <ColorControl className='mb20' label={__('Overly Color', 'b-slider')} value={SliderOverly} defaultColor="#59595952" onChange={(val) => { setAttributes({ SliderOverly: val }) }} />
            <small className="bsb_field_hint">{__('Laid over the image, under the title and description. Use a transparent colour to keep the image readable.', 'b-slider')}</small>

            <BoxControl className='mt20' label={__('Border Radius', 'b-slider')} values={borderRadius} onChange={val => setAttributes({ borderRadius: val })} resetValues={{ top: '0px', right: '0px', bottom: '0px', left: '0px' }} units={[pxUnit(3), emUnit(2)]} />
            <ProNotice features={PRO_FEATURES.sliderStyle} />

        </PanelBody>


        <PanelBody className='bPlPanelBody' title={__('Title', 'b-slider')} initialOpen={false}>
            <Typography className='mt20 mb10' label={__('Typography:', 'b-slider')} value={titleTypo} onChange={val => setAttributes({ titleTypo: val })} defaults={{ fontSize: 25 }} produce={produce} />

            <ColorControl className='mb20' label={__('Color', 'b-slider')} value={titleColor} defaultColor="#fff" onChange={val => setAttributes({ titleColor: val })} />

            <BoxControl label={__('Padding', 'b-slider')} values={titleMargin} onChange={val => setAttributes({ titleMargin: val })} resetValues={{ top: '0px', left: '0px', right: '0px', bottom: '0px' }} />

            <ProNotice features={PRO_FEATURES.contentStyle} />
        </PanelBody>

        <PanelBody className='bPlPanelBody' title={__('Description', 'b-slider')} initialOpen={false}>
            <Typography className='mt20 mb10' label={__('Typography:', 'b-slider')} value={descTypo} onChange={val => setAttributes({ descTypo: val })} defaults={{ fontSize: 25 }} produce={produce} />

            <ColorControl className='mb20' label={__('Color', 'b-slider')} value={descColor} defaultColor="#000" onChange={val => { setAttributes({ descColor: val }) }} />

            <BoxControl label={__("Margin", 'b-slider')} values={descMargin} onChange={val => setAttributes({ descMargin: val })} resetValues={{ top: '0px', left: '0px', right: '0px', bottom: '0px' }} />

            <ProNotice features={PRO_FEATURES.contentStyle} />
        </PanelBody>



        <ProPanel title={__('Button', 'b-slider')} proTitle={__('Premium Button', 'b-slider')} features={PRO_FEATURES.buttonStyle} />


        {(layoutType !== "grid") && <>

            {arrow.visibility && <PanelBody className='bPlPanelBody' title={__('Arrow', 'b-slider')} initialOpen={false}>
                <RangeControl className='mt20' label={__('Icon Size', 'b-slider')} value={arrow.size} onChange={(value) => {
                    updateObject('arrow', 'size', value)
                }} min={1} max={100} />

                {/* The device switch belongs to the control under it, so it goes in that control's
                    heading row. It used to be pushed across by an empty `<p>`, which left the row
                    looking like a stray blank field. */}
                <PanelRow className='bsb_device_row mt20'>
                    <Label className='mb0'>{__('Width:', 'b-slider')}</Label>
                    <BDevice device={DArrowWidth} onChange={val => setDArrowWidth(val)} />
                </PanelRow>

                <UnitControl className='mb0' value={deviceArrowWidth[DArrowWidth] || arrowWidth} onChange={val => { setAttributes({ deviceArrowWidth: { ...deviceArrowWidth, [DArrowWidth]: val } }) }} units={[pxUnit(400), vhUnit(30)]} isResetValueOnUnitChange={true} beforeIcon='grid-view' />

                <PanelRow className='bsb_device_row mt20'>
                    <Label className='mb0'>{__('Height:', 'b-slider')}</Label>
                    <BDevice device={DArrowHeight} onChange={val => setDArrowHeight(val)} />
                </PanelRow>

                <UnitControl className='' value={deviceArrowHeight[DArrowHeight] || arrowHeight} onChange={val => { setAttributes({ deviceArrowHeight: { ...deviceArrowHeight, [DArrowHeight]: val } }) }} units={[pxUnit(400), vhUnit(30)]} isResetValueOnUnitChange={true} beforeIcon='grid-view' />
                <small className="bsb_field_hint">{__('Set per device. Tablet falls back to desktop, and mobile to tablet, wherever a size is left unset.', 'b-slider')}</small>

                <ColorsControl className='mt10' label={__('Background', 'b-slider')} value={arrow}
                    onChange={val => setAttributes({ arrow: { ...arrow, ...val } })} defaults={{ bg: 'transparent' }} isColor={false} />

                <BorderControl className='mt10' label={__("Border", "b-slider")} value={arrowBorder} onChange={val => setAttributes({ arrowBorder: val })} />

                <BoxControl className='mt10' label={__("Border Radius", 'b-slider')} values={arrowRadius} onChange={val => setAttributes({ arrowRadius: val })} resetValues={{ top: '0px', left: '0px', right: '0px', bottom: '0px' }} />

            </PanelBody>}
        </>}

        {(layoutType !== "grid" && layoutType !== "thumbnails" && indicator?.visibility) && <>
            <PanelBody className='bPlPanelBody' title={__('Indicators', 'b-slider')} initialOpen={false}>


                {(layoutType === 'default' || layoutType === 'carousel') && <SelectControl className='mt20' label={__('Style', 'b-slider')} labelPosition='left' value={indicator.style}
                    onChange={(val) => {
                        setAttributes({
                            indicator: {
                                ...indicator,
                                style: val,
                                width: 'dot' === val ? '10px' : '30px',
                                height: 'dot' === val ? '10px' : '3px',
                                radius: 'dot' === val ? '50%' : '0px'
                            }
                        });
                    }} options={styles}
                    __nextHasNoMarginBottom
                />}

                <ColorControl label={__('Color', 'b-slider')} value={indicator.color} defaultColor="#000" onChange={(val) => updateObject('indicator', 'color', val)} />

                <ColorControl label={__('Active Color', 'b-slider')} value={indicator.activeColor} defaultColor="#000" onChange={(val) => updateObject('indicator', 'activeColor', val)} />


                <UnitControl label={__('Width', 'b-slider')} labelPosition='left' value={indicator?.width} onChange={(val) => updateObject('indicator', 'width', val)} units={[pxUnit(10), emUnit(1)]} isResetValueOnUnitChange={true} />

                <UnitControl className='mt20' label={__('Height', 'b-slider')} labelPosition='left' value={indicator?.height} onChange={(val) => updateObject('indicator', 'height', val)} units={[pxUnit(10), emUnit(1)]} isResetValueOnUnitChange={true} />

                <UnitControl className='mt20' label={__('Radius:', 'b-slider')} labelPosition='left' value={indicator.radius}
                    onChange={val => updateObject('indicator', 'radius', val)} units={[pxUnit(10), perUnit(100)]} isResetValueOnUnitChange={true} />

                <BorderControl className='mt20' label={__('Active Border', 'b-slider')} value={indicator?.activeBorder} onChange={(val) => updateObject('indicator', 'activeBorder', val)} />
            </PanelBody>
        </>}
    </>
}
export default DefaultStyle;