const Source = (props) => {
    const { attributes } = props;
    const { sourceType } = attributes;

    const sources = { image: Image };

    const SourceComponent = sources[sourceType];

    return <SourceComponent {...props} />
}
export default Source;