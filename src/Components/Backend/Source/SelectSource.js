import { __ } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { sourceItem } from '../Source/source-json-item';
import SelectLayout from '../Layout/SelectLayout';
import { wordpress, woo } from '../../../utils/icons';

const SelectSource = (props) => {
    const { attributes, setAttributes, updateObject } = props;
    const { sourceType } = attributes;

    const [isPostTypesView, setIsPostTypesView] = useState(false);
    const [fetchedPostTypes, setFetchedPostTypes] = useState([]);

    useEffect(() => {
        apiFetch({ path: '/bsb/v1/post-types' })
            .then(res => {
                if (Array.isArray(res)) {
                    setFetchedPostTypes(res);
                }
            })
            .catch(() => {
                setFetchedPostTypes([
                    { label: __('Posts', 'b-slider'), value: 'post' },
                    { label: __('Pages', 'b-slider'), value: 'page' }
                ]);
            });
    }, []);

    const handleMainSourceSelect = (item) => {
        if (item.sourceType === 'post_types') {
            setIsPostTypesView(true);
        } else if (item.sourceType === 'posts') {
            updateObject('postsQuery', 'post_type', 'post');
            setAttributes({ sourceType: 'posts' });
        } else if (item.sourceType === 'woo') {
            updateObject('postsQuery', 'post_type', 'product');
            setAttributes({ sourceType: 'woo' });
        } else {
            setAttributes({ sourceType: item.sourceType });
        }
    };

    const handlePostTypeSelect = (postTypeSlug) => {
        if (postTypeSlug === 'product') {
            updateObject('postsQuery', 'post_type', 'product');
            setAttributes({ sourceType: 'woo' });
        } else {
            updateObject('postsQuery', 'post_type', postTypeSlug);
            setAttributes({ sourceType: 'posts' });
        }
    };

    // Sub-wizard: List of all registered WordPress & Custom Post Types
    if (isPostTypesView && !sourceType) {
        return (
            <div className="bsb_main_parent">
                <div className="bsb_wizard_header_row">
                    <button className="bsb_backBtn" onClick={() => setIsPostTypesView(false)}>
                        &larr; {__('Back to Main Sources', 'b-slider')}
                    </button>
                    <span className="bsb_step_badge">{__('Step 1.5 of 2', 'b-slider')}</span>
                </div>

                <div className="bsb_wizard_header">
                    <h2>{__('Select Post Type', 'b-slider')}</h2>
                    <p className="bsb_wizard_subtitle">{__('Choose which post type content you want to fetch and display in your slider', 'b-slider')}</p>
                </div>

                <div className="bsb_parent_area source_grid">
                    {fetchedPostTypes && fetchedPostTypes.length > 0 ? (
                        fetchedPostTypes.map((pt, index) => {
                            const isWoo = pt.value === 'product';
                            const iconFn = isWoo ? woo : wordpress;
                            return (
                                <div key={index} className="single_lay" onClick={() => handlePostTypeSelect(pt.value)}>
                                    <div className="icon_wrapper">
                                        <div className="icon">
                                            {iconFn(28, 28)}
                                        </div>
                                    </div>
                                    <div className="title">{pt.label}</div>
                                    <div className="desc">{`Query all ${pt.label} posts`}</div>
                                    <div className="bsb_card_hover_btn">
                                        <span>{__('Select Layout', 'b-slider')} &rarr;</span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div key="post" className="single_lay" onClick={() => handlePostTypeSelect('post')}>
                            <div className="icon_wrapper">
                                <div className="icon">{wordpress(28, 28)}</div>
                            </div>
                            <div className="title">{__('Posts', 'b-slider')}</div>
                            <div className="desc">{__('WordPress blog posts', 'b-slider')}</div>
                            <div className="bsb_card_hover_btn">
                                <span>{__('Select Layout', 'b-slider')} &rarr;</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <>
            {!sourceType ? (
                <div className="bsb_main_parent">
                    <div className="bsb_wizard_header_row">
                        <span className="bsb_step_badge">{__('Step 1 of 2', 'b-slider')}</span>
                    </div>

                    <div className="bsb_wizard_header">
                        <h2>{__('Choose Content Source', 'b-slider')}</h2>
                        <p className="bsb_wizard_subtitle">{__('Select the type of content you want to display in your slider', 'b-slider')}</p>
                    </div>

                    <div className="bsb_parent_area source_grid">
                        {sourceItem?.map((item, index) => (
                            <div key={index} className="single_lay" onClick={() => handleMainSourceSelect(item)}>
                                <div className="icon_wrapper">
                                    <div className="icon">{item?.icon(28, 28)}</div>
                                </div>
                                <div className="title">{item?.title}</div>
                                {item?.desc && <div className="desc">{item.desc}</div>}
                                <div className="bsb_card_hover_btn">
                                    <span>{item.sourceType === 'post_types' ? __('Browse Post Types', 'b-slider') : __('Select Source', 'b-slider')} &rarr;</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <SelectLayout {...props} />
            )}
        </>
    );
};

export default SelectSource;