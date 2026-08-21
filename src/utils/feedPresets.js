import { __ } from '@wordpress/i18n';

/**
 * Ready-made looks for a social feed, in the shape the block already stores.
 *
 * A feed slider is a lot of small decisions — layout, columns, which badges, whether the channel
 * stands above the grid — and none of them are interesting on their own. Somebody who wants "the
 * YouTube channel page look" wants all of them at once, set the way that look needs them, and then
 * wants to change the two that do not suit them. That is what a preset is here: not a saved bundle
 * the user builds, but a starting point the plugin ships.
 *
 * Each preset writes plain attributes, so nothing downstream has to know presets exist. `Layout`,
 * `Style` and every settings panel go on reading `layoutType`, `columns` and `socialQuery` exactly
 * as they do for a slider set up by hand. Applying one is a normal edit — undoable, and freely
 * changed afterwards from the panels below.
 *
 * `feedTypes` is which feeds a preset is offered for. A channel header over a grid means nothing
 * for a single embedded video, and the list layout is YouTube's alone (see `selectLayoutOpt`), so
 * the picker filters on this rather than showing every preset to every feed and letting the user
 * find out by clicking.
 */

/**
 * The keys a preset is allowed to touch inside `socialQuery`.
 *
 * A preset carries a partial `socialQuery` and it is merged over what is already there — never
 * written whole. The account is in that same object (`channelId`, `source`, the token behind
 * Instagram, the fetched `header*` fields), and replacing the object would sign the user out of
 * their own feed for choosing a different look. So a preset says only what it means to say.
 */
