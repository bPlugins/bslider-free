import useEditorPictureLink from '../../../hooks/useEditorPictureLink';

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
 */
const LinkedPicture = ({ href, linkTarget, label = '', isBackEnd = false, isSelected = false, children }) => {
    /* Called before the early return, because a hook cannot be skipped on some renders and not others.
       It costs one ref on a slide that has no link. */
    const editorLink = useEditorPictureLink({ isBackEnd, isSelected, linkTarget });

    // A fragment rather than `children` bare: a caller passing two nodes would otherwise have this
    // component return an array, which React asks for keys on.
    if (!href) {
        return <>{children}</>;
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
