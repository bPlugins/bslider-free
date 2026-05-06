const { __ } = wp.i18n;
import { layoutItem } from './layout-json';

const SelectLayout = ({ attributes, setAttributes }) => {

    const { layoutType } = attributes;

    return !layoutType && <div className='bsb_main_parent'>
        <button className='bsb_backBtn' onClick={() => setAttributes({ sourceType: '' })}>Back</button>
        <h2> {__('Select Layout', 'b-slider')}</h2>
        <div className='bsb_parent_area source_type'>
            {
                layoutItem?.map((item, index) => (
                    <div key={index} className='single_lay' onClick={() => {
                        setAttributes({ layoutType: item?.layoutType });
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
    </div>
}
export default SelectLayout;