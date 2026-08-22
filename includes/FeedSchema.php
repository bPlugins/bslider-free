<?php

namespace B_SLIDER;

if ( ! defined( 'ABSPATH' ) ) exit;

if ( ! class_exists( __NAMESPACE__ . '\FeedSchema' ) ) {
    

    class FeedSchema {

        

        public static function build( $items, $mode = 'video' ) {
            $items = array_values( array_filter( (array) $items ) );

            if ( ! $items || ! in_array( $mode, [ 'video', 'list' ], true ) ) {
                return null;
            }

            $elements = [];
            $position = 1;

            foreach ( $items as $item ) {
                $entry = 'video' === $mode ? self::videoObject( $item ) : self::listItem( $item );

                if ( ! $entry ) {
                    continue;
                }

                $elements[] = [
                    '@type'    => 'ListItem',
                    'position' => $position++,
                    'item'     => $entry,
                ];
            }

            if ( ! $elements ) {
                return null;
            }

            return [
                '@context'        => 'https://schema.org',
                '@type'           => 'ItemList',
                'itemListElement' => $elements,
            ];
        }

        

        private static function videoObject( $item ) {
            $title     = self::text( $item['title'] ?? '' );
            $thumbnail = self::thumbnail( $item );
            $uploaded  = self::isoDate( $item['dateGMT'] ?? '' );

            if ( '' === $title || '' === $thumbnail || '' === $uploaded ) {
                return null;
            }

            $video = [
                '@type'        => 'VideoObject',
                'name'         => $title,
                
                
                'description'  => self::text( $item['content'] ?? '' ) ?: $title,
                'thumbnailUrl' => $thumbnail,
                'uploadDate'   => $uploaded,
            ];

            if ( ! empty( $item['link'] ) ) {
                $video['contentUrl'] = esc_url_raw( $item['link'] );
            }

            
            
            if ( ! empty( $item['videoId'] ) ) {
                $video['embedUrl'] = 'https://www.youtube.com/embed/' . $item['videoId'];
            }

            if ( ! empty( $item['durationISO'] ) ) {
                $video['duration'] = (string) $item['durationISO'];
            }

            if ( ! empty( $item['views'] ) ) {
                $video['interactionStatistic'] = [
                    '@type'                => 'InteractionCounter',
                    'interactionType'      => [ '@type' => 'WatchAction' ],
                    'userInteractionCount' => (int) $item['views'],
                ];
            }

            if ( ! empty( $item['author']['name'] ) ) {
                $video['author'] = array_filter( [
                    '@type' => 'Person',
                    'name'  => self::text( $item['author']['name'] ),
                    'url'   => ! empty( $item['author']['link'] ) ? esc_url_raw( $item['author']['link'] ) : null,
                ] );
            }

            return $video;
        }

        

        private static function listItem( $item ) {
            $title = self::text( $item['title'] ?? '' );

            if ( '' === $title ) {
                return null;
            }

            return array_filter( [
                '@type' => 'CreativeWork',
                'name'  => $title,
                'url'   => ! empty( $item['link'] ) ? esc_url_raw( $item['link'] ) : null,
                'image' => self::thumbnail( $item ) ?: null,
            ] );
        }

        

        private static function thumbnail( $item ) {
            $url = $item['thumbnail']['url'] ?? '';

            return is_string( $url ) && 0 === strpos( $url, 'http' ) ? esc_url_raw( $url ) : '';
        }

        

        private static function text( $value ) {
            $value = html_entity_decode( (string) $value, ENT_QUOTES, 'UTF-8' );

            return trim( wp_strip_all_tags( $value ) );
        }

        
        private static function isoDate( $date ) {
            $stamp = $date ? strtotime( (string) $date ) : false;

            return $stamp ? gmdate( 'c', $stamp ) : '';
        }

        

        public static function render( $items, $mode = 'video' ) {
            $schema = self::build( $items, $mode );

            if ( ! $schema ) {
                return '';
            }

            return (string) wp_json_encode( $schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );
        }
    }
}
