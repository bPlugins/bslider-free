import { ItemsPanel } from '../../../../../bpl-tools/Components';
import Item from './Item'
import ProNotice from '../../Panel/ProNotice';
import { PRO_FEATURES } from '../../../utils/pro-features';

/**
 * The Slides list.
 *
 * The notice sits here rather than in `Item`, which draws once per slide: the button's three fields
 * are the same three whichever slide is open, so naming them once under the list says it as well as
 * repeating it under every slide would, and does not grow with the slider.
 */
const MainItem = ({ itemsProps }) => {
    const { premiumProps } = itemsProps;

    return <>
        <ItemsPanel {...itemsProps} newItem={{
            image: { id: null, url: '', alt: '', title: '' },
            poster: "",
            action: 'none',
            link: '',
            caption: ''
        }} ItemSettings={Item} itemLabel='Slide' design={premiumProps?.isPremium ? 'sortable' : 'all'} />

        <ProNotice className='mt10' features={PRO_FEATURES.slides} />
    </>
}
export default MainItem
