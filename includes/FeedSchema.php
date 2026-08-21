<?php

namespace B_SLIDER;

if ( ! defined( 'ABSPATH' ) ) exit;

if ( ! class_exists( __NAMESPACE__ . '\FeedSchema' ) ) {
    /**
     * Structured data for a feed slider, so search engines can read what it holds.
     *
     * A slider is a list of pictures and links to a crawler — the titles are in the markup, but
     * nothing says these are videos, how long they are, or when they were published. This writes
     * that out as JSON-LD: an `ItemList` of `VideoObject`s, which is the shape Google documents for
     * a page carrying several videos.
     *
     * Feed-agnostic like the rest: it reads the normalized item shape, so a reader added later for
     * RSS or Instagram gets markup by declaring a different `@type` here and nothing else.
     *
     * ⚠️ **A judgement call the site owner has to make.** Google asks that `VideoObject` describe
     * video that is genuinely the page's content, and these slides link out to YouTube rather than
     * playing in place. For a slider whose whole purpose is the channel's videos that is a fair
     * description; on a page where the slider is an aside it is overreach, and Google may ignore the
     * markup or take it as spam. Hence the setting, and hence `itemListOnly` for the safe half.
     */
    class FeedSchema {

        /**
         * The markup for a set of items, or `null` when there is nothing worth writing.
         *
         * @param array  $items    Normalized items.
         * @param string $mode     `video` for VideoObject, `list` for a plain ItemList, anything
         *                         else for nothing at all.
         * @return array|null
         */
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

        /**
         * One item as a `VideoObject`.
         *
         * `name`, `thumbnailUrl` and `uploadDate` are the three Google treats as required, so an
         * item missing any of them is left out rather than described badly — incomplete markup is
         * worse than none.
         */
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
                // A description is required too, and the title is a truthful stand-in when the
                // service gave none — several YouTube videos come through with an empty one.
                'description'  => self::text( $item['content'] ?? '' ) ?: $title,
                'thumbnailUrl' => $thumbnail,
                'uploadDate'   => $uploaded,
            ];

            if ( ! empty( $item['link'] ) ) {
                $video['contentUrl'] = esc_url_raw( $item['link'] );
            }

            // Only YouTube items carry a `videoId`, and only they have an embed URL that can be
            // stated. A reader without one simply omits it.
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

        /**
         * One item as a plain linked thing.
         *
         * Says the page holds an ordered list of named links and nothing more. Nothing here can be
         * wrong about the content, which is the point of offering it.
         */
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

        /**
         * The picture to name.
         *
         * The local copy when there is one — it is the URL on the page, and pointing search engines
         * at a third party's file for an image this site serves is simply inaccurate.
         */
        private static function thumbnail( $item ) {
            $url = $item['thumbnail']['url'] ?? '';

            return is_string( $url ) && 0 === strpos( $url, 'http' ) ? esc_url_raw( $url ) : '';
        }

        /**
         * Plain text for a JSON string.
         *
         * The items hold text already escaped for writing into HTML — `&amp;` for an ampersand — and
         * JSON-LD is not HTML, so those entities have to come back out or a title reads
         * "Player &amp;amp; Controls" in a search result.
         */
        private static function text( $value ) {
            $value = html_entity_decode( (string) $value, ENT_QUOTES, 'UTF-8' );

            return trim( wp_strip_all_tags( $value ) );
        }

        /** A date as ISO 8601, which is the only form schema.org accepts. */
        private static function isoDate( $date ) {
            $stamp = $date ? strtotime( (string) $date ) : false;

            return $stamp ? gmdate( 'c', $stamp ) : '';
        }

        /**
         * The markup, ready to print.
         *
         * Returns the JSON-LD string (without a wrapping `<script>` tag). The caller is expected
         * to output it with `wp_print_inline_script_tag()`, which is the WordPress-approved way
         * to write a `<script>` block — it handles the escaping the tag needs and is what PCP
         * recognises as safe.
         *
         * `wp_json_encode` with `JSON_UNESCAPED_SLASHES` so the URLs stay readable.
         *
         * @return string The JSON-LD string, or empty when there is nothing to write.
         */
        public static function render( $items, $mode = 'video' ) {
            $schema = self::build( $items, $mode );

            if ( ! $schema ) {
                return '';
            }

            return (string) wp_json_encode( $schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE );
        }
    }
}
