/**
 * A heading over a run of fields inside a settings panel.
 *
 * A sidebar panel with eight controls in it is eight controls in a column, and a column says nothing
 * about which of them belong together. These panels each hold two or three separate subjects — what
 * set of slides there is and how to trim it; the picture, the text, and what a click does — and
 * without a break between them the reader has to work that out from the labels alone. That is how
 * "How many" ended up at the top of the filtering panel, read as "load this many" when what it does
 * is keep this many of whatever the fields below it leave behind.
 *
 * Three parts, each with one job:
 *
 * - `title` names the group. Small, uppercase, quieter than a field label so it groups without
 *   competing with the things it is grouping.
 * - `tag` is one word about the whole run — "Optional", and little else would fit. It sits at the far
 *   end of the rule, where a badge is looked for.
 * - `hint` says what the fields are for. Its own full-width paragraph, because it is a sentence, and
 *   a sentence in a flex row either squashes the label or is squashed by it.
 *
 * **The rule runs beside the label, not above it.** A rule above sits between two fields and belongs
 * to neither — it reads as much like the end of what is above as the start of what is below. On the
 * same line as the words there is nothing to misread, and it leaves the natural place for the tag.
 *
 * `first` for the group that opens a panel: WordPress draws the panel's own title bar and its line
 * directly above it, so that one wants less air, not more. It is a prop rather than a `:first-child`
 * rule because `PanelBody` renders its `<h2>` before any child, so the group is never the first one.
 *
 * Styles: `.bsb_field_group*` in editor.scss.
 */
const FieldGroup = ({ title, tag, hint, first }) => <div className={`bsb_field_group ${first ? 'is-first' : ''}`}>
    <div className='bsb_field_group_head'>
        <span className='bsb_field_group_title'>{title}</span>
        <span className='bsb_field_group_rule' aria-hidden='true' />
        {!!tag && <span className='bsb_field_group_tag'>{tag}</span>}
    </div>

    {!!hint && <p className='bsb_field_group_hint'>{hint}</p>}
</div>;

export default FieldGroup;
