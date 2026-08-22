<?php

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
