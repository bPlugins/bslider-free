import { __ } from '@wordpress/i18n';
import { Spinner } from '@wordpress/components';

const Loading = () => <h3 className='bsbLoading'><Spinner /> {__('Loading...', 'b-slider')}</h3>;
export default Loading;