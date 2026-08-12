import { grid as gridIcon, carousel as masonryIcon, slider as sliderIcon, carousel as tickerIcon } from '../../utils/icons';
import { elementorTabIcon, gutenbergTabIcon, phpTabIcon, shortcodeTabIcon } from './icons';


const slug = 'b-slider';

export const dashboardInfo = (info) => {
    const { version, isPremium, hasPro, adminUrl, licenseActiveNonce, deleteDataOnUninstall = false, uninstallNonce = '' } = info;

    const proSuffix = isPremium ? ' Pro' : '';

    return {
        name: `B Slider Block${proSuffix}`,
        displayName: `B Slider Block${proSuffix} - Create Responsive Image, Post, Product, and Video Sliders`,
        description: 'bSlider is a WordPress slider plugin that lets you create responsive image, post, product, and video carousels using the Gutenberg block & shortcode.',
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
            icon: gridIcon,
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
            icon: masonryIcon,
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
            icon: sliderIcon,
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
            icon: tickerIcon,
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
                        body: 'Choose your preferred source type below (<strong>image</strong>, <strong>posts</strong>, <strong>woocommerce</strong>, <strong>video</strong>) to configure your slider.'
                    },
                    {
                        num: 3,
                        title: 'Select Layout Type',
                        body: 'Choose your preferred layout type below (<strong>slider</strong>, <strong>carousel</strong>, <strong>grid</strong>, <strong>thumbnails</strong>) to configure your slider.'
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
                        body: 'Choose your preferred source type below (image, posts, woocommerce, video) to configure your slider.'
                    },
                    {
                        num: 3,
                        title: 'Select Layout Type',
                        body: 'Choose your preferred layout type below (slider, carousel, grid, thumbnails) to configure your slider.'
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