
const slug = 'b-slider';

export const dashboardInfo = (info) => {
    const { version, isPremium, hasPro, licenseActiveNonce } = info;

    return {
        name: `B Slider Block`,
        displayName: `B Slider Block - Create Responsive Image, Post, Product, and Video Sliders`,
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

        licenseActiveNonce,
        changelogs: [
            {
                version: '2.0.11 - 7 May 2026',
                type: 'update',
                list: [
                    ' Update: Removed restricted "Locked Fields" to improve user flexibility',
                    'New: Custom Slider Height: Easily define and set the perfect height for your sliders',
                    'New: Dynamic Indicators: Fully customize indicator types, positioning, and direction (Horizontal or Vertical).',
                    'New: Carousel Enhancements: Toggle visibility for Navigation Arrows and Pagination Indicators with a single click.',
                    'New: Grid Flexibility: Set items per page and choose your preferred pagination style (Standard Button or Load More).',
                    'New: Post Per Page: Control the exact density of your content.',
                    ' New: Advanced Sorting: Organize content by specific criteria (Order By) and direction (ASC/DESC).',
                    'New: Post Offset: Skip specific posts to create unique layouts and avoid duplication.',
                    ' New: Playback Settings: New options for Auto-play, Loop/Repeat, and Muted starts.',
                    ' New: Comprehensive Player Controls: Empower users with a full suite of controls including Play/Pause, Mute, Rewind/Fast-Forward, and real-time displays for Progress, Current Time, and Duration.',
                    ' Improved: Overall code quality and strengthened security protocols.',
                ]
            },
            {
                version: '2.0.10 - 5 April 2026',
                type: 'new',
                list: [
                    'Added a new modern dashboard.',
                ]
            },
            {
                version: '2.0.9 - 14 Mar 2026',
                type: 'new',
                list: [
                    'The free plugin now supports shortcodes.',
                ]
            },
            {
                version: '2.0.8 - 22 Jan, 2026',
                type: 'update',
                list: [
                    'There were some minor issues with the title and the query, but I have resolved them.',
                ]
            },
            {
                version: '2.0.7 - 18 Jan, 2026',
                type: 'update',
                list: [
                    'Patchstack ( Cross Site Scripting) problem solved;',
                ]
            },
            {
                version: '2.0.3 - 18 Sept, 2025',
                type: 'update',
                list: [
                    'Solved the image max-width and margin;',
                ]
            },
            {
                version: '2.0.2 - 23 Aug, 2025',
                type: 'update',
                list: [
                    'Resolved the conflict between Modula Image Gallery and bSlider;',
                ]
            },
            {
                version: '2.0.1 - 12 Aug, 2025',
                type: 'update',
                list: [
                    'Resolved all security vulnerabilities identified by Wordfence;',
                ]
            },
            {
                version: '2.0.0 - 9 Aug, 2025',
                type: 'update',
                list: [
                    'Fixed missing authorization check that allowed authenticated users (admin) to install arbitrary plugins;',
                ]
            }

        ],
        proFeatures: [
            'Custom HTML Wrapper Tags**: Options to use specific tags like h1-h6 for better structure and SEO.',
            'Slider Transition Effects**: Professional animation effects for seamless slide transitions.',
            'Left/Right Inner Gap**: Customizable internal spacing between slider items.',
            'Dual Slide Direction**: Support for both horizontal and vertical movement paths.',
            'Custom Arrow Styles**: Unique navigation arrow designs to match your branding.',
            'Slide on Mouse Wheel**: Ability to navigate through slides using the mouse scroll wheel.',
            'Arrow Follow Mouse**: Interactive navigation arrows that dynamically follow the cursor.',
            'Slide on Mouse Drag**: Smooth drag-to-slide functionality for a tactile user experience.',
            'Lazy Load Enable**: Optimizes performance by deferring the loading of offscreen images.',
            'Move From Edge**: Precise control over the spacing of content from the slider edges.',
            'Video Reset On End**: Automatically restarts videos from the beginning once they finish.',
            'Video Auto Hide Controls**: Automatically hides playback UI during periods of inactivity.',
            'Advanced Video Tools**: Includes Mute, PIP (Picture-in-Picture), AirPlay, Download, and Fullscreen.',
            'Pagination Position**: Flexible alignment for pagination buttons within grid layouts.',
            'Include/Exclude Posts & Products**: Manually select exactly which items to display or hide.',
            'Exclude Current Post**: Prevents the post being currently viewed from appearing in the feed.',
            'Grab Cursor Interaction**: Displays a "grab" icon to improve carousel usability.',
            'Thumbnail Direction & Navigation**: Controls for thumbnail flow and dedicated navigation arrows.',
            'Thumbnail Styling**: Custom settings for thumbnail position, dimensions, borders, and color overlays.',
            'Box Model Controls**: Full management of Margin, Padding, Border, and Border Radius.',
            'Advanced Typography**: Comprehensive styling for fonts, sizes, and text behavior.',
            'Interactive Color States**: Set specific colors for both standard and hover states.',
            'Animation Timing**: Granular control over animation duration and start delays.',
            'Clickable CTA Buttons**: Add custom button labels and URLs directly into slide content.',
            'Smart Link Behavior**: Option to open button links in a new browser tab automatically.',
            'Advanced Carousel Styles**: Create unique carousels with ticker, grid, and 3D effects.'

        ],

        startButton: {
            label: 'Start Now',
            url: `wp-admin/post-new.php?post_type=bsb`
        }
    }
}

export const demoInfo = {
    allInOneLabel: 'See All Demos',
    allInOneLink: 'https://bplugins.com/products/b-slider/#demos',
    demos: [
        {
            icon: '',
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
            icon: '',
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
            icon: '',
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
            icon: '',
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