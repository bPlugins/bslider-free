import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { SelectControl, ToggleControl, __experimentalUnitControl as UnitControl, __experimentalBoxControl as BoxControl, __experimentalNumberControl as NumberControl, RangeControl, BorderControl, PanelRow } from "@wordpress/components";
import { PanelBody } from '../../../Panel/AccordionPanel';
import { produce } from 'immer';

import { ColorControl, ColorsControl, Typography } from '../../../../../../bpl-tools/Components';

import { BDevice } from '../../../../../../bpl-tools/Components/Deprecated';
import { BControlPro } from '../../../../../../bpl-tools/ProControls';
import { contentAniOption, emUnit, perUnit, pxUnit, styles, vhUnit } from '../../../../utils/options';
import { isProActive } from '../../../../utils/functions';
import ProCard from '../../../Panel/ProCard';
import { PremiumBadge } from '../../../../../../bpl-tools/ProControls';

const DefaultStyle = ({ attributes, setAttributes, updateObject, premiumProps }) => {
    const isPro = premiumProps?.isPremium ?? isProActive();

    const [DArrowWidth, setDArrowWidth] = useState('desktop');
    const [DArrowHeight, setDArrowHeight] = useState('desktop');

    const { layoutType, titleTypo, titleColor, descTypo, descColor, titleMargin, descMargin, SliderOverly, borderRadius, margin, deviceArrowWidth, arrowHeight, deviceArrowHeight, arrowRadius, btnColors, btnHovColors, btnTypo, btnPadding, btnBorder, btnRadius, titleAnimation, descAnimation, btnAnimation, arrow, arrowWidth, indicator, arrowBorder, sourceType, likesCommentsColor, likesCommentsTypo, playIconColor, playIconBg, playIconHoverBg, cardLayout, cardBgColor, cardPadding, cardRadius, title, desc, button, caption, socialQuery } = attributes;

    return <>
        <PanelBody className='bPlPanelBody' title={__('Slider', 'b-slider')} initialOpen={false}>
            {!cardLayout && layoutType !== 'thumbnails' && (
                <ColorControl className='mb20' label={__('Overly Color', 'b-slider')} value={SliderOverly} defaultColor="#59595952" onChange={(val) => { setAttributes({ SliderOverly: val }) }} />
            )}

            {(layoutType !== "carousel" && layoutType !== "grid" && layoutType !== "post_thumbnails") && <>
                <BControlPro className='mt20' label={__('Margin', 'b-slider')} values={margin} onChange={val => setAttributes({ margin: val })} resetValues={{ top: '0px', right: '0px', bottom: '0px', left: '0px' }} units={[pxUnit(3)]} Component={BoxControl} {...premiumProps} />
            </>}

            <BoxControl className='mt20' label={__('Border Radius', 'b-slider')} values={borderRadius} onChange={val => setAttributes({ borderRadius: val })} resetValues={{ top: '0px', right: '0px', bottom: '0px', left: '0px' }} units={[pxUnit(3), emUnit(2)]} />
        </PanelBody>


        {title?.isVisible !== false && (
            <PanelBody className='bPlPanelBody' title={__('Title', 'b-slider')} initialOpen={false}>
                <Typography className='mt20 mb10' label={__('Typography:', 'b-slider')} value={titleTypo} onChange={val => setAttributes({ titleTypo: val })} defaults={{ fontSize: 25 }} produce={produce} />

                <ColorControl className='mb20' label={__('Color', 'b-slider')} value={titleColor} defaultColor="#fff" onChange={val => setAttributes({ titleColor: val })} />

                <BoxControl label={__('Padding', 'b-slider')} values={titleMargin} onChange={val => setAttributes({ titleMargin: val })} resetValues={{ top: '0px', left: '0px', right: '0px', bottom: '0px' }} />

                {
                    (layoutType !== "carousel" && layoutType !== "grid" && layoutType !== "post_thumbnails") && <>
                        <BControlPro className='mt20' label={__('Animation', 'b-slider')} value={titleAnimation?.effect} labelPosition='left' onChange={(val) => { updateObject('titleAnimation', 'effect', val) }} options={contentAniOption} Component={SelectControl} {...premiumProps} />

                        <BControlPro className='mb10 marginLeft' label={__('Delay(s)', 'b-slider')} labelPosition='left' value={titleAnimation?.delay} onChange={(val) => updateObject('titleAnimation', 'delay', parseFloat(val))} min={0.0} max={10} step={0.1} Component={NumberControl} {...premiumProps} />

                        <BControlPro className='mb10 mt20 marginLeft' label={__('Duration(s)', 'b-slider')} labelPosition='left' value={titleAnimation?.duration} onChange={(val) => updateObject('titleAnimation', 'duration', parseFloat(val))} min={0.0} max={10} step={0.1} Component={NumberControl} {...premiumProps} />
                    </>
                }
            </PanelBody>
        )}

        {desc?.isVisible !== false && (
            <PanelBody className='bPlPanelBody' title={__('Description', 'b-slider')} initialOpen={false}>
                <Typography className='mt20 mb10' label={__('Typography:', 'b-slider')} value={descTypo} onChange={val => setAttributes({ descTypo: val })} defaults={{ fontSize: 25 }} produce={produce} />

                <ColorControl className='mb20' label={__('Color', 'b-slider')} value={descColor} defaultColor="#000" onChange={val => { setAttributes({ descColor: val }) }} />

                <BoxControl label={__("Margin", 'b-slider')} values={descMargin} onChange={val => setAttributes({ descMargin: val })} resetValues={{ top: '0px', left: '0px', right: '0px', bottom: '0px' }} />

                {
                    (layoutType !== "carousel" && layoutType !== "grid" && layoutType !== "post_thumbnails") && <>
                        <BControlPro className='mt20' label={__('Animation', 'b-slider')} value={descAnimation?.effect} labelPosition='left' onChange={(val) => {
                            updateObject('descAnimation', 'effect', val)
                        }} options={contentAniOption} Component={SelectControl} {...premiumProps} />

                        <BControlPro className='mb10 marginLeft' label={__('Delay(s)', 'b-slider')} labelPosition='left' value={descAnimation?.delay} onChange={(val) => updateObject('descAnimation', 'delay', parseFloat(val))} min={0.0} max={10} step={0.1} Component={NumberControl} {...premiumProps} />

                        <BControlPro className='mb10 mt20 marginLeft' label={__('Duration(s)', 'b-slider')} labelPosition='left' value={descAnimation?.duration} onChange={(val) => updateObject('descAnimation', 'duration', parseFloat(val))} min={0.0} max={10} step={0.1} Component={NumberControl} {...premiumProps} />
                    </>
                }
            </PanelBody>
        )}

        {sourceType === 'social' && socialQuery?.showLikesComments && (
            <PanelBody className='bPlPanelBody' title={__('Likes & Comments', 'b-slider')} badge={__('New', 'b-slider')} initialOpen={false}>
                <Typography className='mt20 mb10' label={__('Typography:', 'b-slider')} value={likesCommentsTypo} onChange={val => setAttributes({ likesCommentsTypo: val })} defaults={{ fontSize: 14 }} produce={produce} />

                <ColorControl className='mb20' label={__('Color', 'b-slider')} value={likesCommentsColor} defaultColor="" onChange={val => setAttributes({ likesCommentsColor: val })} />
            </PanelBody>
        )}

        {sourceType === 'social' && !['rss', 'json'].includes(socialQuery?.feedType) && (
            <PanelBody className='bPlPanelBody' title={__('Play Button', 'b-slider')} badge={__('New', 'b-slider')} initialOpen={false}>
                <ColorControl className='mb20' label={__('Icon Color', 'b-slider')} value={playIconColor} defaultColor="" onChange={val => setAttributes({ playIconColor: val })} />
                <ColorControl className='mb20' label={__('Background Color', 'b-slider')} value={playIconBg} defaultColor="" onChange={val => setAttributes({ playIconBg: val })} />
                <ColorControl className='mb20' label={__('Hover Background Color', 'b-slider')} value={playIconHoverBg} defaultColor="" onChange={val => setAttributes({ playIconHoverBg: val })} />
            </PanelBody>
        )}

        {caption?.display !== 'hover' && cardLayout === true && (
            <PanelBody
                className='bPlPanelBody'
                title={__('Card Settings', 'b-slider')}
                initialOpen={false}
                badge={!isPro ? <PremiumBadge /> : __('New', 'b-slider')}
            >
                {isPro ? (
                    <>
                        <ToggleControl
                            label={__('Enable Card Layout', 'b-slider')}
                            checked={!!cardLayout}
                            onChange={val => setAttributes({ cardLayout: val })}
                        />

                        {cardLayout && (
                            <>
                                <ColorControl className='mb20 mt20' label={__('Card Background', 'b-slider')} value={cardBgColor} defaultColor="" onChange={val => setAttributes({ cardBgColor: val })} />

                                <BoxControl className='mt20' label={__('Card Padding', 'b-slider')} values={cardPadding} onChange={val => setAttributes({ cardPadding: val })} resetValues={{ top: '16px', right: '16px', bottom: '16px', left: '16px' }} />

                                <BoxControl className='mt20' label={__('Card Border Radius', 'b-slider')} values={cardRadius} onChange={val => setAttributes({ cardRadius: val })} resetValues={{ top: '8px', right: '8px', bottom: '8px', left: '8px' }} />
                            </>
                        )}
                    </>
                ) : (
                    <ProCard
                        title={__('Card Settings & Layout', 'b-slider')}
                        description={__('Enable beautiful card layouts for your slides to separate text content from images with custom background, padding, and border radius.', 'b-slider')}
                    />
                )}
            </PanelBody>
        )}

        {button?.isVisible !== false && (
            <PanelBody className='bPlPanelBody' title={__('Button', 'b-slider')} initialOpen={false}>

                <BControlPro className='mt20' label={__('Typography:', 'b-slider')} value={btnTypo} onChange={val => setAttributes({ btnTypo: val })} defaults={{ fontSize: 14 }} Component={Typography} {...premiumProps} produce={produce} />

                <BControlPro className='' label={__('Colors', 'b-slider')} value={btnColors} onChange={val => setAttributes({ btnColors: val })} defaults={{ color: '#fff', bg: '' }} Component={ColorsControl} {...premiumProps} />

                <BControlPro className='' label={__('Hover Colors', 'b-slider')} value={btnHovColors} onChange={val => setAttributes({ btnHovColors: val })} defaults={{ color: '#000', bg: '#fff' }} Component={ColorsControl} {...premiumProps} />

                <BControlPro label={__('Padding', 'b-slider')} values={btnPadding} onChange={val => setAttributes({ btnPadding: val })} resetValues={{
                    top: '0px', left: '0px', right: '0px', bottom: '0px'
                }} Component={BoxControl} {...premiumProps} />

                <BControlPro className='mt10' label={__('Border', 'b-slider')} value={btnBorder} onChange={(val) => setAttributes({ btnBorder: val })} Component={BorderControl} {...premiumProps} />

                <BControlPro className='mt20' label={__('Radius:', 'b-slider')} labelPosition='left' value={btnRadius} onChange={val => setAttributes({ btnRadius: val })} units={[pxUnit(10), perUnit(100)]} isResetValueOnUnitChange={true} Component={UnitControl} {...premiumProps} />
                {
                    (layoutType !== "carousel" && layoutType !== "grid" && layoutType !== "post_thumbnails") && <>
                        <BControlPro className='mt20' label={__('Animation', 'b-slider')} value={btnAnimation?.effect} labelPosition='left' onChange={(val) => {
                            updateObject('btnAnimation', 'effect', val)
                        }} options={contentAniOption} Component={SelectControl} {...premiumProps} />

                        <BControlPro className='mb10 marginLeft' label={__('Delay(s)', 'b-slider')} labelPosition='left' value={btnAnimation?.delay} onChange={(val) => updateObject('btnAnimation', 'delay', parseFloat(val))} min={0.0} max={10} step={0.1} Component={NumberControl} {...premiumProps} />

                        <BControlPro className='mb10 mt20 marginLeft' label={__('Duration(s)', 'b-slider')} labelPosition='left' value={btnAnimation?.duration} onChange={(val) => updateObject('btnAnimation', 'duration', parseFloat(val))} min={0.0} max={10} step={0.1} Component={NumberControl} {...premiumProps} />
                    </>
                }
            </PanelBody>
        )}

        {(layoutType !== "grid") && <>

            {arrow.visibility && <PanelBody className='bPlPanelBody' title={__('Arrow', 'b-slider')} initialOpen={false}>
                <RangeControl className='mt20' label={__('Icon Size', 'b-slider')} value={arrow.size} onChange={(value) => {
                    updateObject('arrow', 'size', value)
                }} min={1} max={100} />

                <PanelRow className='mt0'>
                    <p></p>
                    <BControlPro device={DArrowWidth} onChange={val => setDArrowWidth(val)} Component={BDevice} {...premiumProps} />
                </PanelRow>

                <UnitControl className='mb0' label={__('Width', 'b-slider')} labelPosition='left' value={deviceArrowWidth[DArrowWidth] || arrowWidth} onChange={val => { setAttributes({ deviceArrowWidth: { ...deviceArrowWidth, [DArrowWidth]: val } }) }} units={[pxUnit(400), vhUnit(30)]} isResetValueOnUnitChange={true} beforeIcon='grid-view' />

                <PanelRow className=''>
                    <p></p>
                    <BControlPro device={DArrowHeight} onChange={val => setDArrowHeight(val)} Component={BDevice} {...premiumProps} />
                </PanelRow>

                <UnitControl className='' label={__('Height', 'b-slider')} labelPosition='left' value={deviceArrowHeight[DArrowHeight] || arrowHeight} onChange={val => { setAttributes({ deviceArrowHeight: { ...deviceArrowHeight, [DArrowHeight]: val } }) }} units={[pxUnit(400), vhUnit(30)]} isResetValueOnUnitChange={true} beforeIcon='grid-view' />

                {/* The same value `block.json` gives `arrow.bg`, and it has to be: this is what the
                    control resets to, so a different one here would make "reset" mean something the
                    block's own default does not. It was `transparent` on both sides until the arrows
                    were given a disc to sit on. */}
                <ColorsControl className='mt10' label={__('Background', 'b-slider')} value={arrow}
                    onChange={val => setAttributes({ arrow: { ...arrow, ...val } })} defaults={{ bg: 'rgba(17, 17, 17, 0.55)' }} isColor={false} />

                <BorderControl className='mt10' label={__("Border", 'b-slider')} value={arrowBorder} onChange={val => setAttributes({ arrowBorder: val })} />

                <BoxControl className='mt10' label={__("Border Radius", 'b-slider')} values={arrowRadius} onChange={val => setAttributes({ arrowRadius: val })} resetValues={{ top: '0px', left: '0px', right: '0px', bottom: '0px' }} />

            </PanelBody>}
        </>}

        {(layoutType !== "grid" && layoutType !== "thumbnails" && indicator?.visibility) && <>
            <PanelBody className='bPlPanelBody' title={__('Indicators', 'b-slider')} initialOpen={false}>

                {indicator?.type !== 'image' && <>
                    {
                        (layoutType === 'default' || layoutType === 'carousel') && <SelectControl className='mt20' label={__('Style', 'b-slider')} labelPosition='left' value={indicator.style}
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
                </>}

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