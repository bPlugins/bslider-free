import { __ } from '@wordpress/i18n';
import { Label } from '../../../../../../bpl-tools/Components';
import { DEFAULT_PRESET, FIELD_ROLES } from '../../../Common/single-item/AcfFields';
import AcfFieldPanel from './AcfFieldPanel';
import PresetPicker from './PresetPicker';

/**
 * One panel per ACF field in play, plus the one setting that is genuinely set-wide.
 *
 * The list is every picked field together with every field given a slot under `Use ACF For`. Those
 * two sets overlap but neither contains the other: an image field is never offered in the picker,
 * yet as the Image slot it still needs its per-item exceptions somewhere.
 *
 * One panel is open at a time — a dozen fields with a position grid, four text inputs and a row per
 * post each would otherwise run to thousands of pixels in a sidebar barely 280px wide. That is the
 * accordion these panels sit in and not something arranged here, so which one is open is the ACF
 * area's business rather than this component's.
 */

/** What a slot falls back to when ACF is not in play, for the per-item rows inside each panel. */
const FALLBACK_LABEL = roleKey => ({
    image: __('Featured', 'b-slider'),
    title: __('Post', 'b-slider'),
    desc: __('Post', 'b-slider'),
    buttonText: __('Fixed', 'b-slider'),
    buttonLink: __('Post', 'b-slider')
}[roleKey]);

const EVERY_ITEM_LABEL = roleKey => ({
    image: __('Use the ACF image for every item', 'b-slider'),
    title: __('Use the ACF title for every item', 'b-slider'),
    desc: __('Use the ACF description for every item', 'b-slider'),
    buttonText: __('Use the ACF button label for every item', 'b-slider'),
    buttonLink: __('Use the ACF link for every item', 'b-slider')
}[roleKey]);

/**
 * The fields that need a panel, in a stable order: the ones on display first, then any slot field
 * that is not among them.
 */
const panelFields = (selected = [], acfOptions = [], postsQuery = {}) => {
    const roleNames = Object.values(FIELD_ROLES)
        .map(role => postsQuery?.[role.field])
        .filter(Boolean);

    const names = [...selected, ...roleNames.filter(name => !selected.includes(name))];

    // A name with no matching option is a field the current post type does not have.
    return names.map(name => acfOptions.find(f => f.value === name)).filter(Boolean);
};

const AcfFieldSettings = ({
    fields = [], acfOptions = [], acfDisplayStyle = DEFAULT_PRESET, postsQuery = {}, queriedPosts = [],
    onFieldChange, onRoleChange, onStyleChange, caption
}) => {
    const panels = panelFields(fields, acfOptions, postsQuery);

    // Without this the section is silently empty and looks broken rather than unconfigured.
    if (!panels.length) {
        return <p className="bsb_acf_hint">
            {__('Pick a field above to place it on the slide and style it.', 'b-slider')}
        </p>;
    }

    const roleKeyOf = name =>
        Object.keys(FIELD_ROLES).find(key => postsQuery?.[FIELD_ROLES[key].field] === name) || null;

    /* No spacing classes on any of this: the gap between every block in the ACF area comes from
       one flex `gap`, so a panel cannot end up further from its neighbour than the next one. */
    return <div className="bsb_acf_field_settings">
        {panels.map(field => {
            const roleKey = roleKeyOf(field.value);

            return <AcfFieldPanel
                key={field.value}
                field={field}
                postsQuery={postsQuery}
                queriedPosts={queriedPosts}
                fallbackLabel={FALLBACK_LABEL(roleKey)}
                everyItemLabel={EVERY_ITEM_LABEL(roleKey)}
                onFieldChange={onFieldChange}
                onRoleChange={onRoleChange}
                caption={caption}
            />;
        })}

        <small className="bsb_field_hint">
            {__('Each field sits on one of nine points over the slide. Offsets nudge it from there — any CSS length, negative to pull it back.', 'b-slider')}
        </small>

        {/* Last, under the fields it applies to. It is the fallback rather than the setting most
            people came for: every field carries its own `Style`, and this is only what they fall
            back to — so it belongs after them, not in front of them. */}
        <div>
            <Label className="mb10">{__('Default Field Style:', 'b-slider')}</Label>
            <PresetPicker value={acfDisplayStyle} onChange={onStyleChange} />
            <small className="bsb_acf_hint">
                {__('Used by every field left on Default.', 'b-slider')}
            </small>
        </div>
    </div>
}
export default AcfFieldSettings;
