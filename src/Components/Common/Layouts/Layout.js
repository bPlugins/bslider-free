import Carousel from './Carousel';
import Default from './Default';
import Grid from './grid/Grid';
import Thumbnails from './thumbnails/Thumbnails';
import NoPosts from '../NoPosts';
import Loading from '../Loading';
import { isProActive } from '../../../utils/functions';

const Layout = (props) => {
    const { attributes, PostsGrid, firstPosts, commonDeProps } = props;

    const { layoutType, sourceType } = attributes;
    const layouts = { default: Default, carousel: Carousel, grid: ('posts' === sourceType || 'woo' === sourceType) ? PostsGrid : Grid, thumbnails: Thumbnails };

    /*
     * Grid and Thumbnails cannot draw a `blocks` slider, so it falls back to Default.
     *
     * Both want each slide as a discrete item with a picture to crop and a thumbnail to draw,
     * and a slide built from blocks has neither. Default and Carousel both handle this source —
     * Default hands the rendered blob to Bootstrap, Carousel splits it back into slides for
     * Swiper. The settings panel offers only those two now, but a slider saved before it did
     * still carries whatever it was left on, and would otherwise render empty.
     */
    // Carousel is Pro for this source, so a free licence draws Default whatever is saved — a
    // slider built on Pro and then opened without it should still show its slides.
    const blocksLayout = 'carousel' === layoutType && isProActive() ? 'carousel' : 'default';
    const LayoutComponent = 'blocks' === sourceType ? layouts[blocksLayout] : layouts[layoutType];

    /* Only the editor sets this, so the empty state below can tell an author from a visitor and
       offer the fix to the one who can act on it. */
    const isEditor = true === commonDeProps?.isBackEnd;

    return <>{
        !firstPosts ? <Loading /> : firstPosts?.length || ['image', 'video', 'blocks'].includes(sourceType) ? <LayoutComponent {...props} /> : <NoPosts {...{ attributes, isEditor }} />
    } </>
}
export default Layout;