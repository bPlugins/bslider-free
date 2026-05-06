import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Demos from '../../../../bpl-tools/Admin/Demos';
import Pricing from '../../../../bpl-tools/Admin/Pricing';
import FeatureCompare from '../../../../bpl-tools/Admin/FeatureCompare';
import Activation from '../../../../bpl-tools/Admin/Activation';
import OurPlugins from '../../../../bpl-tools/Admin/OurPlugins';

import Layout from './Layout';
import Welcome from './Welcome';
import { demoInfo, pricingInfo } from '../utils/data';

const App = (props) => {

    return <Router>
        <Routes>
            <Route path='/' element={<Layout {...props} />}>
                <Route index element={<Welcome {...props} />} />

                <Route path='welcome' element={<Welcome {...props} />} />

                <Route path='demos' element={<Demos demoInfo={demoInfo} {...props} />} />

                <Route path='pricing' element={<Pricing pricingInfo={pricingInfo} options={{}} {...props} />} />

                <Route path='feature-comparison' element={<FeatureCompare plans={['free', 'pro']} {...props} />} />

                <Route path='our-plugins' element={<OurPlugins {...props} />} />

                <Route path='*' element={<Navigate to='/welcome' replace />} />
            </Route>
        </Routes>
    </Router>
}
export default App;