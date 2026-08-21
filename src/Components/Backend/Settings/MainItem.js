import { ItemsPanel } from '../../../../../bpl-tools/Components';
import Item from './Item'

const MainItem = ({ itemsProps }) => {
    const { premiumProps } = itemsProps;

    return <ItemsPanel {...itemsProps} newItem={{
        image: { id: null, url: '', alt: '', title: '' },
        poster: "",
        action: 'none',
        link: '',
        caption: ''
    }} ItemSettings={Item} itemLabel='Slide' design={premiumProps?.isPremium ? 'sortable' : 'all'} />
}
export default MainItem