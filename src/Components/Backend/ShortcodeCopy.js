import { useState } from "react";
import { __ } from '@wordpress/i18n';

const ShortcodeCopy = ({ shortcode }) => {
    const [hasCopied, setHasCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shortcode);
            setHasCopied(true);
            setTimeout(() => setHasCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    return (
        <section className="clipBoard">
            <div className="clipBtnWrapper">
                <p>{__('Copy this shortcode and paste it into your post, page, or text widget content', 'b-slider')}</p>
                <button onClick={handleCopy}>
                    {hasCopied ? __('Copied Shortcode!', 'b-slider') : shortcode}
                </button>
            </div>
        </section>
    );
};

export default ShortcodeCopy;
