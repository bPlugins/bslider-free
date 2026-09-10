import { __ } from '@wordpress/i18n';
import { TextControl, TextareaControl } from "@wordpress/components";
import { InlineDetailMediaUpload, Label } from '../../../../../bpl-tools/Components';
import { isPostSource, updateArrayItem } from '../../../utils/functions';
import ProNotice from '../../Panel/ProNotice';
import { PRO_FEATURES } from '../../../utils/pro-features';

const Item = ({ attributes, setAttributes, arrKey, index, setActiveIndex = false }) => {
    const { sourceType, image } = attributes;
    const sliders = attributes[arrKey];
    const { title, img, video, desc, altText, } = sliders[index];

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
                  * Two notices rather than one, and that is a deliberate exception.
                  *
                  * `ProNotice` takes an array so a panel can merge lists into a single sentence, and
                  * that is right where the lists name the same kind of thing — the carousel panels
                  * that used to print two notices about the same controls. Here they do not: one is
                  * about the slide's button fields, the other about the lightbox, and merged they ran
                  * to six names in one sentence, eight lines deep in a 280px column. Two short
                  * sentences read faster than one long one, and nothing is repeated between them.
                  */}
                <ProNotice className='mt15' features={PRO_FEATURES.slides} />

                {/* Only while the slider's own `Lightbox on click` is on: with it off no picture opens
                    anything, so naming what Premium adds to a lightbox nobody has would be an upsell
                    for a feature the reader is not using yet. */}
                {'lightbox' === image?.link && <ProNotice className='mt10' features={PRO_FEATURES.lightboxSlide} />}
            </>}
        </div>
    </>
}
export default Item;