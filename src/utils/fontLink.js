import { getTypoCSS } from '../../../bpl-tools/utils/getCSS';

/** getTypoCSS's Google font @import for the weight actually drawn; a stale fontVariant (e.g. after AI style) loaded only 400. */
export const fontLinkCSS = (typo) => {
	const weight = /^\d{3}$/.test(String(typo?.fontWeight ?? '')) ? String(typo.fontWeight) : '';
	const italic = String(typo?.fontVariant ?? '').endsWith('i');
	const variant = weight ? (italic ? `${weight}i` : ('400' === weight ? 400 : weight)) : typo?.fontVariant;

	return getTypoCSS('', typo ? { ...typo, fontVariant: variant } : typo)?.googleFontLink || '';
};
