import { useRef } from 'react';

/**
 * What a click on a linked slide picture does inside the editor canvas.
 *
 * Three different clicks arrive at the same anchor, and the whole job of this hook is telling them
 * apart. Nothing here runs on the front end — there the anchor is a plain link with no handler on it.
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
 * **A click on an already-selected slider still may not navigate the canvas.** It is an iframe, and a
 * same-tab link followed inside it replaces the editor with the site — unsaved work included.
 * WordPress does not stop this on a block's behalf: `useEventHandlers` in `@wordpress/block-editor`
 * binds `keydown` and `dragstart` and nothing else, and no editor stylesheet takes clicks off links in
 * the canvas. Checked in the bundle this site runs rather than assumed. So the same-tab case is
 * refused for good, and `_blank` — which opens beside the editor and leaves it standing — is let
 * through once the block is selected.
 *
 * **A modifier click is always let through.** Ctrl/⌘-click and shift-click are the browser's own "open
 * this somewhere else"; they cost the canvas nothing, and they are how a same-tab link can be checked
 * from the editor at all. Alt-click is left out — it means "download this", which is not a way of
 * looking at a post.
 *
 * The click is never stopped from bubbling. It is also how the editor selects the block, and a slider
 * that cannot be selected by clicking it is a worse problem than the one being solved.
 */
const useEditorPictureLink = ({ isBackEnd, isSelected, linkTarget }) => {
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

            if (!selected || '_blank' !== linkTarget) {
                event.preventDefault();
            }
        }
    };
};

export default useEditorPictureLink;
