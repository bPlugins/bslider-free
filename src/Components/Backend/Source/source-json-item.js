import { image, socialFeed, video, woo, wordpress, youtube } from '../../../utils/icons';

export const sourceItem = [
    {
        sourceType: "image",
        icon: image,
        title: "Custom Images",
        desc: "Upload or select custom images"
    },
    {
        sourceType: "post_types",
        icon: wordpress,
        title: "Post Types",
        desc: "Posts, Pages, WooCommerce & CPTs"
    },
    {
        sourceType: "woo",
        icon: woo,
        title: "WooCommerce",
        desc: "Products, prices & categories"
    },
    {
        sourceType: "video",
        icon: video,
        title: "Video Slider",
        desc: "Self-hosted, YouTube & Vimeo"
    },
    {
        sourceType: "social",
        icon: socialFeed,
        title: "Social Feeds",
        desc: "Auto-sync from YouTube & more",
        isNew: true
    },
];

/**
 * The services a `social` slider can read.
 *
 * Mirrors `SocialFeed::FEED_TYPES`, which is what actually decides whether a feed can be read.
 */
export const feedItem = [
    {
        feedType: "youtube",
        icon: youtube,
        title: "YouTube Channel",
        desc: "Latest videos from any channel or playlist",
        available: true
    },
    {
        feedType: "youtube_video",
        icon: youtube,
        title: "YouTube Video",
        desc: "A single YouTube video from a URL",
        available: true
    },
    {
        feedType: "rss",
        icon: socialFeed,
        title: "RSS Feed",
        desc: "Any blog or news feed",
        available: true
    },
    {
        feedType: "json",
        icon: socialFeed,
        title: "External JSON / CDN",
        desc: "A remote image or content endpoint",
        available: true
    },
    {
        feedType: "instagram",
        icon: socialFeed,
        title: "Instagram Feed",
        desc: "Posts from a connected account",
        available: true
    },
];
