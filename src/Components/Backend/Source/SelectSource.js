import { __ } from '@wordpress/i18n';
import { sourceItem } from '../Source/source-json-item';
import SelectLayout from '../Layout/SelectLayout';

const SelectSource = (props) => {

    const { attributes, setAttributes, updateObject } = props;
    const { sourceType, } = attributes;

    const handleSourceSelect = (item) => {
        setAttributes({ sourceType: item.sourceType });
        if (item.sourceType === 'posts') {
            updateObject('postsQuery', 'post_type', 'post');
        } else if (item.sourceType === 'woo') {
            updateObject('postsQuery', 'post_type', 'product');
        }
    };

    // Content Source
    return <>
        {!sourceType ? <div className="bsb_main_parent">
            <h2>{__('Choose Slider Type', 'b-slider')}</h2>

            <div className='bsb_parent_area layout'>
                {
                    sourceItem?.map((item, index) => (
                        <div key={index} className='single_lay' onClick={() => {


                            handleSourceSelect(item);

                        }}>
                            <div className="icon">
                                {item?.icon(60, 60)}
                            </div>
                            <div className="title">
                                {item?.title}
                            </div>

                        </div>
                    ))
                }
            </div>
        </div> :
            <SelectLayout {...props} />
        }
    </>
}
export default SelectSource;