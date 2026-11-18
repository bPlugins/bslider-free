/** `style.scss`'s per-device rules for one slider with its own breakpoints (the stylesheet's skip it); written at 768/576 for toPluginBreakpoints to move. */

const PLACE_PROPS = ['left', 'right', 'top', 'bottom', 'translate', 'width', 'max-width', 'margin-left', 'margin-right', 'height', 'box-sizing'];

const place = (scope, device) => `${scope} .bsb-abs[data-bsb-devices] { ${PLACE_PROPS.map(prop => `--bsb-${prop}: var(--bsb-${prop}-${device});`).join(' ')} }`;

const columns = (scope, device, count) => (Number.isInteger(Number(count)) && Number(count) > 0
	? `${scope} .columns-${device}-${Number(count)} { grid-template-columns: repeat(${Number(count)}, 1fr); columns: ${Number(count)}; }`
	: '');

const hidden = (scope, device) => `
	${scope} .bsb-layer.bsb-hide-${device}:not(.block-editor-block-list__block) { display: none !important; }
	${scope} .bsb-layer.bsb-still-${device}, ${scope} .bsb-layer.bsb-still-${device} .bsb-word { animation: none !important; opacity: 1 !important; }`;

const fontSize = (scope, device) => `
	${scope} .bsb-layer-typo[style*="--bsb-font-size-${device}"] { font-size: var(--bsb-font-size-${device}) !important; }
	${scope} .bsb-layer-scaled .bsb-abs.bsb-layer-typo[style*="--bsb-font-size-${device}"],
	${scope} .bsb-layer-scaled .bsb-abs .bsb-layer-typo[style*="--bsb-font-size-${device}"] { font-size: calc(var(--bsb-font-size-${device}) / var(--bsb-layer-scale, 1)) !important; }`;

const order = (scope, device) => {
	const marks = 'mobile' === device ? '> .bsb-order-tablet, > .bsb-order-mobile' : '> .bsb-order-tablet';
	const own = ('mobile' === device ? ['tablet', 'mobile'] : ['tablet'])
		.map(name => `${scope} :has(${marks}) > .bsb-order-${name} { order: var(--bsb-order-${name}); }`).join('\n\t');

	return `
	${scope} :has(${marks}) > * { order: 9999; }
	${own}
	${scope} :is(.bsb-slide-content, .is-layout-flow, .is-layout-constrained):not(.is-layout-flex, .is-layout-grid):has(${marks}) { display: flex; flex-direction: column; }`;
};

export const deviceRulesCSS = (scope, attributes = {}) => `
	${place(scope, 'desktop')}

	@media (max-width: 768px) {
		${columns(scope, 'tablet', attributes.columns?.tablet)}
		${fontSize(scope, 'tablet')}
		${place(scope, 'tablet')}
		${order(scope, 'tablet')}
	}

	@media (max-width: 576px) {
		${columns(scope, 'mobile', attributes.columns?.mobile)}
		${fontSize(scope, 'mobile')}
		${place(scope, 'mobile')}
		${order(scope, 'mobile')}
	}

	@media (min-width: 769px) {
		${hidden(scope, 'desktop')}
	}

	@media (min-width: 577px) and (max-width: 768px) {
		${hidden(scope, 'tablet')}
	}

	@media (max-width: 576px) {
		${hidden(scope, 'mobile')}
	}
`;
