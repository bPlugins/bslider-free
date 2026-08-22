<?php
if ( ! defined( 'ABSPATH' ) ) exit;

// Wrap in a function to avoid global variable scope warnings.
call_user_func( function( $attributes ) {

	$sliders = [];
	$posts_query = isset( $attributes['postsQuery'] ) && is_array( $attributes['postsQuery'] ) ? $attributes['postsQuery'] : [];

	foreach ( ( isset( $attributes['sliders'] ) && is_array( $attributes['sliders'] ) ? $attributes['sliders'] : [] ) as $index => $slider ) {
		$sliders[] = $slider;
		$sliders[ $index ]['title'] = isset( $slider['title'] ) ? wp_kses_post( $slider['title'] ) : '';
		$sliders[ $index ]['desc'] = isset( $slider['desc'] ) ? wp_kses_post( $slider['desc'] ) : '';
		$sliders[ $index ]['btnLabel'] = isset( $slider['btnLabel'] ) ? wp_kses_post( $slider['btnLabel'] ) : '';
	}

	$attributes['sliders'] = $sliders;

	/* Declared for every source, set only by the feed branch — they are both read at the print below,
	   which no branch is. Empty is the honest value everywhere else: a post or image slider prints its
	   whole list and has no handle to offer, exactly as before. */
	$feed_handle = '';
	$page_size   = 0;

	if ( 'social' === ( isset( $attributes['sourceType'] ) ? $attributes['sourceType'] : '' ) ) {
		// An external feed answers with its whole set at once — there is nothing to page through
		// on the server, so the count is simply what came back. `SocialFeed` caches the fetch, so
		// this costs one HTTP request per feed per cache window rather than one per page load.
		// The excerpt length lives on `postsQuery` because the caption is drawn by the same component
		// a post slider uses. It is passed through so the descriptions are cut before they are
		// stored and printed, rather than shipped whole for the browser to cut.
		$excerpt_length = isset( $posts_query['excerptLength'] ) ? $posts_query['excerptLength'] : 25;

		$posts = \B_SLIDER\SocialFeed::items(
			isset( $attributes['socialQuery'] ) ? $attributes['socialQuery'] : [],
			$excerpt_length
		);
		$total_posts = count( $posts );

		/**
		 * Whether this slider prints one page of its feed instead of all of it.
		 *
		 * Every item used to go into the page whether anybody paged to it. An item is about 1.4 KB of
		 * JSON, measured against a real channel, so a slider holding a few hundred videos was a few
		 * hundred KB every visitor downloaded before a single slide appeared — and that, not any limit
		 * of YouTube's, is what kept the fetch capped. Printing one page and fetching the rest from
		 * `/bsb/v1/feed-page` unhooks the size of the page from the size of the feed.
		 *
		 * **Only the grid, and only when it pages.** The other layouts have no pager to ask for a second
		 * page with — a carousel wants every slide at once — so they still print the lot, and for them
		 * the old arithmetic stands.
		 *
		 * The handle is taken here rather than at the print below, because `source` is about to be
		 * removed from the attributes for Instagram: it is an access token and has no business in the
		 * page. The handle names the query as it was actually fetched, token and all, so it has to be
		 * claimed while that query is still intact.
		 */
		$layout_type   = isset( $attributes['layoutType'] ) ? $attributes['layoutType'] : '';
		$pager_type    = isset( $attributes['grid']['paginationType'] ) ? $attributes['grid']['paginationType'] : 'none';
		$page_size     = isset( $posts_query['per_page'] ) ? (int) $posts_query['per_page'] : 12;
		/* Thumbnails pages the same way the grid does, but only in its grid mode — the slider mode's
		   scrolling row has no pager of its own and still wants the whole set, exactly as a carousel
		   does. See `ThumbnailsGrid`'s own paging state, which reads this the same way `Grid` does. */
		$thumb_mode    = isset( $attributes['thumbnails']['mode'] ) ? $attributes['thumbnails']['mode'] : 'slider';
		$pages_by_grid = ( 'grid' === $layout_type )
			|| ( 'thumbnails' === $layout_type && 'grid' === $thumb_mode );

		if ( $pages_by_grid
			&& in_array( $pager_type, [ 'pagination', 'loadMore' ], true )
			&& $page_size > 0
			&& $total_posts > $page_size ) {

			$feed_handle = \B_SLIDER\SocialFeed::pageHandle(
				isset( $attributes['socialQuery'] ) ? $attributes['socialQuery'] : [],
				$excerpt_length
			);
		}
	} else {
		// `query()` is what decides the post type actually queried — it turns down anything this
		// licence or the public is not entitled to — so the taxonomies and the ACF allow list are
		// both built from its answer rather than from the saved attribute.
		$query = \B_SLIDER\Posts::query( $attributes );

		$post_type = $query['post_type'];
		$fimg_size = isset( $posts_query['fImgSize'] ) ? $posts_query['fImgSize'] : 'full';
		$meta_date_format = isset( $posts_query['metaDateFormat'] ) ? $posts_query['metaDateFormat'] : 'M j, Y';
		$is_excerpt_from_content = isset( $posts_query['isExcerptFromContent'] ) ? $posts_query['isExcerptFromContent'] : true;
		$excerpt_length = isset( $posts_query['excerptLength'] ) ? $posts_query['excerptLength'] : 25;

		$selected_acf_fields = \B_SLIDER\Posts::acfFieldsToFetch( $posts_query, $post_type );

		// One query answers both what to draw and how many there are to page through. The count used
		// to be a second `posts_per_page => -1` query that hydrated every matching post on every page
		// load only to count them; `found_posts` comes back with the rows this one already fetched.
		$slider_query = \B_SLIDER\Posts::run( $query, true );

		$posts = \B_SLIDER\Posts::arrangedPosts( $slider_query->posts, $post_type, $fimg_size, $meta_date_format, $is_excerpt_from_content, $excerpt_length, $selected_acf_fields );

		// `found_posts` counts what the query matched before the LIMIT, so the slider's own offset
		// comes off it to leave the pool the pagination steps through. Showing every post drops the
		// offset in `query()`, so reading it back from there keeps this in step with what was asked.
		$total_posts = max( 0, $slider_query->found_posts - (int) ( isset( $query['offset'] ) ? $query['offset'] : 0 ) );
	}

	// Structured data, so a crawler can tell these slides are videos rather than decoration. Printed
	// before the slider's own markup, which is where core puts its JSON-LD too. Only for a feed
	// source — a post slider's posts are already described by the site's own SEO plugin.
	if ( 'social' === ( isset( $attributes['sourceType'] ) ? $attributes['sourceType'] : '' ) ) {
		$feed_type   = isset( $attributes['socialQuery']['feedType'] ) ? $attributes['socialQuery']['feedType'] : 'youtube';

		if ( b_slider_is_premium() ) {
			$schema_mode = isset( $attributes['socialQuery']['seoSchema'] ) ? $attributes['socialQuery']['seoSchema'] : 'video';
			if ( 'rss' === $feed_type && 'video' === $schema_mode ) {
				$schema_mode = 'list';
			}

			// Structured data as a JSON-LD `<script>` block. `wp_print_inline_script_tag` is the
			// WordPress-approved way to write it: it handles the escaping, and PCP recognises the
			// pattern as safe. `FeedSchema::render()` returns the JSON string only.
			$schema_json = \B_SLIDER\FeedSchema::render( $posts, $schema_mode );
			if ( $schema_json ) {
				wp_print_inline_script_tag( $schema_json, [ 'type' => 'application/ld+json' ] );
			}
		}

		// The account itself: its picture, name, bio and link, so the header card and the follow
		// button follow the account rather than a copy of it somebody typed into the block months
		// ago. What *was* typed in still wins — see how `Layout` reads the two together. Cached
		// behind the slider's own cache window, so this is one request per feed per window and none
		// at all on the page loads served from it.
		//
		// Read here rather than below, because the token is what it is looked up with and the next
		// line takes the token away.
		$profile = \B_SLIDER\SocialFeed::profileFor( $attributes['socialQuery'] ?? [] );

		// Instagram's "address" is an access token, and every attribute below is printed into the
		// page for the browser to read. Nothing on the front end wants it — the items are rendered
		// already, and `Layout` only reads the header fields — so it is taken back out rather than
		// handed to everyone who views the source. The same reasoning kept the YouTube Data API key
		// out of the attributes altogether; see SocialFeed::apiKey().
		if ( 'instagram' === $feed_type && isset( $attributes['socialQuery']['source'] ) ) {
			$attributes['socialQuery']['source'] = '';
		}

		// Only the five values the block draws. `profileFor()` also carries the account type, the
		// post count and the website, and none of those have any business being in the page's markup
		// for everyone to read.
		// `socialQuery` is guarded as well as `$profile`: block.json gives every block one, but this
		// file is also reached through `render_block()` on markup written by hand — the shortcode
		// path in `custom-post.php` — where the attribute may simply not be there, and assigning
		// into a missing key raises a notice.
		if ( $profile && isset( $attributes['socialQuery'] ) && is_array( $attributes['socialQuery'] ) ) {
			$attributes['socialQuery']['profile'] = [
				'name'      => $profile['name'] ?? '',
				'bio'       => $profile['bio'] ?? '',
				'avatar'    => $profile['avatar'] ?? '',
				'link'      => $profile['link'] ?? '',
				'followers' => (int) ( $profile['followers'] ?? 0 ),
			];
		}
	}

	?>
	<div
		<?php echo wp_kses_post( get_block_wrapper_attributes() ); ?>
		id='bsbCarousel-<?php echo esc_attr( isset( $attributes['cId'] ) ? $attributes['cId'] : '' ); ?>'
		data-attributes='<?php echo esc_attr( wp_json_encode( $attributes, BSB_JSON_IN_HTML ) ); ?>'
		data-nonce='<?php echo esc_attr( wp_json_encode( wp_create_nonce( 'wp_ajax' ), BSB_JSON_IN_HTML ) ); ?>'
		data-totalposts='<?php echo esc_attr( $total_posts ); ?>'
		<?php
		/* Only present where the grid will actually ask for a second page — see `$feed_handle`. Its
		   absence is what tells the block to page through what it already has, which is what the
		   editor does and what every layout but the paging grid still does. */
		if ( $feed_handle ) {
			/* The finished address, not the bare handle. `rest_url()` differs by site — pretty
			   permalinks give `/wp-json/…`, plain ones `?rest_route=…` — so building it here with
			   `add_query_arg` saves the browser guessing, and saves loading `wp-api-fetch` on the
			   front end just to learn the REST root. The page and page size are appended to it. */
			echo " data-feedpage='" . esc_url( add_query_arg( 'handle', $feed_handle, rest_url( 'bsb/v1/feed-page' ) ) ) . "'";
		}
		?>
	>
		<pre id='posts' style='display: none;'>
			<?php
			/**
			 * One page where the grid will fetch the rest, the whole list everywhere else.
			 *
			 * **`BSB_JSON_IN_HTML`, and this is a bug fix rather than a tidy-up.** A YouTube title
			 * arrives from the API with HTML entities in it — `&quot;` around a quoted word is the
			 * common one — and those entities survive into the JSON as five literal characters.
			 * `esc_html()` does not touch them, because it does not double-encode an existing entity;
			 * the browser then decodes `&quot;` back to a bare `"` *inside* a JSON string, the string
			 * ends early, and the whole feed fails to parse with "Expected ',' or '}'". Every slide
			 * disappears over one punctuation mark in one video title.
			 *
			 * With the flags there is no `&` left in the output to decode — `&`, `<`, `>`, `'` and `"`
			 * are all written as `\u00XX`, which `JSON.parse` turns back into the characters they
			 * stand for and an HTML parser cannot act on at all. `esc_html` stays, with nothing left
			 * for it to do, so the escaping cannot be lost if these flags ever change.
			 */
			echo esc_html( wp_json_encode( $feed_handle ? array_slice( $posts, 0, $page_size ) : $posts, BSB_JSON_IN_HTML ) );
			?>
		</pre>
	</div>
	<?php
}, $attributes );
