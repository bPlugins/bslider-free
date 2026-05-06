import Overview from '../../../../bpl-tools/Admin/Overview';
import Changelog from '../../../../bpl-tools/Admin/Changelog';
import ProAds from '../../../../bpl-tools/Admin/ProAds';

const Welcome = (props) => {
    const { isPremium } = props;

    return <Overview {...props}>
        <div style={{
            display: 'grid',
            gridTemplateColumns: isPremium ? '1fr' : 'repeat(auto-fill, minmax(min(480px, 100%), 1fr))',
            gap: '32px'
        }}>
            <Changelog {...props} />

            {!isPremium && <ProAds {...props} />}
        </div>
    </Overview>
}
export default Welcome;