import { isProActive } from '../../utils/functions';
import { PRO_FEATURES } from '../../utils/pro-features';
import ProNotice from '../Panel/ProNotice';

const ProLayoutsPromo = () => {
    if (isProActive()) {
        return null;
    }

    return <ProNotice className='mt15' features={PRO_FEATURES.layouts} />;
};

export default ProLayoutsPromo;
