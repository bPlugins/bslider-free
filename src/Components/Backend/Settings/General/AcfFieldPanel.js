import { __ } from '@wordpress/i18n';
import { SelectControl, TextControl, ToggleControl } from '@wordpress/components';
import { PanelBody } from '../../../Panel/AccordionPanel';
import { Label } from '../../../../../../bpl-tools/Components';
import { FIELD_PRESETS, FIELD_ROLES, anchorOf, isMediaField, rendersAsCaption, sourceOf } from '../../../Common/single-item/AcfFields';
import AnchorPicker from './AnchorPicker';
import PresetPicker from './PresetPicker';

/**
 * Everything about one ACF field, in one panel.
 *
 * A field used to be configured in three places at once — its style in one section, its position on
 * a shared board, and its per-item exceptions in a list keyed by post. Finding the three rows that
 * belonged to the same field meant reading all three. They are one panel now, in the order the
 * questions come up: where does it go, what does it look like, and which items differ.
 */

/** The slot this field fills, if any, as a role key rather than a label. */
const roleKeyOf = (name, postsQuery) =>
    Object.keys(FIELD_ROLES).find(key => postsQuery?.[FIELD_ROLES[key].field] === name) || null;

/**
 * `source` is the slot's set-wide answer, spelled out inside the Default label: without it the row
 * shows three choices where one silently equals another, and picking Default looks inert.
 */
const OVERRIDE_OPTIONS = (fallbackLabel, source) => {
    const acf = __('ACF', 'b-slider');

    return [
        { label: `${__('Default', 'b-slider')} — ${'acf' === source ? acf : fallbackLabel}`, value: '' },
        { label: acf, value: 'acf' },
        { label: fallbackLabel, value: 'post' }
    ];
};

