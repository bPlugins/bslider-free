/**
 * Renders the ACF extra fields attached to a post/product by Posts.php.
 * Shared by PostItem, WooItem and both grid renderers so the markup stays in one place.
 *
 * Every field is placed freely over the slide: it picks one of nine anchors and can be nudged
 * from there with an offset. Both live in `postsQuery.acfFieldSettings[fieldName]`, alongside the
 * field's own icon, label and affix settings.
 */

import { sanitizeHref } from '../../../utils/functions';

const MEDIA_TYPES = ['image', 'gallery'];
const LINK_TYPES = ['link', 'url', 'email'];

/**
 * Where a field sits over the slide. Fields sharing an anchor stack downwards in the order they
 * were picked, so a corner holding three fields reads as a list rather than three fields on top
 * of one another.
 */
export const ANCHORS = [
    'top-left', 'top-center', 'top-right',
    'middle-left', 'middle-center', 'middle-right',
    'bottom-left', 'bottom-center', 'bottom-right'
];

export const DEFAULT_ANCHOR = 'bottom-left';

/**
 * How many fields a slider can display without a Pro licence.
 *
 * The cap is on the picker alone — the fields assigned to the image, title, description or button
 * slot are a separate setting and are not counted against it.
 */
export const FREE_ACF_FIELD_LIMIT = 3;

/**
 * The picked fields a slider is actually allowed to show.
 *
 * Applied wherever the selection is read rather than only where it is set, so a slider built on a
 * licence that has since lapsed falls back to the first three instead of quietly keeping the rest.
 * The front end has no licence flag of its own, so there it is `Posts::acfFieldsToFetch` that caps —
 * this is the same rule for the editor, kept here so the two cannot drift apart.
 */
export const allowedAcfFields = (selected = [], isPremium) =>
    isPremium ? selected : selected.slice(0, FREE_ACF_FIELD_LIMIT);

/**
 * The looks a set of fields can be given, as `bsb-acf-fields--<value>` in style.scss.
 *
 * One list, read by both the picker in the sidebar and the renderer here, so a preset cannot exist
 * in one and not the other. `chips` is the default and the plainest of them — every other preset is
 * that pill restyled, not a different markup, which is why adding one is a rule in the stylesheet
 * and a line here rather than a branch in the renderer.
 */
export const DISPLAY_PRESETS = [
    'chips', 'rows', 'card', 'outline', 'plain', 'ribbon'
];

export const DEFAULT_PRESET = 'chips';

/**
 * The presets a single field can pick, overriding the set's.
 *
 * `rows` is not among them: it is how a group of fields sits together — one panel holding all of
 * them instead of separate pills — so a field choosing it on its own has nothing to express. It
 * stays the set-wide choice it has always been.
 */
export const FIELD_PRESETS = DISPLAY_PRESETS.filter(preset => 'rows' !== preset);

/** An unknown preset — one saved by a newer version, or hand edited — falls back to the default. */
const presetOf = style => DISPLAY_PRESETS.includes(style) ? style : DEFAULT_PRESET;

/**
 * The preset a field asks for on its own, if any.
 *
 * Nothing stored means it follows the set, which is the whole difference between this and
 * `presetOf`: there is no default to fall back to here, because "no answer" is itself an answer.
 */
const fieldPresetOf = cfg => FIELD_PRESETS.includes(cfg?.preset) ? cfg.preset : null;

/**
 * Anchors for the zones fields used to be placed in.
 *
 * Placement used to be a slot in the caption flow, which has no equivalent here — nothing can
 * turn "below the title" into a corner of the slide. These keep a slider built before the change
 * roughly where it was, top-to-bottom, instead of collapsing every field into one anchor.
 */
const LEGACY_ZONE_ANCHOR = {
    'image-badge': 'top-left',
    'above-title': 'top-left',
    'below-title': 'middle-left',
    'below-excerpt': 'bottom-left',
    'near-button': 'bottom-left'
};

/**
 * Which caption element each row of anchors borrows its entrance animation from.
 *
 * ACF fields have no animation of their own, so without this they snap into place while the
 * title, excerpt and button are still animating in. Taking the effect, delay and duration of
 * whatever animates at that height makes them land as part of the same sequence.
 */
