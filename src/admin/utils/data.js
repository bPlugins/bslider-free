import { image as imageIcon, postDoc as postIcon, woo as wooIcon, video as videoIcon, socialFeed as socialFeedIcon, layers as layersIcon, instagramIcon, youtubeIcon, rssIcon, syncIcon } from '../../utils/icons';
import { elementorTabIcon, gutenbergTabIcon, phpTabIcon, shortcodeTabIcon } from './icons';


const slug = 'b-slider';

export const dashboardInfo = (info) => {
    const { version, isPremium, hasPro, adminUrl, licenseActiveNonce, deleteDataOnUninstall = false, uninstallNonce = '' } = info;

    const proSuffix = isPremium ? ' Pro' : '';

    return {
        name: `B Slider Block${proSuffix}`,
        displayName: `B Slider Block${proSuffix} - Create Responsive Image, Post, Product, Video and Block Sliders`,
        description: 'bSlider is a WordPress slider plugin that lets you create responsive sliders from images, posts, WooCommerce products, videos, or slides built out of Gutenberg blocks, using the block or a shortcode.',
        slug,
        version,
        isPremium,
        hasPro,
        displayOurPlugins: true,
        media: {
            logo: `https://ps.w.org/${slug}/assets/icon-256x256.png`,
            banner: `https://ps.w.org/${slug}/assets/banner-772x250.png`,
            thumbnail: `https://bplugins.com/wp-content/themes/b-technologies/assets/images/products/${slug}.png`,
            // proThumbnail: `https://bplugins.com/wp-content/themes/b-technologies/assets/images/products/${slug}-pro.png`,
            video: 'https://www.youtube.com/watch?v=DOvUG5ArWHE&t=3s',
            isYoutube: true
        },
        pages: {
            org: `https://wordpress.org/plugins/${slug}/`,
            // landing: `https://bplugins.com/products/${slug}/`,
            docs: `https://bplugins.com/docs/${slug}/`,
            pricing: `https://bplugins.com/products/${slug}/pricing`,
        },
        freemius: {
            product_id: 19318,
            plan_id: 32001,
            public_key: 'pk_b24b0b3f21a9dbfaff418c0c40fc1'
        },
        adminUrl,
        licenseActiveNonce,
        deleteDataOnUninstall,
        uninstallNonce,
        startButton: {          // ← new — drives the primary CTA button in the hero card
            label: 'Start Now',
            url: `${adminUrl}post-new.php?post_type=bsb`
        }
    }
}

