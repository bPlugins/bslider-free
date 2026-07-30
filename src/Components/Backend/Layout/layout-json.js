import { carousel, grid, post_thumbnails, slider } from '../../../utils/icons';

export const layoutItem = [
    {
        icon: slider,
        title: "Default Slider",
        desc: "Classic full-width slider layout",
        layoutType: "default",
    },
    {
        icon: carousel,
        title: "Carousel Layout",
        desc: "Multi-item sliding carousel",
        layoutType: "carousel",
    },
    {
        icon: grid,
        title: "Grid Layout",
        desc: "Multi-column responsive grid",
        layoutType: "grid",
    },
    {
        icon: post_thumbnails,
        title: "Thumbnails Layout",
        desc: "Slider with bottom thumbnail strip",
        layoutType: "thumbnails",
    }
];