const ANCHOR_ANIMATION = { top: 'title', middle: 'desc', bottom: 'btn' };

// Gap between consecutive fields on one anchor so they cascade rather than land as a block.
const STAGGER = 0.08;

/**
 * Image and gallery fields are only ever a source for the item's main image, never a caption:
 * a thumbnail nobody asked for showing up among the text reads as a bug, not a feature.
 */
export const isMediaField = type => MEDIA_TYPES.includes(type);

/**
 * ACF types that can supply a URL for the item's button.
 *
 * `text` and `textarea` are in here because keeping a URL in a plain text field is common, and
 * without them a group with no dedicated link field offered no Button link choice at all — the
 * row simply was not drawn, which read as the setting being missing. Free text is not a
 * trustworthy href, so what comes out of it goes through `sanitizeHref`.
 */
export const BUTTON_LINK_TYPES = ['url', 'link', 'page_link', 'file', 'text', 'textarea'];

export const isButtonLinkField = type => BUTTON_LINK_TYPES.includes(type);

/** Media fields have no sensible text form, so they cannot stand in for the title or excerpt. */
export const isTextishField = type => !MEDIA_TYPES.includes(type);

/**
 * The item slots an ACF field can be assigned to, instead of being listed as a caption.
 *
 * Each slot keeps three things in `postsQuery`: which field feeds it (`field`), whether ACF or
 * the post wins for the set as a whole (`source`), and a per-post map that overrides that
 * default item by item (`overrides`). Narrowest wins: override, then source, then the post.
 */
export const FIELD_ROLES = {
    image: { label: 'Image', field: 'imageField', source: 'imageSource', overrides: 'imageOverrides' },
    title: { label: 'Title', field: 'titleField', source: 'titleSource', overrides: 'titleOverrides' },
    desc: { label: 'Description', field: 'descField', source: 'descSource', overrides: 'descOverrides' },
    buttonText: { label: 'Button label', field: 'buttonTextField', source: 'buttonTextSource', overrides: 'buttonTextOverrides' },
    buttonLink: { label: 'Button link', field: 'buttonLinkField', source: 'buttonLinkSource', overrides: 'buttonLinkOverrides' }
};

/**
 * Names to keep out of the caption list.
 *
 * A field assigned to a slot is reserved for it — whichever way the source is currently set,
 * since individual items may still be pointed at ACF. Its own `showInSlider` setting is the
 * opt-in for printing it as a caption as well.
 */
const consumedFields = (postsQuery = {}, settings = {}) => new Set(
    Object.values(FIELD_ROLES)
        .map(role => postsQuery?.[role.field])
        .filter(name => name && true !== settings?.[name]?.showInSlider)
);

/**
 * Whether a picked field shows up as a caption at all.
 *
 * A field can be picked for display and still not appear: media never renders as text, and filling
 * the image, title, description or button slot reserves it for that slot. The settings panel and
 * the renderer both ask this, so the panel can never offer placement for a field the slider will
 * not draw.
 */
export const rendersAsCaption = (name, type, postsQuery = {}) =>
    !isMediaField(type) && !consumedFields(postsQuery, postsQuery?.acfFieldSettings || {}).has(name);

/**
 * Which of the nine anchors a field is placed on.
 *
 * Falls back through the zone a slider saved before placement became free, so an existing slider
 * keeps a sensible arrangement rather than piling every field into one corner.
 */
export const anchorOf = (name, settings = {}) => {
    const { anchor, position } = settings?.[name] || {};

    if (ANCHORS.includes(anchor)) {
        return anchor;
    }

    return LEGACY_ZONE_ANCHOR[position] || DEFAULT_ANCHOR;
};

/**
 * Whether the set as a whole takes a slot from ACF.
 *
 * Assigning a field means "use it": a slot pointing at a field with no source stored yet reads as
 * ACF, so picking the field is all it takes and the toggle is only how you opt back out. Callers
 * that act on this check the slot has a field first, so it can never turn ACF on for an empty one.
 */
export const sourceOf = (roleKey, postsQuery = {}) =>
    postsQuery?.[FIELD_ROLES[roleKey]?.source] || 'acf';

