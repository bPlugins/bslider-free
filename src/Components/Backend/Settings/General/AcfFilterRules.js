import { __ } from '@wordpress/i18n';
import { Button, SelectControl, TextControl } from '@wordpress/components';
import { Label } from '../../../../../../bpl-tools/Components';

/**
 * The filter rules, one row each.
 *
 * The panel cannot know what fields a site has, and does not need to: every row is built from the
 * chosen field's *type*, which ACF does report. The type decides which comparisons are worth
 * offering and what the value box is — a dropdown of the field's own choices where ACF has written
 * them down, a Yes/No for a switch, a date for a date. What a rule never asks is which SQL to use.
 *
 * That last point is the whole reason this is type-driven rather than a free `key / operator /
 * value` form. The comparisons that fail on ACF data fail silently: `= "true"` against a switch that
 * stores `"1"`, `=` against a checkbox that stores a serialized array, an empty field that counts as
 * zero. A form that let someone express those would be a form that mostly produced empty sliders.
 */

/**
 * Comparisons every type can answer, and which need no value typed.
 *
 * "Has no value" rather than "is empty": the person setting this up is thinking about a field they
 * left blank on a post, not about a database row, and the wording matches the switch above — the
 * same question is not worth two names on one panel.
 */
const EMPTINESS = [
    { label: __('has no value', 'b-slider'), value: 'empty' },
    { label: __('has any value', 'b-slider'), value: 'not_empty' }
];

export const VALUELESS = ['empty', 'not_empty'];

const IS = { label: __('is', 'b-slider'), value: 'is' };
const IS_NOT = { label: __('is not', 'b-slider'), value: 'is_not' };

/**
 * What each field type may be asked, and how its value is collected.
 *
 * `numeric` marks the types whose values are compared as numbers — the same short list the sort
 * uses, and for the same reason: read as text, `9` is greater than `10`.
 */
const BY_TYPE = {
    number: {
        numeric: true,
        input: 'number',
        /* "At least" and "at most" rather than "greater or equal" — the same comparison, in the
           words someone pricing a filter would use out loud. */
        compares: [
            IS, IS_NOT,
            { label: __('is more than', 'b-slider'), value: 'gt' },
            { label: __('is at least', 'b-slider'), value: 'gte' },
            { label: __('is less than', 'b-slider'), value: 'lt' },
            { label: __('is at most', 'b-slider'), value: 'lte' }
        ]
    },
    text: {
        input: 'text',
        compares: [
            IS, IS_NOT,
            { label: __('contains', 'b-slider'), value: 'contains' },
            { label: __('does not contain', 'b-slider'), value: 'not_contains' }
        ]
    },
    choice: {
        input: 'choice',
        compares: [IS, IS_NOT]
    },
    /**
     * Stored as a serialized array, so a rule asks what is inside it rather than what it equals.
     *
     * "Has" rather than "includes", which is a word about containers. Someone looking at a set of
     * tickboxes is asking whether one of them is ticked, and "Stock has In stock" is that sentence.
     */
    multi: {
        input: 'choice',
        compares: [
            { label: __('has', 'b-slider'), value: 'includes' },
            { label: __('does not have', 'b-slider'), value: 'not_includes' }
        ]
    },
    boolean: {
        input: 'boolean',
        compares: [IS, IS_NOT]
    },
    /* ACF stores a date picker as `Ymd`, which is fixed width, so ordinary text comparison is
       already chronological — see `toStored` / `toInput` below for the conversion either way. */
    date: {
        input: 'date',
        compares: [
            IS, IS_NOT,
            { label: __('is after', 'b-slider'), value: 'gt' },
            { label: __('is on or after', 'b-slider'), value: 'gte' },
            { label: __('is before', 'b-slider'), value: 'lt' },
            { label: __('is on or before', 'b-slider'), value: 'lte' }
        ]
    },
    /**
     * A date and time, stored `Y-m-d H:i:s`.
     *
     * No `is`: the value carries a time, so asking for a day never matches one exactly. The stored
     * form starts with the date, so the four range comparisons work as plain text and mean what they
     * say — everything from that day onwards, everything before it.
     */
    datetime: {
        input: 'datetime',
        compares: [
            { label: __('is after', 'b-slider'), value: 'gt' },
            { label: __('is on or after', 'b-slider'), value: 'gte' },
            { label: __('is before', 'b-slider'), value: 'lt' },
            { label: __('is on or before', 'b-slider'), value: 'lte' }
        ]
    },
    /* A post, term or user, stored as its ID. */
    ref: { input: 'id', compares: [IS, IS_NOT] },
    /* Several of them, stored as a serialized list of IDs. */
    refs: {
        input: 'id',
        compares: [
            { label: __('has', 'b-slider'), value: 'includes' },
            { label: __('does not have', 'b-slider'), value: 'not_includes' }
        ]
    },
    /**
     * Fields whose only useful question is whether anything is in them.
     *
     * An image, a file, a map pin or a link is stored as an ID or an array, and no comparison
     * against it means anything a person would ask for — but "has one" and "has none" is a real
     * filter, and the commonest one on a media field. So the type stays, with only the two
     * comparisons every field gets.
     */
    presence: { input: 'none', compares: [] }
};

