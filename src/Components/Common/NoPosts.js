import { __ } from '@wordpress/i18n';
import { emptySliderIcon } from '../../utils/icons';

/**
 * What a slider shows when its query comes back empty.
 *
 * Not an error, so it does not look like one. Nothing has broken — the query simply matched no
 * posts — and the red heading this used to be read as a fault in the plugin.
 *
 * The wording turns on who is reading it. In the editor that is the person who can fix it, so it
 * names the panel and the controls to loosen. On the front end the same sentence would be telling a
 * visitor to open a sidebar they have no access to, so they get a plain line and nothing to act on.
 */
const NoPosts = ({ attributes, isEditor = false }) => {
    const { sourceType } = attributes;
    const isProduct = 'woo' === sourceType;

    /* Was one interpolated string, which `__()` cannot extract — a template literal is built at
       runtime, so nothing reaches the .pot file for a translator to work from. */
    const title = isProduct
        ? __('No products to show', 'b-slider')
        : __('No posts to show', 'b-slider');

    const editorHint = isProduct
        ? __('Nothing matched this query. Widen the categories, tags or offset in the Product Query panel — or publish a product.', 'b-slider')
        : __('Nothing matched this query. Widen the categories, tags or offset in the Post Query panel — or publish a post.', 'b-slider');

    return <div className='bsbNoPosts' role='status'>
        <span className='bsbNoPostsIcon'>{emptySliderIcon}</span>

        <h3 className='bsbNoPostsTitle'>{title}</h3>

        <p className='bsbNoPostsText'>
            {isEditor ? editorHint : __('There is nothing to show here yet. Please check back soon.', 'b-slider')}
        </p>
    </div>
}
export default NoPosts;