export const feedPresets = [
    {
        id: 'yt-channel-grid',
        title: __('Channel Grid', 'b-slider'),
        desc: __('The account above a three-column grid, each item with its title and date.', 'b-slider'),
        /**
         * Every feed, because nothing this preset does is one service's.
         *
         * A header over a grid of cards with a title and a date under each is a shape all four
         * readers can fill: `title`, `excerpt`, `date`, `thumbnail` and `link` are on every item
         * they return, and `grid` is offered for every feed type (unlike `list`, which carries
         * `feedOnly: 'youtube'` — see `selectLayoutOpt`).
         *
         * What differs is what each service *reports about itself*, and that is in `perFeed` below
         * rather than in four copies of this preset.
         */
        feedTypes: ['youtube', 'instagram', 'rss', 'json'],
        // Which miniature the card draws — see `FeedPresets`. Named on the preset rather than derived
        // from `layoutType`, since two presets can share a layout and look nothing alike.
        preview: 'header-grid',
        attributes: {
            /**
             * The slides stay where the visitor left them.
             *
             * `isAutoPlay` is on by default for the block — right for a hero image slider, wrong for
             * every one of these: a feed is something to read or watch, and a stage that moves on by
             * itself takes away the item somebody just chose. Only this one key is named; the rest of
             * `carousel` is merged, not replaced — see `presetAttributes`.
             */
            carousel: { isAutoPlay: false },
            layoutType: 'grid',
            /**
             * A Load More button under the grid, rather than a numbered pager.
             *
             * The block's own default is `pagination`, which suits a page of posts and reads oddly
             * under a feed: nobody thinks of a channel as having page 3. Load More keeps the visitor
             * where they are and asks for the next dozen.
             *
             * It appears only where there is more to fetch than is shown — see `$feed_handle` in
             * `render.php`, which prints the paging address only when `total > page size`. Those two
             * numbers are the pair below: `socialQuery.per_page` is how much of the channel to read,
             * `postsQuery.per_page` is how much of it to put on screen at once. Setting only the
             * first is what made the button impossible before — the grid was handed twelve items and
             * told to show twelve.
             */
            grid: { paginationType: 'loadMore' },
            // Twelve on screen; the rest arrive behind Load More.
            postsQuery: { per_page: 12 },
            columns: { desktop: 3, tablet: 2, mobile: 1 },
            columnGap: '24px',
            rowGap: '32px',
            gridItemRatio: '16/9',
            /**
             * Nothing is switched off here.
             *
             * A preset writes `title`, `desc` and `button` visibility for the whole slider, not for
             * the layout it happens to set — so hiding them to tidy a grid emptied the slides of
             * every other layout too. Switch such a slider to Default and its captions were gone,
             * with nothing in the panel to say why.
             *
             * What a grid card shows is left to Slide Content, where the user can see it and undo it.
             */
            title: { tag: 'h4', isVisible: true },
            button: { text: 'Watch' },
            /**
             * No tint over the pictures, and light text on them.
             *
             * `.item:after` paints `SliderOverly` — `#00000088` by default — over every slide
             * whenever `caption.background` is `solid`, which it is out of the box. That is right for
             * a hero slider whose words sit on the picture, and wrong for a feed: it dims twelve
             * thumbnails to make room for a caption that is one line long.
             *
             * The caption stays on the picture (the grid layout has nowhere else to put it — see
             * `.content-area` in style.scss, which covers the slide), so it is given a gradient that
             * darkens only the bottom edge under the text, and the text is white. Near-black titles
             * were written here first, which put dark text on a dark tint.
             */
            caption: { display: 'always', background: 'gradient' },
            SliderOverly: '#00000099',
            titleColor: '#ffffff',
            descColor: '#e5e7eb',
            titleTypo: { fontSize: 15, fontWeight: 600, lineHeight: 1.4 },
            descTypo: { fontSize: 13, fontWeight: 400, lineHeight: 1.5 },
            headerNameTypo: { fontSize: 20, fontWeight: 700, lineHeight: 1.3 },
            headerNameColor: '#0f0f0f',
            headerBioColor: '#606060',
            headerBtnColors: { color: '#ffffff', bg: '#cc0000' }
        },
        socialQuery: {
            /**
             * Fifteen read, twelve shown, three behind Load More.
             *
             * Not more: without a YouTube API key `YouTubeFeed::MAX_FEED_ITEMS` caps a channel at 15,
             * and `SocialFiltering`'s slider takes its `max` from the same number — so a preset
             * writing 36 would both promise items that never arrive *and* leave the control pinned at
             * a value it cannot represent, unwindable by dragging. A site with a key can raise it
             * there; the preset stays inside what every site can do.
             */
            per_page: 15,
            playVideo: 'popup',
            imageFit: 'cover',
            titleLength: 60,
            feedOrderBy: 'date_desc',
            // The banner is left to the channel rather than named here — `headerBanner` stays empty
            // so `Layout` falls through to `account.banner`, which is the channel's own cover. A
            // channel with none draws no strip and the header simply sits at the top.
            showHeaderBanner: true,
            headerBannerHeight: 160,
            showHeader: true,
            // The channel-page header: the banner joined to a plain panel, with the three counts on
            // one line under the name. See `isPanelHeader` in `Layout`.
            headerStyle: 'panel',
            showFollowers: true,
            showChannelStats: true,
            showFollowButton: true,
            // Both keys: `headerFollowText` is the button on the header card (`Layout` line
            // 243), `followButtonText` the separate one under the slides (line 283). Naming
            // only the second left the header saying "Follow" on a YouTube channel.
            headerFollowText: __('SUBSCRIBE', 'b-slider'),
            followButtonText: __('SUBSCRIBE', 'b-slider'),
            followButtonAlign: 'right',
            selectedBadges: ['date'],
            badgeDisplayStyle: 'plain'
        },
        /**
         * What each service cannot do, said once per service.
         *
         * Only the differences are here — everything else comes from the shared blocks above. A feed
         * with no entry (`youtube`) takes them unchanged.
         */
        perFeed: {
            youtube: {
                socialQuery: {
                    // The channel's own cover and its two extra counts. YouTube is the only reader
                    // that reports either — see `readProfile` in each.
                    showHeaderBanner: true,
                    headerBannerHeight: 160,
                    showChannelStats: true,
                    // Both keys: `headerFollowText` is the button on the header card (`Layout` line
                    // 243), `followButtonText` the separate one under the slides (line 283). Naming
                    // only the second left the header saying "Follow" on a YouTube channel.
                    headerFollowText: __('SUBSCRIBE', 'b-slider'),
                    followButtonText: __('SUBSCRIBE', 'b-slider'),
                    ytThumbQuality: 'maxresdefault'
                }
            },
            instagram: {
                title: __('Profile Grid', 'b-slider'),
                desc: __('The account above a square three-column grid, the way a profile page shows its posts.', 'b-slider'),
                preview: 'header-square-nobanner',
                attributes: {
                    // Square, which is what a profile grid is — a photo feed is not 16:9.
                    gridItemRatio: '1/1',
                    // Three across on a tablet too, and the cells nearly touching: a profile grid is
                    // a mosaic of pictures, not a page of cards with gaps between them.
                    columns: { desktop: 3, tablet: 3, mobile: 2 },
                    columnGap: '4px',
                    rowGap: '4px',
                    // The picture is the post here, so the card is left bare — but by the grid's own
                    // ratio and gap above, not by switching the slide's title off for every layout.
                    headerBtnColors: { color: '#ffffff', bg: '#e1306c' }
                },
                socialQuery: {
                    showHeaderBanner: false,
                    showChannelStats: false,
                    // No date badge either: the grid carries no text at all.
                    selectedBadges: [],
                    // Thirty-six rather than the shared 15, which is YouTube's keyless cap and no
                    // business of Graph's — Instagram answers to 500 (`FEED_MAX_ITEMS`). Twelve on
                    // screen, the rest behind Load More: three pages of a profile grid.
                    per_page: 36,
                    // Both keys — see the note in the shared block above.
                    headerFollowText: __('FOLLOW', 'b-slider'),
                    followButtonText: __('FOLLOW', 'b-slider')
                }
            },
            rss: {
                title: __('Publication Grid', 'b-slider'),
                desc: __('The publication above a three-column grid of articles, each with its title and date.', 'b-slider'),
                preview: 'header-grid-nobanner',
                attributes: {
                    // An article's picture is whatever the publication put in the feed, and a 16:9
                    // crop of a portrait illustration cuts the top off it.
                    gridItemRatio: '4/3',
                    headerBtnColors: { color: '#ffffff', bg: '#f26522' }
                },
                socialQuery: {
                    showHeaderBanner: false,
                    showChannelStats: false,
                    // An article has a summary worth reading, unlike a video's description.
                    titleLength: -1,
                    // Both keys — see the note in the shared block above.
                    headerFollowText: __('VISIT', 'b-slider'),
                    followButtonText: __('VISIT', 'b-slider')
                }
            },
            json: {
                title: __('Card Grid', 'b-slider'),
                desc: __('A three-column grid of cards, each with its title, date and summary. No header.', 'b-slider'),
                preview: 'grid-only',
                attributes: {
                    gridItemRatio: '4/3',
                    desc: { isVisible: true }
                },
                socialQuery: {
                    /**
                     * No header at all.
                     *
                     * A JSON document describes no publisher — `hasFeedProfile` leaves `json` out of
                     * `PROFILE_FEED_TYPES`, so `Layout` would draw nothing however these were set.
                     * Named as off rather than left to that, so the preset does not quietly depend on
                     * a guard somewhere else.
                     */
                    showHeader: false,
                    showHeaderBanner: false,
                    showFollowers: false,
                    showChannelStats: false,
                    showFollowButton: false,
                    // Cleared with the button it belongs to. Nothing reads either while the header is
                    // off, but "SUBSCRIBE" left on a JSON slider is a value waiting to surprise
                    // whoever switches a button back on.
                    headerFollowText: '',
                    followButtonText: '',
                    titleLength: -1
                }
            }
        }
    },
    {
        id: 'yt-player-grid',
        title: __('Player & Grid', 'b-slider'),
        desc: __('The channel, then one video playing large, with the rest as a page of thumbnails under it.', 'b-slider'),
        feedTypes: ['youtube'],
        preview: 'stage-grid',
        attributes: {
            // Nothing advances on its own — see the note in `yt-channel-grid`.
            carousel: { isAutoPlay: false },
            layoutType: 'thumbnails',
            columns: { desktop: 3, tablet: 2, mobile: 1 },
            columnGap: '20px',
            rowGap: '20px',
            /**
             * The slide's title, description and button are left alone.
             *
             * They were switched off here, on the reasoning that the stage is a player and nothing
             * should be written over it. But `PostItem` — the only thing that reads them — is inside
             * the main Swiper, which this layout does not render in grid mode at all. So the three
             * keys did nothing for this preset and quietly emptied every *other* layout: switch a
             * Theater slider to Default and its slides had no caption, no description and no button,
             * with no way to tell what had removed them.
             *
             * What the grid under the stage shows is `thumbnails.cardStyle` and its three toggles,
             * set below — those are this layout's own controls and affect nothing else.
             */
            /**
             * Prev/Next, and no Load More.
             *
             * One control under the grid, not two. This preset is a player with its channel laid out
             * underneath, and what a visitor wants there is to step through the videos — which is
             * what the pair does. A Load More beside it would be a second button an inch away doing
             * something else entirely, which is what this drew before.
             *
             * The pager is off rather than left at the block default, and that is what keeps the
             * whole fetched set in the grid: with no button to reveal a second page, `visibleItems`
             * must not slice — see `isPaged` in `Thumbnails`.
             */
            arrow: { visibility: true, size: 20, color: '#0f0f0f', bg: 'transparent' },
            grid: { paginationType: 'none' },
            thumbnails: {
                mode: 'grid',
                /**
                 * Named, not assumed.
                 *
                 * `thumbnails` is deep-merged, so a slider whose user had turned "Show Main Preview"
                 * off keeps it off — and this preset, whose whole description is "one video playing
                 * large", would apply as a bare grid with no player. The two presets below name it
                 * for the same reason.
                 */
                showStage: true,
                /**
                 * And the card style, for the same class of reason: applying Theater and then this
                 * one would otherwise leave `cardStyle: 'beside'` and its three text toggles in
                 * place, putting titles and descriptions beside thumbnails the `stage-grid`
                 * miniature draws bare.
                 */
                cardStyle: 'bare',
                showCardTitle: false,
                showCardMeta: false,
                showCardExcerpt: false,
                showDuration: true,
                showPlay: true,
                navPosition: 'below',
                overly: { color: '' },
                height: { desktop: '120px', tablet: '', mobile: '' },
                position: { desktop: 'bottom' },
                width: { desktop: '30%', tablet: '20%', mobile: '15%' },
                active: { color: '#00000000', border: { color: '#000', style: 'solid', width: '0px' } }
            }
        },
        socialQuery: {
            // Fifteen fetched, twelve shown, the rest behind Load More — capped by
            // `MAX_FEED_ITEMS` without a YouTube key, see `yt-channel-grid`.
            per_page: 15,
            // The point of this preset: a thumbnail loads its video into the player above and it plays
            // there. Nothing opens over the page and nothing starts on its own — the visitor presses
            // play, or presses a thumbnail, and that is the permission. Changeable to the popup or the
            // corner dock afterwards, under Slides.
            playVideo: 'stage',
            imageFit: 'cover',
            feedOrderBy: 'date_desc',
            // The channel stands above its own player, the same way it does over the grid in the
            // preset above — banner, then the card, then the stage. `headerBanner` is left empty so
            // `Layout` falls through to the channel's own cover; see the note in `yt-channel-grid`.
            showHeaderBanner: true,
            headerBannerHeight: 160,
            showHeader: true,
            headerStyle: 'panel',
            showFollowers: true,
            showChannelStats: true,
            showFollowButton: true,
            // Both keys: `headerFollowText` is the button on the header card (`Layout` line
            // 243), `followButtonText` the separate one under the slides (line 283). Naming
            // only the second left the header saying "Follow" on a YouTube channel.
            headerFollowText: __('SUBSCRIBE', 'b-slider'),
            followButtonText: __('SUBSCRIBE', 'b-slider'),
            followButtonAlign: 'right',
            selectedBadges: [],
            ytThumbQuality: 'maxresdefault'
        }
    },
    {
        id: 'yt-theater',
        title: __('Theater', 'b-slider'),
        desc: __('A full-width player above a two-column grid — each thumbnail with its title, views and description beside it.', 'b-slider'),
        /**
         * Every feed, though it means two different things.
         *
         * The rows are the same everywhere: `ThumbnailsGrid` draws them for any feed source, and the
         * title, date and summary beside each picture are fields all four readers fill.
         *
         * What is above them differs. YouTube and Instagram carry a playable video (`videoId` and
         * `videoUrl` respectively), so the stage is a player. RSS and JSON carry neither — see the
         * empty `videoId` in both readers — so `isStagePlayer` is false there and the stage stays the
         * Swiper it has always been: clicking a row moves it, and the picture is a picture. That is a
         * good arrangement for a publication, so it is offered rather than withheld.
         */
        feedTypes: ['youtube', 'instagram', 'rss', 'json'],
        preview: 'theater',
        attributes: {
            // Nothing advances on its own — see the note in `yt-channel-grid`.
            carousel: { isAutoPlay: false },
            layoutType: 'thumbnails',
            // Two across on desktop, one on mobile — a wide card in each, thumbnail beside its text.
            columns: { desktop: 2, tablet: 1, mobile: 1 },
            columnGap: '24px',
            rowGap: '20px',
            // Nothing between the player and the rows: the cards themselves are how this one is
            // navigated, and a Prev/Next pair under a stage this size is a control nobody reaches for.
            arrow: { visibility: false, size: 20, color: '#0f0f0f', bg: 'transparent' },
            /**
             * A Load More button under the rows.
             *
             * The `thumbnails` layout can page now, on the same terms `Grid` does — see the paging
             * state in `Thumbnails.js`. Eight on screen at once keeps the rows from running the
             * player too far down the page; the rest of the channel arrives a press at a time rather
             * than being left unreachable, which is what this said before the layout could page.
             */
            grid: { paginationType: 'loadMore' },
            postsQuery: { per_page: 8 },
            thumbnails: {
                mode: 'grid',
                showStage: true,
                cardStyle: 'beside',
                showCardTitle: true,
                showCardMeta: true,
                showCardExcerpt: true,
                showDuration: true,
                showPlay: true,
                navPosition: 'below',
                overly: { color: '' },
                height: { desktop: '120px', tablet: '', mobile: '' },
                position: { desktop: 'bottom' },
                width: { desktop: '30%', tablet: '20%', mobile: '15%' },
                active: { color: '#00000000', border: { color: '#000', style: 'solid', width: '0px' } }
            }
        },
        socialQuery: {
            // Read three times what one page shows; the rest sit behind Load More. Capped by
            // `MAX_FEED_ITEMS` without a YouTube key — see the note in `yt-channel-grid`.
            per_page: 15,
            playVideo: 'stage',
            imageFit: 'cover',
            titleLength: 70,
            feedOrderBy: 'date_desc',
            // The player is the whole of this one — no channel card over it competing for the space.
            showHeaderBanner: false,
            showHeader: false,
            showChannelStats: false,
            showFollowButton: false,
            selectedBadges: []
        },
        perFeed: {
            youtube: {
                socialQuery: { ytThumbQuality: 'maxresdefault' }
            },
            instagram: {
                title: __('Reels Theater', 'b-slider'),
                desc: __('A full-width player above a two-column grid — each still with its caption beside it.', 'b-slider'),
                attributes: {
                    // Only the difference — the rest of `thumbnails` comes from the preset above.
                    // Graph reports no duration for a video, so the badge would print nothing.
                    thumbnails: { showDuration: false }
                },
                socialQuery: {
                    // Videos only, for the reason `ig-reels-player` gives: a photo has no `videoUrl`,
                    // so clicking one would move the highlight and leave the last video playing.
                    igAllowImage: true,
                    igAllowAlbum: true,
                    igAllowVideo: true,
                    // Past YouTube's keyless 15, which the shared block is written for — Graph's own
                    // cap is 500. Eight on screen, the rest behind Load More.
                    per_page: 30
                }
            },
            rss: {
                title: __('Article Rows', 'b-slider'),
                desc: __('A featured article above a two-column grid of articles — each with its title, date and summary.', 'b-slider'),
                // No play mark on the stage in the miniature either: the stage is a slider here, not
                // a player, and drawing one would promise a video RSS never carries.
                preview: 'theater-still',
                attributes: {
                    // Neither means anything for an article: `RssFeed` fills in no duration, and a
                    // play mark over a photograph promises a video that is not there.
                    thumbnails: { showDuration: false, showPlay: false }
                },
                socialQuery: {
                    /**
                     * The stage is a slider here, not a player — RSS carries no video at all, so
                     * `isStagePlayer` is false whatever this says. Set to the popup rather than left
                     * at `stage`, so a click on the stage opens the article instead of doing nothing.
                     */
                    playVideo: 'popup',
                    // An article's own summary, uncut: the row has the width for it.
                    titleLength: -1,
                    // RSS and JSON both answer to a cap of 100 — see `FEED_MAX_ITEMS` — well past
                    // YouTube's 15 without a key, which the shared block above is written for.
                    per_page: 30
                }
            },
            json: {
                title: __('Feature Rows', 'b-slider'),
                desc: __('A featured item above a two-column grid — each with its title and summary.', 'b-slider'),
                preview: 'theater-still',
                attributes: {
                    thumbnails: { showDuration: false, showPlay: false }
                },
                socialQuery: {
                    playVideo: 'popup',
                    titleLength: -1,
                    per_page: 30
                }
            }
        }
    },
    {
        id: 'ig-reels-player',
        title: __('Reels Player', 'b-slider'),
        desc: __('One video playing large, the rest as a page of stills under it. Videos only.', 'b-slider'),
        feedTypes: ['instagram'],
        preview: 'stage-grid-nobanner',
        attributes: {
            // Nothing advances on its own — see the note in `yt-channel-grid`.
            carousel: { isAutoPlay: false },
            layoutType: 'thumbnails',
            columns: { desktop: 4, tablet: 3, mobile: 2 },
            columnGap: '10px',
            rowGap: '10px',
            // Prev/Next and no Load More — the same arrangement `yt-player-grid` gets, and for the
            // same reason: one control under a stage, not two.
            arrow: { visibility: true, size: 20, color: '#0f0f0f', bg: 'transparent' },
            grid: { paginationType: 'none' },
            thumbnails: {
                mode: 'grid',
                showStage: true,
                cardStyle: 'bare',
                showCardTitle: false,
                showCardMeta: false,
                showCardExcerpt: false,
                // Graph reports no duration for a video — see `InstagramFeed::makeItem()`, which
                // names the field and leaves it empty. The badge would print nothing.
                showDuration: false,
                showPlay: true,
                navPosition: 'below',
                overly: { color: '' },
                height: { desktop: '120px', tablet: '', mobile: '' },
                position: { desktop: 'bottom' },
                width: { desktop: '30%', tablet: '20%', mobile: '15%' },
                active: { color: '#00000000', border: { color: '#000', style: 'solid', width: '0px' } }
            }
        },
        socialQuery: {
            // Twelve, not thirty-six: with the pager off the whole fetched set is on screen at once,
            // and a wall of stills under the player is what a Reels slider is not for. Raise it under
            // Social Filtering — Instagram's own cap is 500.
            per_page: 12,
            // The stage plays the file Graph hands over — see `stageSource` in `Thumbnails`.
            playVideo: 'stage',
            imageFit: 'cover',
            feedOrderBy: 'date_desc',
            /**
             * Videos only, which is the point of this one.
             *
             * A stage player over a grid of stills would be a player that most of the grid cannot
             * fill: a photo has no `videoUrl`, so clicking it would move the highlight and leave the
             * last video playing. Narrowing the feed to videos is what makes every cell work.
             */
            igAllowImage: true,
            igAllowAlbum: true,
            igAllowVideo: true,
            showHeaderBanner: false,
            showHeader: true,
            headerStyle: 'panel',
            showFollowers: true,
            showChannelStats: false,
            showFollowButton: true,
            // Both keys: `headerFollowText` is the button on the header card (`Layout` line
            // 243), `followButtonText` the separate one under the slides (line 283). Naming
            // only the second left the header saying "Follow" on a YouTube channel.
            headerFollowText: __('FOLLOW', 'b-slider'),
            followButtonText: __('FOLLOW', 'b-slider'),
            followButtonAlign: 'right',
            selectedBadges: []
        }
    },
    {
        id: 'feed-player-card-grid',
        title: __('Player & Card Grid', 'b-slider'),
        desc: __('A full-width player above a three-column grid of cards, each with its title, views and description below.', 'b-slider'),
        feedTypes: ['youtube', 'instagram', 'rss', 'json'],
        preview: 'stage-card-grid',
        attributes: {
            carousel: { isAutoPlay: false },
            layoutType: 'thumbnails',
            columns: { desktop: 3, tablet: 2, mobile: 1 },
            columnGap: '24px',
            rowGap: '32px',
            arrow: { visibility: false, size: 20, color: '#0f0f0f', bg: 'transparent' },
            grid: { paginationType: 'loadMore' },
            postsQuery: { per_page: 6 },
            thumbnails: {
                mode: 'grid',
                showStage: true,
                cardStyle: 'stacked',
                showCardTitle: true,
                showCardMeta: true,
                showCardExcerpt: true,
                showDuration: true,
                showPlay: true,
                navPosition: 'below',
                overly: { color: '' },
                height: { desktop: '120px', tablet: '', mobile: '' },
                position: { desktop: 'bottom' },
                width: { desktop: '30%', tablet: '20%', mobile: '15%' },
                active: { color: '#00000000', border: { color: '#000', style: 'solid', width: '0px' } }
            }
        },
        socialQuery: {
            per_page: 15,
            playVideo: 'stage',
            imageFit: 'cover',
            titleLength: 70,
            feedOrderBy: 'date_desc',
            showHeaderBanner: false,
            showHeader: false,
            showChannelStats: false,
            showFollowButton: false,
            selectedBadges: []
        },
        perFeed: {
            youtube: {
                socialQuery: { ytThumbQuality: 'maxresdefault' }
            },
            instagram: {
                title: __('Player & Reels Grid', 'b-slider'),
                desc: __('A full-width player above a three-column grid of Reels cards.', 'b-slider'),
                attributes: {
                    thumbnails: { showDuration: false }
                },
                socialQuery: {
                    igAllowImage: true,
                    igAllowAlbum: true,
                    igAllowVideo: true
                }
            },
            rss: {
                title: __('Player & Article Grid', 'b-slider'),
                desc: __('A featured article/video player above a three-column grid of article cards.', 'b-slider'),
                attributes: {
                    thumbnails: { showDuration: false, showPlay: false }
                },
                socialQuery: {
                    playVideo: 'popup',
                    titleLength: -1,
                    per_page: 30
                }
            },
            json: {
                title: __('Player & Item Grid', 'b-slider'),
                desc: __('A featured item above a three-column grid of cards.', 'b-slider'),
                attributes: {
                    thumbnails: { showDuration: false, showPlay: false }
                },
                socialQuery: {
                    playVideo: 'popup',
                    titleLength: -1,
                    per_page: 30
                }
            }
        }
    },
    {
        id: 'feed-hover-overlay-grid',
        title: __('Hover Overlay Grid', 'b-slider'),
        desc: __('A square grid of items. Hovering reveals likes, comments and caption details.', 'b-slider'),
        feedTypes: ['youtube', 'instagram', 'rss', 'json'],
        preview: 'header-square-nobanner',
        attributes: {
            carousel: { isAutoPlay: false },
            layoutType: 'grid',
            gridItemRatio: '1/1',
            postsQuery: { per_page: 12, excerptLength: 12 },
            columns: { desktop: 3, tablet: 3, mobile: 2 },
            columnGap: '24px',
            rowGap: '24px',
            caption: { display: 'hover', background: 'solid' },
            SliderOverly: 'rgba(0, 0, 0, 0.7)',
            title: { tag: 'h4', isVisible: true },
            titleColor: '#ffffff',
            titleTypo: { fontSize: 14, fontWeight: 500, lineHeight: 1.4 },
            likesCommentsColor: '#ffffff',
            likesCommentsTypo: { fontSize: { desktop: 16, tablet: 16, mobile: 14 }, fontWeight: 600 }
        },
        socialQuery: {
            per_page: 12,
            titleLength: 10,
            playVideo: 'popup',
            imageFit: 'cover',
            feedOrderBy: 'date_desc',
            showHeader: true,
            headerStyle: 'panel',
            showFollowers: true,
            showChannelStats: false,
            showFollowButton: true,
            showLikesComments: true
        },
        perFeed: {
            instagram: {
                title: __('Instagram Hover Grid', 'b-slider'),
                desc: __('A square grid of Instagram posts. Hovering reveals likes, comments and caption details.', 'b-slider'),
                preview: 'header-square-nobanner'
            },
            youtube: {
                title: __('YouTube Hover Grid', 'b-slider'),
                desc: __('A square grid of YouTube videos. Hovering reveals likes, comments and title details.', 'b-slider'),
                preview: 'header-square'
            }
        }
    },
    {
        id: 'feed-card-grid-solid',
        title: __('Solid Card Grid', 'b-slider'),
        desc: __('A grid of square posts, each styled as a card with a solid background displaying likes, comments, and the caption below.', 'b-slider'),
        feedTypes: ['youtube', 'instagram', 'rss', 'json'],
        preview: 'header-grid-nobanner',
        attributes: {
            carousel: { isAutoPlay: false },
            layoutType: 'grid',
            gridItemRatio: '1/1',
            postsQuery: { per_page: 12, excerptLength: 12 },
            columns: { desktop: 3, tablet: 3, mobile: 2 },
            columnGap: '24px',
            rowGap: '32px',
            cardLayout: true,
            cardBgColor: '#e2dbf0',
            cardPadding: { top: '20px', right: '16px', bottom: '20px', left: '16px' },
            cardRadius: { top: '8px', right: '8px', bottom: '8px', left: '8px' },
            caption: { display: 'always', background: 'none' },
            title: { tag: 'h4', isVisible: true },
            titleColor: '#111111',
            titleTypo: { fontSize: 14, fontWeight: 500, lineHeight: 1.4 },
            desc: { isVisible: true },
            descColor: '#3b82f6',
            descTypo: { fontSize: 13, fontWeight: 600, lineHeight: 1.4 },
            likesCommentsColor: '#444444',
            likesCommentsTypo: { fontSize: { desktop: 14, tablet: 14, mobile: 13 }, fontWeight: 500 }
        },
        socialQuery: {
            per_page: 12,
            titleLength: 10,
            playVideo: 'popup',
            imageFit: 'cover',
            feedOrderBy: 'date_desc',
            showHeader: true,
            headerStyle: 'panel',
            showFollowers: true,
            showChannelStats: false,
            showFollowButton: true,
            showLikesComments: true
        },
        perFeed: {
            instagram: {
                title: __('Instagram Card Grid', 'b-slider'),
                desc: __('A grid of Instagram posts. Each post is styled as a card with a solid background displaying likes, comments, and the caption below.', 'b-slider'),
                preview: 'header-grid-nobanner'
            },
            youtube: {
                title: __('YouTube Card Grid', 'b-slider'),
                desc: __('A grid of YouTube videos. Each video is styled as a card with a solid background displaying views, date, and description below.', 'b-slider'),
                preview: 'header-grid'
            }
        }
    }
];

