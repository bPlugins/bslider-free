import { __ } from '@wordpress/i18n';
import { TextControl, TextareaControl } from "@wordpress/components";
import { InlineDetailMediaUpload, Label } from '../../../../../bpl-tools/Components';
import { isPostSource, updateArrayItem } from '../../../utils/functions';

const Item = ({ attributes, setAttributes, arrKey, index, setActiveIndex = false }) => {
    const { sourceType } = attributes;
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
            </>}
        </div>
    </>
}
export default Item;