import { __ } from '@wordpress/i18n';
import { Modal } from '@wordpress/components';
import { adminUrl } from '../../../utils/functions';

const ProModal = ({ proModalOpen, setProModalOpen }) => {

    return (
        <>
            {proModalOpen && (
                <Modal className='bsbProModal' title={__('Pro Feature', 'b-slider')} onRequestClose={() => setProModalOpen(false)}>
                    <div className="proList">
                        <h3 className='title'>{__('Explore new features in Pro', 'b-slider')}</h3>
                        <ul className='list'>
                            <li className='feature'><b>Button in content.</b></li>
                            <li className='feature'><b>Layout:</b>{__(' There are two layout options horizontal and vertical.', 'b-slider')}</li>
                            <li className='feature'> <b>Animation, delay, and duration:</b> {__('Title, description, and button set this.', 'b-slider')}</li>
                            <li className='feature'><b>Indicator image:</b> {__('Set indicator image option.', 'b-slider')}</li>
                            <li className='feature'><b>Multiple Arrow icon</b></li>
                            <li className='feature'><b>Content position:</b></li>
                            <li className='feature'><b>Slide on Mousewheel:</b> {__('Slide on Mousewheel option.', 'b-slider')}</li>
                            <li className='feature'><b>Arrow Follow Mouse:</b> {__('Slide on the arrow follow option.', 'b-slider')}</li>
                            <li className='feature'><b>Slide on mouse drag:</b> {__('Slide on mouse drag.', 'b-slider')}</li>
                            <li className='feature'><b>Indicators custom position</b></li>
                            <li className='feature'><b>Slider Margin</b></li>
                            <li className='feature'><b>Shortcode:</b> {__(' Shortcode option to use anywhere.', 'b-slider')}</li>
                            <li className='feature'><b>Slider Height:</b> {__('Slider height can be set according to the device.', 'b-slider')}</li>
                            <li className='feature'><b>Slide Drag and Drop:</b> {__('Allows dragging and dropping of slide items.', 'b-slider')}</li>
                            <li className='feature'><b>Four Source Types:</b> {__('Image, Posts, WooCommerce, and Video.', 'b-slider')}</li>
                            <li className='feature'><b>Four Layout Types:</b> {__('Slider, Carousel, Grid, and Thumbnails.', 'b-slider')}</li>

                        </ul>
                        <h3 className='title'>{__('To unlock those features! Upgrade to Pro', 'b-slider')}</h3>
                    </div>

                    <div className='bsbProFeature'>

                        <a className='upgradeBtn' href={adminUrl()} target="_blank" rel="noreferrer" >{__('Upgrade Now', 'b-slider')}</a>
                    </div>
                </Modal>
            )}
        </>
    );
};

export default ProModal;