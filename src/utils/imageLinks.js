import metadata from '../block.json';

/** More than this in one paste is not a slider anybody will click through. */
export const MAX_LINKS = 50;

/** How long one picture may take to load before it is counted as broken. */
const CHECK_TIMEOUT = 10000;

/** Unique URLs split on any whitespace or comma. */
export const linksIn = (text = '') => [...new Set(
	String(text)
		.split(/[\s,]+/)
		.map(part => part.trim())
		.filter(part => /^https?:\/\/\S+$/i.test(part))
)];

/** Tested with an Image (no CORS needed); extensions are not checked. */
export const isLoadable = url => new Promise(resolve => {
	const img = new window.Image();
	const timer = setTimeout(() => done(false), CHECK_TIMEOUT);

	function done(ok) {
		clearTimeout(timer);
		img.onload = img.onerror = null;
		resolve(ok);
	}

	img.onload = () => done(img.naturalWidth > 0);
	img.onerror = () => done(false);
	img.src = url;
});

/** Where the plugin's own sample pictures live — the block's defaults and the Add button's. */
const SAMPLE_IMAGE = /^https:\/\/templates\.bplugins\.com\/wp-content\/uploads\//;

/** Sample descriptions from block.json plus the Add button's numbered one. */
const SAMPLE_DESCS = (metadata?.attributes?.sliders?.default || []).map(slide => slide?.desc).filter(Boolean);
const isSampleDesc = desc => !desc || SAMPLE_DESCS.includes(desc) || /^This is description here-\d+$/.test(desc);

/** A slide exactly as shipped (or blank); edited sample slides count as the user's. */
const isSampleSlide = slide =>
	(!slide?.img?.url || SAMPLE_IMAGE.test(slide.img.url))
	&& !slide?.title
	&& !slide?.altText
	&& isSampleDesc(slide?.desc);

/** Only sample or blank slides means new pictures replace them. */
export const isUntouched = (sliders = []) => sliders.length > 0 && sliders.every(isSampleSlide);

/** A fresh slide per picture; a library item keeps its id, title, alt and caption. */
export const slideFrom = picture => ({
	img: 'string' === typeof picture
		? { url: picture }
		: { id: picture.id, url: picture.url, alt: picture.alt || '', title: picture.title || '', caption: picture.caption || '' },
	video: '',
	title: null,
	desc: '',
	altText: null,
});
