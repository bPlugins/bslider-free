<?php

namespace B_SLIDER;

if ( ! defined( 'ABSPATH' ) ) exit;

if ( ! class_exists( __NAMESPACE__ . '\YouTubeFeed' ) ) {
    /**
     * A YouTube channel or playlist, as slider items.
     *
     * Two ways in, and the feed is the one that needs nothing set up:
     *
     * - **No key.** `youtube.com/feeds/videos.xml` is public and costs no quota, so a slider works
     *   the moment a channel is pasted. The feed carries the 15 most recent videos, no more, and
     *   says nothing about a video's length.
     * - **With a key.** The Data API is asked instead, for up to 50 videos plus each one's duration
     *   and view count. A key is a site setting rather than a block attribute — see
     *   `SocialFeed::apiKey()` — because block attributes are printed into the page.
     *
     * The API is asked through the channel's *uploads playlist* rather than through `search`.
     * `search.list` costs 100 quota units of a 10,000/day allowance — 100 calls for the whole site
     * — while `playlistItems.list` costs 1 and returns the same videos. Every channel's uploads
     * playlist is its own ID with `UC` swapped for `UU`, so no extra call is needed to find it.
     */
    class YouTubeFeed {

        public static $current_quality = 'maxresdefault';
        public static $current_refresh_token = '';
        private static $access_token = null;

        public static function getOAuthCredentials() {
            return [
                'client_id'     => defined('BSB_GOOGLE_CLIENT_ID') ? BSB_GOOGLE_CLIENT_ID : get_option('bsb_google_client_id', ''),
                'client_secret' => defined('BSB_GOOGLE_CLIENT_SECRET') ? BSB_GOOGLE_CLIENT_SECRET : get_option('bsb_google_client_secret', ''),
            ];
        }

        public static function getAccessTokenFromRefreshToken( $refresh_token ) {
            if ( self::$access_token !== null ) {
                return self::$access_token;
            }

            $creds = self::getOAuthCredentials();
            $client_id = $creds['client_id'];
            $client_secret = $creds['client_secret'];

            if ( empty( $client_id ) || empty( $client_secret ) ) {
                return new \WP_Error(
                    'b_slider_yt_no_oauth_creds',
                    __( 'Google OAuth Client ID or Client Secret is not set. Please define BSB_GOOGLE_CLIENT_ID and BSB_GOOGLE_CLIENT_SECRET in wp-config.php.', 'b-slider' )
                );
            }

            $transient_key = 'bsb_yt_access_token_' . md5( $refresh_token );
            $cached_token = get_transient( $transient_key );
            if ( $cached_token ) {
                self::$access_token = $cached_token;
                return $cached_token;
            }

            $response = wp_remote_post( 'https://oauth2.googleapis.com/token', [
                'body' => [
                    'client_id'     => $client_id,
                    'client_secret' => $client_secret,
                    'refresh_token' => $refresh_token,
                    'grant_type'    => 'refresh_token',
                ],
                'timeout' => 10,
            ] );

            if ( is_wp_error( $response ) ) {
                return $response;
            }

            $body = json_decode( wp_remote_retrieve_body( $response ), true );
            $access_token = $body['access_token'] ?? '';

            if ( empty( $access_token ) ) {
                $error_msg = $body['error_description'] ?? ( $body['error'] ?? __( 'Could not retrieve access token from Google.', 'b-slider' ) );
                return new \WP_Error( 'b_slider_yt_token_error', $error_msg );
            }

            $expires_in = (int) ( $body['expires_in'] ?? 3500 );
            set_transient( $transient_key, $access_token, $expires_in - 60 );

            self::$access_token = $access_token;
            return $access_token;
        }

        const FEED_URL = 'https://www.youtube.com/feeds/videos.xml';
        const API_BASE = 'https://www.googleapis.com/youtube/v3/';

        /** The most videos one feed document carries. YouTube publishes 15 and ignores a request for more. */
        const MAX_FEED_ITEMS = 15;

        /**
         * The most videos the API path will collect.
         *
         * A ceiling chosen, never one imposed. `playlistItems` answers 50 at a time and hands back a
         * token for the next 50, so reaching 500 is ten of those plus ten detail calls — 20 quota units
         * of a 10,000/day allowance, which is not the constraint and never was.
         *
         * **It was 200, and what held it there was the page rather than the API.** Every item used to be
         * printed into the HTML whether anybody scrolled to it; measured against a real channel an item
         * is about 1.4 KB of JSON, so 200 was already a quarter of a megabyte on every page load. A
         * paging grid now prints one page and fetches the rest from `/bsb/v1/feed-page`, so the size of
         * the page no longer follows the size of the feed — see `$feed_handle` in render.php.
         *
         * What is left to protect is the *fetch*: ten sequential round trips to YouTube inside one
         * request, which on a slow day is a PHP timeout rather than a slow page. `FETCH_TIME_BUDGET`
         * is the answer to that — it stops the walk and keeps what it has instead of dying with
         * nothing. So this number is safe to raise, and raising it further is a question about how
         * long a first fill may take, not about quota or page weight.
         */
        const MAX_API_ITEMS = 500;

        /** How many one `playlistItems` or `videos` call may ask about. The API's own limit. */
        const API_PAGE_SIZE = 50;

        /**
         * How long one fetch may spend talking to YouTube, across every call it makes.
         *
         * The reason `MAX_API_ITEMS` can be 500. Collecting that many is ten paged requests and ten
         * detail requests, one after another, and `TIMEOUT` allows each of them ten seconds — so the
         * worst case without a bound here is minutes, which is not a slow slider but a white page:
         * PHP's own execution limit reached with nothing to show and nothing written to the cache, so
         * the next visitor starts the same doomed walk again.
         *
         * A deadline instead. When it passes, the walk stops and answers with what it has — fewer
         * videos than were asked for, in the right order, cached like any other answer. `oldest()` has
         * worked this way since it was written; this is the same idea applied to the ordinary fetch,
         * which never had it because four calls never needed it.
         */
        const FETCH_TIME_BUDGET = 10;

        const TIMEOUT = 10;

        /**
         * How long a resolved channel ID is kept.
         *
         * A channel's ID never changes. The handle pointing at it can be given up and taken by
         * somebody else, which is the only reason this expires at all rather than being an option.
         */
        const ID_TTL = MONTH_IN_SECONDS;

        /**
         * The thumbnail files YouTube generates, widest first.
         *
         * `maxresdefault` (1280x720) and `mqdefault` (320x180) are the video's own 16:9 frame.
         * `default`, `hqdefault` and `sddefault` are 4:3 and letterbox a widescreen video, so they
         * are worth having only as the fallback for an upload that never got an HD render.
         */
        const THUMB_QUALITIES = [ 'maxresdefault', 'sddefault', 'hqdefault', 'mqdefault', 'default' ];

        /**
         * The sets a channel can be read as, and the playlist ID prefix each one is.
         *
         * Every channel's uploads live at its own ID with `UC` swapped for `UU`. YouTube keeps three
         * more lists at the same trick, and they are what makes "most viewed" affordable:
         *
         * - `UULP` — the channel's Popular videos, ordered by view count, descending.
         * - `UULF` — uploads without the Shorts.
         * - `UUSH` — the Shorts on their own.
         *
         * Measured against four channels before this was built: `UULP` came back strictly descending
         * by views every time, and both filtered lists returned a real subset — the WordPress channel
         * has 8 Shorts against 15 uploads, and MrBeast's newest upload is a Short that `UULF` leaves
         * out. All three answer on `feeds/videos.xml?playlist_id=` as well as through the API, which
         * is the part that matters: most-viewed costs a site with no API key nothing at all.
         *
         * The alternatives were both bad. Walking the whole uploads playlist and calling `videos.list`
         * for every video's statistics is ~40 requests for a 1,000-video channel — the quota is fine,
         * 40 units of 10,000, but no page render waits for 40 sequential HTTP calls. `search.list`
         * with `order=viewCount` costs 100 units a call and stops at about 500 results. Here YouTube
         * does the ranking and it stays one request.
         *
         * These prefixes are undocumented, so nothing depends on them: a set YouTube will not serve
         * falls back to the channel itself. See `items()`.
         */
        const VIDEO_SETS = [
            'latest'  => 'UU',
            'popular' => 'UULP',
            // The one set that is not a playlist. YouTube's channel page offers Latest, Popular and
            // Oldest, but only the first two are lists it keeps — `UULO`, `UUO` and `UUOL` are all 404.
            // Oldest is a sort it applies to the uploads, so it has to be walked to. See `oldest()`.
            'oldest'  => '',
            'long'    => 'UULF',
            'shorts'  => 'UUSH',
            // Also not a list YouTube keeps. It reads the uploads, exactly as `latest` does, and the
            // shuffle happens in `SocialFeed::postProcessItems()` — after the cache rather than
            // before it, so the order is different on every page load instead of frozen for the
            // whole cache window. `cacheKeyFor()` folds it back to `latest` for the same reason:
            // the two ask the service for the identical document, so they share the one fetch.
            'random'  => 'UU',
        ];

        /** The sets that cannot be read without a Data API key. See `oldest()`. */
        const KEYED_SETS = [ 'oldest' ];

        /**
         * How far, and for how long, the walk to the end of a playlist is willing to go.
         *
         * 40 pages is 2,000 videos, which covers all but the largest channels, and the first page says
         * `totalResults` — so a channel past the limit is refused for one quota unit rather than found
         * out 40 requests in. The time budget is the backstop that the page count is not: 40 sequential
         * requests to a slow network would outlast PHP's own execution limit and take the page with it.
         */
        const OLDEST_MAX_PAGES = 40;

        const OLDEST_TIME_BUDGET = 10;

        /**
         * How long a walked result is kept.
         *
         * A month, against the six hours a feed is normally cached for, and the reason is worth stating:
         * **a channel's oldest videos do not change when it publishes**. Uploading pushes new videos on
         * to the front of the list and moves nothing at the back. Only a deletion changes the answer, so
         * the one expensive walk is amortised over a very long time instead of being repeated every time
         * the feed cache lapses.
         */
        const OLDEST_TTL = MONTH_IN_SECONDS;

        /** The set asked for, or the uploads every channel has. */
        public static function videoSet( $set ) {
            $set = is_scalar( $set ) ? (string) $set : '';

            return isset( self::VIDEO_SETS[ $set ] ) ? $set : 'latest';
        }

        /* -------------------------------------------------------------------------- */
        /* This reader's own caches                                                   */
        /* -------------------------------------------------------------------------- */

        /**
         * The three answers this reader keeps for itself, and where each one lives.
         *
         * `SocialFeed` caches the finished feed under a key of its own, and that is the one the
         * slider's `cacheTime` governs and the Refresh button clears. These sit underneath it: a
         * walked playlist, a search result and a channel's playlist list, each expensive enough to be
         * worth keeping past a single feed window.
         *
         * The keys are built here rather than at each call site because `forget()` has to arrive at
         * exactly the same strings from the saved query alone. Written out twice they would drift, and
         * a purge that computes a key nothing was stored under is a purge that silently does nothing —
         * which is what the Refresh button was doing.
         */
        /**
         * All three carry the cache version, for the same reason `SocialFeed::cacheKey()` does.
         *
         * Saving an API key changes what this reader can see — view counts, durations, the most-viewed
         * list, and a ceiling of 500 videos instead of 15 — so every answer given without one is stale
         * the moment a key arrives. `SocialFeed` retires its own caches by bumping the version; these
         * three were not stamped, so a channel that had just been given a key went on being answered
         * from the keyless copy: six hours for a search, a month for a walk.
         */
        private static function keyVersion() {
            return '|v' . SocialFeed::cacheVersion();
        }

        private static function searchKey( $search_term, $channel_id, $limit ) {
            return 'b_slider_yt_search_' . md5( $search_term . '_' . $channel_id . '_' . $limit . self::keyVersion() );
        }

        private static function oldestKey( $playlist_id ) {
            return 'b_slider_yt_oldest_' . md5( $playlist_id . self::keyVersion() );
        }

        private static function playlistsKey( $channel_id ) {
            return 'b_slider_yt_playlists_' . md5( $channel_id . self::keyVersion() );
        }

        /**
         * How many entries a fetch asks for, which is not always how many the slider shows.
         *
         * Filtering by privacy status throws entries away after they arrive, so the fetch has to
         * over-read or a channel of mostly-public videos would come back short of an "Unlisted only"
         * slider's count. Shared with `forget()`, since the number is part of the search key.
         */
        private static function fetchLimit( $limit, $privacy_status ) {
            $original = self::limit( $limit );
            $wanted   = ( 'all' !== $privacy_status ) ? max( $original * 2, self::API_PAGE_SIZE ) : $original;

            return self::limit( $wanted );
        }

        /**
         * Drop what this reader is holding for one slider's feed.
         *
         * Called from `SocialFeed::forget()`, which is the Refresh button and the only thing a user can
         * press to say "go and look again". Before this it cleared the finished-feed transient and
         * stopped, so Refresh did nothing at all for the two sets that answer from here: a search kept
         * serving its six-hour copy, and `Oldest first` its month-old walk. The button reported success
         * and the slider did not change, which is the worst of the three possible outcomes.
         *
         * Only the sets that could be stale. The resolved channel ID is left alone deliberately — it is
         * keyed by the address that was typed, so a corrected handle already misses it, and a channel
         * does not change its ID.
         */
        public static function forget( $socialQuery = [] ) {
            $query = is_array( $socialQuery ) ? $socialQuery : [];

            $source      = (string) ( $query['source'] ?? '' );
            $playlist_id = (string) ( $query['ytPlaylistId'] ?? '' );
            $privacy     = (string) ( $query['ytPrivacyStatus'] ?? 'all' );
            $limit       = self::fetchLimit( self::maxItems(), '' === $privacy ? 'all' : $privacy );

            if ( '' === $source && '' === $playlist_id ) {
                return;
            }

            $resolved = '' !== $playlist_id
                ? [ 'resource' => 'playlist', 'id' => $playlist_id ]
                : self::resolve( $source );

            if ( is_wp_error( $resolved ) ) {
                return;
            }

            $channel_id = 'channel' === $resolved['resource'] ? $resolved['id'] : '';

            // A search is keyed by its term, so a slider that has been pointed at several is only
            // holding the one it is on now — which is the one Refresh is being pressed about.
            $search_term = (string) ( $query['ytSearchTerm'] ?? '' );
            if ( 'search' === ( $query['ytQueryType'] ?? 'channel' ) && '' !== $search_term ) {
                delete_transient( self::searchKey( $search_term, $channel_id, $limit ) );
            }

            // The walk, whether it was a channel's uploads or a playlist pasted by hand.
            delete_transient( self::oldestKey(
                'playlist' === $resolved['resource'] ? $resolved['id'] : 'UU' . substr( $resolved['id'], 2 )
            ) );

            if ( '' !== $channel_id ) {
                delete_transient( self::playlistsKey( $channel_id ) );
            }
        }

        const ATOM_NS  = 'http://www.w3.org/2005/Atom';
        const YT_NS    = 'http://www.youtube.com/xml/schemas/2015';
        const MEDIA_NS = 'http://search.yahoo.com/mrss/';

        /** Whether this site has a Data API key, and so how much a slider may ask for. */
        public static function hasApiKey() {
            return '' !== SocialFeed::apiKey();
        }

        /** The most videos this site can show: one feed document, or one API page. */
        public static function maxItems() {
            return self::hasApiKey() ? self::MAX_API_ITEMS : self::MAX_FEED_ITEMS;
        }

        /**
         * How many videos to take.
         *
         * "Show all" — which the rest of the block writes as `-1` — and anything past what the site
         * can reach both settle on the ceiling rather than on nothing.
         */
        public static function limit( $limit ) {
            $max   = self::maxItems();
            $limit = (int) ( is_scalar( $limit ) ? $limit : $max );

            return ( $limit > 0 && $limit < $max ) ? $limit : $max;
        }

        /**
         * The videos of a channel or playlist, arranged the way a slider item is.
         *
         * @param string $video_set Which of the channel's lists to read. See `VIDEO_SETS`.
         * @param int    $ttl       How long a search result may be kept — the slider's own Feed Cache
         *                          Time. Only the search path caches for itself; everything else here
         *                          answers into `SocialFeed`'s cache and is governed by it already.
         * @return array|\WP_Error
         */
        public static function items( $source, $limit = 12, $date_format = 'M j, Y', $excerpt_length = 25, $video_set = 'latest', $query_type = 'channel', $search_term = '', $playlist_id = '', $quality = 'maxresdefault', $privacy_status = 'all', $refresh_token = '', $ttl = 0 ) {
            if ( ! b_slider_is_premium() ) {
                $playlist_id = '';
                $query_type = 'channel';
                $quality = 'maxresdefault';
            }
            $privacy_status = ! empty( $privacy_status ) ? $privacy_status : 'all';
            self::$current_quality = in_array( $quality, self::THUMB_QUALITIES, true ) ? $quality : 'maxresdefault';
            self::$current_refresh_token = $refresh_token;
            self::$access_token = null;

            $original_limit = self::limit( $limit );
            $fetch_limit    = self::fetchLimit( $limit, $privacy_status );

            if ( 'search' === $query_type && ! empty( $search_term ) ) {
                $channel_id = '';
                $resolved = self::resolve( $source );
                if ( ! is_wp_error( $resolved ) && 'channel' === $resolved['resource'] ) {
                    $channel_id = $resolved['id'];
                }
                $items = self::search( $search_term, $fetch_limit, $date_format, $excerpt_length, $channel_id, $ttl );
            } else {
                if ( ! empty( $playlist_id ) ) {
                    $resolved = [ 'resource' => 'playlist', 'id' => $playlist_id ];
                } else {
                    $resolved = self::resolve( $source );
                }

                if ( is_wp_error( $resolved ) ) {
                    return $resolved;
                }

                $video_set = self::videoSet( $video_set );
                $prefix    = self::VIDEO_SETS[ $video_set ];

                if ( 'oldest' === $video_set ) {
                    $items = self::oldest( $resolved, $fetch_limit, $date_format, $excerpt_length );
                } else {
                    if ( 'UU' !== $prefix && 'channel' === $resolved['resource'] ) {
                        $items = self::read( [
                            'resource' => 'playlist',
                            'id'       => $prefix . substr( $resolved['id'], 2 ),
                        ], $fetch_limit, $date_format, $excerpt_length, $privacy_status );

                        if ( is_wp_error( $items ) || ! $items ) {
                            $items = self::read( $resolved, $fetch_limit, $date_format, $excerpt_length, $privacy_status );
                        }
                    } else {
                        $items = self::read( $resolved, $fetch_limit, $date_format, $excerpt_length, $privacy_status );
                    }

                    if ( 'popular' === $video_set && ! is_wp_error( $items ) ) {
                        usort( $items, function ( $a, $b ) {
                            return ( (int) $b['views'] ) <=> ( (int) $a['views'] );
                        } );
                    }
                }
            }

            if ( is_wp_error( $items ) ) {
                return $items;
            }

            if ( 'all' !== $privacy_status && is_array( $items ) ) {
                $filtered_items = [];
                foreach ( $items as $item ) {
                    $item_privacy = $item['privacy'] ?? 'public';
                    if ( strtolower( $item_privacy ) === strtolower( $privacy_status ) ) {
                        $filtered_items[] = $item;
                    }
                }
                $items = $filtered_items;
            }

            return array_slice( $items, 0, $original_limit );
        }

        /**
         * The channel's first videos, oldest first.
         *
         * There is no list to ask for. The uploads playlist is newest first and the API offers no way to
         * reverse it, no offset, and page tokens that are opaque — so the only route to the far end is
         * to walk there. `search.list` has no ascending date order either, and would cost 100 units a
         * call for the privilege.
         *
         * **A key is required, and this is not a policy but a fact.** Without one the only thing this
         * site can see of a channel is `feeds/videos.xml`, and that document is fifteen entries with no
         * pagination at all: no `rel="next"`, no total, and `start-index`, `max-results` and `page` are
         * all ignored — the same fifteen come back however it is asked. There is no way to learn what a
         * channel's oldest video is, so the panel offers this only when a key is set and says why when
         * it is not.
         *
         * @return array|\WP_Error
         */
        private static function oldest( $resolved, $limit, $date_format, $excerpt_length ) {
            if ( ! self::hasApiKey() ) {
                return new \WP_Error(
                    'b_slider_yt_oldest_needs_key',
                    __( 'Showing a channel’s oldest videos needs a YouTube API key. Without one the public feed only ever returns the 15 most recent, so there is no way to reach the older ones.', 'b-slider' )
                );
            }

            // A pasted playlist is walked as itself: the end of a hand-made playlist is a meaningful
            // thing to ask for too, and it is the same walk.
            $playlist_id = 'playlist' === $resolved['resource']
                ? $resolved['id']
                : 'UU' . substr( $resolved['id'], 2 );

            // The slider's own count is deliberately not part of the key. The walk keeps as many as any
            // slider could ask for, so turning "How many videos" from 12 to 20 slices the same cached
            // tail instead of walking the whole channel again for the sake of eight more.
            $cache_key = self::oldestKey( $playlist_id );
            $entries   = get_transient( $cache_key );

            if ( ! is_array( $entries ) ) {
                $entries = self::walkToEnd( $playlist_id, self::MAX_API_ITEMS );

                if ( is_wp_error( $entries ) ) {
                    return $entries;
                }

                set_transient( $cache_key, $entries, self::OLDEST_TTL );
            }

            return $entries
                ? self::withDetails( $entries, $limit, $date_format, $excerpt_length )
                : [];
        }

        /**
         * The last `$keep` entries of a playlist, turned round so the oldest comes first.
         *
         * Only the tail is held as it goes, so a 2,000-video channel never carries more than `$keep`
         * entries in memory — what is being walked past is not wanted, only walked past.
         *
         * @return array|\WP_Error
         */
        private static function walkToEnd( $playlist_id, $keep ) {
            $started    = microtime( true );
            $tail       = [];
            $page_token = '';
            $pages      = 0;

            do {
                $query = [
                    'part'       => 'snippet,contentDetails,status',
                    'playlistId' => $playlist_id,
                    // The full page every time. Asking for less would only mean more requests to cross
                    // the same distance.
                    'maxResults' => self::API_PAGE_SIZE,
                ];

                if ( '' !== $page_token ) {
                    $query['pageToken'] = $page_token;
                }

                $body = self::apiGet( 'playlistItems', $query );

                if ( is_wp_error( $body ) ) {
                    return $body;
                }

                // The first page states the size of the whole playlist, which makes refusing a channel
                // that is too big cost one request instead of forty.
                if ( 0 === $pages ) {
                    $total = (int) ( $body['pageInfo']['totalResults'] ?? 0 );

                    if ( $total > self::OLDEST_MAX_PAGES * self::API_PAGE_SIZE ) {
                        return new \WP_Error(
                            'b_slider_yt_oldest_too_big',
                            sprintf(
                                /* translators: 1: number of videos on the channel, 2: the largest number this can walk */
                                __( 'This channel has %1$s videos, and reaching the oldest of them means reading through all of them — more than the %2$s this can do in one go. Pick Latest or Most viewed instead.', 'b-slider' ),
                                number_format_i18n( $total ),
                                number_format_i18n( self::OLDEST_MAX_PAGES * self::API_PAGE_SIZE )
                            )
                        );
                    }
                }

                foreach ( (array) ( $body['items'] ?? [] ) as $entry ) {
                    $shaped = self::shapeApiEntry( $entry );

                    if ( $shaped ) {
                        $tail[ $shaped['video_id'] ] = $shaped;
                    }
                }

                // Anything further back than the tail is not wanted, and holding it would grow with the
                // channel.
                if ( count( $tail ) > $keep ) {
                    $tail = array_slice( $tail, -$keep, null, true );
                }

                $pages++;
                $page_token = (string) ( $body['nextPageToken'] ?? '' );

                if (
                    '' !== $page_token &&
                    ( $pages >= self::OLDEST_MAX_PAGES || ( microtime( true ) - $started ) > self::OLDEST_TIME_BUDGET )
                ) {
                    return new \WP_Error(
                        'b_slider_yt_oldest_slow',
                        __( 'Reading back to this channel’s oldest videos is taking too long to finish in one request. Pick Latest or Most viewed instead.', 'b-slider' )
                    );
                }
            } while ( '' !== $page_token );

            // The playlist runs newest first, so its end is the oldest and the tail is back to front.
            return array_reverse( $tail, true );
        }

        /**
         * One list of videos, however this site is able to read it.
         *
         * With a key the API is asked first and the feed is the fallback: a revoked key, an exhausted
         * quota or a key restricted to the wrong referrer should leave the slider showing the 15
         * videos it could always show, rather than showing an error.
         *
         * @return array|\WP_Error
         */
        private static function read( $resolved, $limit, $date_format, $excerpt_length, $privacy_status = 'all' ) {
            if ( self::hasApiKey() || ! empty( self::$current_refresh_token ) ) {
                $items = self::fromApi( $resolved, $limit, $date_format, $excerpt_length );

                if ( ! is_wp_error( $items ) ) {
                    return $items;
                }

                if ( ! empty( self::$current_refresh_token ) ) {
                    if ( in_array( strtolower( $privacy_status ), [ 'private', 'unlisted' ], true ) ) {
                        return $items;
                    }
                }
            }

            return self::fromFeed( $resolved, $limit, $date_format, $excerpt_length );
        }

        /**
         * Search videos from YouTube.
         *
         * @return array|\WP_Error
         */
        public static function search( $search_term, $limit, $date_format, $excerpt_length, $channel_id = '', $ttl = 0 ) {
            if ( ! self::hasApiKey() ) {
                return new \WP_Error(
                    'b_slider_yt_search_needs_key',
                    __( 'Searching YouTube requires a YouTube API key. Add one under Feed Settings → Connection.', 'b-slider' )
                );
            }

            $limit     = self::limit( $limit );
            $cache_key = self::searchKey( $search_term, $channel_id, $limit );
            $items     = get_transient( $cache_key );

            if ( is_array( $items ) ) {
                return $items;
            }

            $query = [
                'part'       => 'snippet',
                'q'          => $search_term,
                'type'       => 'video',
                'maxResults' => $limit,
            ];

            if ( ! empty( $channel_id ) ) {
                $query['channelId'] = $channel_id;
            }

            $body = self::apiGet( 'search', $query );

            if ( is_wp_error( $body ) ) {
                return $body;
            }

            $entries = [];
            foreach ( (array) ( $body['items'] ?? [] ) as $item ) {
                $video_id = $item['id']['videoId'] ?? '';
                if ( empty( $video_id ) ) {
                    continue;
                }

                $snippet = $item['snippet'] ?? [];
                $owner_id = $snippet['channelId'] ?? '';
                $published = (string) ( $snippet['publishedAt'] ?? '' );

                $entries[ $video_id ] = [
                    'video_id'    => $video_id,
                    'title'       => (string) ( $snippet['title'] ?? '' ),
                    'description' => (string) ( $snippet['description'] ?? '' ),
                    'published'   => $published,
                    'updated'     => $published,
                    'author'      => (string) ( $snippet['channelTitle'] ?? '' ),
                    'author_link' => $owner_id ? 'https://www.youtube.com/channel/' . $owner_id : '',
                    'feed_thumb'  => self::bestApiThumb( $snippet['thumbnails'] ?? [] ),
                    'views'       => 0,
                ];
            }

            if ( empty( $entries ) ) {
                return [];
            }

            $deadline = microtime( true ) + self::FETCH_TIME_BUDGET;
            $items = self::withDetails( $entries, $limit, $date_format, $excerpt_length, $deadline );

            /**
             * The slider's own Feed Cache Time, and six hours only when nothing said otherwise.
             *
             * It was a flat 21600 with `self::hasApiKey() ? 21600 : 300` around it — a ternary whose
             * second arm was unreachable, since a search without a key returns the error above and
             * never arrives here.
             *
             * The flat number was the real problem: `SocialFeed` honours Feed Cache Time on the outer
             * cache, so setting a search slider to five minutes expired that copy on time and then had
             * this one hand back the same six-hour-old results. The setting could be raised and not
             * lowered, which is not what a field called Feed Cache Time says it does.
             */
            set_transient( $cache_key, $items, $ttl > 0 ? (int) $ttl : SocialFeed::CACHE_TTL );

            return $items;
        }

        /* -------------------------------------------------------------------------- */
        /* Resolving what the user pasted                                             */
        /* -------------------------------------------------------------------------- */

        /**
         * What the user pasted, as a resource that can be asked for.
         *
         * @param string $input A channel URL, an `@handle`, a playlist URL or a raw ID.
         * @return array|\WP_Error `[ 'resource' => 'channel'|'playlist', 'id' => string ]`
         */
        public static function resolve( $input ) {
            $input = trim( (string) $input );

            if ( '' === $input ) {
                return new \WP_Error( 'b_slider_yt_empty', __( 'Paste a YouTube channel URL, @handle or ID.', 'b-slider' ) );
            }

            // The raw IDs first — they are what everything below is trying to arrive at.
            if ( preg_match( '/^UC[\w-]{22}$/', $input ) ) {
                return [ 'resource' => 'channel', 'id' => $input ];
            }

            if ( preg_match( '/^(PL|UU|FL|LL|OL)[\w-]{10,}$/', $input ) ) {
                return [ 'resource' => 'playlist', 'id' => $input ];
            }

            // `list=` is read before the video forms below: a video opened from a playlist carries
            // both, and the playlist is what somebody copying that URL meant to point at.
            if ( preg_match( '/[?&]list=([\w-]{10,})/', $input, $m ) ) {
                return [ 'resource' => 'playlist', 'id' => $m[1] ];
            }

            if ( preg_match( '#youtube\.com/channel/(UC[\w-]{22})#i', $input, $m ) ) {
                return [ 'resource' => 'channel', 'id' => $m[1] ];
            }

            // A single video has no feed of its own. Saying so beats failing as "unrecognised",
            // since the watch URL is the one everybody has in their clipboard.
            if ( preg_match( '#(?:youtu\.be/|youtube\.com/(?:watch\?|shorts/|embed/|live/|v/))#i', $input ) ) {
                return new \WP_Error(
                    'b_slider_yt_single_video',
                    __( 'That is a single video. Paste the channel URL, its @handle, or a playlist URL instead.', 'b-slider' )
                );
            }

            // `@handle`, `/c/name` and `/user/name` all name a channel without giving its ID.
            if ( preg_match( '#youtube\.com/(@[\w.-]+|c/[\w.-]+|user/[\w.-]+)#i', $input, $m ) ) {
                return self::channelIdOf( $m[1] );
            }

            // A bare handle, with or without the `@`. Last, so it cannot swallow a URL.
            if ( preg_match( '/^@?([\w.-]{3,})$/', $input, $m ) ) {
                return self::channelIdOf( '@' . $m[1] );
            }

            return new \WP_Error(
                'b_slider_yt_unrecognised',
                __( 'That does not look like a YouTube channel or playlist. Paste the channel URL, its @handle, or its UC… ID.', 'b-slider' )
            );
        }

        /**
         * Where a channel page states which channel it is, most authoritative first.
         *
         * Three of them, because this is markup rather than an API and one of them changing should
         * not be the end of the feature. They are read in order and the first hit wins.
         *
         * `"channelId"` is deliberately not among them. It appears all over a channel page and the
         * first occurrence belongs to a *recommended* channel in the sidebar, not to the page — on
         * every channel tried it resolved to somebody else entirely, which is a wrong slider rather
         * than an empty one. `"externalId"` is the same data under the one key that means the page.
         */
        const CHANNEL_ID_PATTERNS = [
            '#<meta\s+itemprop="identifier"\s+content="(UC[\w-]{22})"#i',
            '#<link\s+rel="canonical"\s+href="https?://www\.youtube\.com/channel/(UC[\w-]{22})"#i',
            '/"externalId":"(UC[\w-]{22})"/',
        ];

        /**
         * The `UC…` ID behind a handle or a legacy custom URL.
         *
         * With a key this is one cheap API call. Without one, the channel's own page is fetched and
         * the ID read out of its markup — nothing else turns a handle into an ID, and the
         * alternative would be to refuse every address that is not already a `UC…`. Either way the
         * answer is kept for a month, since it does not change.
         *
         * @return array|\WP_Error
         */
        private static function channelIdOf( $path ) {
            $path   = ltrim( (string) $path, '/' );
            $key    = 'b_slider_yt_id_' . md5( strtolower( $path ) );
            $cached = get_transient( $key );

            if ( is_string( $cached ) && '' !== $cached ) {
                return [ 'resource' => 'channel', 'id' => $cached, 'confirmed' => true ];
            }

            $id = self::hasApiKey() ? self::channelIdFromApi( $path ) : '';

            if ( '' === $id ) {
                $id = self::channelIdFromPage( $path );
            }

            if ( is_wp_error( $id ) ) {
                return $id;
            }

            if ( '' === $id ) {
                return new \WP_Error(
                    'b_slider_yt_no_channel',
                    __( 'No channel was found at that address. Check the handle, or paste the channel’s UC… ID instead.', 'b-slider' )
                );
            }

            set_transient( $key, $id, self::ID_TTL );

            return [ 'resource' => 'channel', 'id' => $id, 'confirmed' => true ];
        }

        /**
         * A channel ID from `channels.list`, or `''` when the API cannot answer.
         *
         * Never a WP_Error: this is only ever the first of two attempts, and a key problem should
         * fall through to reading the page rather than stopping here.
         */
        private static function channelIdFromApi( $path ) {
            $param = 0 === strpos( $path, '@' ) ? 'forHandle' : 'forUsername';
            $value = 0 === strpos( $path, '@' ) ? $path : preg_replace( '#^(c|user)/#', '', $path );

            $body = self::apiGet( 'channels', [ 'part' => 'id', $param => $value ] );

            if ( is_wp_error( $body ) ) {
                return '';
            }

            $id = $body['items'][0]['id'] ?? '';

            return preg_match( '/^UC[\w-]{22}$/', (string) $id ) ? $id : '';
        }

        /**
         * A channel ID read out of the channel page's markup.
         *
         * @return string|\WP_Error `''` when the page loaded but said nothing this recognises.
         */
        private static function channelIdFromPage( $path ) {
            // Built here from a path `resolve()` matched itself, so the host is always youtube.com
            // however the user wrote what they pasted.
            $body = self::get( 'https://www.youtube.com/' . $path );

            if ( is_wp_error( $body ) ) {
                return $body;
            }

            foreach ( self::CHANNEL_ID_PATTERNS as $pattern ) {
                if ( preg_match( $pattern, $body, $m ) ) {
                    return $m[1];
                }
            }

            return '';
        }

        /**
         * Whether this channel is known to exist, whatever the feed goes on to say.
         *
         * A handle only resolves by loading the channel's own page, so if that worked the channel is
         * real — and a 404 from the feed afterwards is the endpoint shedding load, not a wrong
         * address. Worth distinguishing: the message for a wrong address sends somebody off to check
         * an ID that was right all along.
         */
        private static function isConfirmed( $resolved ) {
            return ! empty( $resolved['confirmed'] );
        }

        /* -------------------------------------------------------------------------- */
        /* The channel behind the feed                                                */
        /* -------------------------------------------------------------------------- */

        /**
         * The channel a slider is reading, in the shape the Profile Header draws.
         *
         * The same keys every reader's `profile()` returns, because the header card and the button under the
         * slides read one shape and do not ask which service filled it in — see `SocialFeed::profileFor()`.
         *
         * **Why this needs the API key.** The public `videos.xml` names the channel and links to it,
         * but carries no picture and no subscriber count. A header card that is a name on an empty
         * row is not the card anybody switched on, so this says the key is missing rather than
         * drawing half of one — and the fields can still be filled in by hand either way.
         *
         * A playlist address is answered with the channel that owns it. A playlist has no profile of
         * its own, and "subscribe" means the channel in both cases.
         *
         * @return array|\WP_Error
         */
        public static function profile( $source ) {
            $resolved = self::resolve( $source );

            if ( is_wp_error( $resolved ) ) {
                return $resolved;
            }

            if ( ! self::hasApiKey() ) {
                return new \WP_Error(
                    'b_slider_yt_profile_no_key',
                    __( 'Reading a channel’s name, picture and subscriber count needs a YouTube API key. Add one below, or fill the fields in by hand.', 'b-slider' )
                );
            }

            $channel_id = 'playlist' === $resolved['resource']
                ? self::playlistOwner( $resolved['id'] )
                : $resolved['id'];

            if ( is_wp_error( $channel_id ) ) {
                return $channel_id;
            }

            // `brandingSettings` for the channel banner — the wide picture above the header on
            // YouTube's own page. One more part on a request already being made, not a second call.
            $body = self::apiGet( 'channels', [
                'part'       => 'snippet,statistics,brandingSettings',
                'id'         => $channel_id,
                'maxResults' => 1,
            ] );

            if ( is_wp_error( $body ) ) {
                return $body;
            }

            $item = $body['items'][0] ?? null;

            if ( ! is_array( $item ) ) {
                return new \WP_Error( 'b_slider_yt_profile_missing', __( 'YouTube has no channel at that address.', 'b-slider' ) );
            }

            $snippet = is_array( $item['snippet'] ?? null ) ? $item['snippet'] : [];
            $stats   = is_array( $item['statistics'] ?? null ) ? $item['statistics'] : [];
            $handle  = ltrim( trim( wp_strip_all_tags( (string) ( $snippet['customUrl'] ?? '' ) ) ), '@' );

            /**
             * The channel banner, which not every channel sets.
             *
             * `bannerExternalUrl` arrives without a size on it and YouTube serves the bare address at
             * a width nobody asked for; `=w2560` is the size its own page requests, and the CDN
             * accepts the suffix on any of these. A channel with no banner reports nothing here, which
             * lands as '' and is read downstream as "draw no banner".
             */
            $branding = is_array( $item['brandingSettings']['image'] ?? null ) ? $item['brandingSettings']['image'] : [];
            $banner   = trim( (string) ( $branding['bannerExternalUrl'] ?? '' ) );

            return [
                'id'          => (string) ( $item['id'] ?? $channel_id ),
                'username'    => $handle,
                'name'        => trim( wp_strip_all_tags( (string) ( $snippet['title'] ?? '' ) ) ),
                'bio'         => trim( wp_strip_all_tags( (string) ( $snippet['description'] ?? '' ) ) ),
                'avatar'      => esc_url_raw( self::bestApiThumb( $snippet['thumbnails'] ?? [] ) ),
                'banner'      => '' !== $banner ? esc_url_raw( $banner . '=w2560' ) : '',
                // The handle where the channel publishes one, since that is the address it puts on
                // everything else; the `UC…` URL always works and is what the rest are reached by.
                'link'        => esc_url_raw( '' !== $handle
                    ? 'https://www.youtube.com/@' . $handle
                    : 'https://www.youtube.com/channel/' . $channel_id ),
                'website'     => '',
                'accountType' => 'youtube',
                'posts'       => (int) ( $stats['videoCount'] ?? 0 ),
                // A channel that hides its count reports `hiddenSubscriberCount` and no number at
                // all, which lands here as 0 — read downstream as "nothing to print", which is right.
                'followers'   => (int) ( $stats['subscriberCount'] ?? 0 ),
                // Everything the channel has ever been watched for. Carried beside the other two so a
                // header can print the line YouTube's own page does — subscribers, videos, views.
                'views'       => (int) ( $stats['viewCount'] ?? 0 ),
            ];
        }

        /** The channel a playlist belongs to, since a playlist has no profile of its own. */
        private static function playlistOwner( $playlist_id ) {
            $body = self::apiGet( 'playlists', [
                'part'       => 'snippet',
                'id'         => $playlist_id,
                'maxResults' => 1,
            ] );

            if ( is_wp_error( $body ) ) {
                return $body;
            }

            $channel_id = (string) ( $body['items'][0]['snippet']['channelId'] ?? '' );

            return '' !== $channel_id
                ? $channel_id
                : new \WP_Error( 'b_slider_yt_playlist_owner', __( 'YouTube did not say which channel that playlist belongs to.', 'b-slider' ) );
        }

        /* -------------------------------------------------------------------------- */
        /* The public feed                                                            */
        /* -------------------------------------------------------------------------- */

        /** @return array|\WP_Error */
        private static function fromFeed( $resolved, $limit, $date_format, $excerpt_length = 25 ) {
            $arg  = 'playlist' === $resolved['resource'] ? 'playlist_id' : 'channel_id';
            $body = self::get( add_query_arg( $arg, $resolved['id'], self::FEED_URL ) );

            if ( is_wp_error( $body ) ) {
                // The channel loaded a moment ago, so "nothing at that address" cannot be true — the
                // feed endpoint simply refused this time, whether it said so as a 404 or a 500.
                // Say that instead, and point at the two things that actually help.
                if (
                    in_array( $body->get_error_code(), [ 'b_slider_yt_not_found', 'b_slider_yt_http' ], true ) &&
                    self::isConfirmed( $resolved )
                ) {
                    return new \WP_Error(
                        'b_slider_yt_feed_unavailable',
                        __( 'YouTube did not answer for this channel just now — it limits how often the public feed can be read. Press Refresh to try again, or add an API key below to read it reliably.', 'b-slider' )
                    );
                }

                return $body;
            }

            if ( ! function_exists( 'simplexml_load_string' ) ) {
                return new \WP_Error(
                    'b_slider_yt_no_simplexml',
                    __( 'This site is missing PHP’s SimpleXML extension, which is needed to read a YouTube feed.', 'b-slider' )
                );
            }

            // The document always comes from youtube.com and never from user input, but LIBXML_NONET
            // is passed anyway so no document can ever make this fetch something of its own.
            // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- A malformed feed returns false, which is handled on the next line; the warning it also raises is not news.
            $feed = @simplexml_load_string( $body, 'SimpleXMLElement', LIBXML_NOCDATA | LIBXML_NONET );

            if ( false === $feed ) {
                return new \WP_Error( 'b_slider_yt_unparsable', __( 'The YouTube feed could not be read.', 'b-slider' ) );
            }

            $items = [];

            foreach ( $feed->children( self::ATOM_NS )->entry as $entry ) {
                if ( count( $items ) >= $limit ) {
                    break;
                }

                $yt       = $entry->children( self::YT_NS );
                $media    = $entry->children( self::MEDIA_NS );
                $group    = isset( $media->group ) ? $media->group : null;
                $video_id = trim( (string) $yt->videoId );

                // Every entry in this feed is a video. One without an ID is not something to guess
                // about — there is nothing to link to and no thumbnail to build.
                if ( ! preg_match( '/^[\w-]{11}$/', $video_id ) ) {
                    continue;
                }

                $items[] = self::makeItem( [
                    'video_id'    => $video_id,
                    'title'       => (string) $entry->title,
                    'description' => $group ? (string) $group->description : '',
                    'published'   => trim( (string) $entry->published ),
                    'updated'     => trim( (string) $entry->updated ),
                    'author'      => (string) $entry->author->name,
                    'author_link' => (string) $entry->author->uri,
                    'feed_thumb'  => ( $group && isset( $group->thumbnail ) ) ? (string) $group->thumbnail->attributes()->url : '',
                    'views'       => ( $group && isset( $group->community->statistics ) )
                        ? (int) $group->community->statistics->attributes()->views
                        : 0,
                    'privacy'     => 'public',
                ], $date_format, $excerpt_length );
            }

            return $items;
        }

        /* -------------------------------------------------------------------------- */
        /* The Data API                                                               */
        /* -------------------------------------------------------------------------- */

        /**
         * The same videos through `playlistItems`, plus each one's length and view count.
         *
         * A channel is read as its uploads playlist: `UU` + the channel ID's tail. That is what
         * keeps this at 1 quota unit instead of the 100 `search.list` charges.
         *
         * @return array|\WP_Error
         */
        private static function fromApi( $resolved, $limit, $date_format, $excerpt_length = 25 ) {
            $playlist_id = 'playlist' === $resolved['resource']
                ? $resolved['id']
                : 'UU' . substr( $resolved['id'], 2 );

            $entries    = [];
            $page_token = '';

            /* One deadline for the whole fetch, paging and details together, rather than one each.
               What has to be bounded is the time this request spends on YouTube in total — half a
               budget spent on pages leaves half for details, which is the trade the caller wants
               made silently. See `FETCH_TIME_BUDGET`. */
            $deadline = microtime( true ) + self::FETCH_TIME_BUDGET;

            // One page per 50 videos asked for. The loop stops on the count, on running out of
            // pages, on the ceiling, or on the deadline — never on the token alone, since a channel
            // with thousands of uploads would otherwise walk all of them.
            do {
                $query = [
                    'part'       => 'snippet,contentDetails,status',
                    'playlistId' => $playlist_id,
                    'maxResults' => min( $limit - count( $entries ), self::API_PAGE_SIZE ),
                ];

                if ( '' !== $page_token ) {
                    $query['pageToken'] = $page_token;
                }

                $body = self::apiGet( 'playlistItems', $query );

                if ( is_wp_error( $body ) ) {
                    // A later page failing is not worth throwing away the videos already collected;
                    // only failing on the first one means there is nothing to show.
                    return $entries ? self::withDetails( $entries, $limit, $date_format, $excerpt_length, $deadline ) : $body;
                }

                foreach ( (array) ( $body['items'] ?? [] ) as $entry ) {
                    $shaped = self::shapeApiEntry( $entry );

                    if ( ! $shaped ) {
                        continue;
                    }

                    $entries[ $shaped['video_id'] ] = $shaped;

                    if ( count( $entries ) >= $limit ) {
                        break;
                    }
                }

                $page_token = (string) ( $body['nextPageToken'] ?? '' );
            } while ( '' !== $page_token && count( $entries ) < $limit && microtime( true ) < $deadline );

            if ( ! $entries ) {
                return [];
            }

            return self::withDetails( $entries, $limit, $date_format, $excerpt_length, $deadline );
        }

        private static function shapeApiEntry( $entry ) {
            $snippet  = $entry['snippet'] ?? [];
            $video_id = $entry['contentDetails']['videoId'] ?? ( $snippet['resourceId']['videoId'] ?? '' );

            if ( ! preg_match( '/^[\w-]{11}$/', (string) $video_id ) ) {
                return null;
            }

            // A playlist keeps entries for videos that have since been made private or removed; they
            // come back titled "Private video" with no thumbnail to show.
            if ( empty( $snippet['thumbnails'] ) ) {
                return null;
            }

            $owner_id  = $snippet['videoOwnerChannelId'] ?? ( $snippet['channelId'] ?? '' );
            // The playlist records when the video was *added*; for an uploads playlist that is the
            // upload date, but for a hand-made playlist it is not.
            $published = (string) ( $entry['contentDetails']['videoPublishedAt'] ?? ( $snippet['publishedAt'] ?? '' ) );

            $status    = $entry['status'] ?? [];
            $privacy   = $status['privacyStatus'] ?? 'public';

            return [
                'video_id'    => $video_id,
                'title'       => (string) ( $snippet['title'] ?? '' ),
                'description' => (string) ( $snippet['description'] ?? '' ),
                'published'   => $published,
                'updated'     => $published,
                'author'      => (string) ( $snippet['videoOwnerChannelTitle'] ?? ( $snippet['channelTitle'] ?? '' ) ),
                'author_link' => $owner_id ? 'https://www.youtube.com/channel/' . $owner_id : '',
                'feed_thumb'  => self::bestApiThumb( $snippet['thumbnails'] ),
                'views'       => 0,
                'privacy'     => $privacy,
            ];
        }

        private static function withDetails( $entries, $limit, $date_format, $excerpt_length, $deadline = null ) {
            $entries = array_slice( $entries, 0, $limit, true );
            $details = self::apiDetails( array_keys( $entries ), $deadline );
            $items   = [];

            foreach ( $entries as $video_id => $entry ) {
                $detail = $details[ $video_id ] ?? [];

                $entry['views'] = (int) ( $detail['statistics']['viewCount'] ?? 0 );
                $entry['privacy'] = (string) ( $detail['status']['privacyStatus'] ?? 'public' );
                $duration       = (string) ( $detail['contentDetails']['duration'] ?? '' );
                $items[]        = self::makeItem( $entry, $date_format, $excerpt_length, $duration );
            }

            return $items;
        }

        /**
         * View counts and durations, keyed by video ID.
         *
         * `videos.list` takes 50 IDs at a time, so this is one more unit per 50 videos. A failure is
         * not worth losing the videos over — the details are simply left off.
         */
        private static function apiDetails( $video_ids, $deadline = null ) {
            $details = [];

            foreach ( array_chunk( $video_ids, self::API_PAGE_SIZE ) as $chunk ) {
                /* Out of time. The videos already described keep their length and view count and the
                   rest go without — `withDetails` reads a missing entry as zero, so a slide still
                   draws, it just has no duration to show. Losing the tail of the metadata is a much
                   smaller thing than losing the request. */
                if ( null !== $deadline && microtime( true ) >= $deadline ) {
                    break;
                }

                $body = self::apiGet( 'videos', [
                    'part' => 'statistics,contentDetails,status',
                    'id'   => implode( ',', $chunk ),
                ] );

                if ( is_wp_error( $body ) ) {
                    continue;
                }

                foreach ( (array) ( $body['items'] ?? [] ) as $item ) {
                    if ( ! empty( $item['id'] ) ) {
                        $details[ $item['id'] ] = $item;
                    }
                }
            }

            return $details;
        }

        private static function bestApiThumb( $thumbnails ) {
            foreach ( [ 'maxres', 'standard', 'high', 'medium', 'default' ] as $size ) {
                if ( ! empty( $thumbnails[ $size ]['url'] ) ) {
                    return (string) $thumbnails[ $size ]['url'];
                }
            }

            return '';
        }

        /**
         * A Data API call.
         *
         * Unlike `get()` this reads the body even on a non-200, because that is where the API puts
         * the one useful sentence — "API key not valid", "quota exceeded" — and passing that back is
         * the difference between a fixable problem and a mystery.
         *
         * @return array|\WP_Error
         */
        private static function apiGet( $endpoint, $query ) {
            $headers = [];
            $use_oauth = false;

            if ( ! empty( self::$current_refresh_token ) ) {
                $access_token = self::getAccessTokenFromRefreshToken( self::$current_refresh_token );
                if ( ! is_wp_error( $access_token ) ) {
                    $headers['Authorization'] = 'Bearer ' . $access_token;
                    $use_oauth = true;
                }
            }

            if ( ! $use_oauth ) {
                $api_key = SocialFeed::apiKey();

                if ( '' === $api_key ) {
                    if ( ! empty( self::$current_refresh_token ) ) {
                        return self::getAccessTokenFromRefreshToken( self::$current_refresh_token );
                    }
                    return new \WP_Error( 'b_slider_yt_no_key', __( 'No YouTube API key is set.', 'b-slider' ) );
                }

                $query['key'] = $api_key;
            }

            $response = wp_remote_get( add_query_arg( $query, self::API_BASE . $endpoint ), [
                'headers' => $headers,
                'timeout' => self::TIMEOUT,
            ] );

            if ( is_wp_error( $response ) ) {
                return $response;
            }

            $body = json_decode( (string) wp_remote_retrieve_body( $response ), true );

            if ( ! is_array( $body ) ) {
                return new \WP_Error( 'b_slider_yt_api_unreadable', __( 'The YouTube API returned something unreadable.', 'b-slider' ) );
            }

            if ( ! empty( $body['error'] ) ) {
                return new \WP_Error(
                    'b_slider_yt_api_error',
                    (string) ( $body['error']['message'] ?? __( 'The YouTube API refused the request.', 'b-slider' ) )
                );
            }

            return $body;
        }

        /* -------------------------------------------------------------------------- */
        /* Shared shaping                                                             */
        /* -------------------------------------------------------------------------- */

        /**
         * One video, as a slider item.
         *
         * The keys mirror `Posts::arrangedPosts()` exactly — that is the whole point of the feed
         * sources. Every layout, indicator and thumbnail strip already reads a post in that shape,
         * so a video arriving in it renders through the components that are already there.
         */
        private static function makeItem( $entry, $date_format, $excerpt_length = 25, $duration_iso = '' ) {
            $video_id = $entry['video_id'];
            $title    = trim( wp_strip_all_tags( (string) $entry['title'] ) );

            // Straight through the filter the post sources use, which strips the description to
            // plain text. Slide captions are written into the DOM as HTML, and this text came off
            // the open internet.
            $description = Posts::applyBSBFilter( (string) $entry['description'] );

            // Cut here as well as in the browser, the way the post sources do it. Every item is
            // printed into the page, and a YouTube description is often a wall of timestamps and
            // affiliate links that no layout will ever show — bytes every visitor downloads for
            // nothing. `-1` is the block's "show all", so it is left whole.
            //
            // One word past the limit, not exactly the limit: Excerpt.js decides whether to add its
            // ellipsis by asking whether the text is longer than the limit, so trimming to exactly
            // it would silently drop the "…" from every caption.
            if ( $excerpt_length > -1 ) {
                $description = wp_trim_words( $description, $excerpt_length + 1, '' );
            }

            $published = (string) $entry['published'];

            return [
                'id'        => $video_id,
                'link'      => 'https://www.youtube.com/watch?v=' . $video_id,
                'name'      => $video_id,
                'thumbnail' => [
                    'url' => self::thumbUrl( $video_id, self::$current_quality ),
                    'alt' => $title,
                    // `maxresdefault` exists only for a video that got an HD render, so the file
                    // YouTube named itself is carried along and the browser swaps to it when the
                    // first choice 404s. See the `onError` in PostItem.
                    'fallback' => esc_url_raw( (string) $entry['feed_thumb'] ) ?: self::thumbUrl( $video_id, 'hqdefault' ),
                    'srcset'   => self::srcset( $video_id ),
                    // A slide is as wide as the slider, and a slider is nearly always the full width
                    // of its container. An import replaces this with the real sizes once the
                    // picture is stored on this site.
                    'sizes'    => '(max-width: 782px) 100vw, 1280px',
                ],
                'title'   => esc_html( $title ),
                'content' => $description,
                'excerpt' => $description,
                'author'  => [
                    'name' => trim( wp_strip_all_tags( (string) $entry['author'] ) ),
                    'link' => esc_url_raw( trim( (string) $entry['author_link'] ) ),
                ],
                'date'            => $published ? date_i18n( $date_format ?: 'M j, Y', strtotime( $published ) ) : '',
                // The machine-readable stamp — see the note in `JsonFeed`.
                'dateISO'         => $published ? gmdate( 'c', strtotime( $published ) ) : '',
                'dateGMT'         => $published,
                'modifiedDate'    => (string) $entry['updated'],
                'modifiedDateGMT' => (string) $entry['updated'],
                // A video has none of these. They are written out rather than left off, because
                // every layout reads a post as the shape `arrangedPosts()` returns.
                'commentCount'  => 0,
                'commentStatus' => 'closed',
                'categories'    => [ 'coma' => '', 'space' => '' ],
                'taxonomies'    => [],
                'acf_fields'    => [],
                'readTime'      => [ 'min' => 0, 'sec' => 0 ],
                'status'        => 'publish',
                // Feed-only extras. Nothing renders them yet; they are what a template filter or a
                // later layout reaches for, and they cost nothing to carry. `duration` is only ever
                // filled in on the API path — the public feed does not carry it.
                'videoId'  => $video_id,
                'views'    => (int) $entry['views'],
                'duration' => self::formatDuration( $duration_iso ),
                // The same length as schema.org wants it. Kept beside the readable one rather than
                // converted back later, because `4:13` cannot say whether it means minutes or hours.
                'durationISO' => $duration_iso,
                'privacy'     => (string) ( $entry['privacy'] ?? 'public' ),
            ];
        }

        /**
         * The widths YouTube publishes the video's own 16:9 frame at.
         *
         * `hqdefault` and `sddefault` are left out on purpose: they are 4:3 and letterbox a
         * widescreen video, and a `srcset` whose candidates have different shapes makes the browser
         * pick one that does not match the space reserved for it.
         */
        const SRCSET_WIDTHS = [ 'mqdefault' => 320, 'maxresdefault' => 1280 ];

        /**
         * A `srcset` for a video's thumbnail, straight off the service.
         *
         * Worth having even before anything is imported: a phone showing a 320px slide would otherwise
         * download the full 1280px frame.
         *
         * Two things this used to claim, and both were wrong — the second of them was a live bug for as
         * long as the comment stood.
         *
         * A candidate that 404s is **not** quietly skipped in favour of another, and the browser does
         * **not** then fall back to `src`. It fires an error on the element, and that is all. So the
         * `onError` handler is the only thing that saves a video with no `maxresdefault`, and for it to
         * work it has to strip this attribute before touching `src`: while a `srcset` is present the
         * browser selects from it and never consults `src` at all. See the handler in `PostItem.js`.
         *
         * That same rule is what retired the slider's image-size setting. Whatever it was set to, this is
         * what a visitor was actually sent, so the only thing it decided was which file the import kept —
         * and there the answer is always the largest, since WordPress makes its own smaller copies from
         * whatever is stored. A setting whose every other value was worse is one less thing to explain.
         */
        private static function srcset( $video_id ) {
            $set = [];
            $quality_widths = [
                'default'        => 120,
                'mqdefault'      => 320,
                'hqdefault'      => 480,
                'sddefault'      => 640,
                'maxresdefault'  => 1280,
            ];

            $max_width = $quality_widths[ self::$current_quality ] ?? 1280;

            foreach ( $quality_widths as $quality => $width ) {
                if ( $width <= $max_width ) {
                    $set[] = self::thumbUrl( $video_id, $quality ) . ' ' . $width . 'w';
                }
            }

            return implode( ', ', $set );
        }

        /** One of the thumbnail files YouTube generates for a video. */
        public static function thumbUrl( $video_id, $quality ) {
            $quality = in_array( $quality, self::THUMB_QUALITIES, true ) ? $quality : 'maxresdefault';

            return sprintf( 'https://i.ytimg.com/vi/%s/%s.jpg', $video_id, $quality );
        }

        /**
         * An ISO 8601 duration — `PT4M13S` — as a number of seconds. `0` when there is none.
         *
         * The day part used to be matched and then thrown away: the pattern read `(?:\d+D)?`, with no
         * group to capture it, so a 25-hour livestream archive came out as one hour. Rare, but the
         * kind of wrong that is invisible until somebody points at a video and asks.
         *
         * Its own method because the store needs the number, not the readable form — it stores the
         * length as a meta so a Shorts filter can compare on it. Deriving that by parsing the string
         * this used to return worked until exactly the case above, where the hours had already been
         * lost. One parser, two callers.
         */
        public static function durationSeconds( $duration ) {
            if ( ! $duration || ! preg_match( '/^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/', (string) $duration, $m ) ) {
                return 0;
            }

            return ( (int) ( $m[1] ?? 0 ) ) * DAY_IN_SECONDS
                + ( (int) ( $m[2] ?? 0 ) ) * HOUR_IN_SECONDS
                + ( (int) ( $m[3] ?? 0 ) ) * MINUTE_IN_SECONDS
                + ( (int) ( $m[4] ?? 0 ) );
        }

        /** An ISO 8601 duration — `PT4M13S` — as `4:13`, or `1:02:03` past the hour. */
        public static function formatDuration( $duration ) {
            $seconds = self::durationSeconds( $duration );

            if ( $seconds <= 0 ) {
                return '';
            }

            return $seconds >= HOUR_IN_SECONDS
                ? sprintf( '%d:%02d:%02d', floor( $seconds / HOUR_IN_SECONDS ), floor( ( $seconds % HOUR_IN_SECONDS ) / MINUTE_IN_SECONDS ), $seconds % MINUTE_IN_SECONDS )
                : sprintf( '%d:%02d', floor( $seconds / MINUTE_IN_SECONDS ), $seconds % MINUTE_IN_SECONDS );
        }

        /** Statuses worth trying again. See the note in `get()`. */
        const RETRY_CODES = [ 404, 429, 500, 502, 503, 504 ];

        /**
         * How many times one address is asked for, and how long to wait between tries.
         *
         * `feeds/videos.xml` sheds load by answering 404 — not 429, and not 503 — to requests it is
         * perfectly able to serve. Measured over 8 spaced requests to two channels: a channel with
         * millions of subscribers answered 6 times, a small one twice. Both returned the same 15
         * entries whenever they did answer, so the failures are the endpoint's and not the feed's.
         *
         * Three tries turn a one-in-four chance into somewhat better than one in two, which is worth
         * the two seconds it costs on the failure path and nothing at all on the happy one. It is not
         * a fix — an API key is the fix — but it is the difference between a slider that usually
         * fills on the first try and one that usually does not.
         */
        const MAX_ATTEMPTS = 3;
        const RETRY_WAITS  = [ 500000, 1500000 ];

        /**
         * A GET whose body is worth reading.
         *
         * @param int $attempt Which try this is. Callers pass nothing.
         * @return string|\WP_Error
         */
        private static function get( $url, $attempt = 1 ) {
            $response = wp_remote_get( $url, [
                'timeout' => self::TIMEOUT,
                // YouTube serves a channel page differently to a client it cannot place, and the
                // channel ID this looks for is missing from some of those variants.
                'user-agent' => 'Mozilla/5.0 (compatible; bSlider; +' . home_url( '/' ) . ')',
                'headers'    => [ 'Accept-Language' => 'en-US,en;q=0.9' ],
            ] );

            if ( is_wp_error( $response ) ) {
                return $response;
            }

            $code = (int) wp_remote_retrieve_response_code( $response );

            if ( 200 !== $code ) {
                if ( $attempt < self::MAX_ATTEMPTS && in_array( $code, self::RETRY_CODES, true ) ) {
                    usleep( self::RETRY_WAITS[ $attempt - 1 ] ?? 1500000 );

                    return self::get( $url, $attempt + 1 );
                }

                return new \WP_Error(
                    404 === $code ? 'b_slider_yt_not_found' : 'b_slider_yt_http',
                    404 === $code
                        ? __( 'YouTube has nothing at that address — check the channel or playlist. (Note: YouTube’s public RSS feeds are often down or blocked. For a 100% reliable connection, please add a YouTube API Key in bSlider Settings.)', 'b-slider' )
                        : sprintf(
                            /* translators: %d: HTTP status code, e.g. 503 */
                            __( 'YouTube answered with HTTP %d.', 'b-slider' ),
                            $code
                        )
                );
            }
            $body = (string) wp_remote_retrieve_body( $response );

            return '' !== trim( $body )
                ? $body
                : new \WP_Error( 'b_slider_yt_empty_body', __( 'YouTube returned an empty response.', 'b-slider' ) );
        }

        /**
         * A single YouTube video, resolved and formatted as a slider item.
         */
        public static function single_video( $source, $date_format = 'M j, Y' ) {
            $video_id = self::extractVideoId( $source );
            if ( ! $video_id ) {
                return new \WP_Error( 'b_slider_invalid_video_url', __( 'Please enter a valid YouTube video URL.', 'b-slider' ) );
            }

            $api_key = SocialFeed::apiKey();
            $entry = null;

            if ( $api_key ) {
                $url = self::API_BASE . 'videos?part=snippet,contentDetails,statistics&id=' . $video_id . '&key=' . $api_key;
                $res = wp_remote_get( $url, [ 'timeout' => self::TIMEOUT ] );
                if ( ! is_wp_error( $res ) && 200 === wp_remote_retrieve_response_code( $res ) ) {
                    $body = json_decode( wp_remote_retrieve_body( $res ), true );
                    if ( ! empty( $body['items'] ) ) {
                        $item = $body['items'][0];
                        $snippet = $item['snippet'] ?? [];
                        $content_details = $item['contentDetails'] ?? [];
                        $statistics = $item['statistics'] ?? [];

                        $entry = [
                            'video_id' => $video_id,
                            'title' => $snippet['title'] ?? '',
                            'description' => $snippet['description'] ?? '',
                            'published' => $snippet['publishedAt'] ?? '',
                            'updated' => $snippet['publishedAt'] ?? '',
                            'author' => $snippet['channelTitle'] ?? '',
                            'author_link' => 'https://www.youtube.com/channel/' . ($snippet['channelId'] ?? ''),
                            'feed_thumb' => $snippet['thumbnails']['maxresdefault']['url'] ?? ($snippet['thumbnails']['high']['url'] ?? ''),
                            'views' => $statistics['viewCount'] ?? 0,
                            'duration_iso' => $content_details['duration'] ?? '',
                        ];
                    }
                }
            }

            if ( ! $entry ) {
                $entry = [
                    'video_id' => $video_id,
                    'title' => __( 'YouTube Video', 'b-slider' ),
                    'description' => '',
                    'published' => gmdate( 'c' ),
                    'updated' => gmdate( 'c' ),
                    'author' => '',
                    'author_link' => '',
                    'feed_thumb' => '',
                    'views' => 0,
                    'duration_iso' => '',
                ];
            }

            return [
                self::makeItem( $entry, $date_format, -1, $entry['duration_iso'] )
            ];
        }

        private static function extractVideoId( $source ) {
            $source = trim( $source );
            if ( strlen( $source ) === 11 ) {
                return $source;
            }

            $regExp = '/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/';
            preg_match( $regExp, $source, $matches );
            return ( isset( $matches[2] ) && strlen( $matches[2] ) === 11 ) ? $matches[2] : '';
        }

        public static function fetchPlaylists( $source ) {
            $source = trim( (string) $source );
            if ( '' === $source ) {
                return [];
            }

            $resolved = self::resolve( $source );
            if ( is_wp_error( $resolved ) ) {
                return $resolved;
            }

            if ( 'channel' !== $resolved['resource'] ) {
                return [];
            }

            $channel_id = $resolved['id'];

            if ( ! self::hasApiKey() ) {
                return new \WP_Error(
                    'b_slider_yt_playlists_needs_key',
                    __( 'Fetching playlists requires a YouTube API key. Add one under Connection settings.', 'b-slider' )
                );
            }

            $cache_key = self::playlistsKey( $channel_id );
            $playlists = get_transient( $cache_key );

            if ( is_array( $playlists ) ) {
                return $playlists;
            }

            $body = self::apiGet( 'playlists', [
                'part'       => 'snippet',
                'channelId'  => $channel_id,
                'maxResults' => 50,
            ] );

            if ( is_wp_error( $body ) ) {
                return $body;
            }

            $playlists = [];
            foreach ( (array) ( $body['items'] ?? [] ) as $item ) {
                $playlists[] = [
                    'id'    => (string) ( $item['id'] ?? '' ),
                    'title' => (string) ( $item['snippet']['title'] ?? '' ),
                ];
            }

            set_transient( $cache_key, $playlists, HOUR_IN_SECONDS );

            return $playlists;
        }
    }
}
