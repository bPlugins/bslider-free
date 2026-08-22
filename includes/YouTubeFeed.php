<?php

namespace B_SLIDER;

if ( ! defined( 'ABSPATH' ) ) exit;

if ( ! class_exists( __NAMESPACE__ . '\YouTubeFeed' ) ) {
    

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

        
        const MAX_FEED_ITEMS = 15;

        

        const MAX_API_ITEMS = 500;

        
        const API_PAGE_SIZE = 50;

        

        const FETCH_TIME_BUDGET = 10;

        const TIMEOUT = 10;

        

        const ID_TTL = MONTH_IN_SECONDS;

        

        const THUMB_QUALITIES = [ 'maxresdefault', 'sddefault', 'hqdefault', 'mqdefault', 'default' ];

        

        const VIDEO_SETS = [
            'latest'  => 'UU',
            'popular' => 'UULP',
            
            
            
            'oldest'  => '',
            'long'    => 'UULF',
            'shorts'  => 'UUSH',
            
            
            
            
            
            'random'  => 'UU',
        ];

        
        const KEYED_SETS = [ 'oldest' ];

        

        const OLDEST_MAX_PAGES = 40;

        const OLDEST_TIME_BUDGET = 10;

        

        const OLDEST_TTL = MONTH_IN_SECONDS;

        
        public static function videoSet( $set ) {
            $set = is_scalar( $set ) ? (string) $set : '';

            return isset( self::VIDEO_SETS[ $set ] ) ? $set : 'latest';
        }

        
        
        

        

        

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

        

        private static function fetchLimit( $limit, $privacy_status ) {
            $original = self::limit( $limit );
            $wanted   = ( 'all' !== $privacy_status ) ? max( $original * 2, self::API_PAGE_SIZE ) : $original;

            return self::limit( $wanted );
        }

        

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

            
            
            $search_term = (string) ( $query['ytSearchTerm'] ?? '' );
            if ( 'search' === ( $query['ytQueryType'] ?? 'channel' ) && '' !== $search_term ) {
                delete_transient( self::searchKey( $search_term, $channel_id, $limit ) );
            }

            
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

        
        public static function hasApiKey() {
            return '' !== SocialFeed::apiKey();
        }

        
        public static function maxItems() {
            return self::hasApiKey() ? self::MAX_API_ITEMS : self::MAX_FEED_ITEMS;
        }

        

        public static function limit( $limit ) {
            $max   = self::maxItems();
            $limit = (int) ( is_scalar( $limit ) ? $limit : $max );

            return ( $limit > 0 && $limit < $max ) ? $limit : $max;
        }

        

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

        

        private static function oldest( $resolved, $limit, $date_format, $excerpt_length ) {
            if ( ! self::hasApiKey() ) {
                return new \WP_Error(
                    'b_slider_yt_oldest_needs_key',
                    __( 'Showing a channel’s oldest videos needs a YouTube API key. Without one the public feed only ever returns the 15 most recent, so there is no way to reach the older ones.', 'b-slider' )
                );
            }

            
            
            $playlist_id = 'playlist' === $resolved['resource']
                ? $resolved['id']
                : 'UU' . substr( $resolved['id'], 2 );

            
            
            
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

        

        private static function walkToEnd( $playlist_id, $keep ) {
            $started    = microtime( true );
            $tail       = [];
            $page_token = '';
            $pages      = 0;

            do {
                $query = [
                    'part'       => 'snippet,contentDetails,status',
                    'playlistId' => $playlist_id,
                    
                    
                    'maxResults' => self::API_PAGE_SIZE,
                ];

                if ( '' !== $page_token ) {
                    $query['pageToken'] = $page_token;
                }

                $body = self::apiGet( 'playlistItems', $query );

                if ( is_wp_error( $body ) ) {
                    return $body;
                }

                
                
                if ( 0 === $pages ) {
                    $total = (int) ( $body['pageInfo']['totalResults'] ?? 0 );

                    if ( $total > self::OLDEST_MAX_PAGES * self::API_PAGE_SIZE ) {
                        return new \WP_Error(
                            'b_slider_yt_oldest_too_big',
                            sprintf(
                                
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

            
            return array_reverse( $tail, true );
        }

        

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

            

            set_transient( $cache_key, $items, $ttl > 0 ? (int) $ttl : SocialFeed::CACHE_TTL );

            return $items;
        }

        
        
        

        

        public static function resolve( $input ) {
            $input = trim( (string) $input );

            if ( '' === $input ) {
                return new \WP_Error( 'b_slider_yt_empty', __( 'Paste a YouTube channel URL, @handle or ID.', 'b-slider' ) );
            }

            
            if ( preg_match( '/^UC[\w-]{22}$/', $input ) ) {
                return [ 'resource' => 'channel', 'id' => $input ];
            }

            if ( preg_match( '/^(PL|UU|FL|LL|OL)[\w-]{10,}$/', $input ) ) {
                return [ 'resource' => 'playlist', 'id' => $input ];
            }

            
            
            if ( preg_match( '/[?&]list=([\w-]{10,})/', $input, $m ) ) {
                return [ 'resource' => 'playlist', 'id' => $m[1] ];
            }

            if ( preg_match( '#youtube\.com/channel/(UC[\w-]{22})#i', $input, $m ) ) {
                return [ 'resource' => 'channel', 'id' => $m[1] ];
            }

            
            
            if ( preg_match( '#(?:youtu\.be/|youtube\.com/(?:watch\?|shorts/|embed/|live/|v/))#i', $input ) ) {
                return new \WP_Error(
                    'b_slider_yt_single_video',
                    __( 'That is a single video. Paste the channel URL, its @handle, or a playlist URL instead.', 'b-slider' )
                );
            }

            
            if ( preg_match( '#youtube\.com/(@[\w.-]+|c/[\w.-]+|user/[\w.-]+)#i', $input, $m ) ) {
                return self::channelIdOf( $m[1] );
            }

            
            if ( preg_match( '/^@?([\w.-]{3,})$/', $input, $m ) ) {
                return self::channelIdOf( '@' . $m[1] );
            }

            return new \WP_Error(
                'b_slider_yt_unrecognised',
                __( 'That does not look like a YouTube channel or playlist. Paste the channel URL, its @handle, or its UC… ID.', 'b-slider' )
            );
        }

        

        const CHANNEL_ID_PATTERNS = [
            '#<meta\s+itemprop="identifier"\s+content="(UC[\w-]{22})"#i',
            '#<link\s+rel="canonical"\s+href="https?://www\.youtube\.com/channel/(UC[\w-]{22})"#i',
            '/"externalId":"(UC[\w-]{22})"/',
        ];

        

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

        

        private static function channelIdFromPage( $path ) {
            
            
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

        

        private static function isConfirmed( $resolved ) {
            return ! empty( $resolved['confirmed'] );
        }

        
        
        

        

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

            

            $branding = is_array( $item['brandingSettings']['image'] ?? null ) ? $item['brandingSettings']['image'] : [];
            $banner   = trim( (string) ( $branding['bannerExternalUrl'] ?? '' ) );

            return [
                'id'          => (string) ( $item['id'] ?? $channel_id ),
                'username'    => $handle,
                'name'        => trim( wp_strip_all_tags( (string) ( $snippet['title'] ?? '' ) ) ),
                'bio'         => trim( wp_strip_all_tags( (string) ( $snippet['description'] ?? '' ) ) ),
                'avatar'      => esc_url_raw( self::bestApiThumb( $snippet['thumbnails'] ?? [] ) ),
                'banner'      => '' !== $banner ? esc_url_raw( $banner . '=w2560' ) : '',
                
                
                'link'        => esc_url_raw( '' !== $handle
                    ? 'https://www.youtube.com/@' . $handle
                    : 'https://www.youtube.com/channel/' . $channel_id ),
                'website'     => '',
                'accountType' => 'youtube',
                'posts'       => (int) ( $stats['videoCount'] ?? 0 ),
                
                
                'followers'   => (int) ( $stats['subscriberCount'] ?? 0 ),
                
                
                'views'       => (int) ( $stats['viewCount'] ?? 0 ),
            ];
        }

        
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

        
        
        

        
        private static function fromFeed( $resolved, $limit, $date_format, $excerpt_length = 25 ) {
            $arg  = 'playlist' === $resolved['resource'] ? 'playlist_id' : 'channel_id';
            $body = self::get( add_query_arg( $arg, $resolved['id'], self::FEED_URL ) );

            if ( is_wp_error( $body ) ) {
                
                
                
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

        
        
        

        

        private static function fromApi( $resolved, $limit, $date_format, $excerpt_length = 25 ) {
            $playlist_id = 'playlist' === $resolved['resource']
                ? $resolved['id']
                : 'UU' . substr( $resolved['id'], 2 );

            $entries    = [];
            $page_token = '';

            

            $deadline = microtime( true ) + self::FETCH_TIME_BUDGET;

            
            
            
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

            
            
            if ( empty( $snippet['thumbnails'] ) ) {
                return null;
            }

            $owner_id  = $snippet['videoOwnerChannelId'] ?? ( $snippet['channelId'] ?? '' );
            
            
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

        

        private static function apiDetails( $video_ids, $deadline = null ) {
            $details = [];

            foreach ( array_chunk( $video_ids, self::API_PAGE_SIZE ) as $chunk ) {
                

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

        
        
        

        

        private static function makeItem( $entry, $date_format, $excerpt_length = 25, $duration_iso = '' ) {
            $video_id = $entry['video_id'];
            $title    = trim( wp_strip_all_tags( (string) $entry['title'] ) );

            
            
            
            $description = Posts::applyBSBFilter( (string) $entry['description'] );

            
            
            
            
            
            
            
            
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
                    
                    
                    
                    'fallback' => ( 'maxresdefault' === self::$current_quality ) ? self::thumbUrl( $video_id, 'mqdefault' ) : ( esc_url_raw( (string) $entry['feed_thumb'] ) ?: self::thumbUrl( $video_id, 'hqdefault' ) ),
                    'srcset'   => self::srcset( $video_id ),
                    
                    
                    
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
                
                'dateISO'         => $published ? gmdate( 'c', strtotime( $published ) ) : '',
                'dateGMT'         => $published,
                'modifiedDate'    => (string) $entry['updated'],
                'modifiedDateGMT' => (string) $entry['updated'],
                
                
                'commentCount'  => 0,
                'commentStatus' => 'closed',
                'categories'    => [ 'coma' => '', 'space' => '' ],
                'taxonomies'    => [],
                'acf_fields'    => [],
                'readTime'      => [ 'min' => 0, 'sec' => 0 ],
                'status'        => 'publish',
                
                
                
                'videoId'  => $video_id,
                'views'    => (int) $entry['views'],
                'duration' => self::formatDuration( $duration_iso ),
                
                
                'durationISO' => $duration_iso,
                'privacy'     => (string) ( $entry['privacy'] ?? 'public' ),
            ];
        }

        

        const SRCSET_WIDTHS = [ 'mqdefault' => 320, 'maxresdefault' => 1280 ];

        

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

        
        public static function thumbUrl( $video_id, $quality ) {
            $quality = in_array( $quality, self::THUMB_QUALITIES, true ) ? $quality : 'maxresdefault';

            return sprintf( 'https://i.ytimg.com/vi/%s/%s.jpg', $video_id, $quality );
        }

        

        public static function durationSeconds( $duration ) {
            if ( ! $duration || ! preg_match( '/^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/', (string) $duration, $m ) ) {
                return 0;
            }

            return ( (int) ( $m[1] ?? 0 ) ) * DAY_IN_SECONDS
                + ( (int) ( $m[2] ?? 0 ) ) * HOUR_IN_SECONDS
                + ( (int) ( $m[3] ?? 0 ) ) * MINUTE_IN_SECONDS
                + ( (int) ( $m[4] ?? 0 ) );
        }

        
        public static function formatDuration( $duration ) {
            $seconds = self::durationSeconds( $duration );

            if ( $seconds <= 0 ) {
                return '';
            }

            return $seconds >= HOUR_IN_SECONDS
                ? sprintf( '%d:%02d:%02d', floor( $seconds / HOUR_IN_SECONDS ), floor( ( $seconds % HOUR_IN_SECONDS ) / MINUTE_IN_SECONDS ), $seconds % MINUTE_IN_SECONDS )
                : sprintf( '%d:%02d', floor( $seconds / MINUTE_IN_SECONDS ), $seconds % MINUTE_IN_SECONDS );
        }

        
        const RETRY_CODES = [ 404, 429, 500, 502, 503, 504 ];

        

        const MAX_ATTEMPTS = 3;
        const RETRY_WAITS  = [ 500000, 1500000 ];

        

        private static function get( $url, $attempt = 1 ) {
            $response = wp_remote_get( $url, [
                'timeout' => self::TIMEOUT,
                
                
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

        

        public static function single_video( $source, $date_format = 'M j, Y' ) {
            $video_id = self::extractVideoId( $source );
            if ( ! $video_id ) {
                return new \WP_Error( 'b_slider_invalid_video_url', __( 'Please enter a valid YouTube video URL.', 'b-slider' ) );
            }

            $api_key = SocialFeed::apiKey();
            $entry = null;

            if ( $api_key ) {
                
                
                
                
                $url = add_query_arg(
                    [
                        'part' => 'snippet,contentDetails,statistics',
                        'id'   => $video_id,
                        'key'  => $api_key,
                    ],
                    self::API_BASE . 'videos'
                );
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
