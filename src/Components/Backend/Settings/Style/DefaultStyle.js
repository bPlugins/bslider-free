import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { SelectControl, ToggleControl, __experimentalUnitControl as UnitControl, __experimentalBoxControl as BoxControl, RangeControl, BorderControl, PanelRow } from "@wordpress/components";
import { PanelBody } from '../../../Panel/AccordionPanel';
import { produce } from 'immer';

import { ColorControl, ColorsControl, Label, Typography } from '../../../../../../bpl-tools/Components';

import { BDevice } from '../../../../../../bpl-tools/Components/Deprecated';
import { emUnit, perUnit, pxUnit, styles, vhUnit } from '../../../../utils/options';
import { isProActive } from '../../../../utils/functions';
import ProCard from '../../../Panel/ProCard';
import ProNotice from '../../../Panel/ProNotice';
import ProPanel from '../../../Panel/ProPanel';
import { PRO_FEATURES } from '../../../../utils/pro-features';
import { PremiumBadge } from '../../../../../../bpl-tools/ProControls';

const DefaultStyle = ({ attributes, setAttributes, updateObject, premiumProps }) => {
    const isPro = premiumProps?.isPremium ?? isProActive();

    const [DArrowWidth, setDArrowWidth] = useState('desktop');
    const [DArrowHeight, setDArrowHeight] = useState('desktop');

    const { layoutType, titleTypo, titleColor, descTypo, descColor, titleMargin, descMargin, SliderOverly, borderRadius, deviceArrowWidth, arrowHeight, deviceArrowHeight, arrowRadius, arrow, arrowWidth, indicator, arrowBorder, sourceType, likesCommentsColor, likesCommentsTypo, playIconColor, playIconBg, playIconHoverBg, cardLayout, cardBgColor, cardPadding, cardRadius, title, desc, button, caption, socialQuery } = attributes;

    return <>
        <PanelBody className='bPlPanelBody' title={__('Slider', 'b-slider')} initialOpen={false}>
            {!cardLayout && layoutType !== 'thumbnails' && (
                <ColorControl className='mb20' label={__('Overly Color', 'b-slider')} value={SliderOverly} defaultColor="#59595952" onChange={(val) => { setAttributes({ SliderOverly: val }) }} />
            )}

            <BoxControl className='mt20' label={__('Border Radius', 'b-slider')} values={borderRadius} onChange={val => setAttributes({ borderRadius: val })} resetValues={{ top: '0px', right: '0px', bottom: '0px', left: '0px' }} units={[pxUnit(3), emUnit(2)]} />

            {(layoutType !== "carousel" && layoutType !== "grid" && layoutType !== "post_thumbnails") && <ProNotice features={PRO_FEATURES.sliderStyle} />}
        </PanelBody>


        {title?.isVisible !== false && (
            <PanelBody className='bPlPanelBody' title={__('Title', 'b-slider')} initialOpen={false}>
                <Typography className='mt20 mb10' label={__('Typography:', 'b-slider')} value={titleTypo} onChange={val => setAttributes({ titleTypo: val })} defaults={{ fontSize: 25 }} produce={produce} />

                <ColorControl className='mb20' label={__('Color', 'b-slider')} value={titleColor} defaultColor="#fff" onChange={val => setAttributes({ titleColor: val })} />

                <BoxControl label={__('Padding', 'b-slider')} values={titleMargin} onChange={val => setAttributes({ titleMargin: val })} resetValues={{ top: '0px', left: '0px', right: '0px', bottom: '0px' }} />

                {(layoutType !== "carousel" && layoutType !== "grid" && layoutType !== "post_thumbnails") &&
                    <ProNotice features={PRO_FEATURES.contentStyle} />}
            </PanelBody>
        )}

        {desc?.isVisible !== false && (
            <PanelBody className='bPlPanelBody' title={__('Description', 'b-slider')} initialOpen={false}>
                <Typography className='mt20 mb10' label={__('Typography:', 'b-slider')} value={descTypo} onChange={val => setAttributes({ descTypo: val })} defaults={{ fontSize: 25 }} produce={produce} />

                <ColorControl className='mb20' label={__('Color', 'b-slider')} value={descColor} defaultColor="#000" onChange={val => { setAttributes({ descColor: val }) }} />

                <BoxControl label={__("Margin", 'b-slider')} values={descMargin} onChange={val => setAttributes({ descMargin: val })} resetValues={{ top: '0px', left: '0px', right: '0px', bottom: '0px' }} />

                {(layoutType !== "carousel" && layoutType !== "grid" && layoutType !== "post_thumbnails") &&
                    <ProNotice features={PRO_FEATURES.contentStyle} />}
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

        {/* Every control in this panel is Premium, so the whole panel is the upsell — no option is
            rendered. */}
        {button?.isVisible !== false && (
            <ProPanel title={__('Button', 'b-slider')} proTitle={__('Premium Button', 'b-slider')} features={PRO_FEATURES.buttonStyle} />
        )}

        {(layoutType !== "grid") && <>

            {arrow.visibility && <PanelBody className='bPlPanelBody' title={__('Arrow', 'b-slider')} initialOpen={false}>
                <RangeControl className='mt20' label={__('Icon Size', 'b-slider')} value={arrow.size} onChange={(value) => {
                    updateObject('arrow', 'size', value)
                }} min={1} max={100} />

                {/* The device switch belongs to the control under it, so it goes in that control's
                    heading row rather than being pushed across by an empty `<p>`, which left the row
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