<?php

namespace B_SLIDER;

if ( ! defined( 'ABSPATH' ) ) exit;

if ( ! class_exists( __NAMESPACE__ . '\FeedChannels' ) ) {
    

    class FeedChannels {

        
        const OPTION = 'b_slider_feed_channels';

        
        const MAX = 100;

        

        public static function all() {
            $stored = get_option( self::OPTION, [] );
            $stored = is_array( $stored ) ? $stored : [];

            $channels = [];

            foreach ( $stored as $channel ) {
                $channel = self::shape( $channel );

                if ( '' !== $channel['id'] ) {
                    $channels[] = $channel;
                }
            }

            return $channels;
        }

        
        public static function get( $id ) {
            $id = self::id( $id );

            if ( '' === $id ) {
                return null;
            }

            foreach ( self::all() as $channel ) {
                if ( $channel['id'] === $id ) {
                    return $channel;
                }
            }

            return null;
        }

        

        public static function save( $input ) {
            $input = is_array( $input ) ? $input : [];
            $id    = self::id( $input['id'] ?? '' );

            $channel  = self::shape( $input );
            $existing = '' !== $id ? self::get( $id ) : null;

            
            
            
            
            
            if ( $existing && '' === $channel['source'] ) {
                $channel['source'] = $existing['source'];
            }

            if ( $existing && empty( $channel['ytRefreshToken'] ) ) {
                $channel['ytRefreshToken'] = $existing['ytRefreshToken'] ?? '';
            }

            if ( '' === $channel['source'] ) {
                return new \WP_Error( 'b_slider_channel_no_source', __( 'A channel needs an address.', 'b-slider' ), [ 'status' => 400 ] );
            }

            if ( ! in_array( $channel['feedType'], SocialFeed::FEED_TYPES, true ) ) {
                return new \WP_Error( 'b_slider_channel_bad_type', __( 'That feed type is not available.', 'b-slider' ), [ 'status' => 400 ] );
            }

            $channels = self::all();
            $found    = false;

            
            
            foreach ( $channels as $index => $candidate ) {
                if ( '' !== $id && $candidate['id'] === $id ) {
                    
                    
                    $channel['id']    = $candidate['id'];
                    $channel['added'] = $candidate['added'];
                    
                    
                    
                    
                    
                    
                    
                    $same = $channel['source'] === $candidate['source'];

                    $channel['tokenExpires']  = $same ? (int) ( $candidate['tokenExpires'] ?? 0 ) : 0;
                    $channel['tokenFailedAt'] = $same ? (int) ( $candidate['tokenFailedAt'] ?? 0 ) : 0;
                    $channel['tokenTriedAt']  = $same ? (int) ( $candidate['tokenTriedAt'] ?? 0 ) : 0;
                    $channels[ $index ] = $channel;
                    $found = true;
                    break;
                }
            }

            if ( ! $found ) {
                if ( count( $channels ) >= self::MAX ) {
                    return new \WP_Error(
                        'b_slider_channel_limit',
                        sprintf(
                            
                            __( 'A site can save up to %d channels.', 'b-slider' ),
                            self::MAX
                        ),
                        [ 'status' => 400 ]
                    );
                }

                
                
                $twin = self::findBySource( $channel['feedType'], $channel['source'] );

                if ( $twin ) {
                    return $twin;
                }

                $channel['id']    = self::newId();
                $channel['added'] = time();
                $channels[]       = $channel;
            }

            update_option( self::OPTION, $channels );

            return $channel;
        }

        

        public static function delete( $id ) {
            $id       = self::id( $id );
            $channels = self::all();
            $kept     = array_values( array_filter( $channels, function( $channel ) use ( $id ) {
                return $channel['id'] !== $id;
            } ) );

            if ( count( $kept ) === count( $channels ) ) {
                return false;
            }

            update_option( self::OPTION, $kept );

            return true;
        }

        

        public static function updateToken( $id, $token, $expires_at ) {
            $id    = self::id( $id );
            $token = self::text( $token );

            if ( '' === $id || '' === $token ) {
                return false;
            }

            $channels = self::all();
            $written  = false;

            foreach ( $channels as $index => $channel ) {
                if ( $channel['id'] !== $id ) {
                    continue;
                }

                $channels[ $index ]['source']        = $token;
                $channels[ $index ]['tokenExpires']  = (int) $expires_at;
                
                $channels[ $index ]['tokenFailedAt'] = 0;
                $written = true;
                break;
            }

            if ( $written ) {
                update_option( self::OPTION, $channels );
            }

            return $written;
        }

        
        const WARN_WINDOW = 7 * DAY_IN_SECONDS;

        

        public static function markTokenTried( $id ) {
            $id       = self::id( $id );
            $channels = self::all();

            foreach ( $channels as $index => $channel ) {
                if ( $channel['id'] === $id ) {
                    $channels[ $index ]['tokenTriedAt'] = time();
                    update_option( self::OPTION, $channels );

                    return true;
                }
            }

            return false;
        }

        
        public static function markTokenFailed( $id ) {
            $id       = self::id( $id );
            $channels = self::all();

            foreach ( $channels as $index => $channel ) {
                if ( $channel['id'] === $id ) {
                    
                    
                    
                    if ( empty( $channel['tokenFailedAt'] ) ) {
                        $channels[ $index ]['tokenFailedAt'] = time();
                        update_option( self::OPTION, $channels );
                    }

                    return true;
                }
            }

            return false;
        }

        

        public static function tokenState( $channel ) {
            if ( 'instagram' !== ( $channel['feedType'] ?? '' ) || '' === ( $channel['source'] ?? '' ) ) {
                return '';
            }

            $now     = time();
            $expires = (int) ( $channel['tokenExpires'] ?? 0 );

            
            if ( $expires && $expires <= $now ) {
                return 'expired';
            }

            
            
            if ( ! empty( $channel['tokenFailedAt'] ) ) {
                return 'failing';
            }

            if ( $expires && ( $expires - $now ) < self::WARN_WINDOW ) {
                return 'expiring';
            }

            return $expires ? 'ok' : 'unknown';
        }

        

        public static function forDisplay( $channel ) {
            $source    = $channel['source'] ?? '';
            $feed_type = $channel['feedType'] ?? '';

            if ( 'instagram' === $feed_type && '' !== $source ) {
                $expires = (int) ( $channel['tokenExpires'] ?? 0 );
                $state = self::tokenState( $channel );

                $channel['sourceMasked'] = str_repeat( '•', 8 ) . substr( $source, -4 );
                $channel['hasSource']    = true;
                $channel['source']       = '';
                $channel['tokenState']   = $state;
                
                
                $channel['tokenDays']    = $expires ? (int) ceil( ( $expires - time() ) / DAY_IN_SECONDS ) : 0;
            }

            if ( 'youtube' === $feed_type && ! empty( $channel['ytRefreshToken'] ) ) {
                $channel['ytRefreshTokenMasked'] = str_repeat( '•', 8 ) . substr( $channel['ytRefreshToken'], -4 );
                $channel['hasYtRefreshToken']    = true;
                $channel['ytRefreshToken']       = '';
            }

            return $channel;
        }

        
        public static function findBySource( $feed_type, $source ) {
            $source = self::normalizeSource( $source, $feed_type );

            foreach ( self::all() as $channel ) {
                if ( $channel['feedType'] === $feed_type && self::normalizeSource( $channel['source'], $channel['feedType'] ) === $source ) {
                    return $channel;
                }
            }

            return null;
        }

        

        public static function resolve( $socialQuery ) {
            $socialQuery = is_array( $socialQuery ) ? $socialQuery : [];
            $channel     = self::get( $socialQuery['channelId'] ?? '' );

            if ( ! $channel ) {
                return $socialQuery;
            }

            

            $asked = is_string( $socialQuery['feedType'] ?? '' ) ? trim( $socialQuery['feedType'] ) : '';

            if ( '' !== $asked && $asked !== $channel['feedType'] ) {
                $socialQuery['channelId'] = '';

                return $socialQuery;
            }

            $socialQuery['feedType'] = $channel['feedType'];
            $socialQuery['source']   = $channel['source'];
            if ( 'json' === $channel['feedType'] ) {
                $socialQuery['jsonRootKey']    = ! empty( $socialQuery['jsonRootKey'] ) ? $socialQuery['jsonRootKey'] : ( $channel['jsonRootKey'] ?? '' );
                $socialQuery['jsonImageKey']   = ! empty( $socialQuery['jsonImageKey'] ) ? $socialQuery['jsonImageKey'] : ( $channel['jsonImageKey'] ?? '' );
                $socialQuery['jsonTitleKey']   = ! empty( $socialQuery['jsonTitleKey'] ) ? $socialQuery['jsonTitleKey'] : ( $channel['jsonTitleKey'] ?? '' );
                $socialQuery['jsonLinkKey']    = ! empty( $socialQuery['jsonLinkKey'] ) ? $socialQuery['jsonLinkKey'] : ( $channel['jsonLinkKey'] ?? '' );
                $socialQuery['jsonExcerptKey'] = ! empty( $socialQuery['jsonExcerptKey'] ) ? $socialQuery['jsonExcerptKey'] : ( $channel['jsonExcerptKey'] ?? '' );
                $socialQuery['jsonButtonTextKey'] = ! empty( $socialQuery['jsonButtonTextKey'] ) ? $socialQuery['jsonButtonTextKey'] : ( $channel['jsonButtonTextKey'] ?? '' );
                $socialQuery['jsonDateKey']       = ! empty( $socialQuery['jsonDateKey'] ) ? $socialQuery['jsonDateKey'] : ( $channel['jsonDateKey'] ?? '' );
                $socialQuery['jsonAuthorKey']     = ! empty( $socialQuery['jsonAuthorKey'] ) ? $socialQuery['jsonAuthorKey'] : ( $channel['jsonAuthorKey'] ?? '' );
            }

            if ( 'youtube' === $channel['feedType'] ) {
                $socialQuery['ytRefreshToken'] = ! empty( $socialQuery['ytRefreshToken'] ) ? $socialQuery['ytRefreshToken'] : ( $channel['ytRefreshToken'] ?? '' );
            }

            return $socialQuery;
        }

        
        private static function shape( $channel ) {
            $channel = is_array( $channel ) ? $channel : [];

            $feed_type = self::text( $channel['feedType'] ?? '' );

            return [
                'id'     => self::id( $channel['id'] ?? '' ),
                
                
                'label'  => self::text( $channel['label'] ?? '' ) ?: self::text( $channel['source'] ?? '' ),
                'feedType' => '' !== $feed_type ? $feed_type : 'youtube',
                'source' => self::text( $channel['source'] ?? '' ),
                'added'  => (int) ( $channel['added'] ?? 0 ),
                
                
                
                
                'tokenExpires' => (int) ( $channel['tokenExpires'] ?? 0 ),
                
                
                
                
                'tokenFailedAt' => (int) ( $channel['tokenFailedAt'] ?? 0 ),
                
                
                
                
                
                'tokenTriedAt' => (int) ( $channel['tokenTriedAt'] ?? 0 ),
                'jsonRootKey'    => self::text( $channel['jsonRootKey'] ?? '' ),
                'jsonImageKey'   => self::text( $channel['jsonImageKey'] ?? '' ),
                'jsonTitleKey'   => self::text( $channel['jsonTitleKey'] ?? '' ),
                'jsonLinkKey'    => self::text( $channel['jsonLinkKey'] ?? '' ),
                'jsonExcerptKey' => self::text( $channel['jsonExcerptKey'] ?? '' ),
                'jsonButtonTextKey' => self::text( $channel['jsonButtonTextKey'] ?? '' ),
                'jsonDateKey'       => self::text( $channel['jsonDateKey'] ?? '' ),
                'jsonAuthorKey'     => self::text( $channel['jsonAuthorKey'] ?? '' ),
                'ytRefreshToken'    => self::text( $channel['ytRefreshToken'] ?? '' ),
            ];
        }

        
        private static function id( $id ) {
            $id = is_string( $id ) ? trim( $id ) : '';

            return preg_match( '/^ch_[a-f0-9]{12}$/', $id ) ? $id : '';
        }

        private static function newId() {
            return 'ch_' . substr( md5( uniqid( '', true ) ), 0, 12 );
        }

        private static function text( $value ) {
            return is_string( $value ) ? trim( sanitize_text_field( $value ) ) : '';
        }

        

        private static function normalizeSource( $source, $feed_type = '' ) {
            $source = self::text( $source );
            if ( 'instagram' === $feed_type ) {
                return $source;
            }
            $source = strtolower( $source );
            $source = preg_replace( '#^https?://#', '', $source );
            $source = preg_replace( '#^www\.#', '', $source );
            $source = preg_replace( '#^youtube\.com/#', '', $source );

            return rtrim( (string) preg_replace( '#/(videos|featured|streams|shorts|playlists)/?$#', '', $source ), '/' );
        }
    }
}
