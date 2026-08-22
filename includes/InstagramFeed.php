<?php

namespace B_SLIDER;

if ( ! defined( 'ABSPATH' ) ) exit;

if ( ! class_exists( __NAMESPACE__ . '\InstagramFeed' ) ) {
    

    class InstagramFeed {

        

        const API_VERSION = 'v21.0';

        
        const PAGE_SIZE = 100;

        

        const MAX_PAGES = 5;

        

        const MAX_ITEMS = self::PAGE_SIZE * self::MAX_PAGES;

        
        const TITLE_WORDS = 12;

        
        const REFRESH_HOOK = 'b_slider_instagram_refresh_tokens';

        

        const REFRESH_WINDOW = 14 * DAY_IN_SECONDS;

        

        const REFRESH_MIN_AGE = DAY_IN_SECONDS;

        

        const REFRESH_RETRY = DAY_IN_SECONDS;

        

        const FIELDS = 'id,caption,media_type,media_product_type,media_url,permalink,thumbnail_url,timestamp,username,children{id,media_type,media_url,thumbnail_url}';

        

        const FIELDS_COUNTS = 'like_count,comments_count';

        

        public static function items( $access_token, $limit = 12, $date_format = 'M j, Y', $excerpt_length = 25, $default_image_url = '', $title_length = -1, $allow_image = true, $allow_album = true, $allow_video = true ) {
            $access_token = is_string( $access_token ) ? trim( $access_token ) : '';

            if ( '' === $access_token ) {
                return new \WP_Error( 'b_slider_instagram_no_token', __( 'Connect an Instagram account to show something here.', 'b-slider' ) );
            }

            $limit = (int) $limit;

            
            
            if ( $limit <= 0 ) {
                $limit = self::PAGE_SIZE;
            }

            
            $read_limit = ( ! $allow_image || ! $allow_album || ! $allow_video ) ? max( $limit * 2, self::PAGE_SIZE ) : $limit;
            $posts = self::read( $access_token, $read_limit );

            if ( is_wp_error( $posts ) ) {
                return $posts;
            }

            $filtered_posts = [];
            foreach ( $posts as $post ) {
                $type = (string) ( $post['media_type'] ?? '' );
                if ( ! $allow_image && 'IMAGE' === $type ) {
                    continue;
                }
                if ( ! $allow_album && 'CAROUSEL_ALBUM' === $type ) {
                    continue;
                }
                if ( ! $allow_video && 'VIDEO' === $type ) {
                    continue;
                }
                $filtered_posts[] = $post;
            }

            $items = [];

            
            
            
            unset( $title_length );

            foreach ( array_slice( $filtered_posts, 0, $limit ) as $index => $post ) {
                $items[] = self::makeItem( $post, $index, $date_format, $excerpt_length, $default_image_url );
            }

            return $items;
        }

        

        private static function read( $access_token, $limit, $fields = null ) {
            $fields = null === $fields ? self::FIELDS . ',' . self::FIELDS_COUNTS : $fields;

            $url = add_query_arg( [
                'fields'       => $fields,
                'limit'        => min( $limit, self::PAGE_SIZE ),
                'access_token' => $access_token,
            ], 'https://graph.instagram.com/' . self::API_VERSION . '/me/media' );

            $posts = [];
            $pages = 0;

            while ( '' !== $url && $pages < self::MAX_PAGES ) {
                $page = self::request( $url );

                if ( is_wp_error( $page ) ) {
                    
                    
                    
                    
                    
                    if ( ! $posts && $fields !== self::FIELDS && self::refusedTheCounts( $page ) ) {
                        return self::read( $access_token, $limit, self::FIELDS );
                    }

                    
                    
                    return $posts ? $posts : $page;
                }

                foreach ( (array) ( $page['data'] ?? [] ) as $post ) {
                    if ( is_array( $post ) ) {
                        $posts[] = $post;
                    }
                }

                if ( count( $posts ) >= $limit ) {
                    break;
                }

                
                
                $next = $page['paging']['next'] ?? '';
                $url  = is_string( $next ) ? $next : '';

                $pages++;
            }

            return $posts;
        }

        

        private static function refusedTheCounts( $error ) {
            $message = strtolower( $error->get_error_message() );

            foreach ( explode( ',', self::FIELDS_COUNTS ) as $field ) {
                if ( false !== strpos( $message, $field ) ) {
                    return true;
                }
            }

            return false;
        }

        

        private static function request( $url ) {
            $response = wp_remote_get( $url, [ 'timeout' => 15 ] );

            if ( is_wp_error( $response ) ) {
                return $response;
            }

            $code = (int) wp_remote_retrieve_response_code( $response );
            $data = json_decode( wp_remote_retrieve_body( $response ), true );

            
            
            if ( is_array( $data ) && isset( $data['error'] ) ) {
                return new \WP_Error( 'b_slider_instagram_api_error', self::errorMessage( $data['error'] ) );
            }

            if ( 200 !== $code ) {
                return new \WP_Error(
                    'b_slider_instagram_http',
                    sprintf(
                        
                        __( 'Instagram answered with HTTP %d.', 'b-slider' ),
                        $code
                    )
                );
            }

            if ( ! is_array( $data ) ) {
                return new \WP_Error( 'b_slider_instagram_bad_body', __( 'Instagram returned something this reader could not make sense of.', 'b-slider' ) );
            }

            return $data;
        }

        

        private static function errorMessage( $error ) {
            $error   = is_array( $error ) ? $error : [];
            $code    = (int) ( $error['code'] ?? 0 );
            $subcode = (int) ( $error['error_subcode'] ?? 0 );

            
            
            if ( 190 === $code || 102 === $code || 463 === $subcode || 467 === $subcode ) {
                return __( 'Instagram would not accept the access token — it has expired or been revoked. Reconnect the account under bSlider → Instagram Accounts.', 'b-slider' );
            }

            if ( 4 === $code || 17 === $code || 32 === $code || 613 === $code ) {
                return __( 'Instagram is rate-limiting this site. The slider keeps showing what it last fetched; it will try again shortly.', 'b-slider' );
            }

            $message = $error['message'] ?? '';

            return '' !== $message ? (string) $message : __( 'Instagram refused the request and did not say why.', 'b-slider' );
        }

        

        

        public static function boot() {
            add_action( self::REFRESH_HOOK, [ __CLASS__, 'refreshDueTokens' ] );
            add_action( 'init', [ __CLASS__, 'scheduleRefresh' ] );
        }

        public static function scheduleRefresh() {
            if ( ! wp_next_scheduled( self::REFRESH_HOOK ) ) {
                wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', self::REFRESH_HOOK );
            }
        }

        
        public static function unscheduleRefresh() {
            wp_clear_scheduled_hook( self::REFRESH_HOOK );
        }

        

        public static function refreshDueTokens() {
            $renewed = 0;

            foreach ( FeedChannels::all() as $channel ) {
                if ( self::renew( $channel ) ) {
                    $renewed++;
                }
            }

            return $renewed;
        }

        

        public static function tokenFor( $channel_id, $token ) {
            $channel = FeedChannels::get( $channel_id );

            if ( ! $channel ) {
                
                
                return $token;
            }

            $fresh = self::renew( $channel );

            return $fresh ?: $token;
        }

        

        private static function renew( $channel ) {
            if ( ! self::isRenewalDue( $channel ) ) {
                return '';
            }

            
            
            
            
            
            
            
            
            
            $tried = (int) ( $channel['tokenTriedAt'] ?? 0 );

            if ( $tried && ( time() - $tried ) < self::REFRESH_RETRY ) {
                return '';
            }

            FeedChannels::markTokenTried( $channel['id'] );

            $fresh = self::refreshToken( $channel['source'] );

            if ( is_wp_error( $fresh ) ) {
                
                
                
                
                FeedChannels::markTokenFailed( $channel['id'] );

                return '';
            }

            if ( ! FeedChannels::updateToken( $channel['id'], $fresh['token'], time() + $fresh['expiresIn'] ) ) {
                return '';
            }

            return $fresh['token'];
        }

        

        private static function isRenewalDue( $channel ) {
            if ( 'instagram' !== ( $channel['feedType'] ?? '' ) || '' === ( $channel['source'] ?? '' ) ) {
                return false;
            }

            $now     = time();
            $expires = (int) ( $channel['tokenExpires'] ?? 0 );

            
            
            if ( $expires && $expires <= $now ) {
                return false;
            }

            
            if ( $expires && ( $expires - $now ) > self::REFRESH_WINDOW ) {
                return false;
            }

            
            
            if ( ! $expires && ( $now - (int) ( $channel['added'] ?? 0 ) ) < self::REFRESH_MIN_AGE ) {
                return false;
            }

            return true;
        }

        

        public static function refreshToken( $token ) {
            $token = is_string( $token ) ? trim( $token ) : '';

            if ( '' === $token ) {
                return new \WP_Error( 'b_slider_instagram_no_token', __( 'There is no access token to renew.', 'b-slider' ) );
            }

            $data = self::request( add_query_arg( [
                'grant_type'   => 'ig_refresh_token',
                'access_token' => $token,
            ], 'https://graph.instagram.com/refresh_access_token' ) );

            if ( is_wp_error( $data ) ) {
                return $data;
            }

            $fresh   = isset( $data['access_token'] ) && is_string( $data['access_token'] ) ? trim( $data['access_token'] ) : '';
            $expires = (int) ( $data['expires_in'] ?? 0 );

            if ( '' === $fresh || $expires <= 0 ) {
                return new \WP_Error( 'b_slider_instagram_refresh_failed', __( 'Instagram answered the renewal without a token in it.', 'b-slider' ) );
            }

            return [ 'token' => $fresh, 'expiresIn' => $expires ];
        }

        

        public static function profile( $token ) {
            $token = is_string( $token ) ? trim( $token ) : '';

            if ( '' === $token ) {
                return new \WP_Error( 'b_slider_instagram_no_token', __( 'Connect an Instagram account first.', 'b-slider' ) );
            }

            $data = self::request( add_query_arg( [
                'fields'       => 'id,username,name,account_type,media_count,followers_count,biography,profile_picture_url,website',
                'access_token' => $token,
            ], 'https://graph.instagram.com/' . self::API_VERSION . '/me' ) );

            if ( is_wp_error( $data ) ) {
                return $data;
            }

            $username = isset( $data['username'] ) ? trim( wp_strip_all_tags( (string) $data['username'] ) ) : '';

            return [
                'id'          => (string) ( $data['id'] ?? '' ),
                'username'    => $username,
                
                
                'name'        => trim( wp_strip_all_tags( (string) ( $data['name'] ?? '' ) ) ) ?: ( '' !== $username ? '@' . $username : '' ),
                'bio'         => trim( wp_strip_all_tags( (string) ( $data['biography'] ?? '' ) ) ),
                'avatar'      => esc_url_raw( (string) ( $data['profile_picture_url'] ?? '' ) ),
                
                
                'banner'      => '',
                
                
                'link'        => '' !== $username ? esc_url_raw( 'https://www.instagram.com/' . $username . '/' ) : '',
                'website'     => esc_url_raw( (string) ( $data['website'] ?? '' ) ),
                'accountType' => (string) ( $data['account_type'] ?? '' ),
                'posts'       => (int) ( $data['media_count'] ?? 0 ),
                'followers'   => (int) ( $data['followers_count'] ?? 0 ),
                
                'views'       => 0,
            ];
        }

        
        private static function makeItem( $post, $index, $date_format, $excerpt_length, $default_image_url ) {
            $username = isset( $post['username'] ) ? trim( wp_strip_all_tags( (string) $post['username'] ) ) : '';
            $caption  = trim( wp_strip_all_tags( (string) ( $post['caption'] ?? '' ) ) );

            list( $title, $description ) = self::split( $caption );

            if ( $excerpt_length > -1 ) {
                $description = wp_trim_words( $description, $excerpt_length, '…' );
            }

            $image_url = self::imageUrl( $post );
            if ( '' === $image_url ) {
                $image_url = (string) $default_image_url;
            }

            $link      = esc_url_raw( (string) ( $post['permalink'] ?? '' ) );
            $timestamp = ! empty( $post['timestamp'] ) ? strtotime( (string) $post['timestamp'] ) : 0;
            $published = $timestamp ? gmdate( 'Y-m-d H:i:s', $timestamp ) : '';

            $thumbnail = [];
            if ( '' !== $image_url && 0 === strpos( $image_url, 'http' ) ) {
                $thumbnail = [
                    'url'      => esc_url_raw( $image_url ),
                    'fallback' => esc_url_raw( $image_url ),
                    'srcset'   => '',
                    'sizes'    => '(max-width: 782px) 100vw, 1080px',
                    
                    
                    'alt'      => '' !== $title
                        ? $title
                        : ( '' !== $username
                            
                            ? sprintf( __( 'Post by @%s on Instagram', 'b-slider' ), $username )
                            : __( 'Instagram post', 'b-slider' ) ),
                ];
            }

            return [
                
                
                
                'id'        => (string) ( $post['id'] ?? $index ),
                'name'      => (string) ( $post['id'] ?? $index ),
                'link'      => $link,
                'thumbnail' => $thumbnail,
                'title'     => esc_html( $title ),
                'content'   => $description,
                'excerpt'   => $description,
                'btnLabel'  => __( 'View on Instagram', 'b-slider' ),
                'author'    => [
                    'name' => $username,
                    'link' => '' !== $username ? esc_url_raw( 'https://www.instagram.com/' . $username . '/' ) : '',
                ],
                'date'            => ( $timestamp && ! empty( $date_format ) ) ? date_i18n( $date_format, $timestamp ) : '',
                
                'dateISO'         => $timestamp ? gmdate( 'c', $timestamp ) : '',
                'dateGMT'         => $published,
                'modifiedDate'    => $published,
                'modifiedDateGMT' => $published,
                
                
                'mediaType'       => (string) ( $post['media_type'] ?? '' ),
                'mediaProduct'    => (string) ( $post['media_product_type'] ?? '' ),
                
                
                
                'caption'         => $caption,
                
                
                
                
                
                'videoUrl'        => 'VIDEO' === ( $post['media_type'] ?? '' ) ? esc_url_raw( (string) ( $post['media_url'] ?? '' ) ) : '',
                
                
                'gallery'         => self::gallery( $post ),
                
                
                
                'likes'           => isset( $post['like_count'] ) ? (int) $post['like_count'] : null,
                'comments'        => isset( $post['comments_count'] ) ? (int) $post['comments_count'] : null,
                'commentCount'    => 0,
                'commentStatus'   => 'closed',
                'categories'      => [ 'coma' => '', 'space' => '' ],
                'taxonomies'      => [],
                'acf_fields'      => [],
                'readTime'        => [ 'min' => 0, 'sec' => 0 ],
                'status'          => 'publish',
                
                
                
                'videoId'         => '',
                'views'           => 0,
                'duration'        => '',
            ];
        }

        

        private static function split( $caption ) {
            if ( '' === $caption ) {
                return [ '', '' ];
            }

            
            $lines = preg_split( '/\R+/', $caption, 2 );
            $rest  = isset( $lines[1] ) ? trim( (string) $lines[1] ) : '';

            
            
            
            if ( self::isTagPile( $lines[0] ) ) {
                return [ '', '' !== $rest ? $rest : $caption ];
            }

            if ( '' !== $rest ) {
                return [ trim( (string) $lines[0] ), $rest ];
            }

            $words = preg_split( '/\s+/u', trim( (string) $lines[0] ), -1, PREG_SPLIT_NO_EMPTY );

            
            if ( count( $words ) <= self::TITLE_WORDS ) {
                return [ implode( ' ', $words ), '' ];
            }

            return [
                implode( ' ', array_slice( $words, 0, self::TITLE_WORDS ) ) . '…',
                implode( ' ', array_slice( $words, self::TITLE_WORDS ) ),
            ];
        }

        

        private static function gallery( $post ) {
            $children = $post['children']['data'] ?? null;
            $items    = is_array( $children ) && $children ? $children : [ $post ];
            $gallery  = [];

            foreach ( $items as $item ) {
                if ( ! is_array( $item ) ) {
                    continue;
                }

                $is_video = 'VIDEO' === ( $item['media_type'] ?? '' );
                $picture  = $is_video ? ( $item['thumbnail_url'] ?? '' ) : ( $item['media_url'] ?? '' );

                if ( '' === $picture ) {
                    continue;
                }

                $gallery[] = [
                    'url'      => esc_url_raw( (string) $picture ),
                    'isVideo'  => $is_video,
                    'videoUrl' => $is_video ? esc_url_raw( (string) ( $item['media_url'] ?? '' ) ) : '',
                ];
            }

            return $gallery;
        }

        

        private static function isTagPile( $line ) {
            $words = preg_split( '/\s+/u', trim( (string) $line ), -1, PREG_SPLIT_NO_EMPTY );

            if ( ! $words ) {
                return false;
            }

            $tags = 0;

            foreach ( $words as $word ) {
                if ( '#' === substr( $word, 0, 1 ) || '@' === substr( $word, 0, 1 ) ) {
                    $tags++;
                }
            }

            return ( $tags / count( $words ) ) > 0.6;
        }

        

        private static function imageUrl( $post ) {
            $type = (string) ( $post['media_type'] ?? '' );

            if ( 'VIDEO' === $type ) {
                return (string) ( $post['thumbnail_url'] ?? '' );
            }

            if ( 'CAROUSEL_ALBUM' === $type ) {
                foreach ( (array) ( $post['children']['data'] ?? [] ) as $child ) {
                    if ( ! is_array( $child ) ) {
                        continue;
                    }

                    $url = ( 'VIDEO' === ( $child['media_type'] ?? '' ) )
                        ? (string) ( $child['thumbnail_url'] ?? '' )
                        : (string) ( $child['media_url'] ?? '' );

                    if ( '' !== $url ) {
                        return $url;
                    }
                }

                
                
                return (string) ( $post['media_url'] ?? '' );
            }

            $url = (string) ( $post['media_url'] ?? '' );

            return '' !== $url ? $url : (string) ( $post['thumbnail_url'] ?? '' );
        }
    }

    InstagramFeed::boot();
}
