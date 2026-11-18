import { createBlock } from '@wordpress/blocks';
import { escapeHTML } from '@wordpress/escape-html';

/** Slides one request may ask for; matches AiSlides::MAX_SLIDES. */
export const MAX_SLIDES = 10;

const LIMITS = { eyebrow: 40, heading: 90, text: 200, button: 30 };

/* Used when the AI's colours are missing or too light for white text. */
const FALLBACK = { from: '#0F172A', to: '#1E3A8A', accent: '#3B82F6' };

const isHex = val => 'string' === typeof val && /^#[0-9a-f]{6}$/i.test(val.trim());

/** Relative luminance (WCAG) of a #RRGGBB colour. */
const luminance = hex => {
	const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
		.map(c => c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** WCAG contrast ratio against white. */
const contrastWithWhite = hex => 1.05 / (luminance(hex) + 0.05);

/** Plain text of a sensible length, or ''. */
const clean = (val, field) => {
	if ('string' !== typeof val) {
		return '';
	}

	const text = val.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

	return text.length <= LIMITS[field] ? text : '';
};

/** Keeps a usable theme: both background colours must carry white text (4.5:1). */
const cleanTheme = (theme = {}) => {
	const { from, to, accent } = theme || {};

	if (!isHex(from) || !isHex(to) || contrastWithWhite(from) < 4.5 || contrastWithWhite(to) < 4.5) {
		return FALLBACK;
	}

	return { from: from.trim(), to: to.trim(), accent: isHex(accent) ? accent.trim() : FALLBACK.accent };
};

/** The slides and theme worth using from an AI answer; slides without a heading are dropped. */
export const sanitizeSlides = (answer, count) => {
	const list = Array.isArray(answer?.slides) ? answer.slides : [];

	const slides = list.map(item => ({
		eyebrow: clean(item?.eyebrow, 'eyebrow'),
		heading: clean(item?.heading, 'heading'),
		text: clean(item?.text, 'text'),
		button: clean(item?.button, 'button'),
	})).filter(slide => slide.heading).slice(0, count);

	return { slides, theme: cleanTheme(answer?.theme) };
};

/** One `bsb/slide` with core blocks inside, styled like the demo templates. */
const slideBlock = ({ eyebrow, heading, text, button }, { from, to, accent }) => {
	// Dark button text when the accent is too light for white.
	const buttonText = contrastWithWhite(accent) >= 4.5 ? '#FFFFFF' : '#0F172A';

	const inner = [
		eyebrow && createBlock('core/paragraph', {
			content: escapeHTML(eyebrow),
			bsbLayer: { entry: { effect: 'fadeInDown' }, typo: { fontSize: { desktop: 13 }, fontWeight: '600', letterSpace: '2px', textTransform: 'uppercase' } },
			style: { color: { text: accent } },
		}),
		createBlock('core/heading', {
			level: 2,
			content: escapeHTML(heading),
			bsbLayer: { entry: { effect: 'fadeInUp', delay: 0.2 }, typo: { fontSize: { desktop: 52, tablet: 40, mobile: 30 }, fontWeight: '700', lineHeight: '1.15' } },
			style: { color: { text: '#FFFFFF' } },
		}),
		text && createBlock('core/paragraph', {
			content: escapeHTML(text),
			bsbLayer: { entry: { effect: 'fadeInUp', delay: 0.5 }, typo: { fontSize: { desktop: 18, mobile: 16 }, lineHeight: '1.6' } },
			style: { color: { text: '#E2E8F0' }, spacing: { margin: { top: '16px' } } },
		}),
		button && createBlock('core/buttons', {
			bsbLayer: { entry: { effect: 'zoomIn', delay: 0.8 } },
			layout: { type: 'flex', justifyContent: 'center' },
			style: { spacing: { margin: { top: '28px' } } },
		}, [createBlock('core/button', {
			text: escapeHTML(button),
			url: '#',
			style: {
				color: { background: accent, text: buttonText },
				border: { radius: '8px' },
				spacing: { padding: { top: '14px', bottom: '14px', left: '32px', right: '32px' } },
			},
		})]),
	].filter(Boolean);

	return createBlock('bsb/slide', {
		background: { type: 'gradient', gradient: `linear-gradient(135deg,${from} 0%,${to} 100%)` },
		padding: { top: '60px', right: '40px', bottom: '60px', left: '40px' },
		contentAlign: 'center',
		verticalAlign: 'center',
	}, inner);
};

/** Ready-to-insert slide blocks for a sanitized answer. */
export const buildSlides = ({ slides, theme }) => slides.map(slide => slideBlock(slide, theme));
