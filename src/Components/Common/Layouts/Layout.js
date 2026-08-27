import Carousel from './Carousel';
import Default from './Default';
import Grid from './grid/Grid';
import Thumbnails from './thumbnails/Thumbnails';
import NoPosts from '../NoPosts';
import Loading from '../Loading';

const Layout = (props) => {
    const { attributes, PostsGrid, firstPosts, commonDeProps } = props;

    const { layoutType, sourceType } = attributes;
    const layouts = { default: Default, carousel: Carousel, grid: ('posts' === sourceType || 'woo' === sourceType) ? PostsGrid : Grid, thumbnails: Thumbnails };

    const LayoutComponent = layouts[layoutType];

    /* Only the editor sets this, so the empty state below can tell an author from a visitor and
       offer the fix to the one who can act on it. */
    const isEditor = true === commonDeProps?.isBackEnd;

    return <>{
        !firstPosts ? <Loading /> : firstPosts?.length || ['image', 'video', 'blocks'].includes(sourceType) ? <LayoutComponent {...props} /> : <NoPosts {...{ attributes, isEditor }} />
    } </>
}
export default Layout;