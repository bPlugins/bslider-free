/** Title, Description or Button with Absolute Position: out of the caption box, on a layer over the whole slide, at their X/Y (Style.js). */

export const isPlaced = (attributes, part) => Boolean(attributes?.[part]?.place?.absolute);

/** `parts`: [name, element or false]; draws nothing when none is placed. */
const FreeParts = ({ parts }) => {
	const shown = parts.filter(([, element]) => element);

	if (!shown.length) {
		return null;
	}

	return <div className='bsb-free-parts'>
		{shown.map(([part, element]) => <div key={part} className={`bsb-free-part bsb-free-${part}`}>{element}</div>)}
	</div>;
};

export default FreeParts;
