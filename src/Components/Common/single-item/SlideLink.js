import { createElement } from 'react';
import useEditorLink from '../../../hooks/useEditorLink';

/**
 * An anchor on a slide, wearing the editor's click rule.
 *
 * Every way off a slide is one of these — the caption's button, the overlay a slide with no image
 * uses, a linked ACF field — so the rule in `useEditorLink` is stated once and cannot be half applied.
 * The picture has its own wrapper, `LinkedPicture`, because it also has to decide whether to make an
 * anchor at all; it follows the same hook.
 *
 * **A component rather than the hook at each call site.** Two of these anchors are drawn inside a
 * `map` over the posts — `PostsGridBack`, and the fields in `AcfFields` — and a hook cannot be called
 * from a loop whose length changes with the query. Each anchor being its own component gives each one
 * its own `wasSelected` besides, which is what a per-slide answer needs.
 *
 * On the front end `useEditorLink` returns nothing, so what renders is the plain anchor these call
 * sites wrote by hand before — same attributes, same behaviour.
 */
const SlideLink = ({ href, linkTarget, isBackEnd = false, isSelected = false, children, ...rest }) => {
    const editorLink = useEditorLink({ isBackEnd, isSelected, linkTarget, href });

    return createElement('a', {
        href,
        target: linkTarget || undefined,
        /* `_blank` without `noopener` hands the opened page a handle on this one, so that much is not
           a caller's choice. Anything else a caller passes still wins — `rest` is spread after. */
        rel: '_blank' === linkTarget ? 'noopener noreferrer' : 'noreferrer',
        ...rest,
        ...editorLink,
        /* Only when the caller is not writing the anchor's html itself: a button label is markup the
           user typed and arrives as `dangerouslySetInnerHTML`, and React refuses an element carrying
           both that and children. */
        ...(rest.dangerouslySetInnerHTML ? {} : { children })
    });
};

export default SlideLink;
