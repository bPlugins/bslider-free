/**
 * Every feature the free build names in a *sentence*, named once.
 *
 * A panel lists the feature names it is missing and `ProNotice`/`ProPanel`/`ProCard` compose the
 * sentence from them, so a feature crossing between free and Premium is one edit here rather than a
 * hand-written sentence tracked down at the call site.
 *
 * Names are held as separate strings rather than whole sentences, so a panel drawing two groups can
 * hand over both lists and still print one notice — `proFeatureSentence` dedupes what they share.
 *
 * A control drawn *locked* is not listed here. `BControlPro` puts the Pro tag on the control's own
 * label, so the control names itself and a list saying the same thing would be a second copy to keep
 * in step for no notice — which is what fourteen of these keys had become when the panels moved from
 * hiding controls to locking them. A key earns its place only where a sentence is printed.
 */

import { __, _n, sprintf } from '@wordpress/i18n';

/** Shared between panels, so the merged lists stay spelt the same and dedupe cleanly. */
const MOUSE_WHEEL = __('Mouse Wheel', 'b-slider');
const GRAB_CURSOR = __('Grab Cursor', 'b-slider');

export const PRO_FEATURES = {
	/* General tab */

	/**
	 * A slide's own button. Named here rather than drawn: this build has no reader for `btnLabel`,
	 * `btnUrl` or `target` on an image slide, and WordPress.org does not allow the controls to be put
	 * in front of someone who cannot use them — see `MainItem`, which prints this once under the list
	 * rather than once per slide.
	 */
	slides: [__('Button label', 'b-slider'), __('Button Url', 'b-slider'), __('Open In New Tab', 'b-slider')],

	title: [__('Custom HTML wrapper tags (e.g., h1-h6)', 'b-slider')],
	postQuery: [__('Include', 'b-slider'), __('Exclude', 'b-slider'), __('Current Post', 'b-slider')],

	/**
	 * Carousel settings. `Direction` and `Show Arrow/Navigation` are deliberately absent: this panel
	 * draws both of them for free, and the notice it inherited from `Controls` used to claim
	 * otherwise right underneath the working controls.
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

	layoutSettings: [
		__('Left/Right Inner Gap', 'b-slider'),
		__('Slide Direction (Horizontal and Vertical)', 'b-slider'),
		__('Arrow Styles', 'b-slider'),
	],
	sliderOptions: [
		__('Slide On MouseWheel', 'b-slider'),
		__('Slide on Mouse Drag', 'b-slider'),
		__('Arrow Follow Mouse', 'b-slider'),
	],

	/** Its own panel here, rather than a line in `sliderOptions` as it was before. */
	lazyLoad: [__('Lazy Load Images', 'b-slider')],

	indicators: [__('Move From Edge', 'b-slider')],

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

	gridPagination: [__('Position (Left, Right, Center)', 'b-slider')],

	/**
	 * External feeds. The free build reads YouTube channels and videos, Instagram, RSS and JSON —
	 * every reader ships. What is held back is either a whole panel or a setting the server refuses
	 * without a licence: `SocialFeed::storesLocally()`, `cacheTtl()` and `postProcessItems()` are
	 * where those are really enforced rather than merely hidden.
	 *
	 * A panel whose whole body is replaced by a card — ACF Query, Date & Time, Presets — has no key
	 * here. Its card carries prose instead, which says what the feature is *for* ("prevent exceeding
	 * API rate limits") where a list of control names cannot; keeping a list beside that prose would
	 * be a second copy nothing reads. See `ProCard`.
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

	/**
	 * `PlayerGeneral`, group by group, in the order the panel draws them.
	 *
	 * Read through `proFeatureList` rather than `proFeatureSentence`: eleven sentences down one
	 * sidebar is eleven repetitions of "available in the Premium version", so each of these is
	 * printed as a caption beside the heading it belongs to. See that helper.
	 *
	 * `Show Player Controls` is named twice on purpose — YouTube's native player and Instagram's are
	 * separate groups, each with its own line, and each has to name it.
	 */
	nativeYouTube: [__('Show Player Controls', 'b-slider'), __('Show Fullscreen Button', 'b-slider')],
	nativeYouTubeCaptions: [__('Always Show Subtitles/Captions', 'b-slider')],
	nativeYouTubePrivacy: [
		__('Recommend Videos from Other Channels', 'b-slider'),
		__('Lazy Load Video', 'b-slider'),
	],
	nativeInstagram: [__('Show Player Controls', 'b-slider'), __('Loop Video', 'b-slider')],
	playerBehaviour: [
		__('Click To Play', 'b-slider'),
		__('Reset On End', 'b-slider'),
		__('Remember Settings', 'b-slider'),
	],
	playerSpeed: [__('Playback Speed', 'b-slider')],
	/**
	 * The control-bar buttons this build leaves out — the two named on the panel plus every
	 * CONTROL_ITEM marked `pro`. They used to be drawn locked, so the list only had to cover the two
	 * that were filtered out; now the filter drops all five and this has to name all five.
	 */
	playerControlButtons: [
		__('PIP', 'b-slider'),
		__('Airplay', 'b-slider'),
		__('Settings', 'b-slider'),
		__('Download', 'b-slider'),
		__('Fullscreen', 'b-slider'),
	],
	playerSpeedMenu: [__('Speed menu option', 'b-slider')],
	/**
	 * `Tooltip On The Progress Bar` is the control's own label. The line here read "progress
	 * tooltips", which was a paraphrase and the only entry in this panel that was not the wording on
	 * the control it points at — a reader looking for it in the Premium build would not find that
	 * name. The other two are unchanged.
	 */
	playerExtras: [
		__('Auto Hide Control', 'b-slider'),
		__('Tooltip On The Progress Bar', 'b-slider'),
		__('Keyboard While Focused', 'b-slider'),
	],
	playerGdpr: [__('Privacy-Enhanced Mode (GDPR)', 'b-slider')],

	/** `ProLayoutsPromo` — the layouts `SelectLayout` draws locked. */
	/**
	 * `ProLayoutsPromo` — and only for a feed source.
	 *
	 * Every other source draws all four layouts free, as the released build does. It is a feed that
	 * is held to the default one, which is why `SelectLayout` filters on `sourceType` before it
	 * looks at the licence at all, and why the promo is rendered in that branch alone.
	 */
	layouts: [
		__('Carousel', 'b-slider'),
		__('Grid', 'b-slider'),
		__('Thumbnails layouts for a feed', 'b-slider'),
	],

};