export const demoInfo = {
    allInOneLabel: 'See All Demos',
    allInOneLink: 'https://bplugins.com/products/b-slider/#demos',
    demos: [
        {
            icon: layersIcon(24, 24),
            title: 'Gutenberg',
            children: [
                {
                    title: 'Full Page Portfolio',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/full-page-portfolio/'
                },
                {
                    title: 'Live Product Carousel',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/woocommerce-products-live-product-carousel/'
                },
                {
                    title: 'Dynamic Post Slider',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/dynamic-post-slider-live-wordpress-data/'
                },
                {
                    title: 'What Our Customers Say',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/what-our-customers-say/'
                },
                {
                    title: 'Agency Portfolio Cover Slides',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/agency-portfolio-full-screen-cover-slides/'
                },
                {
                    title: 'Restaurant Menu Carousel',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/restaurant-menu-carousel-with-3-cards-per-view/'
                },
                {
                    title: 'SaaS Product Launch',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/saas-product-launch/'
                },
                {
                    title: 'Luxury Real Estate Lightbox Slider',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/luxury-real-estate-lightbox-slider/'
                },
                {
                    title: 'Photography Portfolio Slider',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/photography-portfolio-slider-with-lightbox-captions/'
                },
                {
                    title: 'Movie Showcase Slider',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/movie-showcase-slider-counters-gallery-trailer-lightbox/'
                },
                {
                    title: 'Business Intro to Contact',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/business-intro-to-contact/'
                },
                {
                    title: 'Software Products & Reviews',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/software-products-reviews/'
                }
            ]
        },
        {
            icon: socialFeedIcon(24, 24),
            title: 'Social feeds',
            children: [
                {
                    icon: instagramIcon(24, 24),
                    title: 'Shoppable Instagram Feed Product Wall',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/shoppable-instagram-feed-product-wall/'
                },
                {
                    icon: instagramIcon(24, 24),
                    title: 'Shoppable Feed Product Display',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/shoppable-feed-product-display/'
                },
                {
                    icon: instagramIcon(24, 24),
                    title: 'Shoppable Instagram Reels Wall',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/shoppable-instagram-reels-wall/'
                },
                {
                    icon: instagramIcon(24, 24),
                    title: 'Live Outfit Video Showcase',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/live-outfit-video-showcase/'
                },
                {
                    icon: youtubeIcon(24, 24),
                    title: 'Tech Reviews Channel Hub & Subscribe Booster',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/youtube-channel-showcase-subscribe-booster/'
                },
                {
                    icon: youtubeIcon(24, 24),
                    title: 'Vogue Fashion Runway & Cinema Lounge',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/youtube-video-academy-cinema-theater/'
                },
                {
                    icon: youtubeIcon(24, 24),
                    title: 'freeCodeCamp Developer Learning Portal',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/freecodecamp-developer-learning-portal/'
                },
                {
                    icon: rssIcon(24, 24),
                    title: 'Automated RSS News Digest Magazine Grid',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/automated-rss-news-digest-magazine-grid/'
                },
                {
                    icon: rssIcon(24, 24),
                    title: 'Featured Article Multi-Column Magazine Layout',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/featured-article-multi-column-magazine-layout/'
                },
                {
                    icon: syncIcon(24, 24),
                    title: 'Dynamic E-Commerce & Product Showcase Grid',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/dynamic-api-portfolio-cdn-content-grid/'
                }
            ]
        },
        {
            icon: imageIcon(24, 24),
            title: 'Image Slider',
            children: [
                {
                    title: 'Default',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/default/',
                },
                {
                    title: 'Customize',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/customize/'
                },
                {
                    title: 'Imae Slider',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/image-slider/'
                },
                {
                    title: 'Content Slider',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/content-slider/'
                },
                {
                    title: 'Animation Slider',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/animation-slider/'
                },
                {
                    title: 'Default Content',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/default-content/'
                },
                {
                    title: 'Vertical Slide',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/vertical-slide/'
                },
                {
                    title: 'Slide on Mouse Wheel',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/slide-on-mouse-wheel/'
                },
                {
                    title: 'Arrow Follow Mouse',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/arrow-follow-mouse/'
                },
                {
                    title: 'Mouse Drag Slide',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/mouse-drag-slide/'
                },
                {
                    title: 'Dot Indicators',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/dot-indicators/'
                },
                {
                    title: 'Image Indicators',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/image-indicators/'
                },
                {
                    title: 'Vertical Image Indicators (Right)',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/vertical-image-indicators-right/'
                },
                {
                    title: 'Vertical Image Indicators (Left)',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/vertical-image-indicators-left/'
                },
                {
                    title: 'Full Width',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/full-width/'
                }
            ]
        },
        {
            icon: postIcon(24, 24),
            title: 'Posts Slider',
            children: [
                {
                    title: 'Default Layout',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/posts-default-layout/'
                },
                {
                    title: 'Carousel Layout',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/posts-carousel-layout/'
                },
                {
                    title: 'Grid Layout',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/posts-grid-layout/'
                },
                {
                    title: 'Thumbnails Layout',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/posts-thumbnails-layout/'
                },
                {
                    title: 'Default Layout with Image Indicators',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/posts-default-layout-image-indicators/'
                },
                {
                    title: 'Default Layout Fade Effect',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/posts-default-layout-fade-effect/'
                },
                {
                    title: 'Carousel Layout Center Style',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/posts-carosel-layout-center-style/'
                },
                {
                    title: 'Carousel Layout Ticker Style',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/post-carousel-layout-ticker-style/'
                },
                {
                    title: 'Carousel Layout Grid Style',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/posts-carosel-layout-grid-style/'
                },
                {
                    title: 'Carousel Layout 3D Style',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/posts-carousel-layout-3d-style/'
                }
            ]
        },
        {
            icon: wooIcon(24, 24),
            title: 'WooCommerce Slider',
            children: [{
                title: 'Default Layout',
                type: 'iframe',
                url: 'https://b-slider.bplugins.com/demo/woo-default-layout/'
            },
            {
                title: 'Carousel Layout',
                type: 'iframe',
                url: 'https://b-slider.bplugins.com/demo/woo-carousel-layout/'
            },
            {
                title: 'Grid Layout',
                type: 'iframe',
                url: 'https://b-slider.bplugins.com/demo/woo-grid-layout/'
            },
            {
                title: 'Thumbnails Layout',
                type: 'iframe',
                url: 'https://b-slider.bplugins.com/demo/woo-thumbnails-layout/'
            },
            {
                title: 'Default Layout with Image Indicators',
                type: 'iframe',
                url: 'https://b-slider.bplugins.com/demo/woo-default-layout-image-indicators/'
            },
            {
                title: 'Default Layout Fade Effect',
                type: 'iframe',
                url: 'https://b-slider.bplugins.com/demo/woo-default-layout-fade-effect/'
            },
            {
                title: 'Carousel Layout Center Style',
                type: 'iframe',
                url: 'https://b-slider.bplugins.com/demo/woo-carousel-layout-center-style/'
            },
            {
                title: 'Carousel Layout Ticker Style',
                type: 'iframe',
                url: 'https://b-slider.bplugins.com/demo/woo-carousel-layout-ticker-style/'
            },
            {
                title: 'Carousel Layout Grid Style',
                type: 'iframe',
                url: 'https://b-slider.bplugins.com/demo/woo-carousel-layout-grid-style/'
            },
            {
                title: 'Carousel Layout 3D Style',
                type: 'iframe',
                url: 'https://b-slider.bplugins.com/demo/woo-carousel-layout-3d-style/'
            }
            ]
        },
        {
            icon: videoIcon(24, 24),
            title: 'Video Slider',
            children: [
                {
                    title: 'Default Layout',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/video-default-layout/'
                },
                {
                    title: 'Carousel Layout',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/video-carousel-layout/'
                },
                {
                    title: 'Grid Layout',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/video-grid-layout/'
                },
                {
                    title: 'Thumbnails Layout',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/video-thumbnails-layout/'
                },
                {
                    title: 'Default Layout with Image Indicators',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/video-default-layout-image-indicators/'
                },
                {
                    title: 'Default Layout Fade Effect',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/video-default-layout-fade-effect/'
                },
                {
                    title: 'Carousel Layout Center Style',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/video-carousel-layout-center-style/'
                },
                {
                    title: 'Carousel Layout Ticker Style',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/video-carousel-layout-ticker-style/'
                },
                {
                    title: 'Carousel Layout 3D Style',
                    type: 'iframe',
                    url: 'https://b-slider.bplugins.com/demo/video-carousel-layout-3d-style/'
                }
            ]
        }
    ]
}

