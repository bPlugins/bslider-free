<?php

namespace B_SLIDER;

if ( ! defined( 'ABSPATH' ) ) exit;

if ( ! class_exists( __NAMESPACE__ . '\FeedChannels' ) ) {
    /**
     * The site's saved feeds, kept once and used by any number of sliders.
     *
     * Before this, every slider carried its own copy of a channel address. Two sliders on the same
     * channel were two addresses to keep in step, and correcting a typo meant opening every page that
     * had one. A saved channel is stored here and *referenced* by the sliders that show it, so the
     * address, the name and the defaults are edited in one place and every slider follows.
     *
     * **A reference has to survive an edit.** Imported videos are grouped by feed, and if that
     * grouping were derived from the address then repointing a channel would orphan everything
     * already imported for it. So a referencing slider is keyed by the channel's own id, which never
     * changes — the feed key is derived from it. Changing the address refetches the videos, as it should,
     * without losing what is already stored against the channel.
     *
     * Service-agnostic by design: a channel carries a `feedType`, so the same library holds an RSS
     * feed or an Instagram account once those readers exist.
     */
    class FeedChannels {

        /** Where the library lives. One option, read on nearly every feed render, so it autoloads. */
        const OPTION = 'b_slider_feed_channels';

        /** How many a site may keep. A guard against a runaway import, not a licence limit. */
        const MAX = 100;

        /**
         * Every saved channel, in the order they were added.
         *
         * Shaped on the way out rather than trusted as stored: the option is written by a REST route
         * and read by every render, and a slider asking for a channel that has lost its address should
         * get an empty string rather than a notice.
         */
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

        /** One saved channel, or `null`. */
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

        /**
         * Add a channel, or update the one whose id is given.
         *
         * @return array|\WP_Error The saved channel.
         */
        public static function save( $input ) {
            $input = is_array( $input ) ? $input : [];
            $id    = self::id( $input['id'] ?? '' );

            $channel  = self::shape( $input );
            $existing = '' !== $id ? self::get( $id ) : null;

            // An Instagram account's address is an access token, and a token is never sent back to
            // the browser — see `SocialFeed::get_channels()`. So an edit that only renames an
            // account arrives with the address field empty, and that means "keep the one held"
            // rather than "clear it". A saved address is only ever replaced by typing a new one,
            // which is also what somebody who blanked the field by accident would expect.
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

            foreach ( $channels as $index => $existing ) {
                if ( '' !== $id && $existing['id'] === $id ) {
                    // The id and the date it was added are the channel's identity; everything else is
                    // the user's to change.
                    $channel['id']    = $existing['id'];
                    $channel['added'] = $existing['added'];
                    // A token's expiry belongs to that token. Carried over while the address is the
                    // same one, and dropped the moment it is replaced — a freshly pasted token has
                    // its own sixty days, and the old one's date would have the upkeep run either
                    // leave it alone for two months or chase it immediately.
                    // A freshly pasted token is a fresh start: it has its own sixty days, and it has
                    // not failed at anything yet. That is what makes retyping a token the fix for a
                    // channel this had given up on.
                    $same = $channel['source'] === $existing['source'];

                    $channel['tokenExpires']  = $same ? (int) ( $existing['tokenExpires'] ?? 0 ) : 0;
                    $channel['tokenFailedAt'] = $same ? (int) ( $existing['tokenFailedAt'] ?? 0 ) : 0;
                    $channel['tokenTriedAt']  = $same ? (int) ( $existing['tokenTriedAt'] ?? 0 ) : 0;
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
                            /* translators: %d: the most channels a site may save */
                            __( 'A site can save up to %d channels.', 'b-slider' ),
                            self::MAX
                        ),
                        [ 'status' => 400 ]
                    );
                }

                // Two sliders should not each save the same channel. An address already in the library
                // returns the entry that holds it, so "add" on a duplicate quietly means "use that one".
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

        /**
         * Remove a channel.
         *
         * What it imported is left alone. The videos and pictures are keyed by the channel's id and
         * nothing else can reach them once it is gone, so they become the Storage screen's "not used
         * by anything" — deliberately, because deleting a name should not silently delete 12 MB.
         *
         * @return bool Whether anything was removed.
         */
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

        /**
         * Put a refreshed access token onto a channel.
         *
         * Its own writer rather than a trip through `save()`: this runs unattended, and `save()`
         * answers a form — it dedupes by address, enforces the library's size, and would treat a
         * token that came back looking like another channel's as a reason to merge two accounts.
         * Nothing here is the user's decision, so nothing here should go through the user's path.
         *
         * @return bool Whether the channel was found and written.
         */
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
                // Whatever it was failing at, it is not failing now.
                $channels[ $index ]['tokenFailedAt'] = 0;
                $written = true;
                break;
            }

            if ( $written ) {
                update_option( self::OPTION, $channels );
            }

            return $written;
        }

        /** How close to running out a token has to be before the site is told about it. */
        const WARN_WINDOW = 7 * DAY_IN_SECONDS;

        /**
         * Record that renewing this channel's token is being attempted, now.
         *
         * Written *before* the request goes out, not after it comes back. A refresh that dies
         * mid-flight — a timeout that takes the whole PHP process with it — would otherwise leave
         * no trace, and the next page load would try again, and so would the one after that.
         */
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

        /** Record that renewing this channel's token was refused. */
        public static function markTokenFailed( $id ) {
            $id       = self::id( $id );
            $channels = self::all();

            foreach ( $channels as $index => $channel ) {
                if ( $channel['id'] === $id ) {
                    // Kept as the first time it failed, not the latest: what a person wants to know
                    // is how long this has been broken, and overwriting it every day would answer
                    // "since yesterday" forever.
                    if ( empty( $channel['tokenFailedAt'] ) ) {
                        $channels[ $index ]['tokenFailedAt'] = time();
                        update_option( self::OPTION, $channels );
                    }

                    return true;
                }
            }

            return false;
        }

        /**
         * What to say about a channel's access token, in one word.
         *
         * `''` only for the sources that have no token at all — a feed URL, a YouTube handle.
         *
         * An Instagram account this site has not yet learned the life of is `unknown`, not `''`.
         * Instagram will not tell you when a token runs out except by handing you a new one, so a
         * freshly connected account has no date against it until the first renewal — about a day,
         * and sooner if a slider reads the feed. That was being drawn as nothing at all, which on
         * screen is indistinguishable from a connection that never worked.
         *
         * @return string `expired` | `failing` | `expiring` | `ok` | `unknown` | `''`
         */
        public static function tokenState( $channel ) {
            if ( 'instagram' !== ( $channel['feedType'] ?? '' ) || '' === ( $channel['source'] ?? '' ) ) {
                return '';
            }

            $now     = time();
            $expires = (int) ( $channel['tokenExpires'] ?? 0 );

            // Beyond renewing. Only a new token from Instagram gets this account back.
            if ( $expires && $expires <= $now ) {
                return 'expired';
            }

            // Refused while it still had time on it — a revoked app, a changed password. The date
            // says everything is fine, which is exactly why this is checked before it.
            if ( ! empty( $channel['tokenFailedAt'] ) ) {
                return 'failing';
            }

            if ( $expires && ( $expires - $now ) < self::WARN_WINDOW ) {
                return 'expiring';
            }

            return $expires ? 'ok' : 'unknown';
        }

        /**
         * A channel as a browser may see it.
         *
         * Instagram's address is an access token, and the channel list is readable by anybody who
         * may edit a post — so the token stays on the server and what goes out is only enough to
         * recognise the account by. The editing form sends an empty address back to mean "keep the
         * one held"; see `save()`.
         */
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
                // Days left, rounded up so "less than a day" reads as 1 rather than 0. Negative once it
                // has gone, which the screens show as nothing rather than as a countdown backwards.
                $channel['tokenDays']    = $expires ? (int) ceil( ( $expires - time() ) / DAY_IN_SECONDS ) : 0;
            }

            if ( 'youtube' === $feed_type && ! empty( $channel['ytRefreshToken'] ) ) {
                $channel['ytRefreshTokenMasked'] = str_repeat( '•', 8 ) . substr( $channel['ytRefreshToken'], -4 );
                $channel['hasYtRefreshToken']    = true;
                $channel['ytRefreshToken']       = '';
            }

            return $channel;
        }

        /** The channel holding this address, if the library already has one. */
        public static function findBySource( $feed_type, $source ) {
            $source = self::normalizeSource( $source, $feed_type );

            foreach ( self::all() as $channel ) {
                if ( $channel['feedType'] === $feed_type && self::normalizeSource( $channel['source'], $channel['feedType'] ) === $source ) {
                    return $channel;
                }
            }

            return null;
        }

        /**
         * A slider's query with its saved channel filled in.
         *
         * The reference is the address: when a slider names a channel, what the channel says wins, so
         * editing it in one place changes every slider that shows it. A slider that names a channel
         * the library no longer has keeps whatever address it last carried, which is the difference
         * between a slider that still works and one that empties because a name was tidied up.
         *
         * A channel is the address and nothing else. It used to carry `per_page` as the default for a
         * slider that had not chosen its own, and that could never happen: `block.json` ships the key
         * inside the `socialQuery` default, and `updateObject` writes the whole object back, so by the
         * time a slider names a channel it is already carrying a value for it. The loop that filled it
         * in was dead, and the field offered for it on the channel forms was decorative — set it and
         * nothing anywhere changed.
         *
         * It is a per-slider setting, which is what it had in effect always been, and it lives in the
         * Feed Settings panel with `storeLocal`, `seoSchema`, `cacheTime` and `videoSet`.
         */
        public static function resolve( $socialQuery ) {
            $socialQuery = is_array( $socialQuery ) ? $socialQuery : [];
            $channel     = self::get( $socialQuery['channelId'] ?? '' );

            if ( ! $channel ) {
                return $socialQuery;
            }

            /**
             * A channel belonging to another service is not this slider's channel.
             *
             * **The bug this fixes, in the words it was reported in: "the feed type says Instagram but
             * the profile header is the RSS feed's."** The block asked for `instagram` while still
             * carrying the id of a saved RSS channel — which is what a slider looks like the moment
             * somebody changes its service — and the next two lines handed the whole request over to
             * the channel: the feed came back as NYT World News, the header card introduced NYT, and
             * the panel went on saying Instagram. Nothing anywhere admitted the disagreement.
             *
             * Measured before it was changed: `normalizeQuery(['feedType' => 'instagram', 'channelId'
             * => <an rss channel>])` answered `feedType=rss` with the NYT address, and `profileFor()`
             * on the same query answered "NYT &gt; World News".
             *
             * So a mismatch drops the channel instead of following it. The slider is then a feed with
             * no address, which is a state the editor already has a word for — it asks for an account
             * — and the front end draws nothing rather than another service's posts under the wrong
             * name. `SelectSource` clears the id on the way out of a service now, so this is the
             * safety net for the blocks that were saved before it did.
             *
             * Only when the block actually said what it wanted. A caller that passes a channel id and
             * no type — the import route does — is naming the channel and asking what it is, and that
             * question still gets its old answer.
             */
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

        /** A channel as this class stores it, whatever arrived. */
        private static function shape( $channel ) {
            $channel = is_array( $channel ) ? $channel : [];

            $feed_type = self::text( $channel['feedType'] ?? '' );

            return [
                'id'     => self::id( $channel['id'] ?? '' ),
                // Named for the person reading the list. Falls back to the address, so a channel added
                // in a hurry is still recognisable.
                'label'  => self::text( $channel['label'] ?? '' ) ?: self::text( $channel['source'] ?? '' ),
                'feedType' => '' !== $feed_type ? $feed_type : 'youtube',
                'source' => self::text( $channel['source'] ?? '' ),
                'added'  => (int) ( $channel['added'] ?? 0 ),
                // When an Instagram token stops working, as a timestamp. Kept so the upkeep run
                // knows what is close to running out and the screens can say so before it does —
                // an expired token cannot be refreshed, only replaced by hand. Zero for everything
                // else, and for a token whose life nobody has asked Meta about yet.
                'tokenExpires' => (int) ( $channel['tokenExpires'] ?? 0 ),
                // When renewal was last refused, or `0`. A token can be refused long before its
                // date runs out — somebody changed their Instagram password, or took the app's
                // permission away — and until this was recorded the only sign of it was a slider
                // that stopped changing. Cleared the moment a renewal succeeds.
                'tokenFailedAt' => (int) ( $channel['tokenFailedAt'] ?? 0 ),
                // When renewal was last attempted, successful or not. Kept here rather than in a
                // transient for the same reason `SocialFeed::acquireLock()` uses an option: a
                // transient is allowed to vanish, and the one site where that happens constantly is
                // also the site where the feed cache misses on every page load — so the one guard
                // stopping a renewal being attempted on every visit would be the guard that is gone.
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

        /** An id as stored: the characters this class generates and nothing else. */
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

        /**
         * An address reduced to what makes it the same channel.
         *
         * `@bplugins`, `youtube.com/@bplugins` and `https://www.youtube.com/@bplugins/videos` are one
         * channel written three ways, and the library should not end up holding all three.
         */
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
