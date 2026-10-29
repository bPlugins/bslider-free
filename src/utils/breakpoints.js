/** This plugin's tablet and mobile widths; bpl-tools CSS uses 1024/640, so its queries are moved onto these. */
export const BREAKPOINTS = { tablet: 768, mobile: 576 };

/** A slider's own widths (Custom Breakpoints), else the plugin's; a value out of range falls back. */
export const breakpointsOf = (attributes) => {
	const { tablet, mobile } = attributes?.breakpoints || {};
	const tab = Number.isInteger(tablet) && tablet >= 320 && tablet <= 2560 ? tablet : BREAKPOINTS.tablet;
	const mob = Number.isInteger(mobile) && mobile >= 240 && mobile < tab ? mobile : Math.min(BREAKPOINTS.mobile, tab - 1);

	return { tablet: tab, mobile: mob };
};

/** Set on the slider: it then gets the stylesheet's device rules in its own CSS, at its own widths. */
export const hasOwnBreakpoints = (attributes) => Boolean(attributes?.breakpoints && Object.keys(attributes.breakpoints).length);

export const tabletQuery = (bp = BREAKPOINTS) => `(max-width: ${bp.tablet}px)`;

export const mobileQuery = (bp = BREAKPOINTS) => `(max-width: ${bp.mobile}px)`;

/** Media queries written at 1024/640 (bpl-tools) or at the plugin's widths, moved onto the slider's. */
export const toPluginBreakpoints = (css, bp = BREAKPOINTS) => {
	const to = { 1024: bp.tablet, 640: bp.mobile, 768: bp.tablet, 769: bp.tablet + 1, 576: bp.mobile, 577: bp.mobile + 1 };

	return String(css || '').replace(/@media[^{]*/g, query => query.replace(/(min|max)-width:\s*(\d+)px/g, (all, side, width) => (to[width] ? `${side}-width: ${to[width]}px` : all)));
};
