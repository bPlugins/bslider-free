import { useEffect, useRef } from 'react';
import useEditorLink from '../../../hooks/useEditorLink';
import { bsb_open_popup, galleryOf } from '../../../utils/config';

/**
 * A slide picture that is itself the link — the `Clicking the picture` setting.
 *
 * **Why this is a component and not four copies of an anchor.** Four places draw a post or product
 * slide: `PostItem`, `WooItem`, and the two grid renderers, which `Layout` swaps in for a `posts` or
 * `woo` grid instead of `Grid`. The setting has to mean the same thing in all four, and the first cut
 * of it missed the grids entirely — the option was in the panel doing nothing for anyone whose slider
 * was a grid. One component is what stops the next change reintroducing that.
 *
 * **The anchor belongs inside `.img`, so this wraps the picture and not the slide.** The picture is
 * sized by `.item > .img img`; a wrapper outside that box takes it out of the rule's reach and the
 * picture stops filling the slide. `.bsbSlideLink` gives the anchor the real height it needs — see
 * the rule it shares with `.bsbFeedPlay` in style.scss.
 *
 * **`href` empty means no anchor at all**, which is the whole of the off state: nothing is wrapped,
 * nothing is styled, and the markup is exactly what it was before the setting existed.
 *
 * `label` is for the anchor's accessible name, and is meant to be left empty where the picture inside
 * already carries an `alt` — an image inside a link is what names that link, so a second name would
 * only repeat the first over the top of it.
 *
 * **`lightbox` sends the click to the lightbox instead, and it is the one thing here that changes what
 * a click means.** The anchor is still an anchor and still points at the picture, so a visitor with no
 * JavaScript — and any crawler — follows it to the image the way they always did. Only `data-fancybox`
 * is added, which is the whole of how Fancybox finds a trigger: `bsb_lightbox_config` binds by that
 * attribute, so a slide without it is invisible to the lightbox. That is why the off state needs no
 * `false` of its own — the absence of the attribute *is* the off state.
 *
 * `href` is the picture's own file rather than the post's permalink in that mode, because the lightbox
 * shows the picture. The caller resolves which file that is — see `lightboxHref` in `PostItem`.
 *
 * `caption` is the line under the picture inside the lightbox, already resolved and stripped of markup
 * by `lightboxCaption` — the caller picks which of the slide's strings it comes from, since only the
 * caller knows what a slide of its kind has.
 */
const LinkedPicture = ({ href, linkTarget, label = '', lightbox = false, caption = '', clientId = '', attributes = null, isBackEnd = false, isSelected = false, children }) => {
    /* Called before the early return, because a hook cannot be skipped on some renders and not others.
       It costs one ref on a slide that has no link. */
    const editorLink = useEditorLink({ isBackEnd, isSelected, linkTarget, href });
    const anchor = useRef(null);
    const wasSelected = useRef(false);

    /**
     * Opening the lightbox in the editor, where Fancybox's own listener cannot be relied on.
     *
     * The reasoning is written out in full at `ImageItem`'s `LightboxPicture` and applies here
     * unchanged: a click on a slide in the canvas is also how the block gets selected, so something has
     * usually called `preventDefault` before Fancybox's delegated listener sees it, and it gives up.
     * `bsb_open_popup` does what that handler would have done.
     *
     * Native listeners rather than the React props `useEditorLink` returns, because React dispatches
     * from the canvas root — above the slide area — so a React handler runs *after* Fancybox's
     * delegated one, too late to prevent it. `useEditorLink` is left out of this mode entirely for the
     * same reason its job does not apply: nothing here navigates.
     */
    useEffect(() => {
        const trigger = anchor.current;

        if (!isBackEnd || !lightbox || !href || !trigger) {
            return;
        }

        const onDown = () => { wasSelected.current = isSelected; };

        const onClick = event => {
            // A keyboard-raised click has no mousedown behind it — `detail` is 0 — and reaching the
            // anchor with the keyboard means the block is already selected, so the prop is honest there.
            if (!(0 === event.detail ? isSelected : wasSelected.current)) {
                event.preventDefault();
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            bsb_open_popup(clientId, attributes, trigger);
        };

        trigger.addEventListener('mousedown', onDown);
        trigger.addEventListener('click', onClick);

        return () => {
            trigger.removeEventListener('mousedown', onDown);
            trigger.removeEventListener('click', onClick);
        };
    }, [isBackEnd, lightbox, href, isSelected, clientId, attributes]);

    // A fragment rather than `children` bare: a caller passing two nodes would otherwise have this
    // component return an array, which React asks for keys on.
    if (!href) {
        return <>{children}</>;
    }

    /* No `target` and no `rel` in this mode: `Open in a new tab` is about the post, and the click no
       longer goes there. Leaving `_blank` on would make a JavaScript-less visitor's fallback open the
       bare image file in a new tab, which is not what the switch was asked about. */
    if (lightbox) {
        return <a
            ref={anchor}
            className='bsbLightboxImage'
            data-fancybox={galleryOf(clientId)}
            href={href}
            /* Left off entirely where there is no caption, rather than set empty: Fancybox reads this
               off the dataset and an empty string is still a caption to it — it renders the caption
               element and every existing lightbox gets a taller pane. Absence is the off state. */
            {...(caption ? { 'data-caption': caption } : {})}
            {...(label ? { 'aria-label': label } : {})}
        >
            {children}
        </a>;
    }

    return <a
        className='bsbSlideLink'
        href={href}
        target={linkTarget || undefined}
        rel={'_blank' === linkTarget ? 'noopener noreferrer' : undefined}
        {...(label ? { 'aria-label': label } : {})}
        {...editorLink}
    >
        {children}
    </a>;
};

export default LinkedPicture;
