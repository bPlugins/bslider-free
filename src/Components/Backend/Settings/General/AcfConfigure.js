import { __, sprintf } from '@wordpress/i18n';
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { AccordionGroup, PanelBody } from '../../../Panel/AccordionPanel';
import { Label } from '../../../../../../bpl-tools/Components';
import { FIELD_ROLES, FREE_ACF_FIELD_LIMIT } from '../../../Common/single-item/AcfFields';
import Notice from '../../Notice';
import ProNotice from '../../../Panel/ProNotice';
import { PRO_FEATURES } from '../../../../utils/pro-features';
import SelectTokenField from '../../../Panel/SelectTokenField';
import AcfFieldRoles, { ACF_ROLES_PANEL } from './AcfFieldRoles';
import AcfFieldSettings from './AcfFieldSettings';

/**
 * Everything ACF, in a panel of its own.
 *
 * The panel is always there. Hiding it when there is nothing to configure only moves the confusion:
 * someone following a tutorial finds the setting missing with no way to tell whether the plugin is
 * broken, ACF is absent, or their fields simply do not reach this post type. So it says which.
 */
/**
 * The walkthrough offered when there is nothing to pick yet.
 *
 * Kept as one constant so the address is changed in a single place, and read as "is there a video?" at the
 * point of use — left empty, nothing is rendered at all. A link that goes nowhere is worse than no link:
 * somebody stuck on the ACF step clicks it, lands on nothing, and now has two problems.
 */
const ACF_VIDEO = 'https://www.youtube.com/watch?v=Pj7veTzHbQk';

