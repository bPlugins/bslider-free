import { __ } from '@wordpress/i18n';
import { layoutItem } from './layout-json';
import { isProActive } from '../../../utils/functions';
import ProLayoutsPromo from '../ProLayoutsPromo';

const SelectLayout = ({ attributes, setAttributes }) => {

    const { layoutType, sourceType, socialQuery } = attributes;
    const isPro = isProActive();

    const cards = layoutItem.filter(item => {
        const matchesFeed = !item.feedOnly || ('social' === sourceType && item.feedOnly === socialQuery?.feedType);
        if ('social' === sourceType) {
            return matchesFeed && (isPro || 'default' === item.layoutType);
        }
        return matchesFeed;
    });

    return !layoutType && <div className='bsb_main_parent'>
        <div className="bsb_wizard_header_row">
            <button className='bsb_backBtn' onClick={() => setAttributes({ sourceType: '', layoutType: '' })}>
                &larr; {__('Back to Sources', 'b-slider')}
            </button>
            <span className="bsb_step_badge">{__('Step 2 of 2', 'b-slider')}</span>
        </div>

        <div className="bsb_wizard_header">
            <h2>{__('Select Layout Style', 'b-slider')}</h2>
            <p className="bsb_wizard_subtitle">{__('Choose how your slides will be displayed and animated on your site', 'b-slider')}</p>
        </div>

        <div className='bsb_parent_area source_grid'>
            {
                cards?.map((item, index) => (
                    <div key={index} className='single_lay' onClick={() => setAttributes({ layoutType: item?.layoutType })}>
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
                ))
            }
        </div>
        {!isPro && 'social' === sourceType && <ProLayoutsPromo />}
    </div>
}
export default SelectLayout;