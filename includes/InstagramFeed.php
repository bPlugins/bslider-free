<?php

namespace B_SLIDER;

if ( ! defined( 'ABSPATH' ) ) exit;

if ( ! class_exists( __NAMESPACE__ . '\InstagramFeed' ) ) {
    /**
     * An Instagram account's own posts, as slider items.
     *
     * Reads `/me/media` off the Graph API with the account's access token, which is what the
     * Instagram API with Instagram Login hands back — the Basic Display API this used to name was
     * shut down on 4 December 2024 and its tokens no longer answer.
     *
     * The token is the "address" of an Instagram channel, which makes it unlike every other reader
     * here: a feed URL is public and a token is a credential. It is kept in the site's channel
     * library rather than on the slider, never sent to a browser, and taken back out of the block's
     * attributes before they are printed — see `FeedChannels::forDisplay()` and `render.php`.
     *
     * What comes back is shaped like `Posts::arrangedPosts()`, so a feed renders through the
     * layouts, indicators and thumbnail strips that already exist.
     */
    class InstagramFeed {

        /**
         * The Graph version this reader is written against.
         *
         * Pinned on purpose. An unversioned call follows whatever Meta currently defaults to, so a
         * response could change shape on a day nobody here touched anything.
         */
        const API_VERSION = 'v21.0';

        /** The most one Graph page returns. Asking for more is answered with this many anyway. */
        const PAGE_SIZE = 100;

        /**
         * The most pages one fetch will walk.
         *
         * A ceiling rather than a target: `paging.next` keeps answering as long as the account has
         * posts, and a slider asking for "everything" should not hold a request open for a minute.
         */
        const MAX_PAGES = 5;

        /**
         * The most posts one account will give up — what the paging loop can actually reach.
         *
         * Derived rather than written down, because it is not a decision of its own: it is the two
         * constants above multiplied, and a ceiling that had to be kept in step with them by hand
         * would drift the first time either moved. `SocialFeed::maxItems()` reads this, so what the
         * block may ask for and what `read()` can fetch are the same number by construction.
         */
        const MAX_ITEMS = self::PAGE_SIZE * self::MAX_PAGES;

        /** How many words of a caption stand in for a title when the block asked for no limit. */
        const TITLE_WORDS = 12;

        /** The event that keeps this site's tokens alive. */
        const REFRESH_HOOK = 'b_slider_instagram_refresh_tokens';

        /**
         * How long before a token runs out that the upkeep run starts trying to renew it.
         *
         * An Instagram token lasts about sixty days and, once it has actually lapsed, cannot be
         * renewed at all — the only way back is a person pasting a new one. So the window is wide:
         * a fortnight of daily attempts means a site can be down, or its cron asleep, for most of a
         * fortnight and still recover on its own.
         */
        const REFRESH_WINDOW = 14 * DAY_IN_SECONDS;

        /**
         * How old a token has to be before Meta will renew it.
         *
         * Their rule, not ours: a token refreshed within a day of being issued is refused. This is
         * what stops a site that saves a token and immediately runs the upkeep from logging a
         * failure it can do nothing about.
         */
        const REFRESH_MIN_AGE = DAY_IN_SECONDS;

        /**
         * How long an account is left alone after a renewal was attempted for it.
         *
         * A day, so the two callers together — the daily event and every feed fetch — still make
         * one attempt a day between them rather than one each, and an account whose token is beyond
         * saving is asked about once a day instead of on every page that shows its feed. Fourteen
         * attempts across the renewal window, which is more chances than a working site needs and
         * more than a broken one deserves.
         */
        const REFRESH_RETRY = DAY_IN_SECONDS;

        /**
         * What every post is asked for, whatever the account.
         *
         * `children` is the expensive-looking one and the one that matters: an album carries no
         * picture of its own, so without it every carousel post is a slide with no image.
         */
        const FIELDS = 'id,caption,media_type,media_product_type,media_url,permalink,thumbnail_url,timestamp,username,children{id,media_type,media_url,thumbnail_url}';

        /**
         * The counts, which not every connection is allowed to read.
         *
         * `like_count` and `comments_count` need a professional account and the permissions that go
         * with it. Asked for separately so a refusal costs the counts and not the feed: an unknown
         * field is dropped silently by Graph — that was measured — but a field the token may not
         * read can come back as an error for the whole request, which would empty a slider to show
         * a number nobody asked to be essential. See the fallback in `read()`.
         */
        const FIELDS_COUNTS = 'like_count,comments_count';

        /**
         * An account's posts, arranged the way a slider item is.
         *
         * @param string $access_token      The account's access token.
         * @param int    $limit             How many posts to return.
         * @param string $date_format       PHP date format string.
         * @param int    $excerpt_length    Words of caption to keep. `-1` keeps all of it.
         * @param string $default_image_url Shown when a post has no picture this reader can reach.
         * @param int    $title_length      Words of title to keep. `-1` leaves it to `TITLE_WORDS`.
         * @return array|\WP_Error
         */
        public static function items( $access_token, $limit = 12, $date_format = 'M j, Y', $excerpt_length = 25, $default_image_url = '', $title_length = -1, $allow_image = true, $allow_album = true, $allow_video = true ) {
            $access_token = is_string( $access_token ) ? trim( $access_token ) : '';

            if ( '' === $access_token ) {
                return new \WP_Error( 'b_slider_instagram_no_token', __( 'Connect an Instagram account to show something here.', 'b-slider' ) );
            }

            $limit = (int) $limit;

            // "Show all" — which the rest of the block writes as `-1` — and a nonsense count both
            // settle on what a page returns rather than on nothing at all.
            if ( $limit <= 0 ) {
                $limit = self::PAGE_SIZE;
            }

            // If we filter posts, we should read a bit more to ensure we have enough to fulfill the limit.
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

            // `$title_length` is not read here on purpose: cutting a title to the block's setting
            // is `SocialFeed::postProcessItems()`'s job, and it does it for every feed type. It
            // stays on the signature because the call site passes it positionally.
            unset( $title_length );

            foreach ( array_slice( $filtered_posts, 0, $limit ) as $index => $post ) {
                $items[] = self::makeItem( $post, $index, $date_format, $excerpt_length, $default_image_url );
            }

            return $items;
        }

        /**
         * Every post the account will give up, to the count asked for.
         *
         * Graph answers a page at a time — 25 by default, `PAGE_SIZE` at most — and hands back a
         * `paging.next` for the rest. Following it is what makes "show 40 posts" mean anything;
         * without it the reader silently stopped at whatever the first page held.
         *
         * @return array|\WP_Error
         */
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
                    // Refused over the counts, and nothing read yet: ask again without them. The
                    // like and comment numbers are an ornament on a popup; the posts are the
                    // feature, and an account not licensed for the first should still get the
                    // second. Only from the first page, and only once — a retry that can itself
                    // retry is a loop waiting for a bad day.
                    if ( ! $posts && $fields !== self::FIELDS && self::refusedTheCounts( $page ) ) {
                        return self::read( $access_token, $limit, self::FIELDS );
                    }

                    // A page already in hand beats nothing. The first page failing is a failure;
                    // the fourth failing is 75 posts the slider can still show.
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

                // Followed as given: the cursor is Graph's, and rebuilding it from parts is how a
                // paging loop starts repeating its first page forever.
                $next = $page['paging']['next'] ?? '';
                $url  = is_string( $next ) ? $next : '';

                $pages++;
            }

            return $posts;
        }

        /**
         * Whether this failure was about the counts rather than about the account.
         *
         * Read from the message, because Graph does not separate "you may not read that field" from
         * "your token is dead" by code — both arrive as an error on a 400. Naming the fields is the
         * only thing that tells them apart, and getting it wrong in the safe direction costs one
         * extra request; getting it wrong the other way would retry a dead token forever.
         */
        private static function refusedTheCounts( $error ) {
            $message = strtolower( $error->get_error_message() );

            foreach ( explode( ',', self::FIELDS_COUNTS ) as $field ) {
                if ( false !== strpos( $message, $field ) ) {
                    return true;
                }
            }

            return false;
        }

        /**
         * One Graph call, with its failures turned into something worth reading.
         *
         * @return array|\WP_Error
         */
        private static function request( $url ) {
            $response = wp_remote_get( $url, [ 'timeout' => 15 ] );

            if ( is_wp_error( $response ) ) {
                return $response;
            }

            $code = (int) wp_remote_retrieve_response_code( $response );
            $data = json_decode( wp_remote_retrieve_body( $response ), true );

            // The body is read before the status because it is the side that says *why*. Graph
            // reports a dead token and a malformed field the same way — a 400 with an `error`.
            if ( is_array( $data ) && isset( $data['error'] ) ) {
                return new \WP_Error( 'b_slider_instagram_api_error', self::errorMessage( $data['error'] ) );
            }

            if ( 200 !== $code ) {
                return new \WP_Error(
                    'b_slider_instagram_http',
                    sprintf(
                        /* translators: %d: an HTTP status code, e.g. 429 */
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

        /**
         * What to tell somebody about a Graph failure.
         *
         * An expired token is the failure this reader meets most, and by far the most fixable —
         * but Graph reports it as "OAuthException", which says nothing about what to do. The rest
         * are passed through as Meta wrote them; they are usually specific enough.
         */
        private static function errorMessage( $error ) {
            $error   = is_array( $error ) ? $error : [];
            $code    = (int) ( $error['code'] ?? 0 );
            $subcode = (int) ( $error['error_subcode'] ?? 0 );

            // 190 is an invalid token; 102 a session that has ended. 463 and 467 are the subcodes
            // for "expired" and "invalidated", which are the same conversation.
            if ( 190 === $code || 102 === $code || 463 === $subcode || 467 === $subcode ) {
                return __( 'Instagram would not accept the access token — it has expired or been revoked. Reconnect the account under bSlider → Instagram Accounts.', 'b-slider' );
            }

            if ( 4 === $code || 17 === $code || 32 === $code || 613 === $code ) {
                return __( 'Instagram is rate-limiting this site. The slider keeps showing what it last fetched; it will try again shortly.', 'b-slider' );
            }

            $message = $error['message'] ?? '';

            return '' !== $message ? (string) $message : __( 'Instagram refused the request and did not say why.', 'b-slider' );
        }

        /**
         * Keep this site's saved tokens alive.
         *
         * The reason this exists: an Instagram access token lasts about sixty days, and once it has
         * lapsed there is no way to renew it — every slider on the site empties, and the only fix is
         * somebody going and connecting the account again. Meta's own answer is to ask for a fresh
         * token before the old one runs out, which is a thing no site owner is going to remember to
         * do six times a year.
         *
         * Daily, because the cost of a run with nothing to do is a loop over an option that is
         * already in memory, and the cost of missing the window is the whole feature.
         */
        /**
         * Deliberately no `admin_notices` here.
         *
         * There was one, and it was wrong. A token lapsing on its own is the thing this class exists
         * to prevent, and between the daily event and the renewal on every fetch it does not happen
         * — so a banner on every screen in wp-admin was warning about a problem that had already
         * been solved, and WordPress.org rightly frowns on a plugin shouting outside its own pages.
         *
         * What is left to say is narrower: an account whose connection a person broke themselves,
         * by changing a password or withdrawing the app's permission. Nothing here can renew around
         * that. It is said where somebody would go to look — on the Instagram Accounts screen, and
         * on the tab leading to it — rather than everywhere they were not.
         *
         * `FeedChannels::tokenState()` is what both of those read.
         */
        public static function boot() {
            add_action( self::REFRESH_HOOK, [ __CLASS__, 'refreshDueTokens' ] );
            add_action( 'init', [ __CLASS__, 'scheduleRefresh' ] );
        }

        public static function scheduleRefresh() {
            if ( ! wp_next_scheduled( self::REFRESH_HOOK ) ) {
                wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', self::REFRESH_HOOK );
            }
        }

        /** Stop asking. Called when the plugin is switched off, so nothing is left behind. */
        public static function unscheduleRefresh() {
            wp_clear_scheduled_hook( self::REFRESH_HOOK );
        }

        /**
         * Renew every saved token that is close enough to running out to be worth renewing.
         *
         * A channel whose expiry nobody knows yet — one saved before this existed, or saved and
         * never asked about — is renewed on the first run that sees it. That is also how its expiry
         * comes to be known at all, since Meta only reports a token's life when it hands one over.
         *
         * @return int How many were renewed.
         */
        public static function refreshDueTokens() {
            $renewed = 0;

            foreach ( FeedChannels::all() as $channel ) {
                if ( self::renew( $channel ) ) {
                    $renewed++;
                }
            }

            return $renewed;
        }

        /**
         * Renew this channel's token if it is time to, and answer with the token to use.
         *
         * Called on the way to Instagram, from `SocialFeed::fetchFresh()`. The daily event is the
         * belt; this is the braces, and on most sites it is the one that actually does the work —
         * WP-Cron only runs when somebody visits the site, so a quiet site can go a fortnight
         * without a tick and lose a token it had every chance to save. A request that is already
         * going to Instagram is proof the site is alive and proof the network is reachable, which
         * makes it the best moment there is to spend one more call on staying connected.
         *
         * Costs nothing on a cached page load: this only runs when the feed cache has lapsed and a
         * fetch is happening anyway, and only inside the renewal window.
         *
         * @return string The token to read the feed with — the new one, or the old one untouched.
         */
        public static function tokenFor( $channel_id, $token ) {
            $channel = FeedChannels::get( $channel_id );

            if ( ! $channel ) {
                // A one-off address, or a channel that has since been deleted. There is nowhere to
                // write a new token back to, so renewing one would help nobody.
                return $token;
            }

            $fresh = self::renew( $channel );

            return $fresh ?: $token;
        }

        /**
         * Renew one channel's token, if it is due and has not just been tried.
         *
         * @return string The new token, or `''` when nothing was renewed.
         */
        private static function renew( $channel ) {
            if ( ! self::isRenewalDue( $channel ) ) {
                return '';
            }

            // One attempt a day per account, however many times this is reached. Two things need
            // it: a feed being read every few minutes on a busy site would otherwise ask on every
            // cache lapse, and an account whose token is already dead would be asked forever by
            // the daily event.
            //
            // The time is kept on the channel rather than in a transient. A transient is allowed to
            // disappear, and a site where they disappear constantly is a site where the feed cache
            // also misses on every page load — so on the one site that needs this guard most, a
            // transient would not be there to give it.
            $tried = (int) ( $channel['tokenTriedAt'] ?? 0 );

            if ( $tried && ( time() - $tried ) < self::REFRESH_RETRY ) {
                return '';
            }

            FeedChannels::markTokenTried( $channel['id'] );

            $fresh = self::refreshToken( $channel['source'] );

            if ( is_wp_error( $fresh ) ) {
                // Written down, because this is the one failure nobody would otherwise see: the
                // feed carries on showing its stored copy, the token's date still looks healthy,
                // and the only symptom is a slider that quietly stops changing. See the notice in
                // `expiryNotice()`.
                FeedChannels::markTokenFailed( $channel['id'] );

                return '';
            }

            if ( ! FeedChannels::updateToken( $channel['id'], $fresh['token'], time() + $fresh['expiresIn'] ) ) {
                return '';
            }

            return $fresh['token'];
        }

        /**
         * Whether a channel's token is at the point of wanting renewal.
         *
         * One place for the rule, because two callers ask it — the daily event and every fetch that
         * goes to Instagram — and a rule written twice is a rule that will be changed once.
         */
        private static function isRenewalDue( $channel ) {
            if ( 'instagram' !== ( $channel['feedType'] ?? '' ) || '' === ( $channel['source'] ?? '' ) ) {
                return false;
            }

            $now     = time();
            $expires = (int) ( $channel['tokenExpires'] ?? 0 );

            // Already lapsed. Renewing is not on offer any more — Meta refuses a dead token — so
            // asking would spend a request to be told what is already known.
            if ( $expires && $expires <= $now ) {
                return false;
            }

            // Still comfortably alive.
            if ( $expires && ( $expires - $now ) > self::REFRESH_WINDOW ) {
                return false;
            }

            // Meta refuses a token younger than a day. `added` is when the channel was saved, which
            // is the closest thing to when its token was issued that this site knows.
            if ( ! $expires && ( $now - (int) ( $channel['added'] ?? 0 ) ) < self::REFRESH_MIN_AGE ) {
                return false;
            }

            return true;
        }

        /**
         * Trade a token for a fresh one.
         *
         * The token that comes back is a *different* string, not the same one with a later date, so
         * the answer has to be written back over the old one or the next renewal is attempted with
         * a token that is on its way out. The old one keeps working until its own expiry, which is
         * what makes a failed write here recoverable rather than fatal.
         *
         * Unversioned on purpose: this endpoint takes no version, unlike the media routes.
         *
         * @return array|\WP_Error `[ 'token' => string, 'expiresIn' => int ]`
         */
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

        /**
         * The account behind a token: who it is, and what it looks like.
         *
         * What the Profile Header asks a person to type — the picture, the name, the bio, the link.
         * The counts and the bio are only there for a Business or Creator account; a personal one
         * simply answers without them, since Graph drops a field it will not give rather than
         * failing the call. So every one of these is read back with a default.
         *
         * @return array|\WP_Error
         */
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
                // The display name, falling back to the handle — a slider's header wants something
                // to print, and not every account has filled its name in.
                'name'        => trim( wp_strip_all_tags( (string) ( $data['name'] ?? '' ) ) ) ?: ( '' !== $username ? '@' . $username : '' ),
                'bio'         => trim( wp_strip_all_tags( (string) ( $data['biography'] ?? '' ) ) ),
                'avatar'      => esc_url_raw( (string) ( $data['profile_picture_url'] ?? '' ) ),
                // Graph has no cover picture to give — an Instagram profile has none. Named anyway so
                // every reader answers with the same shape and the header can ask without checking.
                'banner'      => '',
                // Where "Follow" should go. The account's own website is not that, so the profile
                // is used and the website is offered separately.
                'link'        => '' !== $username ? esc_url_raw( 'https://www.instagram.com/' . $username . '/' ) : '',
                'website'     => esc_url_raw( (string) ( $data['website'] ?? '' ) ),
                'accountType' => (string) ( $data['account_type'] ?? '' ),
                'posts'       => (int) ( $data['media_count'] ?? 0 ),
                'followers'   => (int) ( $data['followers_count'] ?? 0 ),
                // Graph reports no lifetime view total for an account, only per-media insights.
                'views'       => 0,
            ];
        }

        /** Normalize a single Graph post into a slider item. */
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
                    // A captionless post has no title, and an empty `alt` tells a screen reader
                    // the picture is decoration. Saying whose post it is beats saying nothing.
                    'alt'      => '' !== $title
                        ? $title
                        : ( '' !== $username
                            /* translators: %s: an Instagram handle */
                            ? sprintf( __( 'Post by @%s on Instagram', 'b-slider' ), $username )
                            : __( 'Instagram post', 'b-slider' ) ),
                ];
            }

            return [
                // Graph's own id, which is stable across fetches — that is what lets an import
                // update a post rather than store it a second time. The index is only a last
                // resort, for a response missing the one field every post is supposed to have.
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
                // The machine-readable stamp — see the note in `JsonFeed`.
                'dateISO'         => $timestamp ? gmdate( 'c', $timestamp ) : '',
                'dateGMT'         => $published,
                'modifiedDate'    => $published,
                'modifiedDateGMT' => $published,
                // Carried so a slide can tell a Reel from a photo — a still of a video wants a play
                // badge, and an album wants to say there is more behind it.
                'mediaType'       => (string) ( $post['media_type'] ?? '' ),
                'mediaProduct'    => (string) ( $post['media_product_type'] ?? '' ),
                // The caption whole and uncut, which the slide itself never wants: `title` and
                // `excerpt` are the split, trimmed halves of it. A popup shows the post as it was
                // written — hashtags, line breaks and all — so it needs the thing before the knife.
                'caption'         => $caption,
                // The video file, for a popup that plays it. Deliberately not used for the slide,
                // whose picture is the still. Worth knowing: these URLs are signed and short-lived —
                // measured at about a day, against four for a thumbnail — so a popup playing from a
                // feed that is only cached will meet dead links long before the pictures fail. A
                // stored feed does not have the problem.
                'videoUrl'        => 'VIDEO' === ( $post['media_type'] ?? '' ) ? esc_url_raw( (string) ( $post['media_url'] ?? '' ) ) : '',
                // Every picture in an album, so a popup can page through the set rather than
                // showing the cover and hiding the other seven.
                'gallery'         => self::gallery( $post ),
                // Absent unless the account is allowed to report them — see `FIELDS_COUNTS`. `null`
                // rather than `0`, because "none yet" and "not permitted" are different answers and
                // a popup should print the first and say nothing for the second.
                'likes'           => isset( $post['like_count'] ) ? (int) $post['like_count'] : null,
                'comments'        => isset( $post['comments_count'] ) ? (int) $post['comments_count'] : null,
                'commentCount'    => 0,
                'commentStatus'   => 'closed',
                'categories'      => [ 'coma' => '', 'space' => '' ],
                'taxonomies'      => [],
                'acf_fields'      => [],
                'readTime'        => [ 'min' => 0, 'sec' => 0 ],
                'status'          => 'publish',
                // Placeholders, so an Instagram item is the same shape as every other feed item.
                // Graph gives no play id of the kind the YouTube popup wants, and no view count
                // outside the Insights permissions a slider has no business asking for.
                'videoId'         => '',
                'views'           => 0,
                'duration'        => '',
            ];
        }

        /**
         * A caption, split into the heading and the rest of itself.
         *
         * An Instagram post has no title, and the two obvious answers are both wrong. Using
         * `@username` — which is what this did — gave every slide in a slider the same heading: on
         * the account this was measured against, sixteen of twenty posts have no caption at all, so
         * sixteen slides read as one handle repeated. Using the caption for both title and
         * description printed the same sentence twice on the four that do.
         *
         * So the caption is cut once, at whichever boundary it offers: its first line if it has
         * one, and `TITLE_WORDS` if it is a single block of prose. The heading goes above, the
         * remainder below, and neither repeats the other.
         *
         * A post captioned with nothing has no heading. That is deliberate — a picture with no
         * caption is a picture, and a made-up heading over it is worse than none.
         *
         * @return array `[ $title, $description ]`
         */
        private static function split( $caption ) {
            if ( '' === $caption ) {
                return [ '', '' ];
            }

            // A caption written with line breaks has already said where its heading ends.
            $lines = preg_split( '/\R+/', $caption, 2 );
            $rest  = isset( $lines[1] ) ? trim( (string) $lines[1] ) : '';

            // Unless that line is a block of hashtags, which plenty of captions open with. It is
            // the one thing a heading must never be — twenty tags in a row is not a sentence — so
            // the post goes untitled and the tags stay where they were written.
            if ( self::isTagPile( $lines[0] ) ) {
                return [ '', '' !== $rest ? $rest : $caption ];
            }

            if ( '' !== $rest ) {
                return [ trim( (string) $lines[0] ), $rest ];
            }

            $words = preg_split( '/\s+/u', trim( (string) $lines[0] ), -1, PREG_SPLIT_NO_EMPTY );

            // Short enough to be a heading on its own, with nothing left to put under it.
            if ( count( $words ) <= self::TITLE_WORDS ) {
                return [ implode( ' ', $words ), '' ];
            }

            return [
                implode( ' ', array_slice( $words, 0, self::TITLE_WORDS ) ) . '…',
                implode( ' ', array_slice( $words, self::TITLE_WORDS ) ),
            ];
        }

        /**
         * Every picture in a post, in the order Instagram gives them.
         *
         * One entry for a photo or a video, and as many as it holds for an album. A video's still
         * and its file are both kept: a popup shows the first until somebody presses play.
         */
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

        /**
         * Whether this is a run of hashtags and mentions rather than a sentence.
         *
         * Judged by proportion, not by the first word: "#nofilter sunset over the harbour" opens
         * with a tag and is still a perfectly good heading, while a line that is two thirds tags is
         * a keyword list somebody appended.
         */
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

        /**
         * The picture a slide shows.
         *
         * Three cases, and only the first is the obvious one:
         *
         * - A photo's `media_url` is the picture.
         * - A video's `media_url` is the *video file*, so the still under `thumbnail_url` is what a
         *   slide wants — putting an mp4 in an `<img>` was the bug this replaces.
         * - An album has no picture of its own at all. What it shows is its first child, which is
         *   why `children` is asked for; and a child that is a video needs the same treatment as
         *   any other video.
         */
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

                // An album cached before `children` was asked for still carries the first child's
                // picture here, so an old entry is not left blank until its cache lapses.
                return (string) ( $post['media_url'] ?? '' );
            }

            $url = (string) ( $post['media_url'] ?? '' );

            return '' !== $url ? $url : (string) ( $post['thumbnail_url'] ?? '' );
        }
    }

    InstagramFeed::boot();
}
