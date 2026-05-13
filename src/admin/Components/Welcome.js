import { __ } from '@wordpress/i18n';
import Overview from '../../../../bpl-tools/Admin/Overview';
import Changelog from '../../../../bpl-tools/Admin/Changelog';


const Welcome = (props) => {
    const { isPremium } = props;

    return <Overview {...props}>
        <div style={{
            display: 'grid',
            gridTemplateColumns: isPremium ? '1fr' : 'repeat(auto-fill, minmax(min(480px, 100%), 1fr))',
            gap: '32px'
        }}>
            <Changelog {...props} limit={5} loadMoreLabel={__('View More Changelogs', 'b-slider')} />


        </div>
    </Overview>
}
export default Welcome;