<?php

namespace B_SLIDER;

if ( ! defined( 'ABSPATH' ) ) exit;

if ( ! class_exists( __NAMESPACE__ . '\SocialFeed' ) ) {
    /**
     * The slider's fifth content source: an external feed.
     *
     * One class in front of the per-service readers, holding the three things they all need —
     * the cache, the sanitizing of what the block saved, and the editor's preview route. A new
     * service is a reader of its own plus one line in `FEED_TYPES` and one in `fetchFresh()`.
     *
     * Everything a reader returns is shaped like `Posts::arrangedPosts()`, so a feed renders
     * through the layouts, indicators and thumbnail strips that already exist.
     */
    class SocialFeed {

        /**
         * The feed types a slider can be built from.
         *
         * Instagram is absent: it is Premium, and the reader that talks to the Graph API does not
         * ship here. A block saved on a licensed site and opened on this one falls through to the
         * unknown-type error rather than reaching for a class that is not present.
         */
        const FEED_TYPES = [ 'youtube', 'youtube_video', 'rss', 'json' ];

        /**
         * The feed types with an account, a channel or a publication standing behind them.
         *
         * What decides whether a slider gets a Profile Header and a follow button at all — the panel
         * is not offered for the rest, and `profileFor()` answers them with nothing.
         *
         * `youtube_video` is out because a single video is not a channel: the slider is one clip
         * somebody embedded, and a "Subscribe" card over it is an invitation the block was never
         * asked to make. `json` is out because an arbitrary JSON document describes no publisher —
         * there is nothing to read a name or a picture out of.
         */
        const PROFILE_TYPES = [ 'youtube', 'rss' ];

        /** How long a fetched feed is kept, when nothing else says otherwise. */
        const CACHE_TTL = 6 * HOUR_IN_SECONDS;

        /** The window a Pro licence may pick from. */
        const MIN_TTL = 5 * MINUTE_IN_SECONDS;
        const MAX_TTL = WEEK_IN_SECONDS;

        /**
         * How long a failure is kept.
         *
         * A channel that 404s, or a network that is down, should not be asked again on every page
         * load — but it should also recover on its own within a few minutes of being fixed, which
         * is why a failure is cached briefly rather than not at all.
         */
        const ERROR_TTL = 5 * MINUTE_IN_SECONDS;

        /**
         * How long a copy is kept past the moment it stops being fresh.
         *
         * Going stale is not the same as being thrown away. The stale copy is what everybody is
         * served while one process refreshes, and what keeps serving if that refresh fails.
         */
        const STALE_TTL = WEEK_IN_SECONDS;

        /**
         * How long one refresh may hold the right to run.
         *
         * A request that dies mid-fetch — a timeout, a fatal — leaves its lock behind. After this
         * the lock is stealable, or that feed would never refresh again.
         */
        const LOCK_TTL = 60;

        /** Where this site's YouTube Data API key is kept. */
        const API_KEY_OPTION = 'b_slider_youtube_api_key';

        /** Bumped whenever the key changes, which retires every cached feed at once. */
        const CACHE_VERSION_OPTION = 'b_slider_social_cache_version';

        /** Which feeds have a last-good copy kept, oldest first. See `remember()`. */
        const KEEPSAKE_INDEX = 'b_slider_social_keepsakes';

        /**
         * How many last-good copies a site keeps.
         *
         * A ceiling rather than a target. Each is a feed's whole pool — up to a couple of hundred
         * items — and a site with twenty sliders that have each been reconfigured a few times would
         * otherwise leave a row behind for every combination anybody ever tried.
         */
        const KEEPSAKE_MAX = 20;

        /**
         * The option `video-gallery-for-youtube` keeps its key in.
         *
         * A site running that plugin has already been through the Google Cloud Console, so its key
         * is borrowed rather than asked for a second time. Read only — this never writes there.
         */
        const SHARED_KEY_OPTION = 'ytvgb-video-gallery';

        public function __construct() {
            add_action( 'rest_api_init', [ $this, 'register_routes' ] );
        }

        public function register_routes() {
            register_rest_route( 'bsb/v1', '/social-feed', [
                'methods'             => 'GET',
                'callback'            => [ $this, 'get_feed' ],
                'permission_callback' => [ __CLASS__, 'can_edit' ],
            ] );

            /**
             * One page of a feed a visitor is already looking at.
             *
             * **The only route here that is public, and the only one that accepts no address.** That
             * pairing is the whole of its security. A feed slider's items used to be printed into the
             * page in full — every one of them, whether the visitor ever paged to it — which is what
             * put a ceiling on how many videos a slider could hold: measured against a real channel,
             * an item costs about 1.4 KB of JSON, so a thousand of them is 1.4 MB downloaded before
             * anything appears. Paging over here instead means the page carries one page.
             *
             * A public route that took a feed URL would be an open proxy: anybody could make this site
             * fetch any address they named, and spend its API quota doing it. So this one takes a
             * `handle` — an opaque key the server itself printed into the page — looks the query up
             * behind it, and reads from the cache that query already filled. Nothing a caller sends
             * can name a destination, and no call here can start a fetch.
             *
             * `__return_true` because the answer is already public: it is a slice of the same list the
             * page is showing to everyone who loads it.
             */
            register_rest_route( 'bsb/v1', '/feed-page', [
                'methods'             => 'GET',
                'callback'            => [ $this, 'get_feed_page' ],
                'permission_callback' => '__return_true',
                'args'                => [
                    'handle'   => [ 'required' => true, 'type' => 'string' ],
                    'page'     => [ 'type' => 'integer', 'default' => 1 ],
                    'per_page' => [ 'type' => 'integer', 'default' => 12 ],
                ],
            ] );

            register_rest_route( 'bsb/v1', '/feed-channels', [
                [
                    'methods'             => 'GET',
                    'callback'            => [ $this, 'get_channels' ],
                    // Reading the library is what the block's picker does, so any author may.
                    'permission_callback' => [ __CLASS__, 'can_edit' ],
                ],
                [
                    'methods'             => 'POST',
                    'callback'            => [ $this, 'save_channel' ],
                    // Adding one from the block panel is part of building a slider, not administration.
                    'permission_callback' => [ __CLASS__, 'can_edit' ],
                ],
                [
                    'methods'             => 'DELETE',
                    'callback'            => [ $this, 'delete_channel' ],
                    'permission_callback' => [ __CLASS__, 'can_edit' ],
                ],
            ] );

            register_rest_route( 'bsb/v1', '/feed-profile', [
                'methods'             => 'GET',
                'callback'            => [ $this, 'get_feed_profile' ],
                // Reads an account this site has already connected, or the address the block is
                // already fetching a feed from, and answers with what both show the public.
                // Building a slider is what this is for.
                'permission_callback' => [ __CLASS__, 'can_edit' ],
            ] );

            register_rest_route( 'bsb/v1', '/youtube-key', [
                [
                    'methods'             => 'GET',
                    'callback'            => [ $this, 'get_key' ],
                    'permission_callback' => [ __CLASS__, 'can_edit' ],
                ],
                [
                    'methods'             => 'POST',
                    'callback'            => [ $this, 'save_key' ],
                    // Writing a site-wide credential is not something every author may do, unlike
                    // building a slider with one.
                    'permission_callback' => [ __CLASS__, 'can_manage' ],
                ],
            ] );

            register_rest_route( 'bsb/v1', '/youtube-oauth', [
                [
                    'methods'             => 'GET',
                    'callback'            => [ $this, 'get_oauth_creds' ],
                    'permission_callback' => [ __CLASS__, 'can_edit' ],
                ],
                [
                    'methods'             => 'POST',
                    'callback'            => [ $this, 'save_oauth_creds' ],
                    'permission_callback' => [ __CLASS__, 'can_manage' ],
                ],
            ] );

            register_rest_route( 'bsb/v1', '/youtube-playlists', [
                'methods'             => 'GET',
                'callback'            => [ $this, 'get_playlists' ],
                'permission_callback' => [ __CLASS__, 'can_edit' ],
            ] );
        }

        public static function can_edit() {
            return current_user_can( 'edit_posts' );
        }

        public static function can_manage() {
            return current_user_can( 'manage_options' );
        }

        public static function postProcessItems( $items, $normalizedQuery ) {
            $filtered = [];

            // 1. Keyword & Exclude Keyword Filters, & Age Limit
            $keyword_filter = isset( $normalizedQuery['keywordFilter'] ) ? trim( (string) $normalizedQuery['keywordFilter'] ) : '';
            $exclude_filter = isset( $normalizedQuery['excludeKeywordFilter'] ) ? trim( (string) $normalizedQuery['excludeKeywordFilter'] ) : '';
            $age_limit = isset( $normalizedQuery['feedAgeLimit'] ) ? (int) $normalizedQuery['feedAgeLimit'] : 0;
            if ( ! b_slider_is_premium() ) {
                $age_limit = 0;
                $keyword_filter = '';
                $exclude_filter = '';
            }

            $keywords = [];
            if ( ! empty( $keyword_filter ) ) {
                $keywords = array_filter( array_map( 'trim', explode( ',', strtolower( $keyword_filter ) ) ) );
            }

            $exclude_keywords = [];
            if ( ! empty( $exclude_filter ) ) {
                $exclude_keywords = array_filter( array_map( 'trim', explode( ',', strtolower( $exclude_filter ) ) ) );
            }

            $now = time();

            foreach ( (array) $items as $item ) {
                // A. Check Age Limit
                $date_to_parse = isset( $item['dateGMT'] ) && ! empty( $item['dateGMT'] ) ? $item['dateGMT'] : ( isset( $item['date'] ) ? $item['date'] : '' );
                if ( $age_limit > 0 && ! empty( $date_to_parse ) ) {
                    $item_time = strtotime( $date_to_parse );
                    if ( $item_time ) {
                        $age_seconds = $now - $item_time;
                        $limit_seconds = $age_limit * 24 * 60 * 60;
                        if ( $age_seconds > $limit_seconds ) {
                            continue;
                        }
                    }
                }

                $title_lower = isset( $item['title'] ) ? strtolower( $item['title'] ) : '';
                $content_lower = isset( $item['content'] ) ? strtolower( $item['content'] ) : '';

                // B. Check Exclude Keywords
                if ( ! empty( $exclude_keywords ) ) {
                    $exclude_match = false;
                    foreach ( $exclude_keywords as $ex_kw ) {
                        if ( false !== strpos( $title_lower, $ex_kw ) || false !== strpos( $content_lower, $ex_kw ) ) {
                            $exclude_match = true;
                            break;
                        }
                    }
                    if ( $exclude_match ) {
                        continue;
                    }
                }

                // C. Check Include Keywords (Filter by Keywords)
                if ( ! empty( $keywords ) ) {
                    $keyword_match = false;
                    foreach ( $keywords as $kw ) {
                        if ( false !== strpos( $title_lower, $kw ) || false !== strpos( $content_lower, $kw ) ) {
                            $keyword_match = true;
                            break;
                        }
                    }
                    if ( ! $keyword_match ) {
                        continue;
                    }
                }

                $filtered[] = $item;
            }

            /**
             * 2. Sorting
             *
             * **A YouTube channel does not come through here, and that is the fix rather than a
             * special case.** Its order is decided when it is fetched, by "Which videos": `popular`
             * arrives sorted by view count and `oldest` arrives sorted by date, both settled in
             * `YouTubeFeed::items()`. Sorting again here overwrote that. `feedOrderBy` defaults to
             * `date_desc`, so the default undid it — a slider set to Most viewed fetched the right
             * videos in the right order and then put the newest one at the front, which looked for
             * all the world like the setting not working.
             *
             * The control is gone from the panel for this feed type — see `SocialFiltering` — but
             * that alone would have fixed nothing. `feedOrderBy` is a saved attribute: every slider
             * built before this still carries `date_desc`, and this function reads what was saved,
             * not what the editor is currently willing to show. Ignoring it here is what repairs
             * those sliders, without anybody having to open one and change a setting.
             *
             * Random is the one order YouTube has no list for, so it is applied here — and here on
             * purpose. Shuffling during the fetch would put one shuffled order in the cache and
             * serve it to every visitor for the next six hours, which is not what Random means.
             * This runs after the cache is read, so each page load gets its own.
             *
             * Every other feed type is unchanged: the service returns one list and `feedOrderBy` is
             * the only say there is over it.
             */
            $feed_type = isset( $normalizedQuery['feedType'] ) ? (string) $normalizedQuery['feedType'] : '';

            if ( 'youtube' === $feed_type ) {
                if ( 'random' === ( isset( $normalizedQuery['videoSet'] ) ? $normalizedQuery['videoSet'] : '' ) ) {
                    shuffle( $filtered );
                }

                $order_by = '';
            } else {
                $order_by = isset( $normalizedQuery['feedOrderBy'] ) ? (string) $normalizedQuery['feedOrderBy'] : 'date_desc';
            }

            if ( 'date_asc' === $order_by ) {
                usort( $filtered, function( $a, $b ) {
                    $date_a = isset( $a['dateGMT'] ) && ! empty( $a['dateGMT'] ) ? $a['dateGMT'] : ( isset( $a['date'] ) ? $a['date'] : '' );
                    $date_b = isset( $b['dateGMT'] ) && ! empty( $b['dateGMT'] ) ? $b['dateGMT'] : ( isset( $b['date'] ) ? $b['date'] : '' );
                    $ta = ! empty( $date_a ) ? strtotime( $date_a ) : 0;
                    $tb = ! empty( $date_b ) ? strtotime( $date_b ) : 0;
                    return $ta <=> $tb;
                } );
            } elseif ( 'date_desc' === $order_by ) {
                usort( $filtered, function( $a, $b ) {
                    $date_a = isset( $a['dateGMT'] ) && ! empty( $a['dateGMT'] ) ? $a['dateGMT'] : ( isset( $a['date'] ) ? $a['date'] : '' );
                    $date_b = isset( $b['dateGMT'] ) && ! empty( $b['dateGMT'] ) ? $b['dateGMT'] : ( isset( $b['date'] ) ? $b['date'] : '' );
                    $ta = ! empty( $date_a ) ? strtotime( $date_a ) : 0;
                    $tb = ! empty( $date_b ) ? strtotime( $date_b ) : 0;
                    return $tb <=> $ta;
                } );
            } elseif ( 'random' === $order_by ) {
                shuffle( $filtered );
            }

            // 3. Offset and Limit
            $offset = isset( $normalizedQuery['feedOffset'] ) ? max( 0, (int) $normalizedQuery['feedOffset'] ) : 0;
            $per_page = isset( $normalizedQuery['per_page'] ) ? max( 1, (int) $normalizedQuery['per_page'] ) : 12;

            if ( $offset > 0 ) {
                $filtered = array_slice( $filtered, $offset );
            }

            $filtered = array_slice( $filtered, 0, $per_page );

            // 4. Title Truncation
            $title_length = isset( $normalizedQuery['titleLength'] ) ? (int) $normalizedQuery['titleLength'] : -1;
            if ( $title_length > -1 ) {
                foreach ( $filtered as &$item ) {
                    $title = html_entity_decode( wp_strip_all_tags( $item['title'] ), ENT_QUOTES, 'UTF-8' );
                    $item['title'] = esc_html( wp_trim_words( $title, $title_length, '...' ) );
                }
                unset($item);
            }

            return $filtered;
        }

        private static function requestQuery( \WP_REST_Request $request ) {
            return [
                'channelId'            => (string) $request->get_param( 'channelId' ),
                'feedType'             => (string) $request->get_param( 'feedType' ),
                'source'               => (string) $request->get_param( 'source' ),
                'per_page'             => $request->get_param( 'per_page' ),
                'videoSet'             => (string) $request->get_param( 'videoSet' ),
                'metaDateFormat'       => (string) $request->get_param( 'metaDateFormat' ),
                'cacheTime'            => $request->get_param( 'cacheTime' ),
                'linkTarget'           => (string) $request->get_param( 'linkTarget' ),
                'defaultImageUrl'      => (string) $request->get_param( 'defaultImageUrl' ),
                'titleLength'          => $request->get_param( 'titleLength' ),
                'keywordFilter'        => (string) $request->get_param( 'keywordFilter' ),
                'excludeKeywordFilter' => (string) $request->get_param( 'excludeKeywordFilter' ),
                'feedOrderBy'          => (string) $request->get_param( 'feedOrderBy' ),
                'feedOffset'           => $request->get_param( 'feedOffset' ),
                'feedAgeLimit'         => $request->get_param( 'feedAgeLimit' ),
                'selectedBadges'       => $request->get_param( 'selectedBadges' ),
                'badgeSettings'        => $request->get_param( 'badgeSettings' ),
                'badgeDisplayStyle'    => (string) $request->get_param( 'badgeDisplayStyle' ),
                'jsonRootKey'          => (string) $request->get_param( 'jsonRootKey' ),
                'jsonImageKey'         => (string) $request->get_param( 'jsonImageKey' ),
                'jsonTitleKey'         => (string) $request->get_param( 'jsonTitleKey' ),
                'jsonLinkKey'          => (string) $request->get_param( 'jsonLinkKey' ),
                'jsonExcerptKey'       => (string) $request->get_param( 'jsonExcerptKey' ),
                'jsonButtonTextKey'    => (string) $request->get_param( 'jsonButtonTextKey' ),
                'jsonDateKey'          => (string) $request->get_param( 'jsonDateKey' ),
                'jsonAuthorKey'        => (string) $request->get_param( 'jsonAuthorKey' ),
                'ytQueryType'          => (string) $request->get_param( 'ytQueryType' ),
                'ytSearchTerm'         => (string) $request->get_param( 'ytSearchTerm' ),
                'ytPlaylistId'         => (string) $request->get_param( 'ytPlaylistId' ),
                'ytThumbQuality'       => (string) $request->get_param( 'ytThumbQuality' ),
                'usePlyr'              => (bool) $request->get_param( 'usePlyr' ),
                'ytAutoplay'           => (bool) $request->get_param( 'ytAutoplay' ),
                'ytMute'               => (bool) $request->get_param( 'ytMute' ),
                'ytControls'           => (bool) $request->get_param( 'ytControls' ),
                'ytFullscreen'         => (bool) $request->get_param( 'ytFullscreen' ),
                'ytKeyboard'           => (bool) $request->get_param( 'ytKeyboard' ),
                'ytCaptions'           => (bool) $request->get_param( 'ytCaptions' ),
                'ytNoCookie'           => (bool) $request->get_param( 'ytNoCookie' ),
                'ytRel'                => (bool) $request->get_param( 'ytRel' ),
                'ytLazy'               => (bool) $request->get_param( 'ytLazy' ),
                'rssTimezoneOffset'    => (string) $request->get_param( 'rssTimezoneOffset' ),
                'rssTranslateDate'     => (string) $request->get_param( 'rssTranslateDate' ),
                'rssLocalTimezone'     => rest_sanitize_boolean( $request->get_param( 'rssLocalTimezone' ) ),
                'ytPrivacyStatus'      => (string) $request->get_param( 'ytPrivacyStatus' ),
                'ytRefreshToken'       => (string) $request->get_param( 'ytRefreshToken' ),
            ];
        }


        /**
         * The saved channels.
         *
         * The free build reads its feeds from the service every time, so there is no stored copy to
         * count and no slider-usage warning to give — both belong to the Storage screen, which is
         * Premium. What is left is the list itself, which is what the block's channel picker needs.
         */
        public function get_channels( \WP_REST_Request $request ) {
            // Initialised here rather than in the loop below: a site with nothing saved yet used to
            // answer with an undefined variable, and the picker reading it found no list at all.
            $channels = [];

            foreach ( FeedChannels::all() as $channel ) {
                // Masked on the way out — this route answers anybody who may edit a post.
                $channels[] = FeedChannels::forDisplay( $channel );
            }

            return rest_ensure_response( [
                'channels' => $channels,
                'error'    => '',
            ] );
        }


        /**
         * The account, channel or publication behind a feed.
         *
         * So the Profile Header fills itself in instead of asking somebody to retype the picture,
         * the name and the bio the service already holds.
         *
         * Answered from a saved channel where the block names one — Instagram in particular, whose
         * source *is* the token and is looked up on this side, the only side that has it. A slider
         * that carries a plain address instead is answered from that, since it is the same address
         * the feed is already being fetched from.
         *
         * A failure comes back on a 200, like the feed preview does — a panel offering to fetch a
         * profile wants to print "that token has expired", not to treat it as a broken request.
         */
        public function get_feed_profile( \WP_REST_Request $request ) {
            $channel = FeedChannels::get( (string) $request->get_param( 'channelId' ) );

            $feed_type = $channel ? (string) $channel['feedType'] : (string) $request->get_param( 'feedType' );
            $source    = $channel ? (string) $channel['source'] : trim( sanitize_text_field( (string) $request->get_param( 'source' ) ) );

            if ( ! self::hasProfile( $feed_type ) ) {
                return rest_ensure_response( [
                    'profile' => null,
                    'error'   => __( 'This feed type has no profile behind it.', 'b-slider' ),
                ] );
            }

            if ( '' === $source ) {
                return rest_ensure_response( [
                    'profile' => null,
                    'error'   => __( 'Pick a saved account, or paste the feed address first.', 'b-slider' ),
                ] );
            }

            $profile = self::readProfile( $feed_type, $source );

            if ( is_wp_error( $profile ) ) {
                return rest_ensure_response( [ 'profile' => null, 'error' => $profile->get_error_message() ] );
            }

            return rest_ensure_response( [ 'profile' => $profile, 'error' => '' ] );
        }

        public function get_playlists( \WP_REST_Request $request ) {
            $channel = FeedChannels::get( (string) $request->get_param( 'channelId' ) );
            $source  = $channel ? (string) $channel['source'] : trim( sanitize_text_field( (string) $request->get_param( 'source' ) ) );

            if ( '' === $source ) {
                return rest_ensure_response( [ 'playlists' => [], 'error' => __( 'Select a channel first.', 'b-slider' ) ] );
            }

            $playlists = YouTubeFeed::fetchPlaylists( $source );

            if ( is_wp_error( $playlists ) ) {
                return rest_ensure_response( [ 'playlists' => [], 'error' => $playlists->get_error_message() ] );
            }

            return rest_ensure_response( [ 'playlists' => $playlists, 'error' => '' ] );
        }

        /** Whether this kind of feed has anything standing behind it — see `PROFILE_TYPES`. */
        public static function hasProfile( $feed_type ) {
            return in_array( (string) $feed_type, self::PROFILE_TYPES, true );
        }

        /**
         * Ask one service who it is. No cache and no fallback — both belong to the caller.
         *
         * @param string $source The address the feed is read from, which for Instagram is its token.
         * @return array|\WP_Error
         */
        public static function readProfile( $feed_type, $source ) {
            switch ( $feed_type ) {
                case 'youtube':
                    return YouTubeFeed::profile( $source );

                case 'rss':
                    return RssFeed::profile( $source );
            }

            return new \WP_Error( 'b_slider_profile_unsupported', __( 'This feed type has no profile behind it.', 'b-slider' ) );
        }

        /**
         * The account behind a slider, cached the way its feed is.
         *
         * **Why this exists next to `get_feed_profile()`.** That one answers a panel that asked;
         * this one is read on every render, so it cannot go out to the service each time. Same
         * shape, same reader, one cached behind the slider's own `cacheTime` and the other not
         * cached at all.
         *
         * **Why a render reads it at all.** The header card and the follow button used to print what
         * somebody had typed into the block, so an account that changed its picture, its name or its
         * bio went on showing the old one until a human noticed and pressed a button. Read here they
         * follow the account, and what was typed into the block stays as an override — see `Layout`.
         *
         * Failure is silence. A slider whose token has expired should show its slides and no header,
         * not an error where a name should be — and there is a panel that says so properly.
         *
         * @return array The profile, or `[]` when there is none to be had.
         */
        public static function profileFor( $socialQuery = [] ) {
            $query     = self::normalizeQuery( $socialQuery );
            $feed_type = $query['feedType'];

            if ( ! self::hasProfile( $feed_type ) ) {
                return [];
            }

            // Every service reads the profile from the same address the feed itself is read from.
            $source = $query['source'];

            if ( '' === trim( (string) $source ) ) {
                return [];
            }

            // Keyed by the account and not by the whole query: two sliders reading one channel
            // differently still describe the same account, and should not spend two requests on it.
            $key   = 'b_slider_feed_profile_' . md5( $feed_type . '|' . $source . '|v' . self::cacheVersion() );
            $entry = get_transient( $key );

            if ( ! is_array( $entry ) ) {
                $profile = self::readProfile( $feed_type, $source );
                $entry   = is_wp_error( $profile ) ? [] : $profile;

                // A failure is cached too, for a shorter while. Without that, an expired token — or
                // a site with no YouTube key — means a request out on every page load of every page
                // the slider is on.
                set_transient( $key, $entry, $entry ? self::cacheTtl( $socialQuery ) : self::ERROR_TTL );
            }

            if ( ! $entry ) {
                return [];
            }

            return $entry;
        }

        /** Add a channel, or update one. Answers with the whole list, so a caller needs one request. */
        public function save_channel( \WP_REST_Request $request ) {
            // The address and its name. `per_page` used to be accepted here too and stored with the
            // channel, where nothing could ever read it back — see the note on FeedChannels::resolve().
            $saved = FeedChannels::save( [
                'id'             => (string) $request->get_param( 'id' ),
                'label'          => (string) $request->get_param( 'label' ),
                'feedType'       => (string) $request->get_param( 'feedType' ),
                'source'         => (string) $request->get_param( 'source' ),
                'jsonRootKey'    => (string) $request->get_param( 'jsonRootKey' ),
                'jsonImageKey'   => (string) $request->get_param( 'jsonImageKey' ),
                'jsonTitleKey'   => (string) $request->get_param( 'jsonTitleKey' ),
                'jsonLinkKey'    => (string) $request->get_param( 'jsonLinkKey' ),
                'jsonExcerptKey' => (string) $request->get_param( 'jsonExcerptKey' ),
                'jsonButtonTextKey' => (string) $request->get_param( 'jsonButtonTextKey' ),
                'jsonDateKey'       => (string) $request->get_param( 'jsonDateKey' ),
                'jsonAuthorKey'     => (string) $request->get_param( 'jsonAuthorKey' ),
                'ytRefreshToken'    => (string) $request->get_param( 'ytRefreshToken' ),
            ] );

            if ( is_wp_error( $saved ) ) {
                return $saved;
            }

            $list = $this->get_channels( $request )->get_data();
            // Masked like the list itself: this is the same channel, and it is going to the same
            // browser that was not trusted with the token a line earlier.
            $list['saved'] = FeedChannels::forDisplay( $saved );

            return rest_ensure_response( $list );
        }

        /** Remove a channel. What it imported stays, and becomes the Storage screen's leftovers. */
        public function delete_channel( \WP_REST_Request $request ) {
            FeedChannels::delete( (string) $request->get_param( 'id' ) );

            return rest_ensure_response( $this->get_channels( $request )->get_data() );
        }



        /**
         * This site's YouTube Data API key, if it has one.
         *
         * Deliberately not a block attribute: `render.php` prints every attribute into the page as
         * `data-attributes`, so a key stored there would be readable by anybody viewing the source.
         */
        public static function apiKey() {
            $key = get_option( self::API_KEY_OPTION, '' );
            $key = is_string( $key ) ? trim( $key ) : '';

            if ( '' === $key ) {
                $key = self::sharedApiKey();
            }

            $key = (string) apply_filters( 'b_slider_youtube_api_key', $key );

            // Checked on the way out as well as on the way in. Something that is not a key makes
            // `hasApiKey()` true, which raises the item ceiling and spends a request on every fetch
            // to be told "API key not valid" before falling back to the feed — so anything already
            // stored that cannot be a key is treated as no key at all rather than left to fail.
            return self::isValidKey( $key ) ? $key : '';
        }

        /**
         * Whether this could be a Google API key at all.
         *
         * They are `AIza` followed by 35 characters of the URL-safe alphabet. The check is here
         * because the field sits next to the one asking for a channel address, and a channel URL
         * pasted into it used to save silently and then break every fetch. The length is a range
         * rather than exactly 39 so a future change at Google does not lock everybody out.
         */
        public static function isValidKey( $key ) {
            return is_string( $key ) && (bool) preg_match( '/^AIza[A-Za-z0-9_-]{30,45}$/', trim( $key ) );
        }

        /** The key belonging to `video-gallery-for-youtube`, when that plugin has one. */
        private static function sharedApiKey() {
            $stored = get_option( self::SHARED_KEY_OPTION, '' );

            if ( ! is_string( $stored ) || '' === $stored ) {
                return '';
            }

            $data = json_decode( $stored, true );

            return is_array( $data ) && is_string( $data['key'] ?? null ) ? trim( $data['key'] ) : '';
        }

        /**
         * Whether a key is set, and its last four characters.
         *
         * Never the key itself. An author may see that one is configured — the count of videos they
         * can ask for depends on it — without the editor handing the credential to every browser
         * that opens a post.
         */
        public function get_key( \WP_REST_Request $request ) {
            $key = self::apiKey();
            $own = get_option( self::API_KEY_OPTION, '' );

            return rest_ensure_response( [
                'hasKey'    => '' !== $key,
                'masked'    => '' === $key ? '' : str_repeat( '•', 8 ) . substr( $key, -4 ),
                // So the panel can say the key is coming from the other plugin rather than offering
                // to clear one this plugin does not hold.
                'inherited' => '' !== $key && ( ! is_string( $own ) || '' === trim( $own ) ),
                'canManage' => self::can_manage(),
                'maxItems'  => YouTubeFeed::maxItems(),
            ] );
        }

        /**
         * Store or clear the key.
         *
         * Every cached feed is retired on the way out: a slider that fell back to the 15-video feed
         * should pick up the other 35 as soon as a key is saved, not six hours later.
         */
        public function save_key( \WP_REST_Request $request ) {
            $key = $request->get_param( 'key' );
            $key = is_string( $key ) ? trim( sanitize_text_field( $key ) ) : '';

            if ( '' !== $key && ! self::isValidKey( $key ) ) {
                return new \WP_Error(
                    'b_slider_invalid_api_key',
                    __( 'That does not look like a YouTube API key. A key starts with “AIza” — the channel address goes in the field above.', 'b-slider' ),
                    [ 'status' => 400 ]
                );
            }

            if ( '' === $key ) {
                delete_option( self::API_KEY_OPTION );
            } else {
                update_option( self::API_KEY_OPTION, $key );
            }

            update_option( self::CACHE_VERSION_OPTION, self::cacheVersion() + 1 );

            return $this->get_key( $request );
        }

        public function get_oauth_creds( \WP_REST_Request $request ) {
            $client_id = defined( 'BSB_GOOGLE_CLIENT_ID' ) ? BSB_GOOGLE_CLIENT_ID : get_option( 'bsb_google_client_id', '' );
            $client_secret = defined( 'BSB_GOOGLE_CLIENT_SECRET' ) ? BSB_GOOGLE_CLIENT_SECRET : get_option( 'bsb_google_client_secret', '' );

            return rest_ensure_response( [
                'clientId'         => '' === $client_id ? '' : str_repeat( '•', 8 ) . substr( $client_id, -4 ),
                'clientSecret'     => '' === $client_secret ? '' : str_repeat( '•', 8 ) . substr( $client_secret, -4 ),
                'hasClientId'      => '' !== $client_id,
                'hasClientSecret'  => '' !== $client_secret,
                'inheritedId'      => defined( 'BSB_GOOGLE_CLIENT_ID' ),
                'inheritedSecret'  => defined( 'BSB_GOOGLE_CLIENT_SECRET' ),
                'canManage'        => self::can_manage(),
            ] );
        }

        public function save_oauth_creds( \WP_REST_Request $request ) {
            $client_id = $request->get_param( 'clientId' );
            $client_id = is_string( $client_id ) ? trim( sanitize_text_field( $client_id ) ) : '';

            $client_secret = $request->get_param( 'clientSecret' );
            $client_secret = is_string( $client_secret ) ? trim( sanitize_text_field( $client_secret ) ) : '';

            if ( strpos( $client_id, '•' ) !== false ) {
                $client_id = get_option( 'bsb_google_client_id', '' );
            }
            if ( strpos( $client_secret, '•' ) !== false ) {
                $client_secret = get_option( 'bsb_google_client_secret', '' );
            }

            if ( '' === $client_id ) {
                delete_option( 'bsb_google_client_id' );
            } else {
                update_option( 'bsb_google_client_id', $client_id );
            }

            if ( '' === $client_secret ) {
                delete_option( 'bsb_google_client_secret' );
            } else {
                update_option( 'bsb_google_client_secret', $client_secret );
            }

            update_option( self::CACHE_VERSION_OPTION, self::cacheVersion() + 1 );

            return $this->get_oauth_creds( $request );
        }

        /** The number every cache key carries, so bumping it retires all of them at once. */
        public static function cacheVersion() {
            return (int) get_option( self::CACHE_VERSION_OPTION, 1 );
        }

        /**
         * The editor's own preview of a feed.
         *
         * A failure comes back as a message on a 200 rather than as an error response: the user is
         * typing a URL into a field, so "no channel found" is the ordinary state of a half-typed
         * handle. The panel wants to say so plainly without the editor treating every keystroke as
         * a broken request.
         */
        public function get_feed( \WP_REST_Request $request ) {
            $query          = self::requestQuery( $request );
            $excerpt_length = self::excerptLength( $request->get_param( 'excerptLength' ) );

            // The Refresh button. Dropping this feed's own entry is enough — a user waiting on a
            // video they just published should not clear every other slider's cache to see it.
            $force_refresh = false;
            if ( $request->get_param( 'refresh' ) ) {
                self::forget( $query, $excerpt_length );
                $force_refresh = true;
            }

            $items = self::fetch( $query, $excerpt_length, $force_refresh );

            if ( is_wp_error( $items ) ) {
                return rest_ensure_response( [
                    'items' => [],
                    'error' => $items->get_error_message(),
                    'media' => [ 'total' => 0, 'stored' => 0 ],
                ] );
            }

            // Keeping a feed on this site is Premium, so the free build always answers with what it
            // just read from the service.
            $response_items = $items;

            $normalized = self::normalizeQuery( $query, $excerpt_length );
            $response_items = self::postProcessItems( $response_items, $normalized );

            // Nothing is held locally, and the editor reads these to decide whether to offer the
            // import — sent as zeroes rather than left out so the shape of the answer is unchanged.
            $media = [ 'total' => 0, 'stored' => 0, 'items' => 0 ];

            return rest_ensure_response( [
                'items' => $response_items,
                'error' => '',
                'media' => $media,
                // So the editor draws the same header the front end will. Without it the canvas
                // showed the card only once somebody had pressed "Fill from Instagram account",
                // while the published page showed it from the start — the preview disagreeing with
                // the page about what the block does.
                'profile' => self::profileFor( $query ),
            ] );
        }

        /**
         * What a render wants: the items, and nothing to handle when the feed is down.
         *
         * A slider whose feed cannot be reached falls through to the block's "nothing to show"
         * state, the same as a post query that matched no posts.
         */
        public static function items( $socialQuery = [], $excerpt_length = 25 ) {
            $items = self::fetch( $socialQuery, $excerpt_length );
            $items = is_wp_error( $items ) ? [] : $items;

            // Nothing to draw. The failure has already been handled as far as the cache is
            // concerned — what is left is a visitor looking at a hole where a slider was, and
            // the last thing this feed ever said is better than that. Deliberately only on the
            // render path: the editor's preview goes through `get_feed()`, which still gets the
            // failure itself, because somebody typing an address needs to be told what is wrong
            // rather than shown yesterday's answer.
            if ( ! $items ) {
                $items = self::recall( self::keyFor( $socialQuery, $excerpt_length ) );
            }

            $normalized = self::normalizeQuery( $socialQuery, $excerpt_length );

            return self::postProcessItems( $items, $normalized );
        }

        /**
         * Whether this slider keeps its videos and pictures on this site.
         *
         * Never, in the free build: keeping a feed locally is Premium, and the classes that write
         * the rows and copy the pictures are not shipped here. Kept as a method rather than removed
         * so the read paths that ask the question still have something to ask, and so a block saved
         * with `storeLocal` on simply reads from the service instead of breaking.
         */
        public static function storesLocally( $socialQuery = [] ) {
            return false;
        }

        /**
         * A feed, from the cache when it is fresh and from the cache anyway when it is not.
         *
         * The cached copy is served past its freshness while a single process goes and replaces it.
         * That is what ties a site's quota to the cache window instead of to its traffic: without
         * it, the moment a window lapses every request that arrives together sees an empty cache and
         * every one of them goes out to the service. A page of 10,000 visitors would spend the whole
         * day's allowance in the seconds after each expiry, and each visitor would wait on the
         * round trip.
         *
         * @return array|\WP_Error
         */
        public static function fetch( $socialQuery = [], $excerpt_length = 25, $force_refresh = false ) {
            $query = self::normalizeQuery( $socialQuery, $excerpt_length );

            // Fetched at the service's own ceiling rather than at the slider's count, so keywords,
            // order and age have a pool to work on. The count itself is applied to what comes back,
            // in `postProcessItems()`.
            $query['per_page'] = self::maxItems( $query['feedType'] );

            $key   = self::cacheKeyFor( $query );
            $entry = get_transient( $key );
            $now   = time();


            $has_entry = is_array( $entry ) && isset( $entry['freshUntil'] );

            if ( ! $force_refresh && $has_entry && $now < (int) $entry['freshUntil'] ) {
                return self::entryResult( $entry );
            }

            // Stale, or never fetched. Whoever takes the lock refreshes; everybody else is answered
            // from what is already here. With nothing here at all there is nothing to answer with,
            // so those requests come back empty and the next page load has it.
            if ( ! self::acquireLock( $key ) ) {
                return $has_entry ? self::entryResult( $entry ) : [];
            }

            // Force WordPress fetch_feed to respect the slider cache time or bypass it if force_refresh is true
            $ttl = $force_refresh ? 0 : self::cacheTtl( $socialQuery );
            $filter_lifetime = function() use ( $ttl ) {
                return $ttl;
            };
            add_filter( 'wp_feed_cache_transient_lifetime', $filter_lifetime );

            $items = self::fetchFresh( $query );

            remove_filter( 'wp_feed_cache_transient_lifetime', $filter_lifetime );

            // A failed refresh does not throw away a good answer. The stale items keep serving, and
            // the next attempt is held off for ERROR_TTL rather than made on the very next request.
            if ( is_wp_error( $items ) && ! $force_refresh && $has_entry && isset( $entry['items'] ) ) {
                $entry['freshUntil'] = $now + self::ERROR_TTL;
                set_transient( $key, $entry, self::ERROR_TTL + self::STALE_TTL );
                self::releaseLock( $key );

                return $entry['items'];
            }

            $save_ttl = is_wp_error( $items ) ? self::ERROR_TTL : self::cacheTtl( $socialQuery );
            $fresh = is_wp_error( $items )
                ? [ 'error' => $items->get_error_message(), 'freshUntil' => $now + $save_ttl ]
                : [ 'items' => $items, 'freshUntil' => $now + $save_ttl ];

            set_transient( $key, $fresh, $save_ttl + self::STALE_TTL );

            // Kept somewhere a cache cannot lose it — but not for a feed that already keeps its
            // items on the site, which has a copy that outlasts this one. See `remember()`.
            if ( ! is_wp_error( $items ) && $items && ! self::storesLocally( $socialQuery ) ) {
                self::remember( $key, $items );
            }

            self::releaseLock( $key );

            return self::entryResult( $fresh );
        }

        /**
         * The last good answer a feed gave, kept where a cache cannot lose it.
         *
         * The cache is a transient, and a transient is allowed to disappear — an object cache under
         * memory pressure evicts them, and a site that installs Redis loses every one it had. When
         * that happens at the same moment the service is unreachable there is nothing left to draw,
         * and the slider renders as "nothing to show". So does the request that arrives while
         * another process holds the refresh lock on a cold cache — a real case on a busy site, the
         * one moment a cache window lapses.
         *
         * A copy in an option survives all of it. Never autoloaded, and only read when there is
         * nothing else, so on a working site it costs one write per cache window and nothing else.
         *
         * A feed that stores its items on the site does not get one: the store already holds a
         * copy that outlasts anything, and a second one would be the same items written twice.
         */
        private static function remember( $key, $items ) {
            update_option( self::keepsakeName( $key ), $items, false );

            $known = get_option( self::KEEPSAKE_INDEX, [] );
            $known = is_array( $known ) ? $known : [];

            // Most recently written last. A slider whose settings change gets a new key — the old
            // one is nobody's now, and without this the row count would only ever go up.
            $known = array_values( array_diff( $known, [ $key ] ) );
            $known[] = $key;

            while ( count( $known ) > self::KEEPSAKE_MAX ) {
                delete_option( self::keepsakeName( array_shift( $known ) ) );
            }

            update_option( self::KEEPSAKE_INDEX, $known, false );
        }

        /** What `remember()` kept, or nothing. */
        private static function recall( $key ) {
            $items = get_option( self::keepsakeName( $key ), [] );

            return is_array( $items ) ? $items : [];
        }

        /** Forget one feed's copy — for when its stored items are being cleared anyway. */
        public static function forgetKeepsake( $socialQuery = [], $excerpt_length = 25 ) {
            $key   = self::keyFor( $socialQuery, $excerpt_length );
            $known = get_option( self::KEEPSAKE_INDEX, [] );

            delete_option( self::keepsakeName( $key ) );

            if ( is_array( $known ) ) {
                update_option( self::KEEPSAKE_INDEX, array_values( array_diff( $known, [ $key ] ) ), false );
            }
        }

        private static function keepsakeName( $key ) {
            return 'bsb_last_' . $key;
        }

        /** A stored entry as a caller sees it: the items, or the failure it holds instead. */
        private static function entryResult( $entry ) {
            if ( isset( $entry['error'] ) ) {
                return new \WP_Error( 'b_slider_feed_cached', (string) $entry['error'] );
            }

            $items = isset( $entry['items'] ) && is_array( $entry['items'] ) ? $entry['items'] : [];
            foreach ( $items as $idx => $item ) {
                if ( is_array( $item ) ) {
                    if ( isset( $item['socialImage'] ) && ! isset( $item['thumbnail'] ) ) {
                        $items[ $idx ]['thumbnail'] = $item['socialImage'];
                    }
                    if ( is_string( $item['author'] ?? null ) ) {
                        $items[ $idx ]['author'] = [
                            'name' => $item['author'],
                            'link' => '',
                        ];
                    }
                }
            }

            return $items;
        }

        /**
         * Take the right to refresh this feed, if nobody else holds it.
         *
         * `add_option()` rather than a transient, because it is the one write here that *fails* when
         * the row already exists — the option table has a unique index on the name. A
         * `get_transient()` then `set_transient()` pair leaves a window in which every request that
         * arrived together reads "no lock" and all of them go out to the service, and that window is
         * exactly the moment a cache expires on a busy site, which is the case this exists for.
         */
        private static function acquireLock( $key ) {
            $lock = $key . '_lock';
            $held = get_option( $lock );

            if ( $held ) {
                if ( ( time() - (int) $held ) < self::LOCK_TTL ) {
                    return false;
                }

                // Left behind by a refresh that died. Clear it so the insert below can take it.
                delete_option( $lock );
            }

            return (bool) add_option( $lock, time(), '', false );
        }

        private static function releaseLock( $key ) {
            delete_option( $key . '_lock' );
        }

        public static function forget( $socialQuery = [], $excerpt_length = 25 ) {
            $query = self::normalizeQuery( $socialQuery, $excerpt_length );

            $key = self::keyFor( $socialQuery, $excerpt_length );

            delete_transient( $key );
            // The Refresh button is also the way out of a lock left behind by a fetch that hung.
            self::releaseLock( $key );

            // A reader that keeps caches of its own is asked to drop them too. Clearing the finished
            // feed and stopping there meant Refresh reported success while the reader answered the
            // very next fetch from the same copy — six hours of it for a YouTube search, a month for
            // `Oldest first`. See `YouTubeFeed::forget()`.
            if ( 'youtube' === $query['feedType'] ) {
                YouTubeFeed::forget( $query );
            }

            // If it's an RSS feed, also drop WordPress's internal site and standard transients for the feed
            if ( 'rss' === $query['feedType'] && ! empty( $query['source'] ) ) {
                $md5 = md5( $query['source'] );
                delete_site_transient( 'feed_' . $md5 );
                delete_site_transient( 'feed_mod_' . $md5 );
                delete_transient( 'feed_' . $md5 );
                delete_transient( 'feed_mod_' . $md5 );
            }
        }

        /**
         * A feed, off the service itself.
         *
         * @return array|\WP_Error
         */
        private static function fetchFresh( $query ) {
            if ( '' === $query['source'] ) {
                return new \WP_Error( 'b_slider_feed_no_source', __( 'Add a feed address to show something here.', 'b-slider' ) );
            }

            switch ( $query['feedType'] ) {
                case 'youtube':
                    return YouTubeFeed::items(
                        $query['source'],
                        $query['per_page'],
                        $query['metaDateFormat'],
                        $query['excerptLength'],
                        $query['videoSet'],
                        $query['ytQueryType'] ?? 'channel',
                        $query['ytSearchTerm'] ?? '',
                        $query['ytPlaylistId'] ?? '',
                        $query['ytThumbQuality'] ?? 'maxresdefault',
                        $query['ytPrivacyStatus'] ?? 'all',
                        $query['ytRefreshToken'] ?? '',
                        self::cacheTtl( $query )
                    );
                case 'youtube_video':
                    return YouTubeFeed::single_video(
                        $query['source'],
                        $query['metaDateFormat']
                    );
                case 'rss':
                    return RssFeed::items(
                        $query['source'],
                        $query['per_page'],
                        $query['metaDateFormat'],
                        $query['excerptLength'],
                        $query['defaultImageUrl'],
                        $query['titleLength'],
                        $query['rssTimezoneOffset'] ?? '',
                        $query['rssTranslateDate'] ?? ''
                    );
                case 'json':
                    return JsonFeed::items(
                        $query['source'],
                        $query['per_page'],
                        $query['metaDateFormat'],
                        $query['excerptLength'],
                        $query['defaultImageUrl'],
                        $query['titleLength'],
                        $query['jsonRootKey'],
                        $query['jsonImageKey'],
                        $query['jsonTitleKey'],
                        $query['jsonLinkKey'],
                        $query['jsonExcerptKey'],
                        $query['jsonButtonTextKey'],
                        $query['jsonDateKey'],
                        $query['jsonAuthorKey']
                    );
            }

            return new \WP_Error( 'b_slider_feed_unknown_type', __( 'That feed type is not available.', 'b-slider' ) );
        }

        /**
         * What the block saved, as values a reader may be handed.
         *
         * `socialQuery` arrives from block markup and from a request, so every value is read off
         * the array by name and narrowed to something known. What this returns also identifies the
         * cached answer — see `cacheKey()` — so it holds only what changes the feed's contents and
         * not, say, how long it is kept for.
         */
        public static function normalizeQuery( $socialQuery, $excerpt_length = 25 ) {
            $socialQuery = is_array( $socialQuery ) ? $socialQuery : [];

            // A slider may name a saved channel instead of carrying an address. Resolved first, so
            // everything below — the cache key, the fetch, the import — works from what the channel
            // says rather than from whatever the block last had.
            $socialQuery = FeedChannels::resolve( $socialQuery );

            /**
             * An unknown type stays unknown.
             *
             * It used to fall back to `youtube`, which is safe where every type has a reader — but
             * Instagram is Premium and absent here, so a block built on a licensed site arrived with
             * `feedType: 'instagram'` and had its *access token* renamed into a YouTube channel
             * address and sent to YouTube. Left as it is, `fetchFresh()` matches no case and answers
             * with the unknown-type error, which is the truth: this build cannot read that feed.
             *
             * Empty still becomes `youtube`, because that is a new block with nothing chosen yet
             * rather than a block asking for something this build has not got.
             */
            $feed_type = self::str( $socialQuery, 'feedType' );

            if ( '' === $feed_type ) {
                $feed_type = 'youtube';
            }
            $format    = self::str( $socialQuery, 'metaDateFormat' );

            return [
                'feedType'             => $feed_type,
                'source'               => trim( sanitize_text_field( self::str( $socialQuery, 'source' ) ) ),
                // Capped by what *this* service can reach — see `maxItems()`.
                'per_page'             => self::limit( $socialQuery['per_page'] ?? 12, $feed_type ),
                // `thumbQuality` used to sit here, and a slider saved before it went may still carry
                // one. It is not read back on purpose: the file a visitor is sent comes off the
                // `srcset` either way — see `YouTubeFeed::srcset()` — and the import keeps the largest.
                // Out of the key as well as out of the fetch, so an old value cannot split the cache.

                // Which of the channel's lists to read. Very much part of the key: the same channel
                // asked for its newest and for its most viewed is two different sets of videos, and
                // leaving this out would serve whichever was fetched first to both.
                'videoSet'             => YouTubeFeed::videoSet( $socialQuery['videoSet'] ?? 'latest' ),
                'metaDateFormat'       => '' !== $format ? $format : 'M j, Y',
                // In the key as well as resolved above: a slider moved from one saved channel to
                // another is a different set of videos even if both happen to be unset.
                'channelId'            => self::str( $socialQuery, 'channelId' ),
                // Lives on `postsQuery`, not here — the caption is drawn by the same component a post
                // slider uses. It belongs in the key all the same: the descriptions are cut to it
                // before they are stored, so two sliders wanting different lengths are two answers.
                'excerptLength'        => self::excerptLength( $excerpt_length ),
                'linkTarget'           => self::str( $socialQuery, 'linkTarget' ),
                'defaultImageUrl'      => self::str( $socialQuery, 'defaultImageUrl' ),
                'titleLength'          => isset( $socialQuery['titleLength'] ) ? (int) $socialQuery['titleLength'] : -1,
                'keywordFilter'        => isset( $socialQuery['keywordFilter'] ) ? sanitize_text_field( (string) $socialQuery['keywordFilter'] ) : '',
                'excludeKeywordFilter' => isset( $socialQuery['excludeKeywordFilter'] ) ? sanitize_text_field( (string) $socialQuery['excludeKeywordFilter'] ) : '',
                'feedOrderBy'          => isset( $socialQuery['feedOrderBy'] ) ? sanitize_text_field( (string) $socialQuery['feedOrderBy'] ) : 'date_desc',
                'feedOffset'           => isset( $socialQuery['feedOffset'] ) ? (int) $socialQuery['feedOffset'] : 0,
                'feedAgeLimit'         => isset( $socialQuery['feedAgeLimit'] ) ? (int) $socialQuery['feedAgeLimit'] : 0,
                'selectedBadges'       => isset( $socialQuery['selectedBadges'] ) && is_array( $socialQuery['selectedBadges'] ) ? $socialQuery['selectedBadges'] : [],
                'badgeSettings'        => isset( $socialQuery['badgeSettings'] ) && is_array( $socialQuery['badgeSettings'] ) ? $socialQuery['badgeSettings'] : [],
                'badgeDisplayStyle'    => isset( $socialQuery['badgeDisplayStyle'] ) ? sanitize_text_field( $socialQuery['badgeDisplayStyle'] ) : 'chips',
                'jsonRootKey'          => isset( $socialQuery['jsonRootKey'] ) ? sanitize_text_field( (string) $socialQuery['jsonRootKey'] ) : '',
                'jsonImageKey'         => isset( $socialQuery['jsonImageKey'] ) ? sanitize_text_field( (string) $socialQuery['jsonImageKey'] ) : '',
                'jsonTitleKey'         => isset( $socialQuery['jsonTitleKey'] ) ? sanitize_text_field( (string) $socialQuery['jsonTitleKey'] ) : '',
                'jsonLinkKey'          => isset( $socialQuery['jsonLinkKey'] ) ? sanitize_text_field( (string) $socialQuery['jsonLinkKey'] ) : '',
                'jsonExcerptKey'       => isset( $socialQuery['jsonExcerptKey'] ) ? sanitize_text_field( (string) $socialQuery['jsonExcerptKey'] ) : '',
                'jsonButtonTextKey'    => isset( $socialQuery['jsonButtonTextKey'] ) ? sanitize_text_field( (string) $socialQuery['jsonButtonTextKey'] ) : '',
                'jsonDateKey'          => isset( $socialQuery['jsonDateKey'] ) ? sanitize_text_field( (string) $socialQuery['jsonDateKey'] ) : '',
                'jsonAuthorKey'        => isset( $socialQuery['jsonAuthorKey'] ) ? sanitize_text_field( (string) $socialQuery['jsonAuthorKey'] ) : '',
                'ytQueryType'          => isset( $socialQuery['ytQueryType'] ) ? sanitize_text_field( (string) $socialQuery['ytQueryType'] ) : 'channel',
                'ytSearchTerm'         => isset( $socialQuery['ytSearchTerm'] ) ? sanitize_text_field( (string) $socialQuery['ytSearchTerm'] ) : '',
                'ytPlaylistId'         => isset( $socialQuery['ytPlaylistId'] ) ? sanitize_text_field( (string) $socialQuery['ytPlaylistId'] ) : '',
                'ytThumbQuality'       => isset( $socialQuery['ytThumbQuality'] ) ? sanitize_text_field( (string) $socialQuery['ytThumbQuality'] ) : 'maxresdefault',
                'usePlyr'              => ! isset( $socialQuery['usePlyr'] ) || (bool) $socialQuery['usePlyr'],
                'ytAutoplay'           => ! isset( $socialQuery['ytAutoplay'] ) || (bool) $socialQuery['ytAutoplay'],
                'ytMute'               => isset( $socialQuery['ytMute'] ) && (bool) $socialQuery['ytMute'],
                'ytControls'           => ! isset( $socialQuery['ytControls'] ) || (bool) $socialQuery['ytControls'],
                'ytFullscreen'         => ! isset( $socialQuery['ytFullscreen'] ) || (bool) $socialQuery['ytFullscreen'],
                'ytKeyboard'           => ! isset( $socialQuery['ytKeyboard'] ) || (bool) $socialQuery['ytKeyboard'],
                'ytCaptions'           => isset( $socialQuery['ytCaptions'] ) && (bool) $socialQuery['ytCaptions'],
                'ytNoCookie'           => ! isset( $socialQuery['ytNoCookie'] ) || (bool) $socialQuery['ytNoCookie'],
                'ytRel'                => isset( $socialQuery['ytRel'] ) && (bool) $socialQuery['ytRel'],
                'ytLazy'               => ! isset( $socialQuery['ytLazy'] ) || (bool) $socialQuery['ytLazy'],
                'rssTimezoneOffset'    => isset( $socialQuery['rssTimezoneOffset'] ) ? sanitize_text_field( (string) $socialQuery['rssTimezoneOffset'] ) : '',
                'rssTranslateDate'     => isset( $socialQuery['rssTranslateDate'] ) ? sanitize_text_field( (string) $socialQuery['rssTranslateDate'] ) : '',
                'rssLocalTimezone'     => isset( $socialQuery['rssLocalTimezone'] ) && (bool) $socialQuery['rssLocalTimezone'],
                'ytPrivacyStatus'      => ! empty( $socialQuery['ytPrivacyStatus'] ) ? sanitize_text_field( (string) $socialQuery['ytPrivacyStatus'] ) : 'all',
                'ytRefreshToken'       => isset( $socialQuery['ytRefreshToken'] ) ? sanitize_text_field( (string) $socialQuery['ytRefreshToken'] ) : '',
            ];
        }

        /**
         * Words of description to keep.
         *
         * `-1` keeps all of it, which is what the block means by it. The ceiling is only there so a
         * value arriving from a request cannot ask for a stored description longer than any caption
         * could show.
         */
        public static function excerptLength( $length ) {
            $length = (int) ( is_scalar( $length ) ? $length : 25 );

            return $length < 0 ? -1 : min( $length, 200 );
        }

        /**
         * A trimmed string off the saved query, whatever the key actually held.
         *
         * A slider saved before one of these settings existed has no key for it at all, and the
         * block's own defaults are only applied to a block the editor has opened — a shortcode or a
         * template render reaches here with whatever was stored.
         */
        private static function str( $socialQuery, $key ) {
            $value = $socialQuery[ $key ] ?? '';

            return is_string( $value ) ? trim( $value ) : '';
        }

        /**
         * How long a fetched feed is kept.
         *
         * Free sliders all cache for the same six hours. Choosing the window is a Pro setting — see
         * the feature table in docs/social-external-feeds.md — so a value saved on the block is
         * honoured only on a licensed site. The filter is what a developer uses either way, and is
         * applied last so it can override both.
         */
        public static function cacheTtl( $socialQuery = [] ) {
            $ttl = self::CACHE_TTL;

            if ( b_slider_is_premium() ) {
                $saved = (int) ( is_array( $socialQuery ) ? ( $socialQuery['cacheTime'] ?? 0 ) : 0 );

                if ( $saved >= self::MIN_TTL && $saved <= self::MAX_TTL ) {
                    $ttl = $saved;
                }
            }

            return (int) apply_filters( 'b_slider_social_cache_ttl', $ttl, $socialQuery );
        }

        /**
         * Where a feed's answer is cached.
         *
         * Keyed by everything that decides the contents, so two sliders reading the same channel
         * the same way share one fetch, and changing the address or the count fetches again. The
         * version goes in too — saving a key changes what a feed can return, and every cached
         * answer from before it is stale.
         */
        private static function cacheKey( $query ) {
            return 'b_slider_social_' . md5( (string) wp_json_encode( $query ) . '|v' . self::cacheVersion() );
        }

        /**
         * The same, with the settings that only ever narrow the answer left out.
         *
         * Keywords, order, offset, age and title length are all applied to what came back, by
         * `postProcessItems()`. In the key they would split one account's fetch into one fetch per
         * set of filters — two sliders on the same feed, showing different keywords, would each
         * spend a request and each count against the same quota.
         */
        /** Where a page handle's query is kept, and for how long. */
        const HANDLE_PREFIX = 'b_slider_feed_h_';

        const HANDLE_TTL = WEEK_IN_SECONDS;

        /**
         * An opaque name for "the feed this slider is showing", safe to print into a public page.
         *
         * The query goes into a transient and only its hash comes back. That is what lets `/feed-page`
         * be public without being an open proxy: the caller holds a name, never an address, so there is
         * nothing in a request for it to point somewhere else.
         *
         * Keyed off the same normalisation the cache uses, so two sliders reading one feed the same way
         * share a handle rather than each storing its own copy of the same query.
         *
         * A week, against the six hours a feed is cached for. The handle has to outlive the cache: a
         * page sitting open, or served from a page cache, may ask for its second page long after the
         * feed behind it was last fetched — and a handle that had expired would leave the pager dead
         * with no way to explain itself. Re-printed on every render, so an active slider's handle keeps
         * being renewed and only a slider nobody has loaded for a week falls out.
         */
        public static function pageHandle( $socialQuery = [], $excerpt_length = 25 ) {
            $handle = substr( self::keyFor( $socialQuery, $excerpt_length ), -32 );

            set_transient( self::HANDLE_PREFIX . $handle, [
                'query'         => $socialQuery,
                'excerptLength' => $excerpt_length,
            ], self::HANDLE_TTL );

            return $handle;
        }

        /**
         * One page of the list a handle stands for.
         *
         * Reads what `items()` reads — the cached fetch, or this site's own copy where the feed is
         * stored locally — and slices it. No fetch is triggered from here even when the cache has
         * lapsed: `items()` falls back to the last answer it kept, and a visitor clicking to page 3
         * is the wrong moment to go and wait on YouTube. The page load after the window lapses is what
         * refreshes it, as it always was.
         *
         * `total` comes back with every page so the pager can size itself without a second request.
         */
        public function get_feed_page( \WP_REST_Request $request ) {
            $handle = preg_replace( '/[^a-f0-9]/', '', (string) $request->get_param( 'handle' ) );
            $stored = $handle ? get_transient( self::HANDLE_PREFIX . $handle ) : false;

            if ( ! is_array( $stored ) || ! isset( $stored['query'] ) ) {
                // Not an error the visitor can act on, and not one worth a 404 in the console: the
                // pager simply keeps the page it has.
                return rest_ensure_response( [ 'items' => [], 'total' => 0, 'page' => 1, 'expired' => true ] );
            }

            $items = self::items( $stored['query'], isset( $stored['excerptLength'] ) ? $stored['excerptLength'] : 25 );
            $items = is_array( $items ) ? $items : [];

            $per_page = max( 1, (int) $request->get_param( 'per_page' ) );
            $total    = count( $items );
            // Clamped, so a page number past the end answers with the last page rather than nothing —
            // the same thing the grid does when a feed shrinks under it.
            $pages    = max( 1, (int) ceil( $total / $per_page ) );
            $page     = min( max( 1, (int) $request->get_param( 'page' ) ), $pages );

            return rest_ensure_response( [
                'items' => array_slice( $items, ( $page - 1 ) * $per_page, $per_page ),
                'total' => $total,
                'page'  => $page,
            ] );
        }

        private static function cacheKeyFor( $query ) {
            unset(
                $query['keywordFilter'],
                $query['excludeKeywordFilter'],
                $query['feedOrderBy'],
                $query['feedOffset'],
                $query['feedAgeLimit'],
                $query['titleLength']
            );

            /**
             * Random is a `videoSet` that changes no video.
             *
             * The rest of them each name a different list — Shorts, no Shorts, most viewed — so
             * `videoSet` stays in the key. This one asks YouTube for the uploads, the same document
             * `latest` asks for, and only differs in what `postProcessItems()` does with the answer
             * afterwards. Left alone it would keep a second, identical copy of the feed under its
             * own key: one more request per cache window, and one more transient, for nothing.
             */
            if ( 'youtube' === ( isset( $query['feedType'] ) ? $query['feedType'] : '' )
                && 'random' === ( isset( $query['videoSet'] ) ? $query['videoSet'] : '' ) ) {
                $query['videoSet'] = 'latest';
            }

            return self::cacheKey( $query );
        }

        /**
         * Where a slider's answer lives, worked out from what the block saved.
         *
         * The two steps — take the type's whole pool, then drop the settings that only narrow it —
         * have to be the same everywhere or a feed is stored under one key and looked for under
         * another. They were written out twice before, and had begun to drift.
         */
        private static function keyFor( $socialQuery, $excerpt_length = 25 ) {
            $query             = self::normalizeQuery( $socialQuery, $excerpt_length );
            $query['per_page'] = self::maxItems( $query['feedType'] );

            return self::cacheKeyFor( $query );
        }

        /**
         * The most items a feed of this type can be asked for.
         *
         * YouTube is the one that has to be asked: what a channel will give up depends on whether
         * this site has a Data API key, because the public feed is fifteen entries and no more.
         *
         * RSS and JSON keep the 100. A document that lists its own items is read in one request, and
         * 100 is already more slides than a slider shows.
         */
        public static function maxItems( $feed_type ) {
            if ( 'youtube' === $feed_type ) {
                return YouTubeFeed::maxItems();
            }

            // One video is the whole of that feed type.
            return 'youtube_video' === $feed_type ? 1 : 100;
        }

        /**
         * How many items to take, for a feed of this type.
         *
         * "Show all" — which the rest of the block writes as `-1` — and anything past what the
         * service can reach both settle on the ceiling rather than on nothing.
         */
        public static function limit( $limit, $feed_type ) {
            $max   = self::maxItems( $feed_type );
            $limit = (int) ( is_scalar( $limit ) ? $limit : $max );

            return ( $limit > 0 && $limit < $max ) ? $limit : $max;
        }
    }

    new SocialFeed();
}
