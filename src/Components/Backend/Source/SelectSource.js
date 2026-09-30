import { __, sprintf } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { sourceItem } from '../Source/source-json-item';
import SelectLayout from '../Layout/SelectLayout';
import ProPostTypesPromo from '../ProPostTypesPromo';
import ProSocialPromo from '../ProSocialPromo';
import { lock, wordpress, woo } from '../../../utils/icons';
import { adminUrl, isPostTypeLocked } from '../../../utils/functions';

const CardFlag = ({ item }) => {
    if (item.isNew) {
        return <div className="bsb_card_flag is-new"><p>{__('New', 'b-slider')}</p></div>;
    }

    return null;
};

/**
 * The way into the Template Library from where somebody is actually standing.
 *
 * The toolbar button is the discoverable entry point; this is the useful one. An author who has just
 * added the block is looking at these source cards with the question "what can this make?", and that
 * is the question the template modal answers — asking them to notice a button at the top of the
 * screen first is asking them to already know.
 *
 * It clicks the toolbar button rather than rendering a second copy of the modal: two mounted copies
 * would mean two sets of AJAX requests and two portals fighting over the same DOM id. If the button
 * is not there — the editor's toolbar has been renamed twice and `index.js` may not have found it —
 * this renders nothing rather than a control that does nothing.
 *
 * The lookup goes through `window.top` because the block canvas is an iframe from WP 6.5 on: this
 * component's own `document` is the canvas's, and the toolbar is in the document above it. Wrapped
 * because reading across frames throws if they are ever not same-origin.
 */
const editorDocument = () => {
    try {
        return window.top?.document || document;
    } catch (e) {
        return document;
    }
};

const TemplateLibraryPrompt = () => {
    const [hasLibrary, setHasLibrary] = useState(false);

    useEffect(() => {
        // The toolbar button mounts on `domReady` and is re-placed on editor re-renders, so it may
        // not be there on this component's first paint. Polling rather than observing: the target
        // is in another document, and this stops as soon as it is found.
        const check = () => {
            const found = Boolean(editorDocument().querySelector('.bPlTemplatesButton'));

            setHasLibrary(found);

            return found;
        };

        if (check()) {
            return undefined;
        }

        const timer = setInterval(() => {
            if (check()) {
                clearInterval(timer);
            }
        }, 500);

        return () => clearInterval(timer);
    }, []);

    if (!hasLibrary) {
        return null;
    }

    return (
        <div className="bsb_template_prompt">
            <p>{__('Not sure where to start? Pick a ready-made slider and change what you like.', 'b-slider')}</p>

            <button
                type="button"
                onClick={() => editorDocument().querySelector('.bPlTemplatesButton')?.click()}
            >
                {__('Browse Templates', 'b-slider')}
            </button>
        </div>
    );
};

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
                    { label: __('Posts', 'b-slider'), value: 'post', locked: false },
                    { label: __('Pages', 'b-slider'), value: 'page', locked: false }
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

    // `locked` comes off the REST route, which knows about the `b_slider_free_post_types` filter;
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
                                            __('Query all %s posts', 'b-slider'),
                                            pt.label
                                        )}
                                    </div>
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

                <ProPostTypesPromo lockedTypes={lockedPostTypes} />
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
                                <CardFlag item={item} />
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

                    <TemplateLibraryPrompt />

                    <ProSocialPromo />
                </div>
            ) : (
                <SelectLayout {...props} />
            )}
        </>
    );
};

export default SelectSource;