import Blocks from './SourceType/Blocks';
import Image from './SourceType/Image';
import Posts from './SourceType/Posts';
import Woo from './SourceType/Woo';


const ImageIndicators = (props) => {
    const { attributes } = props;
    const { sourceType } = attributes;


    return (() => {
        switch (sourceType) {
            case 'blocks':
                return <Blocks {...{ ...props }} />;
            case 'posts':
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