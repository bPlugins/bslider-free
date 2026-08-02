import { __, sprintf } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { sourceItem } from '../Source/source-json-item';
import SelectLayout from '../Layout/SelectLayout';
import ProPostTypesPromo from '../ProPostTypesPromo';
import { lock, wordpress, woo } from '../../../utils/icons';
import { adminUrl, isPostTypeLocked } from '../../../utils/functions';

const SelectSource = (props) => {
    const { attributes, setAttributes, updateObject } = props;
    const { sourceType } = attributes;

    const [isPostTypesView, setIsPostTypesView] = useState(false);
    const [fetchedPostTypes, setFetchedPostTypes] = useState([]);

    useEffect(() => {
        apiFetch({ path: '/bsb/v1/post-types' })
            .then(res => {
                if (Array.isArray(res)) {
                    // The route already says what this licence may query. Only the fallback below
                    // has to work the `locked` flag out for itself.
                    setFetchedPostTypes(res);
                }
            })
            .catch(() => {
                setFetchedPostTypes([
                    { label: __('Posts', 'slider'), value: 'post', locked: false },
                    { label: __('Pages', 'slider'), value: 'page', locked: false }
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

    // `locked` comes off the REST route, which knows about the `bsb_free_post_types` filter;
    // the local check only covers the offline fallback list, which carries no flag.
    const isLocked = (pt) => (undefined === pt.locked ? isPostTypeLocked(pt.value) : Boolean(pt.locked));
    const lockedPostTypes = fetchedPostTypes.filter(isLocked);

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
                        &larr; {__('Back to Main Sources', 'slider')}
                    </button>
                    <span className="bsb_step_badge">{__('Step 1.5 of 2', 'slider')}</span>
                </div>

                <div className="bsb_wizard_header">
                    <h2>{__('Select Post Type', 'slider')}</h2>
                    <p className="bsb_wizard_subtitle">{__('Choose which post type content you want to fetch and display in your slider', 'slider')}</p>
                </div>

                <div className="bsb_parent_area source_grid">
                    {fetchedPostTypes && fetchedPostTypes.length > 0 ? (
                        fetchedPostTypes.filter(pt => !isLocked(pt)).map((pt, index) => {
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
                                    <div className="desc">
                                        {sprintf(
                                            /* translators: %s: post type name, e.g. Pages */
                                            __('Query all %s posts', 'slider'),
                                            pt.label
                                        )}
                                    </div>
                                    <div className="bsb_card_hover_btn">
                                        <span>{__('Select Layout', 'slider')} &rarr;</span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div key="post" className="single_lay" onClick={() => handlePostTypeSelect('post')}>
                            <div className="icon_wrapper">
                                <div className="icon">{wordpress(28, 28)}</div>
                            </div>
                            <div className="title">{__('Posts', 'slider')}</div>
                            <div className="desc">{__('WordPress blog posts', 'slider')}</div>
                            <div className="bsb_card_hover_btn">
                                <span>{__('Select Layout', 'slider')} &rarr;</span>
                            </div>
                        </div>
                    )}
                </div>

                <ProPostTypesPromo lockedTypes={lockedPostTypes} />
            </div>
        );
    }

    return (
        <>
            {!sourceType ? (
                <div className="bsb_main_parent">
                    <div className="bsb_wizard_header_row">
                        <span className="bsb_step_badge">{__('Step 1 of 2', 'slider')}</span>
                    </div>

                    <div className="bsb_wizard_header">
                        <h2>{__('Choose Content Source', 'slider')}</h2>
                        <p className="bsb_wizard_subtitle">{__('Select the type of content you want to display in your slider', 'slider')}</p>
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
                                    <span>{item.sourceType === 'post_types' ? __('Browse Post Types', 'slider') : __('Select Source', 'slider')} &rarr;</span>
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