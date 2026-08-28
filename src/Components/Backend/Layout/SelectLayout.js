const { __ } = wp.i18n;
import { layoutItem } from './layout-json';
import ProListLayoutPromo from '../ProListLayoutPromo';

const CardFlag = ({ item }) => {
    if (item.isPro) {
        return <div className="bsb_card_flag is-pro"><p>{__('Pro', 'b-slider')}</p></div>;
    }
    return null;
};

const SelectLayout = ({ attributes, setAttributes }) => {
    const { layoutType, sourceType } = attributes;

    // A `blocks`-sourced slide's content arrives on the front end as one pre-rendered HTML blob
    // (see render.php's `_blocksHtml` bridge), not a JS-enumerable array of items — only the
    // Bootstrap-Carousel-based Default layout can animate between opaque HTML blocks like that.
    // Grid and Thumbnails want a picture to crop and a thumbnail to draw, which a slide built
    // from blocks has neither of. Carousel does work for this source — it splits the blob back
    // into slides for Swiper — but it is a Pro layout here, so the promo below names it rather
    // than the tile offering something this licence cannot apply.
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
                {availableLayouts?.map((item, index) => {
                    const handleLayoutClick = () => {
                        if (item.isPro) {
                            return;
                        }
                        setAttributes({ layoutType: item?.layoutType });
                    };

                    return (
                        <div key={index} className={`single_lay ${item.isPro ? 'is-locked-layout' : ''}`} onClick={handleLayoutClick}>
                            <CardFlag item={item} />
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
                                <span>{item.isPro ? __('Unlock with Pro', 'b-slider') : __('Apply Layout', 'b-slider')} &rarr;</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* The notice reads differently for a `blocks` slider: the layout held back there is
                Carousel, not List. Passing the source is what lets one component say either. */}
            <ProListLayoutPromo sourceType={sourceType} />
        </div>
    );
};

export default SelectLayout;