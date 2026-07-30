import { noticeIcon } from '../../utils/icons';

/** `children` is the message; the default is kept for the call sites that relied on it. */
const Notice = ({ children }) => {
    return <div className='bsbNotice'>
        <div className="icon">{noticeIcon}</div>
        <p>{children || 'Only work in front-end'}</p>
    </div>
}
export default Notice;