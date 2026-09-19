import ItemsPanel from '../../../../../bpl-tools/Components/ItemsPanel/ItemsPanel';
import Item from './Item'

const MainItem = ({ itemsProps }) => {

    return <ItemsPanel {...itemsProps} newItem={{
        image: { id: null, url: '', alt: '', title: '' },
        poster: "",
        action: 'none',
        link: '',
        caption: ''
    }} ItemSettings={Item} itemLabel='Slide' design={'all'} />
}
export default MainItem