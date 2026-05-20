import { __ } from '@wordpress/i18n';
import { produce } from 'immer';
import { PanelBody, __experimentalUnitControl as UnitControl, __experimentalBoxControl as BoxControl, RangeControl, BorderControl, SelectControl } from "@wordpress/components";

import { ColorControl, ColorsControl, Notice, Typography } from '../../../../../../bpl-tools/Components';
import { emUnit, perUnit, pxUnit, styles } from '../../../../utils/options';
import { PremiumBadge, PremiumPanel } from '../../../../../../bpl-tools/ProControls';

import { adminUrl } from '../../../../utils/functions';

const DefaultStyle = ({ attributes, setAttributes, updateObject }) => {

    const { layoutType, titleTypo, titleColor, descTypo, descColor, titleMargin, descMargin, SliderOverly, borderRadius, arrowRadius, arrow, indicator, arrowBorder } = attributes;

    return <>
        <PanelBody className='' title={__('Slider', 'b-slider')} initialOpen={false}>
            <ColorControl className='mb20' label={__('Overly Color', 'b-slider')} value={SliderOverly} defaultColor="#59595952" onChange={(val) => { setAttributes({ SliderOverly: val }) }} />

            <BoxControl className='mt20' label={__('Border Radius', 'b-slider')} values={borderRadius} onChange={val => setAttributes({ borderRadius: val })} resetValues={{ top: '0px', right: '0px', bottom: '0px', left: '0px' }} units={[pxUnit(3), emUnit(2)]} />
            <Notice status='premium' isIcon={true}>{__('Margin option is available in the Premium version.', 'b-slider')}</Notice>

        </PanelBody>


        <PanelBody className='' title={__('Title', 'b-slider')} initialOpen={false}>
            <Typography className='mt20 mb10' label={__('Typography:', 'b-slider')} value={titleTypo} onChange={val => setAttributes({ titleTypo: val })} defaults={{ fontSize: 25 }} produce={produce} />

            <ColorControl className='mb20' label={__('Color', 'b-slider')} value={titleColor} defaultColor="#fff" onChange={val => setAttributes({ titleColor: val })} />

            <BoxControl label={__('Padding', 'b-slider')} values={titleMargin} onChange={val => setAttributes({ titleMargin: val })} resetValues={{ top: '0px', left: '0px', right: '0px', bottom: '0px' }} />

            <Notice status='premium' isIcon={true}>{__('Animation, Delay, Duration settings are available in the Premium version.', 'b-slider')}</Notice>
        </PanelBody>

        <PanelBody className='' title={__('Description', 'b-slider')} initialOpen={false}>
            <Typography className='mt20 mb10' label={__('Typography:', 'b-slider')} value={descTypo} onChange={val => setAttributes({ descTypo: val })} defaults={{ fontSize: 25 }} produce={produce} />

            <ColorControl className='mb20' label={__('Color', 'b-slider')} value={descColor} defaultColor="#000" onChange={val => { setAttributes({ descColor: val }) }} />

            <BoxControl label={__("Margin", 'b-slider')} values={descMargin} onChange={val => setAttributes({ descMargin: val })} resetValues={{ top: '0px', left: '0px', right: '0px', bottom: '0px' }} />

            <Notice status='premium' isIcon={true}>{__('Animation, Delay, Duration settings are available in the Premium version.', 'b-slider')}</Notice>
        </PanelBody>



        <PanelBody className='bPlPanelBody' title={<> {__('Button', 'b-slider')}<PremiumBadge />
        </>} initialOpen={false}>
            <PremiumPanel title={__('Premium Button', 'b-slider')} description={__('Typography,Colors, Hover Colors, Padding, Border, Border Radius , Animation, Delay and Duration are available in the Premium version.', 'b-slider')} pricingUrl={adminUrl()} demoUrl='https://bplugins.com/products/b-slider/#demos' />
        </PanelBody>


        {(layoutType !== "grid") && <>

            {arrow.visibility && <PanelBody className='' title={__('Arrow', 'b-slider')} initialOpen={false}>
                <RangeControl className='mt20' label={__('Icon Size', 'b-slider')} value={arrow.size} onChange={(value) => {
                    updateObject('arrow', 'size', value)
                }} min={1} max={100} />

                <ColorsControl className='mt10' label={__('Background', 'b-slider')} value={arrow}
                    onChange={val => setAttributes({ arrow: { ...arrow, ...val } })} defaults={{ bg: 'transparent' }} isColor={false} />

                <BorderControl className='mt10' label={__("Border", "b-slider")} value={arrowBorder} onChange={val => setAttributes({ arrowBorder: val })} />

                <BoxControl className='mt10' label={__("Border Radius", 'b-slider')} values={arrowRadius} onChange={val => setAttributes({ arrowRadius: val })} resetValues={{ top: '0px', left: '0px', right: '0px', bottom: '0px' }} />

            </PanelBody>}
        </>}

        {(layoutType !== "grid" && layoutType !== "thumbnails" && indicator?.visibility) && <>
            <PanelBody className='' title={__('Indicators', 'b-slider')} initialOpen={false}>


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