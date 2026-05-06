const Edit = ({ attributes }) => {
    return <Layout>
        <Source {...attributes} />
    </Layout>
}

const Layout = ({ layout = 'default', children }) => {

    const layouts = { default: Default, carousel: Carousel, grid: Grid, thumbnail: Thumbnail };

    const LayoutComponent = layouts[layout];

    return <LayoutComponent>{children}</LayoutComponent>
    // switch (layout) {
    //     case 'default':
    //         return <Default>{children}</Default>
    //     case 'carousel':
    //         return <Carousel>{children}</Carousel>
    //     case 'grid':
    //         return <Grid>{children}</Grid>
    //     case 'thumbnail':
    //         return <Thumbnail>{children}</Thumbnail>
    //     default:
    //         return null;
    // }
}

const Source = ({ source = 'image' }) => {
    switch (source) {
        case 'image':
            return <image-content></image-content>
        case 'posts':
            return <posts-content></posts-content>
        case 'products':
            return <products-content></products-content>
        case 'video':
            return <video-content></video-content>
        default:
            return null;
    }
}

const Default = ({ children }) => {
    return <bootstrap-slider>{children}</bootstrap-slider>
}
const Carousel = ({ children }) => {
    return <swiper-slider>{children}</swiper-slider>
}
const Grid = ({ children }) => {
    return <grid>{children}</grid>
}
const Thumbnail = ({ children }) => {
    return <thumbnail>{children}</thumbnail>
}