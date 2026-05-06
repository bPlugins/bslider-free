import { __ } from '@wordpress/i18n';

const NoPosts = ({ attributes }) => {
    const { sourceType } = attributes;
    const checkSource = sourceType === "posts" ? "posts" : "products";

    return <>
        <h3 className='bsbNoPosts'>{__(`No ${checkSource} found!! Please update the query or add some posts`, 'b-slider')}</h3>
    </>

}
export default NoPosts;