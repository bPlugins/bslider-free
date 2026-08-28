const { __ } = wp.i18n;
import { layoutItem } from './layout-json';
import ProListLayoutPromo from '../ProListLayoutPromo';

const SelectLayout = ({ attributes, setAttributes }) => {
    const { layoutType, sourceType } = attributes;

    // A `blocks`-sourced slide's content arrives on the front end as one pre-rendered HTML blob
    // (see render.php's `_blocksHtml` bridge), not a JS-enumerable array of items — only the
    // Bootstrap-Carousel-based Default layout can animate between opaque HTML blocks like that.
    // Carousel/Grid/Thumbnails are Swiper-based and need each slide as a discrete item.
    const availableLayouts = 'blocks' === sourceType
        ? layoutItem.filter(item => 'default' === item.layoutType)
        : layoutItem;

    return !layoutType && (
        <div className='bsb_main_parent'>
            <div className="bsb_wizard_header_row">
                <button className='bsb_backBtn' onClick={() => setAttributes({ sourceType: '' })}>
                    &larr; {__('Back to Sources', 'b-slider')}
                </button>
                <span className="bsb_step_badge">{__('Step 2 of 2', 'b-slider')}</span>
            </div>

            <div className="bsb_wizard_header">
                <h2>{__('Select Layout Style', 'b-slider')}</h2>
                <p className="bsb_wizard_subtitle">{__('Choose how your slides will be displayed and animated on your site', 'b-slider')}</p>
            </div>

            <div className='bsb_parent_area source_grid'>
                {availableLayouts?.map((item, index) => (
                    <div key={index} className="single_lay" onClick={() => setAttributes({ layoutType: item?.layoutType })}>
                        <div className="icon_wrapper">
                            <div className="icon">
                                {item?.icon(32, 32)}
                            </div>
                        </div>
                        <div className="title">
                            {item?.title}
                        </div>
                        {item?.desc && <div className="desc">{item.desc}</div>}
                        <div className="bsb_card_hover_btn">
                            <span>{__('Apply Layout', 'b-slider')} &rarr;</span>
                        </div>
                    </div>
                ))}
            </div>

            <ProListLayoutPromo />
        </div>
    );
};

export default SelectLayout;