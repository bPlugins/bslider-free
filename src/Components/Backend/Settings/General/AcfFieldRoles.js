import { __ } from '@wordpress/i18n';
import { SelectControl } from '@wordpress/components';
import { PanelBody } from '../../../Panel/AccordionPanel';
import { FIELD_ROLES, isButtonLinkField, isMediaField, isTextishField } from '../../../Common/single-item/AcfFields';

/**
 * Assigns ACF fields to the item's image, title, description and button slots.
 *
 * This is only the assignment. What the slot then does with the field — whether the whole set uses
 * it, which items differ, whether it also shows on the slide — is per field, so it lives in that
 * field's own panel rather than being collected here by slot.
 */

/** How the ACF area asks its accordion for this panel, on adding a field. */
export const ACF_ROLES_PANEL = 'acf-field-roles';

/**
 * What a slot falls back to with ACF out of the picture, as the empty choice in its field list.
 *
 * The button label is the odd one out — it falls back to the single text set in the Button panel
 * rather than to anything on the post, so calling it "Post" would name the wrong thing.
 */
const NONE_LABEL = roleKey => ({
    image: __('— Featured image —', 'b-slider'),
    title: __('— Post default —', 'b-slider'),
    desc: __('— Post default —', 'b-slider'),
    buttonText: __('— Button panel text —', 'b-slider'),
    buttonLink: __('— Post default —', 'b-slider')
}[roleKey]);

const withNone = (options, noneLabel) => [
    { label: noneLabel, value: '' },
    ...options.map(f => ({ label: f.label, value: f.value }))
];

/**
 * Which ACF types can stand in for each slot. The button splits in two: its label is text like
 * the title and description, while its URL needs a type that actually carries one.
 */
const acceptsField = (roleKey, type) => {
    if ('image' === roleKey) {
        return isMediaField(type);
    }

    return 'buttonLink' === roleKey ? isButtonLinkField(type) : isTextishField(type);
};

const AcfFieldRoles = ({ acfOptions = [], postsQuery = {}, onChange }) => {
    const roleKeys = Object.keys(FIELD_ROLES);

    const optionsFor = roleKey => acfOptions.filter(f => acceptsField(roleKey, f.type));

    if (!roleKeys.some(k => optionsFor(k).length)) {
        return null;
    }

    /**
     * Picking a field switches that slot to ACF straight away — choosing one and seeing nothing
     * change reads as broken. The toggle below is then how it gets switched back.
     *
     * This includes the image. It was once opt-in, on the grounds that a slider is built around
     * the post's own image, but picking an ACF image and still getting the featured one read as
     * the setting being ignored.
     */
    const setField = (roleKey, value) => {
        const role = FIELD_ROLES[roleKey];

        // Clearing the slot drops the per-item rows too; they would otherwise name a field the
        // slot no longer points at and quietly apply again if it were picked back.
        if (!value) {
            onChange({ [role.field]: '', [role.source]: 'post', [role.overrides]: {} });
            return;
        }

        onChange({ [role.field]: value, [role.source]: 'acf' });
    };

    return <PanelBody
        className="bPlPanelBody bsb_acf_field_roles"
        panelId={ACF_ROLES_PANEL}
        title={__('Use ACF For', 'b-slider')}
        initialOpen={false}
    >
        {roleKeys.map(roleKey => {
            const options = optionsFor(roleKey);

            if (!options.length) {
                return null;
            }

            return <SelectControl
                key={roleKey}
                label={`${FIELD_ROLES[roleKey].label}:`}
                value={postsQuery?.[FIELD_ROLES[roleKey].field] || ''}
                options={withNone(options, NONE_LABEL(roleKey))}
                onChange={val => setField(roleKey, val)}
            />;
        })}

        {/* Whether the whole set takes each slot from ACF, and which items differ, are settings
            about one field — so they live in that field's own panel below, not here. */}
        <small className="bsb_field_hint">
            {__('A field used here is hidden from the slide body. Its panel below carries the rest: whether every item uses it, which items differ, and putting it back on the slide as well.', 'b-slider')}
        </small>
    </PanelBody>
}
export default AcfFieldRoles;
