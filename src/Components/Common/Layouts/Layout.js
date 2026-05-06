import Carousel from './Carousel';
import Default from './Default';
import Grid from './grid/Grid';
import Thumbnails from './thumbnails/Thumbnails';
import NoPosts from '../NoPosts';
import Loading from '../Loading';

const Layout = (props) => {
    const { attributes, PostsGrid, firstPosts } = props;

    const { layoutType, sourceType } = attributes;
    const layouts = { default: Default, carousel: Carousel, grid: ('posts' === sourceType || 'woo' === sourceType) ? PostsGrid : Grid, thumbnails: Thumbnails };

    const LayoutComponent = layouts[layoutType];

    return <>{
        !firstPosts ? <Loading /> : firstPosts?.length || ['image', 'video'].includes(sourceType) ? <LayoutComponent {...props} /> : <NoPosts {...{ attributes }} />
    } </>
}
export default Layout;