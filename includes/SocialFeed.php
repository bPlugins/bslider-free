<?php

namespace B_SLIDER;

if ( ! defined( 'ABSPATH' ) ) exit;

if ( ! class_exists( __NAMESPACE__ . '\SocialFeed' ) ) {
    

    class SocialFeed {

        
        const FEED_TYPES = [ 'youtube', 'youtube_video', 'rss', 'json', 'instagram' ];

        

        const PROFILE_TYPES = [ 'instagram', 'youtube', 'rss' ];

        

        const STORE_READ_MAX = YouTubeFeed::MAX_API_ITEMS;

        
        const CACHE_TTL = 6 * HOUR_IN_SECONDS;

        
        const MIN_TTL = 5 * MINUTE_IN_SECONDS;
        const MAX_TTL = WEEK_IN_SECONDS;

        

        const ERROR_TTL = 5 * MINUTE_IN_SECONDS;

        

        const STALE_TTL = WEEK_IN_SECONDS;

        

        const LOCK_TTL = 60;

        
        const API_KEY_OPTION = 'b_slider_youtube_api_key';

        
        const CACHE_VERSION_OPTION = 'b_slider_social_cache_version';

        
        const KEEPSAKE_INDEX = 'b_slider_social_keepsakes';

        

        const KEEPSAKE_MAX = 20;

        

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

            register_rest_route( 'bsb/v1', '/feed-media', [
                [
                    'methods'             => 'GET',
                    'callback'            => [ $this, 'list_media' ],
                    'permission_callback' => [ __CLASS__, 'can_upload' ],
                ],
                [
                    'methods'             => 'POST',
                    'callback'            => [ $this, 'import_media' ],
                    'permission_callback' => [ __CLASS__, 'can_upload' ],
                ],
                [
                    'methods'             => 'DELETE',
                    'callback'            => [ $this, 'purge_media' ],
                    'permission_callback' => [ __CLASS__, 'can_upload' ],
                ],
            ] );

            register_rest_route( 'bsb/v1', '/feed-channels', [
                [
                    'methods'             => 'GET',
                    'callback'            => [ $this, 'get_channels' ],
                    
                    'permission_callback' => [ __CLASS__, 'can_edit' ],
                ],
                [
                    'methods'             => 'POST',
                    'callback'            => [ $this, 'save_channel' ],
                    
                    'permission_callback' => [ __CLASS__, 'can_edit' ],
                ],
                [
                    'methods'             => 'DELETE',
                    'callback'            => [ $this, 'delete_channel' ],
                    'permission_callback' => [ __CLASS__, 'can_edit' ],
                ],
            ] );

            register_rest_route( 'bsb/v1', '/feed-sync', [
                'methods'             => 'POST',
                'callback'            => [ $this, 'sync_feed' ],
                
                
                'permission_callback' => [ __CLASS__, 'can_upload' ],
            ] );

            register_rest_route( 'bsb/v1', '/feed-profile', [
                'methods'             => 'GET',
                'callback'            => [ $this, 'get_feed_profile' ],
                
                
                
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

        
        public static function can_upload() {
            return current_user_can( 'upload_files' );
        }

        public static function postProcessItems( $items, $normalizedQuery ) {
            $filtered = [];

            
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

            
            $offset = isset( $normalizedQuery['feedOffset'] ) ? max( 0, (int) $normalizedQuery['feedOffset'] ) : 0;
            $per_page = isset( $normalizedQuery['per_page'] ) ? max( 1, (int) $normalizedQuery['per_page'] ) : 12;

            if ( $offset > 0 ) {
                $filtered = array_slice( $filtered, $offset );
            }

            $filtered = array_slice( $filtered, 0, $per_page );

            
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
                'igAllowImage'         => ! $request->has_param( 'igAllowImage' ) || rest_sanitize_boolean( $request->get_param( 'igAllowImage' ) ),
                'igAllowAlbum'         => ! $request->has_param( 'igAllowAlbum' ) || rest_sanitize_boolean( $request->get_param( 'igAllowAlbum' ) ),
                'igAllowVideo'         => ! $request->has_param( 'igAllowVideo' ) || rest_sanitize_boolean( $request->get_param( 'igAllowVideo' ) ),
                'ytPrivacyStatus'      => (string) $request->get_param( 'ytPrivacyStatus' ),
                'ytRefreshToken'       => (string) $request->get_param( 'ytRefreshToken' ),
            ];
        }

        

        public function import_media( \WP_REST_Request $request ) {
            $query = self::requestQuery( $request );
            $items = self::fetch( $query, self::excerptLength( $request->get_param( 'excerptLength' ) ), true );

            if ( is_wp_error( $items ) ) {
                return rest_ensure_response( [
                    'total'    => 0,
                    'stored'   => 0,
                    'items'    => FeedStore::count( $query ),
                    'imported' => 0,
                    'written'  => 0,
                    'failed'   => [],
                    'error'    => $items->get_error_message(),
                ] );
            }

            
            $normalized = self::normalizeQuery( $query, self::excerptLength( $request->get_param( 'excerptLength' ) ) );
            $items = self::postProcessItems( $items, $normalized );

            
            
            $written = FeedStore::save( $items, $query );

            
            
            FeedSync::markStored( FeedStore::feedKey( $query ) );

            $result             = FeedMedia::import( $items, self::normalizeQuery( $query )['feedType'] );

            
            
            
            self::storeAvatar( $query );

            $result['items']    = FeedStore::count( $query );
            $result['written']  = $written['saved'] + $written['updated'];
            $result['error']    = '';

            return rest_ensure_response( $result );
        }

        

        public function get_channels( \WP_REST_Request $request ) {
            $usage    = [];
            
            
            $channels = [];

            foreach ( FeedStore::sliderUsage() as $use ) {
                if ( '' !== $use['channelId'] ) {
                    $usage[ $use['channelId'] ][] = [
                        'postId'  => $use['postId'],
                        'title'   => $use['title'],
                        'editUrl' => $use['editUrl'],
                    ];
                }
            }

            foreach ( FeedChannels::all() as $channel ) {
                $feed_key = FeedStore::feedKey( [ 'channelId' => $channel['id'] ] );
                $channel['usedBy'] = $usage[ $channel['id'] ] ?? [];
                $channel['videos'] = FeedStore::countByKey( $feed_key );

                
                $channel_avatar = '';
                
                $stored_posts = get_posts( [
                    'post_type'      => FeedStore::POST_TYPE,
                    'post_status'    => [ 'publish', 'future' ],
                    'posts_per_page' => 1,
                    'meta_key'       => FeedStore::FEED_META,
                    'meta_value'     => $feed_key,
                    'fields'         => 'ids',
                ] );
                
                if ( ! empty( $stored_posts ) ) {
                    $post_id = $stored_posts[0];
                    $item_data = json_decode( get_post_meta( $post_id, FeedStore::DATA_META, true ), true );
                    if ( is_array( $item_data ) && ! empty( $item_data['thumbnail']['url'] ) ) {
                        $channel_avatar = $item_data['thumbnail']['url'];
                    }
                }
                $channel['avatar'] = $channel_avatar;

                
                
                $channels[]        = FeedChannels::forDisplay( $channel );
            }

            return rest_ensure_response( [
                'channels' => $channels,
                
                
                'instagram' => [
                    'renewsFromDays' => (int) ( InstagramFeed::REFRESH_WINDOW / DAY_IN_SECONDS ),
                ],
                'error'    => '',
            ] );
        }

        

        public function sync_feed( \WP_REST_Request $request ) {
            $feed_key = (string) $request->get_param( 'feedKey' );

            if ( '' === $feed_key ) {
                return new \WP_Error( 'b_slider_sync_no_feed', __( 'Which feed?', 'b-slider' ), [ 'status' => 400 ] );
            }

            $done = FeedSync::syncNow( $feed_key );

            return rest_ensure_response( [
                'synced' => (bool) $done,
                
                
                'error'  => $done ? '' : __( 'Nothing came back. The feed may be unreachable, or no slider is using it any more.', 'b-slider' ),
            ] );
        }

        

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

        
        public static function hasProfile( $feed_type ) {
            return in_array( (string) $feed_type, self::PROFILE_TYPES, true );
        }

        

        public static function readProfile( $feed_type, $source ) {
            switch ( $feed_type ) {
                case 'instagram':
                    return InstagramFeed::profile( $source );

                case 'youtube':
                    return YouTubeFeed::profile( $source );

                case 'rss':
                    return RssFeed::profile( $source );
            }

            return new \WP_Error( 'b_slider_profile_unsupported', __( 'This feed type has no profile behind it.', 'b-slider' ) );
        }

        

        public static function profileFor( $socialQuery = [] ) {
            $query     = self::normalizeQuery( $socialQuery );
            $feed_type = $query['feedType'];

            if ( ! self::hasProfile( $feed_type ) ) {
                return [];
            }

            
            
            $source = 'instagram' === $feed_type
                ? InstagramFeed::tokenFor( $query['channelId'], $query['source'] )
                : $query['source'];

            if ( '' === trim( (string) $source ) ) {
                return [];
            }

            
            
            $key   = 'b_slider_feed_profile_' . md5( $feed_type . '|' . $source . '|v' . self::cacheVersion() );
            $entry = get_transient( $key );

            if ( ! is_array( $entry ) ) {
                $profile = self::readProfile( $feed_type, $source );
                $entry   = is_wp_error( $profile ) ? [] : $profile;

                
                
                
                set_transient( $key, $entry, $entry ? self::cacheTtl( $socialQuery ) : self::ERROR_TTL );
            }

            if ( ! $entry ) {
                return [];
            }

            if ( ! empty( $entry['avatar'] ) ) {
                $entry['avatar'] = FeedMedia::localiseUrl( $entry['avatar'] );
            }

            return $entry;
        }

        

        public static function storeAvatar( $socialQuery = [] ) {
            if ( ! self::storesLocally( $socialQuery ) ) {
                return;
            }

            $profile = self::profileFor( $socialQuery );

            if ( empty( $profile['avatar'] ) ) {
                return;
            }

            FeedMedia::storeUrl(
                $profile['avatar'],
                $profile['name'] ?? ( $profile['username'] ?? '' ),
                self::normalizeQuery( $socialQuery )['feedType']
            );
        }

        
        public function save_channel( \WP_REST_Request $request ) {
            
            
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
            
            
            $list['saved'] = FeedChannels::forDisplay( $saved );

            return rest_ensure_response( $list );
        }

        
        public function delete_channel( \WP_REST_Request $request ) {
            FeedChannels::delete( (string) $request->get_param( 'id' ) );

            return rest_ensure_response( $this->get_channels( $request )->get_data() );
        }

        

        public function list_media( \WP_REST_Request $request ) {
            $listing = FeedMedia::groupedListing();

            $listing['videos'] = self::storedItemCount();
            $listing['error']  = '';

            return rest_ensure_response( $listing );
        }

        
        private static function storedItemCount() {
            $counts = (array) wp_count_posts( FeedStore::POST_TYPE );

            return (int) ( $counts['publish'] ?? 0 );
        }

        

        public function purge_media( \WP_REST_Request $request ) {
            
            
            if ( $request->get_param( 'unused' ) ) {
                
                
                $deleted = FeedMedia::deleteIds( FeedMedia::unusedIds() );

                return rest_ensure_response( [
                    'deleted' => $deleted,
                    'removed' => FeedStore::purgeUnused(),
                    'items'   => 0,
                    'total'   => 0,
                    'stored'  => 0,
                    'error'   => '',
                ] );
            }

            
            $feed_key = $request->get_param( 'feedKey' );

            if ( is_string( $feed_key ) && '' !== $feed_key ) {
                $deleted = FeedMedia::deleteByFeed( $feed_key );

                return rest_ensure_response( [
                    'deleted' => $deleted,
                    'removed' => FeedStore::purgeByKey( $feed_key ),
                    'items'   => 0,
                    'total'   => 0,
                    'stored'  => 0,
                    'error'   => '',
                ] );
            }

            $query    = self::requestQuery( $request );
            $feed_key = FeedStore::feedKey( $query );

            
            
            
            
            
            
            $deleted = FeedMedia::deleteByFeed( $feed_key );
            $removed = FeedStore::purge( $query );

            
            
            self::forgetKeepsake( $query, $request->get_param( 'excerptLength' ) ?? 25 );

            return rest_ensure_response( [
                'deleted' => $deleted,
                'items'   => 0,
                'removed' => $removed,
                'total'   => 0,
                'stored'  => 0,
                'error'   => '',
            ] );
        }

        

        public static function apiKey() {
            $key = get_option( self::API_KEY_OPTION, '' );
            $key = is_string( $key ) ? trim( $key ) : '';

            if ( '' === $key ) {
                $key = self::sharedApiKey();
            }

            $key = (string) apply_filters( 'b_slider_youtube_api_key', $key );

            
            
            
            
            return self::isValidKey( $key ) ? $key : '';
        }

        

        public static function isValidKey( $key ) {
            return is_string( $key ) && (bool) preg_match( '/^AIza[A-Za-z0-9_-]{30,45}$/', trim( $key ) );
        }

        
        private static function sharedApiKey() {
            $stored = get_option( self::SHARED_KEY_OPTION, '' );

            if ( ! is_string( $stored ) || '' === $stored ) {
                return '';
            }

            $data = json_decode( $stored, true );

            return is_array( $data ) && is_string( $data['key'] ?? null ) ? trim( $data['key'] ) : '';
        }

        

        public function get_key( \WP_REST_Request $request ) {
            $key = self::apiKey();
            $own = get_option( self::API_KEY_OPTION, '' );

            return rest_ensure_response( [
                'hasKey'    => '' !== $key,
                'masked'    => '' === $key ? '' : str_repeat( '•', 8 ) . substr( $key, -4 ),
                
                
                'inherited' => '' !== $key && ( ! is_string( $own ) || '' === trim( $own ) ),
                'canManage' => self::can_manage(),
                'maxItems'  => YouTubeFeed::maxItems(),
            ] );
        }

        

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

        
        public static function cacheVersion() {
            return (int) get_option( self::CACHE_VERSION_OPTION, 1 );
        }

        

        public function get_feed( \WP_REST_Request $request ) {
            $query          = self::requestQuery( $request );
            $excerpt_length = self::excerptLength( $request->get_param( 'excerptLength' ) );

            
            
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

            $stores_locally = self::storesLocally( [ 'storeLocal' => $request->get_param( 'storeLocal' ) ] );

            $response_items = $stores_locally
                ? ( FeedStore::has( $query )
                    ? FeedStore::read( $query, self::STORE_READ_MAX )
                    : FeedMedia::localise( $items ) )
                : $items;

            $normalized = self::normalizeQuery( $query, $excerpt_length );
            $response_items = self::postProcessItems( $response_items, $normalized );

            
            
            $media          = FeedMedia::progress( $response_items );
            $media['items'] = FeedStore::count( $query );

            return rest_ensure_response( [
                'items' => $response_items,
                'error' => '',
                'media' => $media,
                
                
                
                
                'profile' => self::profileFor( $query ),
            ] );
        }

        

        public static function items( $socialQuery = [], $excerpt_length = 25 ) {
            
            
            if ( self::storesLocally( $socialQuery ) && FeedStore::has( $socialQuery ) ) {
                $items = FeedStore::read( $socialQuery, self::STORE_READ_MAX );
            } else {
                $items = self::fetch( $socialQuery, $excerpt_length );
                $items = is_wp_error( $items ) ? [] : $items;

                
                
                
                
                
                
                if ( ! $items ) {
                    $items = self::recall( self::keyFor( $socialQuery, $excerpt_length ) );
                }
            }

            $normalized = self::normalizeQuery( $socialQuery, $excerpt_length );
            $items = self::postProcessItems( $items, $normalized );

            
            
            return self::storesLocally( $socialQuery ) ? FeedMedia::localise( $items ) : $items;
        }

        

        public static function storesLocally( $socialQuery = [] ) {
            if ( ! b_slider_is_premium() ) {
                return false;
            }
            $store = is_array( $socialQuery ) ? ( $socialQuery['storeLocal'] ?? false ) : false;

            
            
            return ! empty( $store ) && 'false' !== $store;
        }

        

        public static function fetch( $socialQuery = [], $excerpt_length = 25, $force_refresh = false ) {
            $query = self::normalizeQuery( $socialQuery, $excerpt_length );

            
            
            
            $query['per_page'] = self::maxItems( $query['feedType'] );

            $key   = self::cacheKeyFor( $query );
            $entry = get_transient( $key );
            $now   = time();

            $has_entry = is_array( $entry ) && isset( $entry['freshUntil'] );

            if ( ! $force_refresh && $has_entry && $now < (int) $entry['freshUntil'] ) {
                return self::entryResult( $entry );
            }

            
            
            
            if ( ! self::acquireLock( $key ) ) {
                return $has_entry ? self::entryResult( $entry ) : [];
            }

            
            $ttl = $force_refresh ? 0 : self::cacheTtl( $socialQuery );
            $filter_lifetime = function() use ( $ttl ) {
                return $ttl;
            };
            add_filter( 'wp_feed_cache_transient_lifetime', $filter_lifetime );

            $items = self::fetchFresh( $query );

            remove_filter( 'wp_feed_cache_transient_lifetime', $filter_lifetime );

            
            
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

            
            
            if ( ! is_wp_error( $items ) && $items && ! self::storesLocally( $socialQuery ) ) {
                self::remember( $key, $items );
            }

            self::releaseLock( $key );

            return self::entryResult( $fresh );
        }

        

        private static function remember( $key, $items ) {
            update_option( self::keepsakeName( $key ), $items, false );

            $known = get_option( self::KEEPSAKE_INDEX, [] );
            $known = is_array( $known ) ? $known : [];

            
            
            $known = array_values( array_diff( $known, [ $key ] ) );
            $known[] = $key;

            while ( count( $known ) > self::KEEPSAKE_MAX ) {
                delete_option( self::keepsakeName( array_shift( $known ) ) );
            }

            update_option( self::KEEPSAKE_INDEX, $known, false );
        }

        
        private static function recall( $key ) {
            $items = get_option( self::keepsakeName( $key ), [] );

            return is_array( $items ) ? $items : [];
        }

        
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

        

        private static function acquireLock( $key ) {
            $lock = $key . '_lock';
            $held = get_option( $lock );

            if ( $held ) {
                if ( ( time() - (int) $held ) < self::LOCK_TTL ) {
                    return false;
                }

                
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
            
            self::releaseLock( $key );

            
            
            
            
            if ( 'youtube' === $query['feedType'] ) {
                YouTubeFeed::forget( $query );
            }

            
            if ( 'rss' === $query['feedType'] && ! empty( $query['source'] ) ) {
                $md5 = md5( $query['source'] );
                delete_site_transient( 'feed_' . $md5 );
                delete_site_transient( 'feed_mod_' . $md5 );
                delete_transient( 'feed_' . $md5 );
                delete_transient( 'feed_mod_' . $md5 );
            }
        }

        

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
                case 'instagram':
                    
                    
                    
                    
                    
                    return InstagramFeed::items(
                        InstagramFeed::tokenFor( $query['channelId'], $query['source'] ),
                        $query['per_page'],
                        $query['metaDateFormat'],
                        $query['excerptLength'],
                        $query['defaultImageUrl'],
                        $query['titleLength'],
                        $query['igAllowImage'] ?? true,
                        $query['igAllowAlbum'] ?? true,
                        $query['igAllowVideo'] ?? true
                    );
            }

            return new \WP_Error( 'b_slider_feed_unknown_type', __( 'That feed type is not available.', 'b-slider' ) );
        }

        

        public static function normalizeQuery( $socialQuery, $excerpt_length = 25 ) {
            $socialQuery = is_array( $socialQuery ) ? $socialQuery : [];

            
            
            
            $socialQuery = FeedChannels::resolve( $socialQuery );

            $feed_type = self::str( $socialQuery, 'feedType' );
            $feed_type = in_array( $feed_type, self::FEED_TYPES, true ) ? $feed_type : 'youtube';
            $format    = self::str( $socialQuery, 'metaDateFormat' );

            return [
                'feedType'             => $feed_type,
                'source'               => trim( sanitize_text_field( self::str( $socialQuery, 'source' ) ) ),
                
                'per_page'             => self::limit( $socialQuery['per_page'] ?? 12, $feed_type ),
                
                
                
                

                
                
                
                'videoSet'             => YouTubeFeed::videoSet( $socialQuery['videoSet'] ?? 'latest' ),
                'metaDateFormat'       => '' !== $format ? $format : 'M j, Y',
                
                
                'channelId'            => self::str( $socialQuery, 'channelId' ),
                
                
                
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
                'igAllowImage'         => ! isset( $socialQuery['igAllowImage'] ) || (bool) $socialQuery['igAllowImage'],
                'igAllowAlbum'         => ! isset( $socialQuery['igAllowAlbum'] ) || (bool) $socialQuery['igAllowAlbum'],
                'igAllowVideo'         => ! isset( $socialQuery['igAllowVideo'] ) || (bool) $socialQuery['igAllowVideo'],
                'ytPrivacyStatus'      => ! empty( $socialQuery['ytPrivacyStatus'] ) ? sanitize_text_field( (string) $socialQuery['ytPrivacyStatus'] ) : 'all',
                'ytRefreshToken'       => isset( $socialQuery['ytRefreshToken'] ) ? sanitize_text_field( (string) $socialQuery['ytRefreshToken'] ) : '',
            ];
        }

        

        public static function excerptLength( $length ) {
            $length = (int) ( is_scalar( $length ) ? $length : 25 );

            return $length < 0 ? -1 : min( $length, 200 );
        }

        

        private static function str( $socialQuery, $key ) {
            $value = $socialQuery[ $key ] ?? '';

            return is_string( $value ) ? trim( $value ) : '';
        }

        

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

        

        private static function cacheKey( $query ) {
            return 'b_slider_social_' . md5( (string) wp_json_encode( $query ) . '|v' . self::cacheVersion() );
        }

        

        
        const HANDLE_PREFIX = 'b_slider_feed_h_';

        const HANDLE_TTL = WEEK_IN_SECONDS;

        

        public static function pageHandle( $socialQuery = [], $excerpt_length = 25 ) {
            $handle = substr( self::keyFor( $socialQuery, $excerpt_length ), -32 );

            set_transient( self::HANDLE_PREFIX . $handle, [
                'query'         => $socialQuery,
                'excerptLength' => $excerpt_length,
            ], self::HANDLE_TTL );

            return $handle;
        }

        

        public function get_feed_page( \WP_REST_Request $request ) {
            $handle = preg_replace( '/[^a-f0-9]/', '', (string) $request->get_param( 'handle' ) );
            $stored = $handle ? get_transient( self::HANDLE_PREFIX . $handle ) : false;

            if ( ! is_array( $stored ) || ! isset( $stored['query'] ) ) {
                
                
                return rest_ensure_response( [ 'items' => [], 'total' => 0, 'page' => 1, 'expired' => true ] );
            }

            $items = self::items( $stored['query'], isset( $stored['excerptLength'] ) ? $stored['excerptLength'] : 25 );
            $items = is_array( $items ) ? $items : [];

            $per_page = max( 1, (int) $request->get_param( 'per_page' ) );
            $total    = count( $items );
            
            
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

            

            if ( 'youtube' === ( isset( $query['feedType'] ) ? $query['feedType'] : '' )
                && 'random' === ( isset( $query['videoSet'] ) ? $query['videoSet'] : '' ) ) {
                $query['videoSet'] = 'latest';
            }

            return self::cacheKey( $query );
        }

        

        private static function keyFor( $socialQuery, $excerpt_length = 25 ) {
            $query             = self::normalizeQuery( $socialQuery, $excerpt_length );
            $query['per_page'] = self::maxItems( $query['feedType'] );

            return self::cacheKeyFor( $query );
        }

        

        public static function maxItems( $feed_type ) {
            if ( 'youtube' === $feed_type ) {
                return YouTubeFeed::maxItems();
            }

            if ( 'instagram' === $feed_type ) {
                return InstagramFeed::MAX_ITEMS;
            }

            
            return 'youtube_video' === $feed_type ? 1 : 100;
        }

        

        public static function limit( $limit, $feed_type ) {
            $max   = self::maxItems( $feed_type );
            $limit = (int) ( is_scalar( $limit ) ? $limit : $max );

            return ( $limit > 0 && $limit < $max ) ? $limit : $max;
        }
    }

    new SocialFeed();
}
