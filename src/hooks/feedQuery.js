/**
 * The feed query, as the server expects it.
 *
 * One place, so anything the server reads off a feed request reaches every caller at once. The
 * Premium build has a second caller here — the import that copies a feed onto the site — which is
 * why this is a function of its own rather than assembled inline by the preview.
 *
 * The keys for the Premium-only settings are still sent. They cost nothing, a block edited on a
 * licensed site and opened here keeps them, and the server ignores what this licence may not use.
 *
 * @param {object} attributes The block's attributes.
 * @return {object} Query parameters for `/bsb/v1/social-feed`.
 */
const feedQuery = (attributes = {}) => {
	const { socialQuery, postsQuery } = attributes;

	return {
		feedType: socialQuery?.feedType || 'youtube',
		// A slider may name a saved channel rather than carry an address; the server resolves the
		// address from it. Leave this out and the request describes a feed with nowhere to look.
		channelId: socialQuery?.channelId || '',
		source: (socialQuery?.source || '').trim(),
		per_page: socialQuery?.per_page,
		// Which of the channel's lists to read — newest, most viewed, with or without the Shorts.
		// It changes which videos come back, so it changes what is cached and what is imported.
		videoSet: socialQuery?.videoSet || 'latest',
		metaDateFormat: socialQuery?.metaDateFormat,
		cacheTime: socialQuery?.cacheTime,
		// Lives on `postsQuery`, because the caption is drawn by the same component a post slider
		// uses — but it changes what the server stores, so it travels with the query.
		excerptLength: postsQuery?.excerptLength ?? 25,
		storeLocal: socialQuery?.storeLocal ? 1 : 0,
		linkTarget: socialQuery?.linkTarget || '',
		defaultImageUrl: socialQuery?.defaultImageUrl || '',
		keywordFilter: socialQuery?.keywordFilter || '',
		excludeKeywordFilter: socialQuery?.excludeKeywordFilter || '',
		feedOrderBy: socialQuery?.feedOrderBy || 'date_desc',
		feedOffset: socialQuery?.feedOffset ?? 0,
		feedAgeLimit: socialQuery?.feedAgeLimit ?? 0,
		jsonRootKey: socialQuery?.jsonRootKey || '',
		jsonImageKey: socialQuery?.jsonImageKey || '',
		jsonTitleKey: socialQuery?.jsonTitleKey || '',
		jsonLinkKey: socialQuery?.jsonLinkKey || '',
		jsonExcerptKey: socialQuery?.jsonExcerptKey || '',
		jsonButtonTextKey: socialQuery?.jsonButtonTextKey || '',
		jsonDateKey: socialQuery?.jsonDateKey || '',
		jsonAuthorKey: socialQuery?.jsonAuthorKey || '',
		ytQueryType: socialQuery?.ytQueryType || 'channel',
		ytSearchTerm: socialQuery?.ytSearchTerm || '',
		ytPlaylistId: socialQuery?.ytPlaylistId || '',
		ytThumbQuality: socialQuery?.ytThumbQuality || 'maxresdefault',
		usePlyr: socialQuery?.usePlyr !== false,
		ytAutoplay: socialQuery?.ytAutoplay !== false,
		ytMute: socialQuery?.ytMute || false,
		ytControls: socialQuery?.ytControls !== false,
		ytFullscreen: socialQuery?.ytFullscreen !== false,
		ytKeyboard: socialQuery?.ytKeyboard !== false,
		ytCaptions: socialQuery?.ytCaptions || false,
		ytNoCookie: socialQuery?.ytNoCookie !== false,
		ytRel: socialQuery?.ytRel || false,
		ytLazy: socialQuery?.ytLazy !== false,
		rssTimezoneOffset: socialQuery?.rssTimezoneOffset || '',
		rssTranslateDate: socialQuery?.rssTranslateDate || '',
		rssLocalTimezone: socialQuery?.rssLocalTimezone || false,
		igAllowImage: socialQuery?.igAllowImage !== false,
		igAllowAlbum: socialQuery?.igAllowAlbum !== false,
		igAllowVideo: socialQuery?.igAllowVideo !== false,
		ytPrivacyStatus: socialQuery?.ytPrivacyStatus || '',
		ytRefreshToken: socialQuery?.ytRefreshToken || ''
	};
};

export default feedQuery;
