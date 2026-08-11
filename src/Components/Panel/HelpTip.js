import { __ } from '@wordpress/i18n';
import { useId, useRef, useState } from 'react';

/**
 * A help text that waits to be asked for: a small mark beside a field, and the words on hover.
 *
 * **Why a mark rather than a paragraph.** A panel's `help` prop prints its text under every field it is
 * given to, so a sidebar full of carefully written explanations reads as a wall — and the explanation
 * somebody needs once is in the way on every visit after that. Kept behind a mark, the panel stays a list
 * of settings and the reasoning is one hover away.
 *
 * **It answers the keyboard too, and that is not decoration.** The mark is focusable and the bubble opens
 * on focus as well as on hover, so the explanation is reachable without a pointer — the stylesheet does
 * both with `:focus-visible`, see `.bsbHelpTip`. `aria-describedby` ties the two together, so a screen
 * reader reads the text as the field's description rather than as a stray sentence after it.
 *
 * **A `<span>` and not a `<button>`, deliberately.** These sit beside labels, and a label containing a
 * button is markup browsers disagree about — a press meant for the mark ends up toggling the field. It
 * takes `tabindex` and a `note` role instead, which is what it is: something to be read, not pressed.
 * The press is stopped as well, for the case where it is dropped inside a label anyway.
 *
 * **It is pushed back inside whatever would clip it.** The bubble hangs off the mark, and a mark can sit
 * anywhere along a field — so a fixed side is wrong on one edge or the other: anchored right, a mark in the
 * middle of the panel put the bubble past the panel's left edge, where the sidebar's own `overflow` cut the
 * first word off. The `HelpTip` measures on open instead, finds the first ancestor that clips, and shifts
 * the bubble in by whatever it overhangs. `translate` and not `transform`, so the shift and the little lift
 * on opening are two properties rather than one fighting itself.
 *
 * **One line, and no furniture around it.** A "WHEN ON" heading sat above this text for a while and it was
 * two things where one would do: the tip is opened from a switch, so what it describes is the switch being
 * on, and saying so in a heading only pushed the sentence down. What is left is the sentence.
 *
 * @param {object}          props
 * @param {React.ReactNode} props.children Whatever should be said when the mark is hovered.
 * @param {string}          [props.label]  The mark's own accessible name.
 */
const HelpTip = ({ children, label = '' }) => {
    /** Stable across renders and unique per mark, which is what `aria-describedby` needs. */
    const id = `bsbHelpTip-${useId()}`;

    const mark = useRef(null);
    const bubble = useRef(null);
    const [shift, setShift] = useState(0);

    /**
     * The box that would cut the bubble off, which is not always the window.
     *
     * The editor's sidebar scrolls, so somewhere above the mark there is an element with an `overflow`
     * that clips — and that, not the viewport, is the edge that matters. The first such ancestor is the
     * one to stay inside of; with none, the window is the honest fallback.
     */
    const bounds = () => {
        for (let el = mark.current?.parentElement; el; el = el.parentElement) {
            if ('visible' !== getComputedStyle(el).overflowX) {
                return el.getBoundingClientRect();
            }
        }

        return { left: 0, right: window.innerWidth };
    };

    /**
     * Nudge the bubble back inside, measured rather than guessed.
     *
     * Read while it is still hidden — `visibility: hidden` keeps an element's box, so the measurement is
     * the same one the visitor is about to see. The shift is *added* to whatever is already applied, so
     * measuring a bubble that has been moved before still lands in one step.
     */
    const place = () => {
        const box = bubble.current?.getBoundingClientRect();

        if (!box) {
            return;
        }

        const edge = bounds();
        const pad = 8;

        const dx = box.left < edge.left + pad
            ? (edge.left + pad) - box.left
            : (box.right > edge.right - pad ? (edge.right - pad) - box.right : 0);

        if (dx) {
            setShift(previous => previous + dx);
        }
    };

    return <span className='bsbHelpTip' onMouseEnter={place} onFocus={place}>
        <span
            ref={mark}
            className='bsbHelpTipMark'
            tabIndex={0}
            role='note'
            aria-label={label || __('What this does', 'b-slider')}
            aria-describedby={id}
            onClick={event => {
                event.preventDefault();
                event.stopPropagation();
            }}
        >
            <svg viewBox='0 0 20 20' aria-hidden='true' focusable='false'>
                <circle cx='10' cy='10' r='8.25' fill='none' stroke='currentColor' strokeWidth='1.5' />
                <path d='M10 8.6v5' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' />
                <circle cx='10' cy='5.9' r='1.05' fill='currentColor' />
            </svg>
        </span>

        <span
            ref={bubble}
            className='bsbHelpTipBubble'
            id={id}
            role='tooltip'
            style={shift ? { '--bsb-tip-shift': `${Math.round(shift)}px` } : undefined}
        >{children}</span>
    </span>;
};

export default HelpTip;
