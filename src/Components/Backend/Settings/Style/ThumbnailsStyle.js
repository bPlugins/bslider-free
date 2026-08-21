import { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { __experimentalUnitControl as UnitControl, PanelRow, SelectControl, BorderControl } from "@wordpress/components";
import { PanelBody } from '../../../Panel/AccordionPanel';
import { ColorControl, Label } from '../../../../../../bpl-tools/Components';
import { BDevice } from '../../../../../../bpl-tools/Components/Deprecated';
import { perUnit, pxUnit, thumbnailsPositionOpt, vhUnit } from '../../../../utils/options';
import { BControlPro } from '../../../../../../bpl-tools/ProControls';

const ThumbnailsStyle = ({ attributes, setAttributes, multipleAttrChange, premiumProps }) => {
    const { thumbnails } = attributes;
    const { overly = {}, height = {}, position = {}, width = {}, active } = thumbnails;
    const [device, setDevice] = useState('desktop');

    return <>
        <PanelBody className='bPlPanelBody' title={__('Thumbnails', 'b-slider')} initialOpen={false}>
            <ColorControl className='mb20' label={__('Overly Color', 'b-slider')} value={overly?.color} defaultColor="" onChange={(val) => { multipleAttrChange('thumbnails', 'overly', 'color', val) }} />

            <BControlPro className='mb20' label={__('Position', 'b-slider')} value={position?.desktop} options={thumbnailsPositionOpt} onChange={val => multipleAttrChange('thumbnails', 'position', 'desktop', val)} Component={SelectControl} {...premiumProps} />

            {(position?.desktop === "top" || position?.desktop === "bottom") && <>
                <PanelRow className='mt20'>
                    <Label mt='0'>{__('Height:', 'b-slider')}</Label>
                    <BControlPro label={__('Slider Height', 'b-slider')} device={device} onChange={val => setDevice(val)} Component={BDevice} {...premiumProps} />
                </PanelRow>

                <BControlPro className='mb20' label={__('Height', 'b-slider')} labelPosition='left' value={height[device]} onChange={val => { setAttributes({ thumbnails: { ...thumbnails, height: { ...height, [device]: val } }, }) }} units={[pxUnit(400), vhUnit(30)]} isResetValueOnUnitChange={true} beforeIcon='grid-view' Component={UnitControl} {...premiumProps} />
            </>}

            {
                (position?.desktop === "left" || position?.desktop === "right") && <>
                    <PanelRow className='mt20'>
                        {/* A spacer that lines the device switcher up with the labelled rows.
                            It held `__(' ')`, which asked translators to translate a space. */}
                        <Label mt='0'>{' '}</Label>
                        <BControlPro label={__('Width', 'b-slider')} device={device} onChange={val => setDevice(val)} Component={BDevice} {...premiumProps} />
                    </PanelRow>
                    <BControlPro className='mb20' label={__('Width', 'b-slider')} labelPosition='left' value={width[device]} onChange={val => { setAttributes({ thumbnails: { ...thumbnails, width: { ...width, [device]: val } }, }) }} units={[perUnit(20)]} isResetValueOnUnitChange={true} beforeIcon='grid-view' Component={UnitControl} {...premiumProps} />
                </>
            }

        </PanelBody>

        <PanelBody className='bPlPanelBody' title={__('Thumbnails Active', 'b-slider')} initialOpen={false}>
            <BControlPro className='mb20' label={__('Overly Color', 'b-slider')} value={active?.color} defaultColor="" onChange={(val) => { multipleAttrChange('thumbnails', 'active', 'color', val) }} Component={ColorControl} {...premiumProps} />

            <BControlPro className='mt10' label={__("Border", 'b-slider')} value={active?.border} onChange={val => { multipleAttrChange('thumbnails', 'active', 'border', val) }} Component={BorderControl} {...premiumProps} />
        </PanelBody>
    </>
}
export default ThumbnailsStyle;