const AcfFieldPanel = ({
    field, postsQuery = {}, queriedPosts = [], fallbackLabel, everyItemLabel,
    onFieldChange, onRoleChange
}) => {
    const cfg = postsQuery?.acfFieldSettings?.[field.value] || {};
    const roleKey = roleKeyOf(field.value, postsQuery);
    const role = roleKey ? FIELD_ROLES[roleKey].label : null;

    // A field filling a slot is already on screen there, so it is not placed on the slide too
    // unless the user asks for both.
    const isPlaced = rendersAsCaption(field.value, field.type, postsQuery);
    const anchor = anchorOf(field.value, postsQuery?.acfFieldSettings || {});

    // An image has no text form, so it can only ever be the Image slot's source — offering to put
    // it on the slide as well would be a switch that does nothing.
    const canBePlaced = !isMediaField(field.type);

    const overrides = roleKey ? (postsQuery?.[FIELD_ROLES[roleKey].overrides] || {}) : {};
    const overrideCount = Object.keys(overrides).length;

    const setOverride = (postId, value) => {
        const next = { ...overrides };

        // "Default" is the absence of an override, not a third stored value.
        if (value) {
            next[postId] = value;
        } else {
            delete next[postId];
        }

        onRoleChange({ [FIELD_ROLES[roleKey].overrides]: next });
    };

    /* `bPlPanelBody` is what carries the plugin's panel look — bpl-tools hangs the open state's
       border and title colour off that class on the element itself, so a panel without it gets the
       hover colour (a descendant rule) but never the active one. */
    return <PanelBody
        className="bPlPanelBody bsb_acf_field_panel"
        panelId={`acf-field-${field.value}`}
        title={field.label}
    >
        {role && canBePlaced && <>
            <ToggleControl
                label={__('Also show it on the slide', 'b-slider')}
                checked={true === cfg.showInSlider}
                onChange={val => onFieldChange(field.value, { showInSlider: val })}
            />

            <small className="bsb_field_hint">
                {__('This field is used as the', 'b-slider')} {role.toLowerCase()}. {__('Turn this on to place it on the slide as well.', 'b-slider')}
            </small>
        </>}

        {/* Wording before placement. Position is set once and then left alone, while the label,
            icon and affixes are what get tweaked repeatedly — having to scroll past a grid and two
            offsets to reach them every time put the common job furthest away. */}
        {isPlaced && <>
            <ToggleControl
                label={__('Show label', 'b-slider')}
                checked={false !== cfg.showLabel}
                onChange={val => onFieldChange(field.value, { showLabel: val })}
            />

            <TextControl
                label={__('Icon:', 'b-slider')}
                value={cfg.icon || ''}
                onChange={val => onFieldChange(field.value, { icon: val })}
                help={__('An emoji or character shown before the value, e.g. 📍', 'b-slider')}
            />

            <TextControl
                label={__('Prefix:', 'b-slider')}
                value={cfg.prefix || ''}
                onChange={val => onFieldChange(field.value, { prefix: val })}
            />

            <TextControl
                label={__('Suffix:', 'b-slider')}
                value={cfg.suffix || ''}
                onChange={val => onFieldChange(field.value, { suffix: val })}
            />

            <div>
                <Label className="mb10">{__('Position:', 'b-slider')}</Label>
                {/* Named per field — one shared name would make every field's grid a single radio
                    group, so choosing a corner for one would clear it for all the others. */}
                <AnchorPicker
                    name={`bsbAcfAnchor-${field.value}`}
                    value={anchor}
                    onChange={val => onFieldChange(field.value, { anchor: val })}
                />
            </div>

            {/* Any CSS length, so a field can be nudged in px, % or em — and pulled back out of a
                corner with a negative value. */}
            <div className="bsb_acf_offsets">
                <TextControl
                    label={__('Offset X:', 'b-slider')}
                    value={cfg.offsetX || ''}
                    placeholder="0"
                    onChange={val => onFieldChange(field.value, { offsetX: val })}
                />

                <TextControl
                    label={__('Offset Y:', 'b-slider')}
                    value={cfg.offsetY || ''}
                    placeholder="0"
                    onChange={val => onFieldChange(field.value, { offsetY: val })}
                />
            </div>

            {/* No `%` in the examples on purpose: the group these move inside is auto height, so a
                percentage on Y resolves against nothing and the field stays put. */}
            <small className="bsb_acf_hint">{__('A plain number is px. Any CSS length works, e.g. 12px, -1em or 2rem.', 'b-slider')}</small>

            {/* Last, under the placement it has nothing to do with, because it is the one control
                here that is not about this field alone: `Default` follows the set, so the answer is
                usually already right and the picker is passed over rather than used. */}
            <div>
                <Label className="mb10">{__('Style:', 'b-slider')}</Label>
                <PresetPicker
                    name={`bsbAcfPreset-${field.value}`}
                    presets={FIELD_PRESETS}
                    withDefault={true}
                    value={cfg.preset || ''}
                    onChange={val => onFieldChange(field.value, { preset: val })}
                />
            </div>
        </>}

        {/* The slot this field fills, set for the whole set and then item by item. Only a field
            with a slot has either, which is why this is the one part a plain caption field skips. */}
        {roleKey && <>
            <ToggleControl
                label={everyItemLabel}
                checked={'acf' === sourceOf(roleKey, postsQuery)}
                onChange={val => onRoleChange({ [FIELD_ROLES[roleKey].source]: val ? 'acf' : 'post' })}
            />

            {queriedPosts.length > 0 && <div className="bsb_acf_overrides">
                <Label className="mb10">
                    {__('Per Item:', 'b-slider')}
                    {overrideCount > 0 && <span className="bsb_override_count">{overrideCount}</span>}
                </Label>

                <div className="bsb_acf_override_list">
                    {queriedPosts.map(post => (
                        <div key={post.id} className="bsb_acf_override_row">
                            <span className="bsb_acf_override_title" title={post.title}>
                                {post.title || `#${post.id}`}
                            </span>

                            <SelectControl
                                value={overrides[post.id] || ''}
                                options={OVERRIDE_OPTIONS(fallbackLabel, sourceOf(roleKey, postsQuery))}
                                onChange={val => setOverride(post.id, val)}
                            />
                        </div>
                    ))}
                </div>
            </div>}
        </>}
    </PanelBody>
}
export default AcfFieldPanel;