/**
 * Which of the shapes above a given ACF type takes.
 *
 * Every type ACF can hand over is listed. Filtering is not sorting: sorting on an image is
 * meaningless, but "only the posts that have one" is one of the most useful rules there is, so
 * nothing is excluded — a type with no sensible comparison simply falls to `presence`, which still
 * answers the empty / not empty question that applies to everything.
 */
const SHAPE_OF = {
    number: 'number', range: 'number',
    text: 'text', email: 'text', url: 'text', password: 'text',
    textarea: 'text', wysiwyg: 'text', oembed: 'text', color_picker: 'text',
    time_picker: 'text',
    select: 'choice', radio: 'choice', button_group: 'choice',
    checkbox: 'multi',
    true_false: 'boolean',
    date_picker: 'date',
    date_time_picker: 'datetime',
    post_object: 'ref', page_link: 'ref', user: 'ref', taxonomy: 'ref',
    relationship: 'refs',
    image: 'presence', file: 'presence', gallery: 'presence',
    link: 'presence', google_map: 'presence'
};

/**
 * The shape a field takes, and the one thing the type alone cannot settle.
 *
 * `select`, `post_object`, `user` and `taxonomy` each store one value or a serialized list of them
 * depending on how the field was set up, and the two need different comparisons. ACF reports which
 * in `multiple`, so the field, not the type, has the last word.
 */
const shapeFor = field => {
    const shape = SHAPE_OF[field?.type];

    if (field?.multiple) {
        if ('choice' === shape) return BY_TYPE.multi;
        if ('ref' === shape) return BY_TYPE.refs;
    }

    // An unknown type — one from a newer ACF, or an add-on — still gets the two questions that
    // need no knowledge of what it holds, rather than being dropped from the picker.
    return BY_TYPE[shape] || BY_TYPE.presence;
};

/** `2026-08-16` as the date input speaks it, `20260816` as ACF stored it. */
const toStored = val => String(val || '').replace(/-/g, '');
const toInput = val => {
    const digits = String(val || '');
    return /^\d{8}$/.test(digits)
        ? `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`
        : '';
};

/**
 * The comparison a fresh rule opens on.
 *
 * A `presence` field has no comparisons of its own, only the two every field gets, so there is
 * nothing at the front of its list to take — and reading `[0].value` off it is how a rule for an
 * image field would have thrown on being added.
 */
const firstCompare = shape => shape.compares[0]?.value || 'not_empty';

