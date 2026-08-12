import { useRef } from 'react';
import { sanitizeHref } from '../utils/functions';

/**
 * What a click on a link inside a slide does in the editor canvas.
 *
 * Three different clicks arrive at the same anchor, and the whole job of this hook is telling them
 * apart. Nothing here runs on the front end — there every one of these anchors is a plain link with
 * no handler on it, which is why the front end behaves like any other page on the site.
 *
 * **Every link on a slide, not only the picture.** This began life guarding the linked picture alone,
 * and the slides had three other ways off them: the caption's button, the full-slide overlay a slide
 * with no image uses instead of the picture, and a linked ACF field. All four point at the same post,
 * so a rule that only one of them followed was not a rule — a first click landing an inch lower still
 * threw the editor away. `SlideLink` is what applies it, and every anchor on a slide goes through it.
 *
 * **The first click on an unselected slider is not the link's to take.** That click is how the editor
 * selects the block, which is how every other block in WordPress is selected and how the toolbar and
 * the sidebar are reached. Taking it would mean a slider you can only configure by finding it in the
 * list view. The same rule `onPlayClick` already applies to a feed slide's popup, so the two answer a
 * first click the same way.
 *
 * **The answer is recorded on mousedown rather than read at click time.** Selecting a block happens on
 * mousedown and on focus, both of which are over before a click event exists — so by the time the
 * click handler runs, `isSelected` is already `true` and every first click would look like a second
 * one. `wasSelected` is that prop as it stood when the interaction began. A React handler is enough
 * for this where the popup needed a native one: the prop read inside the handler comes from the render
 * that created it, and React re-renders after the event rather than during it, so the value is the old
 * one however WordPress orders its own listeners against ours.
 *
 * **The second click opens the post, and `Open in a new tab` alone decides where.** `_blank` is let
 * through for the browser to open beside the editor; anything else opens in this tab, which is what
 * the setting being off means. Neither case is second-guessed here — a link that opened somewhere the
 * setting did not ask for would be this hook overruling a switch the user can see.
 *
 * **Same-tab is navigated on the top window rather than left to the anchor.** The canvas is an iframe,
 * so an anchor with no target replaces *the canvas* and leaves the editor's toolbar and sidebar
 * standing around a page of the site — not a tab that went somewhere, just a broken-looking editor.
 * `window.top` is the same tab in the sense the setting means it, and it is what makes the browser's
 * Back button lead to the editor again. WordPress does not step in on a block's behalf here
 * (`useEventHandlers` in `@wordpress/block-editor` binds `keydown` and `dragstart` and nothing else,
 * and no editor stylesheet takes clicks off links in the canvas; checked in the bundle this site runs
 * rather than assumed) — but its own unsaved-changes `beforeunload` lives on that window, so leaving
 * with edits in hand still asks first.
 *
 * **A modifier click is always let through.** Ctrl/⌘-click and shift-click are the browser's own "open
 * this somewhere else"; they cost the canvas nothing. Alt-click is left out — it means "download
 * this", which is not a way of looking at a post.
 *
 * The click is never stopped from bubbling. It is also how the editor selects the block, and a slider
 * that cannot be selected by clicking it is a worse problem than the one being solved.
 */
const useEditorLink = ({ isBackEnd, isSelected, linkTarget, href = '' }) => {
    const wasSelected = useRef(false);

    if (!isBackEnd) {
        return {};
    }

    return {
        onMouseDown: () => { wasSelected.current = isSelected; },

        onClick: event => {
            if (event.ctrlKey || event.metaKey || event.shiftKey) {
                return;
            }

            // A click raised from the keyboard has no mousedown behind it — `detail` is 0 for those —
            // and reaching a link with the keyboard means the block is already selected and focused,
            // so there the prop is the honest answer.
            const selected = 0 === event.detail ? isSelected : wasSelected.current;

            // The first click selects the block and does nothing else. Bubbling is left alone, since
            // that is what carries the selection.
            if (!selected) {
                event.preventDefault();
                return;
            }

            // `_blank` opens beside the editor on its own, and that is where the setting asked for it.
            if ('_blank' === linkTarget) {
                return;
            }

            /* `sanitizeHref` again rather than trusting the caller: a button link can come from an ACF
               field somebody types into freely, and assigning `location` follows `javascript:` as
               willingly as an anchor does. It answers `#` for anything it will not pass. */
            const url = sanitizeHref(href);

            // Nothing to go to — the anchor is refused rather than left to reload the canvas as `#`.
            if (!url || '#' === url) {
                event.preventDefault();
                return;
            }

            event.preventDefault();

            /* Wrapped because `window.top` is the one thing here that is not ours: the canvas iframe is
               same-origin today, and a browser or a future editor that says otherwise would throw on
               the read. Falling back to this window still opens the post, which is what was asked. */
            try {
                (window.top || window).location.href = url;
            } catch (e) {
                window.location.href = url;
            }
        }
    };
};

export default useEditorLink;