/**
 * The presets offered for a feed, each already reading as that feed's own.
 *
 * A preset shared across services still has to be *named* for the one in front of the user: "Channel
 * Grid" is wrong over an RSS publication, and a card drawing a banner would promise a strip Instagram
 * cannot produce. So `perFeed` may override `title`, `desc` and `preview` alongside the values, and
 * the merge happens here — the picker renders what it is handed and asks no questions about feeds.
 */
export const presetsFor = feedType => feedPresets
    .filter(preset => preset.feedTypes.includes(feedType))
    .map(preset => ({
        ...preset,
        title: preset.perFeed?.[feedType]?.title || preset.title,
        desc: preset.perFeed?.[feedType]?.desc || preset.desc,
        preview: preset.perFeed?.[feedType]?.preview || preset.preview,
        /**
         * The layout this preset produces, lifted out so the picker can check the slider still has
         * it — see `isActive` in `FeedPresets`.
         *
         * Read from the merged pair for the same reason everything else here is, even though no
         * `perFeed` override names one today: an override that did would otherwise leave the tick
         * comparing against the wrong layout.
         */
        layoutType: preset.perFeed?.[feedType]?.attributes?.layoutType
            || preset.attributes?.layoutType
    }));

/**
 * A preset as a single `setAttributes` payload, merged over the slider it is being applied to.
 *
 * One call rather than one per key: every `updateObject` reads the attributes it closed over and
 * writes the whole object back, so a run of them all start from the same stale copy and only the
 * last survives — the same trap `SocialHeaderSettings.fillFromAccount` documents.
 */
