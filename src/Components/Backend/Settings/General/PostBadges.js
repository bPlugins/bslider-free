import { __ } from '@wordpress/i18n';
import { PanelBody, AccordionGroup } from '../../../Panel/AccordionPanel';
import { ToggleControl, TextControl, SelectControl, RangeControl } from '@wordpress/components';
import { Label } from '../../../../../../bpl-tools/Components';
import SelectTokenField from '../../../Panel/SelectTokenField';
import FieldGroup from '../../../Panel/FieldGroup';
import { contentAniOption } from '../../../../utils/options';
import AnchorPicker from './AnchorPicker';
import PresetPicker from './PresetPicker';

/**
 * The date and the author, drawn over the slide as badges.
 *
 * Both are on an arranged post already — see `badgesFrom` in `AcfFields`, which is also where they are
 * rendered. Nothing is fetched for this: choosing a badge only decides whether a value the slide already
 * carries is printed on it.
 *
 * **They share the ACF fields' layer rather than opening a second one.** Two overlays over one slide
 * would anchor and animate independently, and a date in the bottom-left corner would sit above or below
 * an ACF field in the same corner depending on nothing the user could see. So the settings live beside
 * the ACF ones in `postsQuery`, and `AcfFields` merges the two sets.
 */
const PostBadges = ({ attributes, updateObject }) => {
    const { postsQuery, badgeAnimation, sourceType, caption } = attributes || {};
    const { selectedBadges = [], badgeSettings = {}, badgeDisplayStyle = 'chips' } = postsQuery || {};

    const allowedBadges = sourceType === 'woo' ? ['price', 'sale'] : ['date', 'author'];
    const activeBadges = selectedBadges.filter(badgeKey => allowedBadges.includes(badgeKey));
    const inactiveBadges = selectedBadges.filter(badgeKey => !allowedBadges.includes(badgeKey));

    const handleBadgesChange = (newActive) => {
        updateObject('postsQuery', 'selectedBadges', [...newActive, ...inactiveBadges]);
    };

    const setBadgeSetting = (badgeKey, key, val) => {
        updateObject('postsQuery', 'badgeSettings', {
            ...badgeSettings,
            [badgeKey]: {
                ...badgeSettings?.[badgeKey],
                [key]: val
            }
        });
    };

    return (
        <PanelBody
            className='bPlPanelBody bsb_social_badges_panel'
            title={__('Post Badges', 'b-slider')}
            /* Newly arrived, and easy to walk past on a panel list this long — see the `badge` prop. */
            badge={__('New', 'b-slider')}
            initialOpen={false}
        >
            <div className="mb15">
                <Label className="mb5">{__('Select Badges to Display:', 'b-slider')}</Label>
                <SelectTokenField
                    value={activeBadges}
                    onChange={handleBadgesChange}
                    options={sourceType === 'woo' ? [
                        { label: __('Product Price', 'b-slider'), value: 'price' },
                        { label: __('Sale Badge', 'b-slider'), value: 'sale' }
                    ] : [
                        { label: __('Publish Date', 'b-slider'), value: 'date' },
                        { label: __('Author Name', 'b-slider'), value: 'author' }
                    ]}
                />
                <small className="bsb_field_hint">
                    {sourceType === 'woo' 
                        ? __('Search or select metadata like "Product Price" or "Sale Badge" to display them as customizable badges on top of your slides.', 'b-slider')
                        : __('Search or select metadata like "Publish Date" or "Author Name" to display them as customizable badges on top of your slides.', 'b-slider')}
                </small>
            </div>

            {activeBadges.length > 0 && (
                <div className="bsb_acf_sections">
                    <AccordionGroup>
                        {activeBadges.map(badgeKey => {
                            const badgeLabel = {
                                date: __('Publish Date', 'b-slider'),
                                author: __('Author Name', 'b-slider'),
                                price: __('Product Price', 'b-slider'),
                                sale: __('Sale Badge', 'b-slider')
                            }[badgeKey] || badgeKey;
                            const cfg = badgeSettings[badgeKey] || {};
                            const anchor = cfg.anchor || 'bottom-left';

                            return (
                                <PanelBody
                                    key={badgeKey}
                                    className="bPlPanelBody bsb_acf_field_panel"
                                    panelId={`post-badge-${badgeKey}`}
                                    title={badgeLabel}
                                >
                                    <ToggleControl
                                        label={__('Show label', 'b-slider')}
                                        checked={false !== cfg.showLabel}
                                        onChange={val => setBadgeSetting(badgeKey, 'showLabel', val)}
                                    />

                                    {caption?.display === 'hover' && (
                                        <ToggleControl
                                            className="mt15"
                                            label={__('Show on hover only', 'b-slider')}
                                            checked={cfg.hoverOnly !== false}
                                            onChange={val => setBadgeSetting(badgeKey, 'hoverOnly', val)}
                                        />
                                    )}

                                    <TextControl
                                        label={__('Icon:', 'b-slider')}
                                        value={cfg.icon || ''}
                                        onChange={val => setBadgeSetting(badgeKey, 'icon', val)}
                                        placeholder='📍'
                                        help={__('An emoji or character shown before the value.', 'b-slider')}
                                    />

                                    <TextControl
                                        label={__('Prefix:', 'b-slider')}
                                        value={cfg.prefix || ''}
                                        onChange={val => setBadgeSetting(badgeKey, 'prefix', val)}
                                    />

                                    <TextControl
                                        label={__('Suffix:', 'b-slider')}
                                        value={cfg.suffix || ''}
                                        onChange={val => setBadgeSetting(badgeKey, 'suffix', val)}
                                    />

                                    <div>
                                        <Label className="mb10">{__('Position:', 'b-slider')}</Label>
                                        {/* Named per badge — one shared name would make both grids a single
                                            radio group, so choosing a corner for one would clear the other. */}
                                        <AnchorPicker
                                            name={`bsbPostBadgeAnchor-${badgeKey}`}
                                            value={anchor}
                                            onChange={val => setBadgeSetting(badgeKey, 'anchor', val)}
                                        />
                                    </div>

                                    <div className="bsb_acf_offsets">
                                        <TextControl
                                            label={__('Offset X:', 'b-slider')}
                                            value={cfg.offsetX || ''}
                                            placeholder="0"
                                            onChange={val => setBadgeSetting(badgeKey, 'offsetX', val)}
                                        />

                                        <TextControl
                                            label={__('Offset Y:', 'b-slider')}
                                            value={cfg.offsetY || ''}
                                            placeholder="0"
                                            onChange={val => setBadgeSetting(badgeKey, 'offsetY', val)}
                                        />
                                    </div>

                                    <small className="bsb_acf_hint">
                                        {__('A plain number is px. Any CSS length works, e.g. 12px, -1em or 2rem.', 'b-slider')}
                                    </small>

                                    {badgeKey === 'sale' && (
                                        <ToggleControl
                                            className='mt15'
                                            label={__('Show Discount Percentage', 'b-slider')}
                                            checked={cfg.showPercentage === true}
                                            onChange={val => setBadgeSetting(badgeKey, 'showPercentage', val)}
                                        />
                                    )}

                                    {badgeKey === 'price' && (
                                        <ToggleControl
                                            className='mt15'
                                            label={__('Show Sale Price Only', 'b-slider')}
                                            checked={cfg.showSaleOnly === true}
                                            onChange={val => setBadgeSetting(badgeKey, 'showSaleOnly', val)}
                                        />
                                    )}

                                    <div className="mt15">
                                        <Label className="mb10">{__('Style:', 'b-slider')}</Label>
                                        <PresetPicker
                                            name={`bsbPostBadgePreset-${badgeKey}`}
                                            presets={['chips', 'outline', 'plain', 'ribbon']}
                                            withDefault={true}
                                            value={cfg.preset || ''}
                                            onChange={val => setBadgeSetting(badgeKey, 'preset', val)}
                                        />
                                    </div>
                                </PanelBody>
                            );
                        })}
                    </AccordionGroup>

                    <div>
                        <Label className="mb10">{__('Default Badges Style:', 'b-slider')}</Label>
                        <PresetPicker
                            value={badgeDisplayStyle}
                            onChange={val => updateObject('postsQuery', 'badgeDisplayStyle', val)}
                        />
                    </div>
                </div>
            )}

            {/**
              * When the badges arrive — their own timing, rather than the caption's borrowed.
              *
              * Only worth asking once a badge has been chosen: a panel with nothing selected has nothing
              * to time. `badgeAnimation` in `AcfFields` is where these three land.
              */}
            {!!activeBadges?.length && <>
                <FieldGroup title={__('Animation', 'b-slider')} />

                <SelectControl
                    className='mt15'
                    label={__('Effect', 'b-slider')}
                    value={badgeAnimation?.effect ?? 'fadeInUp'}
                    options={[{ label: __('None', 'b-slider'), value: '' }, ...contentAniOption]}
                    onChange={val => updateObject('badgeAnimation', 'effect', val)}
                />

                {!!(badgeAnimation?.effect ?? 'fadeInUp') && <>
                    {/* Off, the badges follow whichever of the title, text and button finishes last, and
                        there is nothing to set. On, the two fields under it are theirs. */}
                    <ToggleControl
                        className='mt15'
                        label={__('Set my own delay', 'b-slider')}
                        checked={'custom' === badgeAnimation?.start}
                        onChange={val => updateObject('badgeAnimation', 'start', val ? 'custom' : 'afterButton')}
                    />

                    {'custom' === badgeAnimation?.start && <>
                        <RangeControl
                            className='mt15'
                            label={__('Delay (s)', 'b-slider')}
                            value={badgeAnimation?.delay ?? 0}
                            onChange={val => updateObject('badgeAnimation', 'delay', val)}
                            min={0}
                            max={6}
                            step={0.1}
                        />

                        <RangeControl
                            className='mt15'
                            label={__('Duration (s)', 'b-slider')}
                            value={badgeAnimation?.duration ?? 0.6}
                            onChange={val => updateObject('badgeAnimation', 'duration', val)}
                            min={0.1}
                            max={3}
                            step={0.1}
                        />
                    </>}

                    {/* Last, and always: the spacing between badges is theirs whichever way the timing is
                        decided above. */}
                    <RangeControl
                        className='mt15'
                        label={__('Gap between badges (s)', 'b-slider')}
                        value={badgeAnimation?.stagger ?? 0.12}
                        onChange={val => updateObject('badgeAnimation', 'stagger', val)}
                        min={0}
                        max={1}
                        step={0.02}
                    />
                </>}
            </>}
        </PanelBody>
    );
};

export default PostBadges;
