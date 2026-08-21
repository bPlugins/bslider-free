import { __, sprintf } from '@wordpress/i18n';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { sourceItem, feedItem } from '../Source/source-json-item';
import SelectLayout from '../Layout/SelectLayout';
import ProPostTypesPromo from '../ProPostTypesPromo';
import { lock, wordpress, woo } from '../../../utils/icons';
import { adminUrl, isPostTypeLocked } from '../../../utils/functions';

/**
 * A card's corner flag, for the two things worth saying before the card is read.
 *
 * One component for both, so the corner can only ever hold one flag: they are the same piece of
 * furniture, and a card wearing "Pro" and "New" at once would stack them into each other.
 */
const CardFlag = ({ item }) => {
    if (item.isNew) {
        return <div className="bsb_card_flag is-new"><p>{__('New', 'b-slider')}</p></div>;
    }

    return null;
};

const SelectSource = (props) => {
    const { attributes, setAttributes, updateObject } = props;
    const { sourceType } = attributes;

    const [isPostTypesView, setIsPostTypesView] = useState(false);
    const [isFeedsView, setIsFeedsView] = useState(false);
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
        /**
         * Settings that belong to the source being left behind.
         *
         * A feed slider carries a card layout, a caption mode, play-icon colours and a preset tick that
         * were chosen for the *previous* source. Left standing, picking YouTube shows the old source's
         * styling over the new feed's items — which reads as the wrong data having loaded. `layoutType`
         * is cleared for the same reason it is not written in `handleFeedSelect`: this step names the
         * source, and `SelectLayout` is what names the layout afterwards.
         */
        const resets = {
            layoutType: '',
            cardLayout: false,
            cardBgColor: '',
            cardPadding: { top: '16px', right: '16px', bottom: '16px', left: '16px' },
            cardRadius: { top: '8px', right: '8px', bottom: '8px', left: '8px' },
            SliderOverly: '#59595952',
            caption: { display: 'always', background: 'solid' },
            playIconColor: '',
            playIconBg: '',
            playIconHoverBg: '',
            socialQuery: {
                ...(attributes?.socialQuery || {}),
                activePreset: ''
            }
        };

        if (item.sourceType === 'post_types') {
            setIsPostTypesView(true);
        } else if (item.sourceType === 'social') {
            setIsFeedsView(true);
        } else if (item.sourceType === 'posts') {
            updateObject('postsQuery', 'post_type', 'post');
            setAttributes({ ...resets, sourceType: 'posts' });
        } else if (item.sourceType === 'woo') {
            updateObject('postsQuery', 'post_type', 'product');
            setAttributes({ ...resets, sourceType: 'woo' });
        } else {
            setAttributes({ ...resets, sourceType: item.sourceType });
        }
    };

    // `locked` comes off the REST route, which knows about the `b_slider_free_post_types` filter;
    // the local check only covers the offline fallback list, which carries no flag.
    const isLocked = (pt) => (undefined === pt.locked ? isPostTypeLocked(pt.value) : Boolean(pt.locked));
    const lockedPostTypes = fetchedPostTypes.filter(isLocked);

    const handlePostTypeSelect = (postTypeSlug) => {
        /**
         * Settings that belong to the source being left behind.
         *
         * A feed slider carries a card layout, a caption mode, play-icon colours and a preset tick that
         * were chosen for the *previous* source. Left standing, picking YouTube shows the old source's
         * styling over the new feed's items — which reads as the wrong data having loaded. `layoutType`
         * is cleared for the same reason it is not written in `handleFeedSelect`: this step names the
         * source, and `SelectLayout` is what names the layout afterwards.
         */
        const resets = {
            layoutType: '',
            cardLayout: false,
            cardBgColor: '',
            cardPadding: { top: '16px', right: '16px', bottom: '16px', left: '16px' },
            cardRadius: { top: '8px', right: '8px', bottom: '8px', left: '8px' },
            SliderOverly: '#59595952',
            caption: { display: 'always', background: 'solid' },
            playIconColor: '',
            playIconBg: '',
            playIconHoverBg: '',
            socialQuery: {
                ...(attributes?.socialQuery || {}),
                activePreset: ''
            }
        };

        if (postTypeSlug === 'product') {
            updateObject('postsQuery', 'post_type', 'product');
            setAttributes({ ...resets, sourceType: 'woo' });
        } else {
            updateObject('postsQuery', 'post_type', postTypeSlug);
            setAttributes({ ...resets, sourceType: 'posts' });
        }
    };

    /**
     * Choosing which service a feed slider reads — and letting go of the one it read before.
     *
     * `channelId` and `source` say which account, and the four `header*` fields are that account's
     * picture, name, bio and link. Left alone across a change of service they go on describing an
     * account the slider no longer reads — an RSS publication's name over a YouTube channel's videos.
     *
     * Only when the service actually changes: re-picking the type you are already on is how somebody
     * returns to this step to look at it, and wiping a configured slider for that would be its own bug.
     *
     * `layoutType` is deliberately not written here. This step names the service; `SelectLayout` names
     * the layout, and setting one on the way past would skip that step altogether.
     */
    const handleFeedSelect = (feedType) => {
        const { socialQuery = {} } = attributes;

        setIsFeedsView(false);

        if (feedType === socialQuery.feedType) {
            setAttributes({ sourceType: 'social' });

            return;
        }

        setAttributes({
            sourceType: 'social',
            socialQuery: {
                ...socialQuery,
                feedType,
                // Which account, and the account as it was described. Both belong to the old service.
                channelId: '',
                source: '',
                headerAvatar: '',
                headerName: '',
                headerBio: '',
                headerLink: '',
                // Only YouTube reports a banner, so leaving it set means the old channel's cover over
                // the new service's posts — or a toggle that is on for a feed with nothing to draw.
                headerBanner: '',
                showHeaderBanner: false,
                /**
                 * The preset tick too.
                 *
                 * Two presets are offered on more than one service, so the id alone still matches
                 * after a switch — and the card would show a tick for settings that were applied to
                 * the *other* service's branch. What is actually on the slider is the old feed's
                 * ratio, its stats toggle, its button colour. Clearing it is the honest answer: no
                 * preset has been applied to this feed yet.
                 */
                activePreset: ''
            }
        });
    };

    // Sub-wizard: which external service a feed slider reads. The address itself is asked for in the
    // Source & Layout panel afterwards, so this step stays a single click.
    //
    // `isFeedsView` still stands on its own, because it means the user has just walked in here from
    // the main sources: a slider that already carries a feed type has to be able to come back.
    if (isFeedsView || ('social' === sourceType && !attributes.socialQuery?.feedType)) {
        return (
            <div className="bsb_main_parent">
                <div className="bsb_wizard_header_row">
                    <button
                        className="bsb_backBtn"
                        onClick={() => {
                            setIsFeedsView(false);
                            setAttributes({ sourceType: '' });
                        }}
                    >
                        &larr; {__('Back to Main Sources', 'b-slider')}
                    </button>
                    <span className="bsb_step_badge">{__('Step 1.5 of 2', 'b-slider')}</span>
                </div>

                <div className="bsb_wizard_header">
                    <h2>{__('Select Feed Type', 'b-slider')}</h2>
                    <p className="bsb_wizard_subtitle">{__('Pull slides straight from an external service — the slider re-syncs on its own', 'b-slider')}</p>
                </div>

                <div className="bsb_parent_area source_grid">
                    {feedItem.map((item, index) => (
                        <div
                            key={index}
                            className={`single_lay ${item.available ? '' : 'is-disabled'}`}
                            onClick={() => item.available && handleFeedSelect(item.feedType)}
                        >
                            <CardFlag item={item} />

                            <div className="icon_wrapper">
                                <div className="icon">{item.icon(28, 28)}</div>
                            </div>
                            <div className="title">{item.title}</div>
                            <div className="desc">{item.desc}</div>
                            <div className="bsb_card_hover_btn">
                                <span>
                                    {item.available
                                        ? <>{__('Select Layout', 'b-slider')} &rarr;</>
                                        : __('Coming soon', 'b-slider')}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

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
                                    <span>{
                                        item.sourceType === 'post_types' ? __('Browse Post Types', 'b-slider')
                                            : item.sourceType === 'social' ? __('Browse Feeds', 'b-slider')
                                                : __('Select Source', 'b-slider')
                                    } &rarr;</span>
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