const AcfConfigure = ({ attributes, setAttributes, updateObject, queriedPosts = [] }) => {
    const { postsQuery, sourceType, caption } = attributes;
    const { post_type = 'post', selectedAcfFields = [], acfFieldSettings = {}, acfDisplayStyle = 'chips' } = postsQuery;

    // `null` until the request answers, so the panel says nothing rather than guessing wrong.
    const [acf, setAcf] = useState(null);

    // Which section the accordion below is being asked to bring up, if any. See `AccordionGroup`.
    const [openSection, setOpenSection] = useState(null);

    const targetPostType = post_type || ('woo' === sourceType ? 'product' : 'post');

    useEffect(() => {
        let stale = false;

        apiFetch({ path: `/bsb/v1/acf-fields?post_type=${targetPostType}` })
            .then(data => {
                // A slower request for the previous post type must not overwrite the current one.
                if (stale || !Array.isArray(data?.fields)) return;

                setAcf({
                    isActive: true === data.isActive,
                    fields: data.fields.map(f => ({ label: f.label, value: f.value, type: f.type }))
                });

                pruneSelection(data.fields.map(f => f.value));
            })
            // A failed request is not evidence that ACF is missing, so it reads as "nothing here"
            // rather than sending the user off to install a plugin they may already have.
            .catch(() => { if (!stale) setAcf({ isActive: true, fields: [] }) });

        return () => { stale = true };
    }, [targetPostType, sourceType]);

    const acfOptions = acf?.fields || [];

    // Fields pointed at one of the item's built-in slots under `Use ACF For`.
    const roleFieldNames = Object.values(FIELD_ROLES)
        .map(role => postsQuery?.[role.field])
        .filter(Boolean);

    /**
     * Fields picked for a previous post type stay in the attributes after switching, so the token
     * field keeps showing them. Drop anything the new post type does not offer, along with its
     * per-field settings. An empty list is left alone: that is ACF being inactive, not a real
     * "this post type has no fields" answer, and it must not wipe a saved selection.
     */
    const pruneSelection = availableNames => {
        if (!availableNames.length || !selectedAcfFields.length) return;

        const kept = selectedAcfFields.filter(name => availableNames.includes(name));
        if (kept.length === selectedAcfFields.length) return;

        // Slot fields keep their settings even when they are not on display: a slot field need not
        // be in `selectedAcfFields` at all, so filtering on that alone would throw away the
        // settings of every field assigned under `Use ACF For`.
        const roleNames = roleFieldNames.filter(name => availableNames.includes(name));

        const keptSettings = Object.fromEntries(
            Object.entries(acfFieldSettings || {})
                .filter(([name]) => kept.includes(name) || roleNames.includes(name))
        );

        setAttributes({
            postsQuery: { ...postsQuery, selectedAcfFields: kept, acfFieldSettings: keptSettings }
        });
    };

    /**
     * The slots held by fields that have just been taken out of the picker, as a patch releasing
     * them — the same clearing `Use ACF For` does when a slot is set back to the post default.
     *
     * Taking a field out has to let go of its slot, or the field is not actually gone: the slot
     * keeps feeding the title or image from it, and the panel of settings for that slot stays in
     * the sidebar under a field the picker no longer lists, which is what removing it was meant to
     * get rid of. Its saved icon, position and affixes are left in `acfFieldSettings` untouched, so
     * putting the field back restores the way it was set up rather than starting it over.
     */
    const releasedSlots = removed => Object.values(FIELD_ROLES).reduce((patch, role) => {
        if (!removed.includes(postsQuery?.[role.field])) {
            return patch;
        }

        return { ...patch, [role.field]: '', [role.source]: 'post', [role.overrides]: {} };
    }, {});

    /**
     * Picking a field brings up `Use ACF For`.
     *
     * A field on its own only becomes a caption on the slide. Whether it should instead be the
     * item's title, image, description or button is the decision that changes everything after it —
     * including what the field's own panel then has to offer — so it is the one to put in front of
     * someone who has just added a field, rather than the panel of settings that decision governs.
     *
     * A fresh request object each time: adding two fields in a row is two requests, and the second
     * has to land as well.
     */
    const setAcfFields = val => {
        // Only growing past the limit is refused, and the notice under the picker has already said
        // so — there is nothing to pop up here. Taking a field out is always allowed, so a slider
        // carried over from Pro with more fields than this can still be brought back under the
        // limit instead of being frozen with every control rejecting the click.
        if (val.length > FREE_ACF_FIELD_LIMIT && val.length > selectedAcfFields.length) {
            return;
        }

        const removed = selectedAcfFields.filter(name => !val.includes(name));

        // One write: the selection and the slots it releases are the same change, and two calls
        // would each spread the same stale `postsQuery`, so the second would undo the first.
        setAttributes({
            postsQuery: { ...postsQuery, selectedAcfFields: val, ...releasedSlots(removed) }
        });

        if (val.length > selectedAcfFields.length) {
            setOpenSection({ id: ACF_ROLES_PANEL });
        }
    };

    const setFieldSetting = (fieldName, patch) => updateObject('postsQuery', 'acfFieldSettings', {
        ...acfFieldSettings,
        [fieldName]: { ...acfFieldSettings?.[fieldName], ...patch }
    });

    const setDisplayStyle = val => updateObject('postsQuery', 'acfDisplayStyle', val);

    // Picking a field writes the field and its source together, so this takes a whole patch —
    // two sequential updateObject calls would each spread the same stale attributes.
    const setFieldRole = patch => setAttributes({ postsQuery: { ...postsQuery, ...patch } });

    /**
     * Whether to offer anything below the picker.
     *
     * Nothing picked means nothing to configure, and a stack of ACF panels above a field the user
     * has not filled in reads as clutter they did not ask for.
     *
     * A slot that is already assigned counts too. Those live outside `selectedAcfFields`, so gating
     * on the picker alone would let a user clear it and strand an ACF title or image that is still
     * being rendered, with no control left on screen to see it or take it back.
     */
    const hasAcfInPlay = selectedAcfFields.length > 0 || roleFieldNames.length > 0;

    /**
     * Why there is nothing to pick, when there is nothing to pick.
     *
     * `null` while the request is in flight — the panel opens closed, so in practice the answer has
     * arrived by the time anyone looks. The two messages differ on purpose: telling someone to
     * install a plugin they already have, because their field group happens to target a different
     * post type, is the kind of advice that sends them to support.
     */
    const emptyReason = () => {
        if (!acf || acfOptions.length) {
            return null;
        }

        return acf.isActive
            ? __('No ACF fields are available for this post type. In ACF, add a field group whose location rules target it.', 'b-slider')
            : __('Advanced Custom Fields is not installed. Install and activate ACF, then create a field group for this post type.', 'b-slider');
    };

    const emptyMessage = emptyReason();

    return <PanelBody
        className="bPlPanelBody"
        title={__('ACF Integration', 'b-slider')}
        /* Newly arrived, and easy to walk past on a panel list this long — see the `badge` prop. */
        badge={__('New', 'b-slider')}
        initialOpen={false}
    >
        {emptyMessage && <Notice>
            {emptyMessage}

            {/**
              * The way out of the notice, not more of the notice.
              *
              * It says what the video shows and how long it takes, so the decision to click is made before
              * clicking rather than after. `target="_blank"` because the reader is mid-setup in the editor —
              * navigating away would cost them the post they are editing.
              */}
            {!!ACF_VIDEO && <a
                className='bsbNoticeVideo'
                href={ACF_VIDEO}
                target='_blank'
                rel='noopener noreferrer'
            >
                <svg viewBox='0 0 24 24' aria-hidden='true' focusable='false'>
                    <circle cx='12' cy='12' r='10' fill='none' stroke='currentColor' strokeWidth='1.6' />
                    <path d='M10 8.5l6 3.5-6 3.5z' fill='currentColor' />
                </svg>
                {__('See how it works (2 min)', 'b-slider')}
            </a>}
        </Notice>}

        {acfOptions.length > 0 && <>
            <Label className="mb5">{__('Select ACF Fields:', 'b-slider')}</Label>

            <SelectTokenField
                value={selectedAcfFields}
                onChange={setAcfFields}
                options={acfOptions}
            />

            {/* Always on screen, not raised once a click has already been refused: picking the
                fourth field simply does nothing, so the reason has to be readable before that
                happens. The count is part of it — "three fields" on its own does not say how many
                are left. */}
            <Notice>
                {sprintf(
                    /* translators: 1: fields picked, 2: how many the free version displays. */
                    __('Using %1$d of %2$d fields. bSlider Pro displays all of your ACF fields, the free version displays %2$d.', 'b-slider'),
                    selectedAcfFields.length,
                    FREE_ACF_FIELD_LIMIT
                )}
            </Notice>
        </>}

        {/* Nothing picked, nothing to configure — the picker stays on its own until the user puts a
            field in it. And nothing on offer means nothing at all: a block whose saved fields
            outlived ACF being deactivated would otherwise pair the notice above with a panel telling
            the user to pick a field, from a picker that is not on screen.

            One container for every section below, so all of them are spaced by the same flex `gap`.
            It has to be a gap rather than margins on the panels: bpl-tools forces
            `margin-top: 0 !important` on `.bPlPanelBody`, which a panel carries for its open colour. */}
        {acfOptions.length > 0 && hasAcfInPlay && <div className="bsb_acf_sections">
            {/* A group of their own: these panels live inside this one, so on the outer group a
                section opening would close the `ACF Integration` panel around it and take itself off
                the screen. Here they only close each other. */}
            <AccordionGroup open={openSection}>
                {/* Assignment comes first: giving a field the title, image, description or button slot
                takes it off the slide as a caption, so it decides what each field's panel below has
                to offer. */}
                <AcfFieldRoles
                    acfOptions={acfOptions}
                    postsQuery={postsQuery}
                    onChange={setFieldRole}
                />

                <AcfFieldSettings
                    fields={selectedAcfFields}
                    acfOptions={acfOptions}
                    acfDisplayStyle={acfDisplayStyle}
                    postsQuery={postsQuery}
                    queriedPosts={queriedPosts}
                    onFieldChange={setFieldSetting}
                    onRoleChange={setFieldRole}
                    onStyleChange={setDisplayStyle}
                    caption={caption}
                />
            </AccordionGroup>
        </div>}

        {/* At the foot of the panel rather than inside each field's own, which is where the icon
            field actually is: a slider with five fields would otherwise carry five copies of the
            same sentence, each behind a different accordion. Only once there are fields to put an
            icon on — the notice is about a control that is not on screen until then. */}
        {acfOptions.length > 0 && hasAcfInPlay && <ProNotice className='mt10' features={PRO_FEATURES.iconLibrary} />}
    </PanelBody>
}
export default AcfConfigure;
