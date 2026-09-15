import { createElement, useEffect, useRef } from 'react';
import { bsb_open_popup, galleryOf } from '../../../utils/config';
import { lightboxCaption } from '../../../utils/functions';

/**
 * The picture, wrapped in a lightbox trigger where the slider asks for one.
 *
 * **Off means no anchor at all**, which is the whole of the off state: the markup is exactly what it
 * was before the setting existed, so a slider saved without it renders byte for byte as it did.
 *
 * No `data-type`: Fancybox's `defaultType` is `image`, and that is what this is. Videos carry
 * `html5video` on their own triggers — the two share one `data-fancybox` value so that a slider
 * holding both opens as a single gallery, and `data-type` is what keeps them told apart inside it.
 */
const LightboxPicture = ({ enabled, clientId, href, caption = '', attributes, isBackEnd = false, isSelected = false, children }) => {
    const anchor = useRef(null);
    const wasSelected = useRef(false);

    /**
     * Opening the lightbox in the editor, where Fancybox's own listener cannot be relied on.
     *
     * A click on a slide in the canvas is also how the block gets selected, so something has usually
     * called `preventDefault` before Fancybox's delegated listener sees it, and it gives up.
     * `bsb_open_popup` does what that handler would have done.
     *
     * The first click on an unselected slider is not the lightbox's to take: it is how the editor
     * selects the block. Declining has to `preventDefault` rather than simply return, because
     * `Fancybox.bind` is listening on an ancestor and would otherwise open the lightbox on the very
     * click this one passed on. Native listeners rather than React props, because React dispatches
     * from the canvas root — above the slide area — so a React handler runs after the delegated one,
     * too late to prevent anything. And `wasSelected` is recorded on mousedown because selecting a
     * block is over before a click event exists.
     *
     * A hook cannot be skipped on some renders and not others, so this is called before the early
     * return below. It costs one ref on a slide that has no lightbox.
     */
    useEffect(() => {
        const trigger = anchor.current;

        if (!isBackEnd || !enabled || !trigger) {
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
    }, [isBackEnd, enabled, isSelected, clientId, attributes]);

    if (!enabled || !href) {
        return <>{children}</>;
    }

    return <a
        ref={anchor}
        className='bsbLightboxImage'
        data-fancybox={galleryOf(clientId)}
        href={href}
        /* Left off entirely where there is no caption, rather than set empty: Fancybox reads this off
           the dataset and an empty string is still a caption to it — it renders the caption element
           and every existing lightbox gets a taller pane. Absence is the off state. */
        {...(caption ? { 'data-caption': caption } : {})}
    >
        {children}
    </a>;
};

const ImageItem = (props) => {

    const { attributes, slide, index, classNames = {}, clientId, isBackEnd = false, isSelected = false } = props;
    const { titleFCaption, title, desc: descOptions, image, lightbox } = attributes;

    // The same two switches the post source reads, so "hide the captions" means the same thing whatever
    // a slider is built from. Only an explicit `false` hides anything: a slider saved before these keys
    // existed has neither of them, and a missing key has to keep meaning "shown".
    const showTitle = title?.isVisible !== false;
    const showDesc = descOptions?.isVisible !== false;

    const { img, title: slideTitle, desc, altText } = slide || {};

    const titleCheck = titleFCaption ?
        (img?.caption || img?.title) :
        ((slideTitle !== null && slideTitle !== undefined) ?
            slideTitle :
            img?.caption || img?.title);

    /**
     * `is-linked` where the picture is a lightbox trigger, for the same reason a post slide carries it.
     *
     * Without it the click never reaches the anchor: `Style.js` lays `.item:after` across the whole
     * slide to paint the overlay tint, and a pseudo-element is credited to the element it belongs to,
     * so hit-testing names `.item` and Fancybox's `closest()` finds no trigger. The rule that makes
     * that layer transparent to clicks lives behind this class — see `.item.is-linked` in style.scss.
     */
    const isLightbox = 'lightbox' === image?.link && !!img?.url;

    /* The line under the picture inside the lightbox. `titleCheck` for the `title` mode rather than
       `slideTitle` alone, so the caption is the words the slide is already showing — having the two
       disagree would mean one picture with two titles. */
    const lbCaption = isLightbox
        ? lightboxCaption(lightbox?.caption, {
            imageCaption: img?.caption || img?.alt || '',
            title: titleCheck
        })
        : '';

    return <div className={`item ${index === 0 ? 'active' : ''} ${isLightbox ? 'is-linked' : ''} ${classNames.item || ''}`}>
        <div className="img">
            {img?.url && <LightboxPicture enabled={isLightbox} clientId={clientId} href={img.url} caption={lbCaption} attributes={attributes} isBackEnd={isBackEnd} isSelected={isSelected}>
                <img src={img.url} className="d-block w-100" alt={altText || img?.alt || img?.title} />
            </LightboxPicture>}
        </div>

        <div className={classNames.contentArea || 'content-area'}>
            <div className={`captionContent ${classNames.captionContent || ''}`}>
                {showTitle && (slideTitle || img?.caption || img?.title) && createElement('h5', {
                    className: `bsbTitle ${classNames.title || ''}`, dangerouslySetInnerHTML: { __html: titleCheck }
                }, null)}

                {showDesc && desc && <>
                    <p className={classNames.desc || ''} dangerouslySetInnerHTML={{ __html: desc }} />
                </>}
            </div>
        </div>
    </div>
}
export default ImageItem;