import { useState } from "react";

const ClipBoard = ({ shortcode }) => {
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
                <p>Copy this shortcode and paste it into your post, page, or text widget content</p>
                <button onClick={handleCopy}>
                    {hasCopied ? "Copied Shortcode!" : shortcode}
                </button>
            </div>
        </section>
    );
};

export default ClipBoard;