/** Whether this particular item takes the slot's value from ACF rather than from the post. */
export const usesAcfFor = (roleKey, post, postsQuery = {}) => {
    const role = FIELD_ROLES[roleKey];

    if (!role || !postsQuery?.[role.field]) {
        return false;
    }

    return 'acf' === (postsQuery?.[role.overrides]?.[post?.id] || sourceOf(roleKey, postsQuery));
};

/**
 * A slot's value, falling back to the post's own whenever ACF is not selected for this item or
 * the field is empty. An assigned-but-empty field can never blank out a title or excerpt.
 */
const resolveRole = (roleKey, post, attributes, fallback, pick) => {
    const postsQuery = attributes?.postsQuery || {};

    if (!usesAcfFor(roleKey, post, postsQuery)) {
        return fallback;
    }

    const value = pick(post?.acf_fields?.[postsQuery[FIELD_ROLES[roleKey].field]] || {});
    return value && String(value).trim() ? value : fallback;
};

export const resolveTitle = (post, attributes) =>
    resolveRole('title', post, attributes, post?.title, acf => acf.value);

/** `fallback` is whatever Excerpt already worked out from the post's excerpt or content. */
export const resolveExcerpt = (post, attributes, fallback) =>
    resolveRole('desc', post, attributes, fallback, acf => acf.value);

/**
 * The button's label.
 *
 * `fallback` is the one text set in the Button panel, which every slide otherwise shares — so an
 * item whose ACF field is empty reads the same as it did before the field was assigned. Callers
 * pass the label they already worked out, so a hidden button stays hidden.
 */
export const resolveButtonText = (post, attributes, fallback) =>
    resolveRole('buttonText', post, attributes, fallback, acf => acf.value);

/**
 * The button's URL.
 *
 * Text types report only a `value`, so the pick falls back to it — and everything is filtered
 * through `sanitizeHref`, since a field a user types into freely can hold `javascript:` as easily
 * as a URL. That also turns an empty result into `#` rather than a link to the current page.
 */
export const resolveButtonLink = (post, attributes) => sanitizeHref(
    resolveRole('buttonLink', post, attributes, post?.link || '', acf => acf.url || acf.value)
);

export const settingsOf = (acf, acfFieldSettings = {}) => acfFieldSettings?.[acf?.name] || {};

/** Posts.php puts the url and alt of both `image` and `gallery` fields at the top level. */
const asImage = acf => acf?.url ? { url: acf.url, alt: acf.alt || '' } : null;

/**
 * Pick the image for the item's main slot.
 *
 * With no Image slot assigned this is the post's featured image. Assigning one switches the whole
 * set over, which the toggle or a per-item override can then take back, and an assigned-but-empty
 * field still falls back to the featured image rather than blanking the slide.
 */
export const resolveSlideImage = (post, attributes, thumbnail) => {
    const postsQuery = attributes?.postsQuery || {};

    if (!usesAcfFor('image', post, postsQuery)) {
        return thumbnail;
    }

    return asImage(post?.acf_fields?.[postsQuery[FIELD_ROLES.image.field]]) || thumbnail;
};

const Value = ({ acf, cfg }) => <>
    {cfg.prefix && <span className="bsb-acf-affix">{cfg.prefix}</span>}
    {acf.value}
    {cfg.suffix && <span className="bsb-acf-affix">{cfg.suffix}</span>}
</>;

const Label = ({ acf, cfg }) => <>
    {cfg.icon && <span className="bsb-acf-icon">{cfg.icon}</span>}
    {false !== cfg.showLabel && <strong className="bsb-acf-label">{acf.label}: </strong>}
</>;

/**
 * A typed offset as a CSS length.
 *
 * The offset fields take any length — `12px`, `5%`, `1.5em` — but a bare number is what anyone
 * types into a box placeholdered `0`, and `left: 20` is not a length: the browser drops the whole
 * declaration and the field does not move at all, which reads as the setting being broken. So a
 * unitless number is taken as px, which is what the person typing it meant.
 *
 * Anything else is passed through untouched. A half typed value like `-` or `5e` is not a length
 * either, but it is on its way to being one, and rejecting it here would only mean the field
 * jumping about while it is being filled in.
 */
