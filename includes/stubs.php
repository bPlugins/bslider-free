<?php
/**
 * What the Premium classes for keeping a feed on this site would do, doing nothing.
 *
 * `SocialFeed` calls `FeedStore`, `FeedMedia` and `FeedSync` in about twenty places. Keeping a feed
 * locally is Premium, so the real classes are not here — and rather than guard every one of those
 * call sites, the names exist and answer the way a build that stores nothing should: `has()` and
 * `read()` report an empty store so the caller always fetches live, `localise()` and `localiseUrl()`
 * hand back exactly what they were given so a thumbnail keeps pointing at the service, and the
 * writers return zero without touching the database.
 *
 * Each class is guarded separately, the way the Premium build guards its own. A single check around
 * the file would be a fatal error the day Premium ships one of these three without the others: the
 * check would pass on the one that exists and this file would redeclare the two that do not.
 */

namespace B_SLIDER;

if ( ! defined( 'ABSPATH' ) ) exit;

if ( ! class_exists( __NAMESPACE__ . '\\FeedMedia' ) ) {
class FeedMedia {
    public static function localiseUrl( $url ) {
        return $url;
    }

    public static function import( $items, $feedType ) {
        return [ 'items' => [] ];
    }

    public static function deleteByFeed( $feed_key ) {
        return 0;
    }

    public static function deleteIds( $ids ) {
        return 0;
    }

    public static function unusedIds() {
        return [];
    }

    public static function groupedListing() {
        return [];
    }

    public static function storeUrl( $url, $feed_key, $item_id, $type ) {}

    public static function localise( $items ) {
        return $items;
    }

    public static function progress( $items ) {
        return [
            'done'    => true,
            'total'   => count( $items ),
            'stored'  => count( $items ),
            'missing' => 0,
            'running' => false
        ];
    }
}

}

if ( ! class_exists( __NAMESPACE__ . '\\FeedStore' ) ) {
class FeedStore {
    const POST_TYPE = 'bsb_feed_item';
    const FEED_META = 'bsb_feed_key';
    const DATA_META = 'bsb_feed_data';

    public static function count( $query ) {
        return 0;
    }

    public static function countByKey( $key ) {
        return 0;
    }

    public static function save( $items, $query ) {
        return 0;
    }

    public static function has( $query ) {
        return false;
    }

    public static function read( $query, $max ) {
        return [];
    }

    public static function purge( $query ) {
        return 0;
    }

    public static function purgeByKey( $key ) {
        return 0;
    }

    public static function purgeUnused() {
        return 0;
    }

    public static function feedKey( $query ) {
        return '';
    }

    public static function sliderUsage() {
        return [];
    }
}

}

if ( ! class_exists( __NAMESPACE__ . '\\FeedSync' ) ) {
class FeedSync {
    public static function markStored( $key ) {}

    public static function syncNow( $key ) {
        return false;
    }
}
}