export const presetAttributes = (preset, attributes, feedType) => {
    const defaultResets = {
        cardLayout: false,
        cardBgColor: '',
        cardPadding: { top: '16px', right: '16px', bottom: '16px', left: '16px' },
        cardRadius: { top: '8px', right: '8px', bottom: '8px', left: '8px' },
        SliderOverly: '#59595952',
        caption: { display: 'always', background: 'solid' },
        playIconColor: '',
        playIconBg: '',
        playIconHoverBg: ''
    };

    return {
        ...defaultResets,
        ...preset.attributes,
        ...(preset.perFeed?.[feedType]?.attributes || {}),

    /**
     * `thumbnails` merged a level deeper than the rest.
     *
     * Every other attribute a preset writes is a scalar or an object it means to replace outright.
     * This one is a bag of unrelated settings — the strip's position and height beside the card
     * style and the badges — and a feed usually wants to change two of them. Spread like the others,
     * an override naming `showDuration: false` would take `mode: 'grid'` and every sizing key with
     * it, and the preset would apply a layout it never described.
     *
     * Only written when at least one side names it, so a preset with no `thumbnails` at all does not
     * gain an empty one.
     */
    ...((preset.attributes?.thumbnails || preset.perFeed?.[feedType]?.attributes?.thumbnails) ? {
        thumbnails: {
            ...(attributes?.thumbnails || {}),
            ...(preset.attributes?.thumbnails || {}),
            ...(preset.perFeed?.[feedType]?.attributes?.thumbnails || {})
        }
    } : {}),

    /**
     * `carousel` merged the same way, and for the same reason.
     *
     * A preset here only ever wants to say one thing about it — that the slides should not advance
     * on their own — while the object also holds the effect, the direction, the pagination and the
     * items-per-slide. Replacing it outright would reset all of those to whatever a preset happened
     * to spell out.
     */
    ...((preset.attributes?.carousel || preset.perFeed?.[feedType]?.attributes?.carousel) ? {
        carousel: {
            ...(attributes?.carousel || {}),
            ...(preset.attributes?.carousel || {}),
            ...(preset.perFeed?.[feedType]?.attributes?.carousel || {})
        }
    } : {}),

    /**
     * `arrow` as well: a preset names whether the arrows show and what size they are, while the
     * colour control stores `bgType` and `gradient` beside those — so replacing the object outright
     * would throw away a gradient the user had set on them.
     */
    ...((preset.attributes?.arrow || preset.perFeed?.[feedType]?.attributes?.arrow) ? {
        arrow: {
            ...(attributes?.arrow || {}),
            ...(preset.attributes?.arrow || {}),
            ...(preset.perFeed?.[feedType]?.attributes?.arrow || {})
        }
    } : {}),

    /** `grid` too — a preset names its pager and leaves the Load More button's styling alone. */
    ...((preset.attributes?.grid || preset.perFeed?.[feedType]?.attributes?.grid) ? {
        grid: {
            ...(attributes?.grid || {}),
            ...(preset.attributes?.grid || {}),
            ...(preset.perFeed?.[feedType]?.attributes?.grid || {})
        }
    } : {}),

    /**
     * And `postsQuery`, which for a feed slider holds two things only: the page size the grid reads
     * and the excerpt length the captions are cut to. Everything else in it belongs to a post query
     * that a feed never runs — the ACF field list, the taxonomy filters, the meta rules — and a
     * preset replacing the object outright would wipe all of that from a slider that had been a post
     * slider before.
     */
    ...((preset.attributes?.postsQuery || preset.perFeed?.[feedType]?.attributes?.postsQuery) ? {
        postsQuery: {
            ...(attributes?.postsQuery || {}),
            ...(preset.attributes?.postsQuery || {}),
            ...(preset.perFeed?.[feedType]?.attributes?.postsQuery || {})
        }
    } : {}),

    socialQuery: {
        ...(attributes?.socialQuery || {}),
        showLikesComments: false,
        hoverActionsPosition: 'top-right',
        ...preset.socialQuery,
        /**
         * What this preset means for the feed it is being applied to.
         *
         * A preset offered to four services cannot name one set of values for all of them: a banner
         * and a channel's video count are YouTube's alone, `ytThumbQuality` means nothing to an RSS
         * item, and a JSON document describes no account to put a header on. Rather than four
         * near-identical presets, the shared look is written once and each feed says what it cannot
         * do — so what a card promises is what applying it produces.
         *
         * Last, so it wins over the shared block above it.
         */
        ...(preset.perFeed?.[feedType]?.socialQuery || {}),
        /**
         * Which preset this slider was started from, so the picker can mark it.
         *
         * It records the choice, not the current state: everything a preset sets stays editable from
         * the panels below, and changing one of those values does not clear this. So the tick means
         * "started here", not "identical to this" — which is the honest reading, since a slider is
         * meant to be adjusted after a preset is applied and a tick that vanished on the first edit
         * would make the picker look broken.
         */
        activePreset: preset.id
    }
  }
};