const asLength = value => {
    const length = String(value ?? '').trim();

    if (!length) {
        return null;
    }

    return /^[+-]?(\d+\.?\d*|\.\d+)$/.test(length) ? `${length}px` : length;
};

/**
 * A field's own nudge away from its anchor.
 *
 * `left`/`top` rather than a transform, because the entrance animations animate `transform` and
 * would wipe the offset out mid-flight. Offsets are relative, so nudging one field never moves
 * the ones stacked with it.
 */
const offsetStyle = cfg => {
    const offsetX = asLength(cfg?.offsetX);
    const offsetY = asLength(cfg?.offsetY);

    return {
        ...(offsetX ? { left: offsetX } : {}),
        ...(offsetY ? { top: offsetY } : {})
    };
};

const AcfItem = ({ acf, cfg, anim = {} }) => {
    const { className = '', style } = anim;
    const itemStyle = { ...offsetStyle(cfg), ...style };

    // A field's own preset, when it has one. The group already carries the set's, and style.scss
    // states this one after it, so the field's choice is what shows.
    const preset = fieldPresetOf(cfg);
    const classes = `bsb-acf-item ${preset ? `bsb-acf-item--${preset}` : ''} ${className}`;

    if (LINK_TYPES.includes(acf.type) && acf.url) {
        return <div className={classes} style={itemStyle}>
            <Label acf={acf} cfg={cfg} />
            <a className="bsb-acf-value" href={acf.url} rel="noreferrer"><Value acf={acf} cfg={cfg} /></a>
        </div>;
    }

    return <div className={classes} style={itemStyle}>
        <Label acf={acf} cfg={cfg} />
        <span className="bsb-acf-value"><Value acf={acf} cfg={cfg} /></span>
    </div>;
};

/**
 * Build the entrance animation for the fields on one anchor.
 *
 * `classNames` only arrives from the carousel layout, so grid renderers pass nothing and their
 * ACF fields stay static — which matches the rest of a grid, where nothing animates.
 */
const anchorAnimation = (anchor, attributes, classNames) => {
    const source = ANCHOR_ANIMATION[anchor.split('-')[0]];
    const className = classNames?.[source];

    if (!className) {
        return () => ({});
    }

    const { delay = 0, duration } = attributes?.[`${source}Animation`] || {};

    return idx => ({
        className,
        style: {
            // Rounded so float drift does not put `0.78000000000000003s` in the markup.
            animationDelay: `${Math.round(((Number(delay) || 0) + idx * STAGGER) * 1000) / 1000}s`,
            ...(duration ? { animationDuration: `${duration}s` } : {})
        }
    });
};

/**
 * The ACF layer over one slide.
 *
 * A single overlay covering the whole item, holding one group per anchor that has fields on it.
 * The overlay ignores pointer events so it cannot swallow a click meant for the slide beneath —
 * the fields themselves take them back, so a linked field is still clickable.
 */
const AcfFields = ({ post, attributes, classNames }) => {
    const fields = post?.acf_fields;

    if (!fields || Object.keys(fields).length === 0) {
        return null;
    }

    const { layoutType, postsQuery } = attributes || {};
    const settings = postsQuery?.acfFieldSettings || {};
    const style = presetOf(postsQuery?.acfDisplayStyle);

    // Pick order, which is the order Posts.php returns them in.
    const placeable = Object.values(fields).filter(acf => rendersAsCaption(acf?.name, acf?.type, postsQuery));

    if (!placeable.length) {
        return null;
    }

    const used = ANCHORS
        .map(anchor => ({ anchor, items: placeable.filter(acf => anchorOf(acf?.name, settings) === anchor) }))
        .filter(group => group.items.length);

    return <div className="bsb-acf-layer">
        {used.map(({ anchor, items }) => {
            const animOf = anchorAnimation(anchor, attributes, classNames);

            return <div
                key={anchor}
                className={`bsb-acf-fields bsb-acf-fields--${layoutType || 'default'} bsb-acf-fields--${style} bsb-acf-at--${anchor}`}
            >
                {items.map((acf, idx) => (
                    <AcfItem key={acf?.name || idx} acf={acf} cfg={settingsOf(acf, settings)} anim={animOf(idx)} />
                ))}
            </div>;
        })}
    </div>
}
export default AcfFields;
