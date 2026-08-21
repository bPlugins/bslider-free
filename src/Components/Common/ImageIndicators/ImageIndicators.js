import Image from './SourceType/Image';
import Posts from './SourceType/Posts';
import Woo from './SourceType/Woo';


const ImageIndicators = (props) => {
    const { attributes } = props;
    const { sourceType } = attributes;


    return (() => {
        switch (sourceType) {
            // A feed item carries a `thumbnail`, which is what the Posts indicator reads.
            case 'posts':
            case 'social':
                return <Posts {...{ ...props }} />;
            case 'woo':
                return <Woo {...{ ...props }} />
            case 'video':
                return <Image {...{ ...props }} />;
            default:
                return <Image {...{ ...props }} />;
        }
    })()
}

export default ImageIndicators;