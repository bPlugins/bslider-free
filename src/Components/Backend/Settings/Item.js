import { __ } from '@wordpress/i18n';
import { TextControl, TextareaControl, ToggleControl } from "@wordpress/components";
import { InlineDetailMediaUpload, Label } from '../../../../../bpl-tools/Components';
import { BControlPro } from '../../../../../bpl-tools/ProControls';
import { isPostSource, updateArrayItem } from '../../../utils/functions';

const Item = ({ attributes, setAttributes, arrKey, index, setActiveIndex = false, premiumProps }) => {
    const { sourceType } = attributes;
    const sliders = attributes[arrKey];
    const { title, img, video, desc, btnLabel, btnUrl, target, altText, } = sliders[index];

    const updateSlider = (type, val, childType = false) => {
        setAttributes({ [arrKey]: updateArrayItem(sliders, index, type, val, childType) });
    }

    return <>
        <div key={index} className="components_button_main" onClick={() => setActiveIndex(index)}>
            <Label className="mt10" >{__('Slide', 'b-slider')} {sourceType === 'video' ? 'Video' : 'Image'}</Label>

            {sourceType === 'video' && <InlineDetailMediaUpload className='mt10' value={video} types={['video']} onChange={val => updateSlider('video', val)} placeholder={__('Enter Video URL', 'b-slider')} />}

            <InlineDetailMediaUpload label={`${sourceType === 'video' ? 'Poster Url' : ''}`} value={img} types={['image']} onChange={val => updateSlider('img', val)} placeholder={__('Enter Image URL', 'b-slider')} />

            {(!isPostSource(sourceType) && sourceType !== 'video') && <>
                <TextControl label={__("Image Alt", 'b-slider')} labelPosition={__('top', 'b-slider')} value={altText != null ? altText : img?.caption || img?.title} placeholder={__('Enter Image Alt Text', 'b-slider')} onChange={val => updateSlider('altText', val)} />

                <TextControl label={__("Title", 'b-slider')} labelPosition={__('top', 'b-slider')} value={title} placeholder={__('Enter Title', 'b-slider')} onChange={val => updateSlider('title', val)} />

                <TextareaControl label={__("Description", 'b-slider')} labelPosition={__('top', 'b-slider')} value={desc} placeholder={__('Enter desc', 'b-slider')} onChange={val => updateSlider('desc', val)} />

                {/**
                 * The slide's own button, shown locked rather than left out.
                 *
                 * `pro-features` listed these three as `slides` all along and no panel drew them, so
                 * the free build simply had no button on an image slide and nothing saying where it
                 * went — while a post or WooCommerce slide draws one from `button.text`, the Style tab
                 * offers a Premium `Button` panel, and `.carousel-button` is in the stylesheet. What
                 * is Premium is the per-slide label, link and target, which is what these are.
                 *
                 * `BControlPro` is the form that fits: it draws the real control with a Pro tag and
                 * sends a click to the pricing modal instead of `onChange`, so nothing is written to
                 * `sliders` — the free build has no reader for these keys, and a value saved into one
                 * would be invisible either way.
                 */}
                <BControlPro label={__('Button label', 'b-slider')} labelPosition={__('top', 'b-slider')} value={btnLabel} placeholder={__('Enter Label', 'b-slider')} onChange={val => updateSlider('btnLabel', val)} Component={TextControl} {...premiumProps} />

                <BControlPro label={__('Button Url', 'b-slider')} labelPosition={__('top', 'b-slider')} value={btnUrl} placeholder={__('Enter Url', 'b-slider')} onChange={val => updateSlider('btnUrl', val)} Component={TextControl} {...premiumProps} />

                <BControlPro className='mt20' label={__('Open in new tab', 'b-slider')} checked={target} onChange={val => updateSlider('target', val)} Component={ToggleControl} {...premiumProps} />
            </>}
        </div>
    </>
}
export default Item;