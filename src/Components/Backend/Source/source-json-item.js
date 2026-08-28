import { image, layers, video, woo, wordpress } from '../../../utils/icons';

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
        desc: "Posts, Pages, WooCommerce & CPTs",
        isNew: true
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
        sourceType: "blocks",
        icon: layers,
        title: "Gutenberg Blocks",
        desc: "Build slides with real WordPress blocks",
        isNew: true
    },
];
