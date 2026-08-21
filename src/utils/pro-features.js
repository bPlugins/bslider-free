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
	/**
	 * General tab.
	 *
	 * A slide's own button — label, URL and new-tab — is deliberately not a key here. Those three are
	 * drawn as `BControlPro` in `Settings/Item`, which puts the Pro tag on each control's own label,
	 * so a list of the same three names would be a second copy to keep in step for no notice. A key
	 * earns its place when a panel needs a *sentence*; a locked control names itself.
	 */
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
	 * The feed panels name two or three controls each rather than a whole panel's worth, and used to
	 * write that out as a finished sentence where it appeared. Thirteen of them, and the same control
	 * named in several: `Feed Cache Time` stood in three sentences in `SocialGeneral` alone and
	 * `Keyword Filters` in three more in `SocialFiltering`. Moving a control between free and Premium
	 * meant finding every sentence that mentioned it, and a missed one left "available in the Premium
	 * version" printed under a control this build draws — the fault already fixed once in the carousel
	 * `Controls` panel. They are all keys here now, so a control is named once.
	 */
	socialStore: [__('Store feed media on this site', 'b-slider'), __('Scheduled feed sync', 'b-slider')],
	socialDateTime: [
		__('Timezone conversion', 'b-slider'),
		__('Date translation', 'b-slider'),
		__('Custom date layouts', 'b-slider'),
	],
	feedPresets: [__('Ready-made feed preset library', 'b-slider')],

	/**
	 * Named separately because they are combined per feed type: every feed can cache, only YouTube
	 * has a search and a channel playlist, and Instagram's own reader is Premium. `proFeatureSentence`
	 * dedupes, so a panel hands over whichever of these apply and gets one sentence.
	 */
	feedCache: [__('Feed Cache Time', 'b-slider')],
	youtubeSource: [__('YouTube Search', 'b-slider'), __('Channel Playlist', 'b-slider')],
	instagramSource: [__('Instagram Feed', 'b-slider')],

	/* `SocialSlides` — what a slide does when clicked, and what it shows on hover. */
	feedSlideLink: [
		__('Click behavior (What it does)', 'b-slider'),
		__('Mini Player Position', 'b-slider'),
		__('Open In New Tab', 'b-slider'),
	],
	feedHover: [
		__('Hover preview', 'b-slider'),
		__('Quick action buttons', 'b-slider'),
		__('Hover action position', 'b-slider'),
	],
	feedThumbQuality: [__('YouTube Thumbnail Quality', 'b-slider')],

	/**
	 * `SocialFiltering`. Split the same way as the feed sources above: keywords are filtered on every
	 * feed type, a timeframe on all but JSON, and privacy status only on a YouTube channel.
	 *
	 * The two keyword fields are named as two rather than as one plural label, so the verb agrees
	 * whichever of these a feed type ends up showing: as a single "Keyword Filters (Include/Exclude)"
	 * a notice with nothing beside it read "… Filters … is available".
	 */
	feedKeywords: [__('Include Keyword Filter', 'b-slider'), __('Exclude Keyword Filter', 'b-slider')],
	feedTimeframe: [__('How recent (timeframe filter)', 'b-slider')],
	feedPrivacy: [__('Privacy Status Filter', 'b-slider')],

	/**
	 * `SocialBadges` — the same icon library as `iconLibrary`, on a badge rather than an ACF field.
	 *
	 * Singular, because `proFeatureSentence` agrees the verb with the length of the list: a one-item
	 * list reads "… is available", so the item has to be a thing rather than things.
	 */
	feedBadgeIcons: [__('Badge Icon Library', 'b-slider')],

	/* `SocialHeaderSettings` — the profile header above the slider. */
	feedHeader: [
		__('Header Style', 'b-slider'),
		__('Show Channel Stats', 'b-slider'),
		__('Show Subscriber/Follower Count', 'b-slider'),
	],
	feedFollowButton: [
		__('Follow Button Alignment', 'b-slider'),
		__('Typography', 'b-slider'),
		__('Colors', 'b-slider'),
	],

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