const AcfFilterRules = ({ fields, rules, relation, onChange }) => {
    const fieldByName = name => fields.find(field => field.value === name);

    const setRule = (index, patch) => onChange(
        rules.map((rule, i) => (i === index ? { ...rule, ...patch } : rule))
    );

    /**
     * Changing the field resets the comparison and the value with it.
     *
     * They were chosen for the old field's type and mean nothing under the new one: `includes` on a
     * number, or a date left in the box of a price rule. Keeping them would leave a row that reads
     * as set and matches nothing.
     */
    const setField = (index, name) => {
        const shape = shapeFor(fieldByName(name));

        setRule(index, {
            key: name,
            compare: firstCompare(shape),
            value: '',
            numeric: true === shape.numeric
        });
    };

    const addRule = () => {
        const first = fields[0];
        const shape = shapeFor(first);

        onChange([...rules, {
            key: first?.value || '',
            compare: firstCompare(shape),
            value: '',
            numeric: true === shape.numeric
        }]);
    };

    const removeRule = index => onChange(rules.filter((rule, i) => i !== index));

    /** The value box, whichever kind this rule's field calls for. */
    const valueControl = (rule, index) => {
        const field = fieldByName(rule.key);
        const shape = shapeFor(field);

        // Nothing to compare against — either the rule is an emptiness test, or the field holds
        // something no comparison would mean anything about and only offers those two.
        if (VALUELESS.includes(rule.compare) || 'none' === shape.input) {
            return null;
        }

        if ('choice' === shape.input) {
            const choices = field?.choices || [];

            /* A field ACF calls a choice field but whose choices are generated in PHP arrives with
               none, and a dropdown of nothing cannot be filled in. Text is the honest fallback. */
            return choices.length
                ? <SelectControl
                    value={rule.value}
                    onChange={val => setRule(index, { value: val })}
                    options={[
                        { label: __('Choose…', 'b-slider'), value: '' },
                        ...choices.map(choice => ({ label: choice.label, value: choice.value }))
                    ]}
                />
                : <TextControl value={rule.value} onChange={val => setRule(index, { value: val })} />;
        }

        if ('boolean' === shape.input) {
            return <SelectControl
                value={rule.value}
                onChange={val => setRule(index, { value: val })}
                options={[
                    { label: __('Choose…', 'b-slider'), value: '' },
                    /* The values ACF actually stores for a switch. `true` would match nothing. */
                    { label: __('Yes', 'b-slider'), value: '1' },
                    { label: __('No', 'b-slider'), value: '0' }
                ]}
            />;
        }

        if ('date' === shape.input) {
            return <TextControl
                type="date"
                value={toInput(rule.value)}
                onChange={val => setRule(index, { value: toStored(val) })}
            />;
        }

        /* A date and time is stored `Y-m-d H:i:s`, so the date goes in as the browser writes it and
           the comparison reads the leading date — no conversion, unlike the date picker's `Ymd`. */
        if ('datetime' === shape.input) {
            return <TextControl
                type="date"
                value={rule.value}
                onChange={val => setRule(index, { value: val })}
            />;
        }

        if ('id' === shape.input) {
            return <TextControl
                type="number"
                value={rule.value}
                onChange={val => setRule(index, { value: val })}
                placeholder={__('e.g. 42', 'b-slider')}
                help={__('The ID number of the post, page or user it links to. You can see it in the address bar when editing that item.', 'b-slider')}
            />;
        }

        return <TextControl
            type={'number' === shape.input ? 'number' : 'text'}
            value={rule.value}
            onChange={val => setRule(index, { value: val })}
            placeholder={__('Value', 'b-slider')}
        />;
    };

    return <>
        {rules.length > 1 && (
            <div className="mb10">
                {/* Spelled as the sentence it makes with the rows under it — "show a post if it
                    matches all of these" — rather than the bare `AND` / `OR` it becomes. */}
                <Label className='mb5'>{__('Show a Post If It Matches:', 'b-slider')}</Label>
                <SelectControl
                    value={relation}
                    onChange={val => onChange(rules, val)}
                    options={[
                        { label: __('All of these rules', 'b-slider'), value: 'AND' },
                        { label: __('Any of these rules', 'b-slider'), value: 'OR' }
                    ]}
                />
            </div>
        )}

        {rules.map((rule, index) => {
            const shape = shapeFor(fieldByName(rule.key));

            return (
                <div key={index} className="bsb_acf_filter_rule mb10">
                    <SelectControl
                        value={rule.key}
                        onChange={val => setField(index, val)}
                        options={fields.map(field => ({ label: field.label, value: field.value }))}
                    />

                    <SelectControl
                        value={rule.compare}
                        onChange={val => setRule(index, {
                            compare: val,
                            // Nothing is compared against for these two, so a value left behind
                            // would be saved on a rule that never reads it.
                            ...(VALUELESS.includes(val) ? { value: '' } : {})
                        })}
                        options={[...shape.compares, ...EMPTINESS]}
                    />

                    {valueControl(rule, index)}

                    <Button
                        isDestructive
                        variant="tertiary"
                        onClick={() => removeRule(index)}
                        label={__('Remove rule', 'b-slider')}
                        showTooltip
                    >
                        ×
                    </Button>
                </div>
            );
        })}

        <Button variant="secondary" onClick={addRule} disabled={!fields.length}>
            {__('+ Add Rule', 'b-slider')}
        </Button>
    </>;
};

export default AcfFilterRules;