/**
 * The names a panel is selling, deduped, whatever depth they arrive at.
 *
 * `flat(Infinity)` rather than `flat()`. A panel that composes its list per feed type nests one
 * level deeper as soon as a branch contributes two keys instead of one — `SocialFiltering` does,
 * for a YouTube channel — and a single-depth flatten leaves an array sitting among the strings.
 * Nothing then throws: `join()` stringifies it and one name still reads correctly, so the fault
 * shows up only later and indirectly. Two names in that array would print "b,c" with no space
 * after the comma, `_n()` would count the array as one item and pick the wrong verb, and the
 * `Set` would compare an array against a string and let a repeat through — the duplicate this
 * file exists to remove.
 */
const proFeatureNames = (features = []) => [...new Set(features.flat(Infinity).filter(Boolean))];

/**
 * The upsell sentence for a set of features, with repeats removed.
 *
 * Returns an empty string for an empty list so a panel that has nothing left to sell renders no
 * notice at all instead of a sentence naming nothing.
 */
export const proFeatureSentence = (features = []) => {
	const list = proFeatureNames(features);

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

/**
 * The same names as a bare caption, for the places that read better without a sentence.
 *
 * `PlayerGeneral` locks eleven groups of controls. As sentences that is "available in the Premium
 * version" printed eleven times down one 280px sidebar; as a short list beside the heading it
 * belongs to, each one is read as a caption on that group. The panel had this already, written as a
 * local component over hardcoded strings — this is the same output with the names coming from
 * `PRO_FEATURES` like everything else, so a control crossing between free and Premium is still one
 * edit in one file.
 */
export const proFeatureList = (features = []) => proFeatureNames(features).join(', ');
