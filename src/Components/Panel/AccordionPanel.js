/**
 * Panels that open one at a time.
 *
 * `PanelBody` below is a drop-in for WordPress's — same props, same markup, so call sites do not
 * change, only where they import it from. Inside an `AccordionGroup` the group owns which panel is
 * open, so opening one closes whichever was open before. Anywhere else it behaves exactly as
 * WordPress's does, each panel keeping its own state.
 *
 * Nesting matters: a group only speaks for the panels under it. The ACF sections sit inside the
 * `ACF Integration` panel, so they take a group of their own — sharing the outer one would have a
 * section closing the panel it lives in, taking itself off the screen with it.
 */

import { createContext, useContext, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { PanelBody as WPPanelBody } from '@wordpress/components';

const AccordionContext = createContext(null);

/**
 * No panel has been clicked yet. Distinct from `null` — which is "clicked, and nothing is open" —
 * because until the first click the panels are still showing whatever they asked to open as.
 */
const UNTOUCHED = undefined;

/**
 * `open` brings a panel up from outside the group, naming it by the `panelId` its `PanelBody`
 * carries. It is a request rather than state: pass a fresh `{ id }` each time, so asking for the
 * same panel twice — with something else opened in between — lands on both occasions. Opening one
 * panel is also closing another, which only the group can do, so it cannot be left to the caller.
 */
export const AccordionGroup = ({ open, children }) => {
    const [openKey, setOpenKey] = useState(UNTOUCHED);
    const group = useMemo(() => ({ openKey, setOpenKey }), [openKey]);

    useEffect(() => {
        if (open?.id) {
            setOpenKey(open.id);
        }
    }, [open]);

    return <AccordionContext.Provider value={group}>{children}</AccordionContext.Provider>;
};

export const PanelBody = ({ initialOpen, onToggle, opened, panelId, badge, ...props }) => {
    const group = useContext(AccordionContext);

    /**
     * A word on the panel's own header — `badge="New"` and nothing else at the call site.
     *
     * Composed here rather than at each call site, so a panel that wants one does not have to build a
     * fragment and remember the class. It goes *into* the title because that is the only part of a
     * `PanelBody` header a caller can reach: WordPress builds the row, the chevron and the button, and
     * anything placed outside the title would land outside the header altogether.
     *
     * The badge is not read out as part of the panel's name — `aria-hidden`, because "Slide Content New"
     * is not what the panel is called, and a screen reader announcing it would be describing our
     * release notes rather than the setting.
     */
    const title = badge
        ? <>
            {props.title}
            {typeof badge === 'string' ? (
                <span className='bsbPanelBadge' aria-hidden='true'>{badge}</span>
            ) : (
                <span style={{ marginLeft: '8px', display: 'inline-flex', verticalAlign: 'middle' }} aria-hidden='true'>
                    {badge}
                </span>
            )}
        </>
        : props.title;

    props = { ...props, title };

    /**
     * What the group holds on to. A `panelId` is only needed by panels something outside the group
     * has to be able to open by name; the rest are known by identity, because a name would have to
     * come from somewhere and there is nothing dependable to take it from — two panels in a tab can
     * carry the same title, and an ACF section's title changes with the field it is showing while
     * the panel itself stays the same one.
     */
    const fallbackKey = useRef({}).current;
    const key = panelId ?? fallbackKey;

    /* Nothing to coordinate with, or a caller already driving the panel. Left to WordPress. */
    if (!group || opened !== undefined) {
        return <WPPanelBody initialOpen={initialOpen} onToggle={onToggle} opened={opened} {...props} />;
    }

    const isOpened = group.openKey === UNTOUCHED
        ? Boolean(initialOpen)
        : group.openKey === key;

    return <WPPanelBody
        {...props}
        opened={isOpened}
        onToggle={next => {
            group.setOpenKey(next ? key : null);
            onToggle?.(next);
        }}
    />;
};
