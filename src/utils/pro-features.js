/**
 * Every feature the free build points at as Premium, named once.
 *
 * A panel lists the feature names it is missing and `ProNotice`/`ProPanel` compose the sentence
 * from them, so a feature crossing between free and Premium is one edit here rather than a
 * hand-written sentence tracked down at the call site.
 *
 * Names are held as separate strings rather than whole sentences for the panels that used to carry
 * two notices: a merged list can drop what both halves named — `Mouse Wheel` and `Grab Cursor` were
 * printed twice in the carousel `Controls` panel — and still say everything either one said.
 */

import { __, _n, sprintf } from '@wordpress/i18n';

/** Shared between panels, so the merged lists stay spelt the same and dedupe cleanly. */
const MOUSE_WHEEL = __('Mouse Wheel', 'b-slider');
const GRAB_CURSOR = __('Grab Cursor', 'b-slider');

export const PRO_FEATURES = {
	/* General tab */
	slides: [__('Button label', 'b-slider'), __('Button Url', 'b-slider'), __('Open In New Tab', 'b-slider')],
	postQuery: [__('Include', 'b-slider'), __('Exclude', 'b-slider'), __('Current Post', 'b-slider')],
	acfQuery: [__('Sort by ACF Field', 'b-slider'), __('Filter by ACF Field', 'b-slider')],
	title: [__('Custom HTML wrapper tags (e.g., h1-h6)', 'b-slider')],

	/**
	 * The icon beside an ACF field or a badge.
	 *
	 * Free takes a typed character — an emoji is still the quickest answer for many fields, and a
	 * slider using one goes on working either way. What is Premium is the library of ready icons,
	 * which writes into the same `icon` setting: it saves the icon's own markup, so nothing has to
	 * be enqueued on the front end and the icon travels with the slider.
	 *
	 * Named once and used by both panels, because it is one feature seen from two places.
	 */
	iconLibrary: [__('Icon Library', 'b-slider')],

	/**
	 * Carousel `Controls` panel. `Direction` and `Show Arrow/Navigation` are deliberately absent:
	 * this panel draws both of them for free, and the notice it inherited from `Controls` used to
	 * claim otherwise right underneath the working controls.
	 */
	carouselControls: [
		__('Carousel Style (Ticker, Grid, 3D Carousel)', 'b-slider'),
		__('Effect (Default, Cards, Coverflow)', 'b-slider'),
		MOUSE_WHEEL,
		GRAB_CURSOR,
	],

	/** Thumbnails panel — here the direction and arrow toggles really are Premium-only. */
	thumbnailsControls: [
		MOUSE_WHEEL,
		GRAB_CURSOR,
		__('Direction (Horizontal, Vertical)', 'b-slider'),
		__('Show Arrow/Navigation', 'b-slider'),
	],

	layoutSettings: [__('Slide Direction (Horizontal and Vertical)', 'b-slider'), __('Arrow Styles', 'b-slider')],
	sliderOptions: [
		__('Slide On MouseWheel', 'b-slider'),
		__('Slide on Mouse Drag', 'b-slider'),
		__('Arrow Follow Mouse', 'b-slider'),
		__('Lazy Load Enable', 'b-slider'),
	],
	indicators: [__('Move From Edge', 'b-slider')],
	gridPagination: [__('Position (Left, Right, Center)', 'b-slider')],
	video: [__('Reset On End', 'b-slider'), __('Auto Hide Control', 'b-slider')],
	videoControls: [
		__('Volume', 'b-slider'),
		__('PIP', 'b-slider'),
		__('Airplay', 'b-slider'),
		__('Settings', 'b-slider'),
		__('Download', 'b-slider'),
		__('Fullscreen', 'b-slider'),
	],

	/**
	 * External feeds. The free build reads YouTube channels and videos, Instagram, RSS and JSON —
	 * every reader ships. What is held back is either a whole panel (see the three keys below) or a
	 * setting the server refuses without a licence: `SocialFeed::storesLocally()`, `cacheTtl()` and
	 * `postProcessItems()` are where those are really enforced rather than merely hidden.
	 *
	 * Only the keys a panel actually names are here. The rest of the feed upsells are written where
	 * they appear, because each one names the two or three controls beside it rather than a whole
	 * panel's worth — see the notices in `SocialGeneral`, `SocialSlides` and `SocialFiltering`.
	 */
	socialStore: [__('Store feed media on this site', 'b-slider'), __('Scheduled feed sync', 'b-slider')],
	socialDateTime: [
		__('Timezone conversion', 'b-slider'),
		__('Date translation', 'b-slider'),
		__('Custom date layouts', 'b-slider'),
	],
	feedPresets: [__('Ready-made feed presets', 'b-slider')],

	/* Style tab */
	sliderStyle: [__('Margin', 'b-slider')],
	contentStyle: [__('Animation', 'b-slider'), __('Delay', 'b-slider'), __('Duration', 'b-slider')],
	buttonStyle: [
		__('Typography', 'b-slider'),
		__('Colors', 'b-slider'),
		__('Hover Colors', 'b-slider'),
		__('Padding', 'b-slider'),
		__('Border', 'b-slider'),
		__('Border Radius', 'b-slider'),
		__('Animation', 'b-slider'),
		__('Delay', 'b-slider'),
		__('Duration', 'b-slider'),
	],
	thumbnailsStyle: [__('Position (Bottom, Top, Right, Left)', 'b-slider'), __('Height', 'b-slider')],
	thumbnailsActive: [__('Overly Color', 'b-slider'), __('Border', 'b-slider')],
};

/**
 * The upsell sentence for a set of features, with repeats removed.
 *
 * Returns an empty string for an empty list so a panel that has nothing left to sell renders no
 * notice at all instead of a sentence naming nothing.
 */
export const proFeatureSentence = (features = []) => {
	const list = [...new Set(features.flat().filter(Boolean))];

	if (!list.length) {
		return '';
	}

	return sprintf(
		_n(
			'%s is available in the Premium version.',
			'%s are available in the Premium version.',
			list.length,
			'b-slider'
		),
		list.join(', ')
	);
};