export const pricingInfo = {
    logo: `https://ps.w.org/${slug}/assets/icon-256x256.png`, // Optional
    pluginId: 19318,
    planId: 32001,
    licenses: [
        1,
        3,
        null
    ],
    button: {
        label: 'Buy Now ➜'
    },
    featured: {
        selected: 3, // choose from licenses item
    }
}


export const welcomeInfo = (adminUrl) => ({
    keywords: ['Image', 'Post', 'WooCommerce', 'Video'],
    keywordsLabel: 'Select Source Type',
    gettingStarted: {
        tabs: [
            {
                key: 'gutenberg',
                label: 'Gutenberg',
                icon: gutenbergTabIcon,
                steps: [
                    {
                        num: 1,
                        title: 'Add the B Slider Block',
                        body: 'Open the block editor on any post or page. Click the <strong>+</strong> icon in the top-left corner or type <strong>/b slider</strong> to find and insert the B Slider block.',
                        link: { url: `${adminUrl}/post-new.php`, label: 'Open Editor' }
                    },
                    {
                        num: 2,
                        title: 'Select Source Type',
                        body: 'Pick what the slides are built from — <strong>Image</strong>, <strong>Posts</strong>, <strong>WooCommerce</strong>, <strong>Video</strong>, or <strong>Gutenberg Blocks</strong> to build each slide out of real blocks. <strong>Social &amp; External Feeds</strong> (YouTube, Instagram, RSS, JSON) is available in Pro.'
                    },
                    {
                        num: 3,
                        title: 'Select Layout Type',
                        body: 'Choose how the slides are arranged — <strong>Slider</strong>, <strong>Carousel</strong>, <strong>Grid</strong>, or <strong>Thumbnails</strong>. Pro adds a <strong>List</strong> layout. Gutenberg Blocks slides support Slider and Carousel.'
                    },
                    {
                        num: 4,
                        title: 'Publish',
                        body: 'Once everything is configured, click Publish. Make sure you have entered the <strong>Title</strong>, <strong>Description</strong>, <strong>Button Text</strong>, and <strong>Button URL</strong>.'
                    }
                ]
            },
            {
                key: 'shortcode',
                label: 'ShortCode',
                icon: shortcodeTabIcon,
                steps: [
                    {
                        num: 1,
                        title: 'Open ShortCode Generator',
                        body: 'Go to <strong>B Slider &rsaquo; ShortCode Generator</strong> in your WordPress admin and click <strong>Add New ShortCode</strong>.',
                        link: { url: `${adminUrl}edit.php?post_type=bsb`, label: 'ShortCode Generator' }
                    },
                    {
                        num: 2,
                        title: 'Select Source Type',
                        body: 'Pick what the slides are built from — Image, Posts, WooCommerce, Video, or Gutenberg Blocks. Social &amp; External Feeds (YouTube, Instagram, RSS, JSON) is available in Pro.'
                    },
                    {
                        num: 3,
                        title: 'Select Layout Type',
                        body: 'Choose how the slides are arranged — Slider, Carousel, Grid, or Thumbnails. Pro adds a List layout.'
                    },
                    {
                        num: 4,
                        title: 'Publish & Copy the Shortcode',
                        body: 'Publish the post. Return to the ShortCode Generator list — the shortcode <code>[bsb-slider id=POST_ID]</code> is shown in the list table. Click it to copy to clipboard.'
                    },
                    {
                        num: 5,
                        title: 'Paste Anywhere',
                        body: 'Paste the copied shortcode (e.g. <code>[bsb-slider id=2400]</code>) into any post, page, widget area, or block using the <strong>Shortcode</strong> block.'
                    }
                ]
            },
            {
                key: 'elementor',
                label: 'Elementor',
                icon: elementorTabIcon,
                steps: [
                    {
                        num: 1,
                        title: 'Create a ShortCode',
                        body: 'Go to <strong>B Slider &rsaquo; ShortCode Generator</strong>, click <strong>Add New ShortCode</strong>, configure your layout and query, then publish. Note the shortcode from the list table.',
                        link: { url: `${adminUrl}edit.php?post_type=bsb`, label: 'ShortCode Generator' }
                    },
                    {
                        num: 2,
                        title: 'Add a Shortcode Widget',
                        body: 'Open the Elementor editor on any page. Search for the <strong>Shortcode</strong> widget and drag it to your desired location on the canvas.'
                    },
                    {
                        num: 3,
                        title: 'Enter & Preview',
                        body: 'Type <code>[bsb-slider id=2400]</code> into the widget\'s Shortcode field (replace <em>YOUR_ID</em> with your actual post ID) and click <strong>Preview</strong> to see the posts rendered live.'
                    }
                ]
            },
            {
                key: 'php',
                label: 'Theme / PHP',
                icon: phpTabIcon,
                steps: [
                    {
                        num: 1,
                        title: 'Create a ShortCode',
                        body: 'Go to <strong>B Slider Block &rsaquo; ShortCode Generator</strong>, click <strong>Add New ShortCode</strong>, configure your layout and query, then publish. Note the post ID shown in the list table.',
                        link: { url: `${adminUrl}edit.php?post_type=bsb`, label: 'ShortCode Generator' }
                    },
                    {
                        num: 2,
                        title: 'Open Your Template',
                        body: 'Open the theme template file where you want to display the posts block — for example <code>single.php</code>, <code>page.php</code>, or a custom template part.'
                    },
                    {
                        num: 3,
                        title: 'Render via do_shortcode',
                        body: 'Add <code>&lt;?php echo do_shortcode(\'[bsb-slider id=YOUR_ID]\'); ?&gt;</code> in your template (replace <em>YOUR_ID</em> with your actual post ID) to render the block on the front end.'
                    }
                ]
            }
        ]
    },
    changelogs: [
        {
            version: '2.2.1 - 10 September, 2026',
            type: 'new',
            list: [
                '<strong>New</strong> Image, post and product slides open in a lightbox on click, as one gallery with arrows, swipe and keyboard.',
                '<strong>New</strong> Caption under the picture — image caption, slide title, or post or product title — with colour, background, margin and alignment.',
                '<strong>New</strong> Lightbox toolbar switches: counter, thumbnail strip, zoom, slideshow, fullscreen, rotate, flip and download.',
                '<strong>New</strong> Backdrop colour and opacity.',
            ]
        },
        {
            version: '2.2.0 - 9 September, 2026',
            type: 'new',
            list: [
                '<strong>New</strong> Gutenberg Blocks source — build every slide from real WordPress blocks instead of a fixed title, image and button;',
                '<strong>New</strong> Layer animations on any block inside a slide, with entry effects, preset delays and a per-slide stagger;',
                '<strong>New</strong> Loop animations that keep a layer moving after it arrives — Pulse and Bounce;',
                '<strong>New</strong> Hover and click actions on a layer — grow, lift or fade on hover; open a link, scroll to a section, or move the slider on click;',
                '<strong>New</strong> Visual Timeline panel showing every animated layer on one scale, with the delay editable in place;',
                '<strong>New</strong> Typography panel on text layers, Google Fonts included;',
                '<strong>New</strong> Responsive panel — hide a layer on desktop, tablet or mobile, or let it show without animating;',
                '<strong>New</strong> Per-slide background, overlay, border, corner radius, padding and content alignment;',
                '<strong>New</strong> Empty slides offer Heading, Image, Button and Two columns as one-click starting points;',
                '<strong>New</strong> Tutorial video for the Gutenberg Blocks source, linked under the Source Type tiles and on an empty slide;',
                '<strong>New</strong> Gutenberg demo tab in the dashboard, with eight block-built slider layouts;',
            ]
        },
        {
            version: '2.0.10 - 5 April 2026',
            type: 'new',
            list: [
                '<strong>New</strong> Added a new modern dashboard.',
            ]
        },
        {
            version: '2.0.9 - 14 Mar 2026',
            type: 'new',
            list: [
                '<strong>New</strong> The free plugin now supports shortcodes.',
            ]
        },
        {
            version: '2.0.8 - 22 Jan, 2026',
            type: 'update',
            list: [
                '<strong>Update</strong> There were some minor issues with the title and the query, but I have resolved them.',
            ]
        },
        {
            version: '2.0.7 - 18 Jan, 2026',
            type: 'update',
            list: [
                '<strong>Update</strong> Patchstack ( Cross Site Scripting) problem solved;',
            ]
        },
        {
            version: '2.0.3 - 18 Sept, 2025',
            type: 'update',
            list: [
                '<strong>Update</strong> Solved the image max-width and margin;',
            ]
        },
        {
            version: '2.0.2 - 23 Aug, 2025',
            type: 'update',
            list: [
                '<strong>Update</strong> Resolved the conflict between Modula Image Gallery and bSlider;',
            ]
        },
        {
            version: '2.0.1 - 12 Aug, 2025',
            type: 'update',
            list: [
                '<strong>Update</strong> Resolved all security vulnerabilities identified by Wordfence;',
            ]
        },
        {
            version: '2.0.0 - 9 Aug, 2025',
            type: 'update',
            list: [
                '<strong>Update</strong> Fixed missing authorization check that allowed authenticated users (admin) to install arbitrary plugins;',
            ]
        }

    ],
    changelogsLimit: 6,
    changelogsReadMoreLabel: 'View More Changelogs',
    proFeatures: [
        'Social & External Feeds: Build a slider from a YouTube channel, Instagram account, RSS feed, or any JSON endpoint, auto-synced on your schedule.',
        'Feed Presets: Ready-made feed sliders — channel grid, player grid, theater, reels, card, and hover overlay.',
        'Profile Header & Mini Player: Show name, picture and follower count with a Follow button, and let a video dock into a corner as visitors scroll.',
        'Dynamic Content: Bind a post or product to a block-built slide and drop in Post Field blocks.',
        'Lottie Animation Layer: Drop a Lottie JSON into a slide and play it as the slide arrives.',
        'Advanced Layer Animations: Exit animations, word-by-word text, custom timing, and Float, Flash, Shake and Swing loops.',
        'ACF Query Controls: Sort and filter slides by any Advanced Custom Field, with unlimited fields per slide.',
        'Custom Post Type Sliders: Build a slider from any registered CPT — portfolio, services, testimonials.',
        'Lightbox Styling: Glass effect, button styling, caption typography, per-slide captions and images, size and loop controls.',
        'Advanced Carousel Styles: Create unique carousels with ticker, grid, and 3D effects.',
        'Creative Effects: Use coverflow and card-style transitions for modern visual appeal.',
        'Buttons in Content: Add clickable buttons inside slides for CTAs and product links.',
        'Advanced Animations: Control timing, delay, and duration for text and button animations.',
        'Custom Image Indicators: Replace default indicators with images for a more branded look.',
        'Multiple Arrow Icons: Select from different arrow styles to fit your design.',
        'Flexible Content Positioning: Place content anywhere within each slide for more control.',
        'Drag-and-Drop Reordering: Organize slides easily by dragging and dropping items.',
        'Mouse Controls: Navigate with the mouse wheel, dragging, or grab the cursor for better usability.',
        'Arrow Follow Mouse: Enable arrows that follow mouse movement for dynamic navigation.',
        'Responsive Slider Height: Adjust slider height per device for better responsiveness.',
        'Advanced Post Controls: Set posts per page, change order, exclude/include posts, or skip current post.',
        'WooCommerce Advanced Options: Apply the same filters and display controls to products.',
        'Full Video Controls: Unlock rewind, fast forward, progress bar, time display, mute, volume, PIP, AirPlay, download, and full screen.',
        'Grid Pagination: Add pagination with options for load more or numbered pages, aligned left, right, or center.',
        'Pagination Styling: Customize buttons with typography, colors, padding, and borders.',
        'Enhanced Thumbnails: Control navigation arrows, overlays, cursor options, and direction for thumbnails.',
        'Multiple Layouts: Switch between slider, carousel, grid, or thumbnails for flexible presentations.',
    ],
});

export const settingsInfo = {
    ajaxAction: 'bsbSaveUninstallOption',
    cleanupItems: []
};