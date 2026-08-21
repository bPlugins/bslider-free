import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * The ACF fields a post type offers, for any panel that needs to name one.
 *
 * `AcfConfigure` asks the same endpoint for the same list, but it does more with the answer than
 * read it — arriving fields are also what prune a selection saved for a previous post type — so the
 * fetch stayed there and this is deliberately only the reading half. A panel that just wants to
 * offer the names, like the sort field picker, has no business carrying the pruning.
 *
 * @param {string} postType Slug to ask about.
 * @return {{label: string, value: string, type: string}[]} Empty until the request answers, and
 *         after one that fails or finds nothing — the caller cannot tell those apart, and for a
 *         picker it does not matter: there is nothing to offer either way.
 */
const useAcfFields = postType => {
    const [fields, setFields] = useState([]);

    useEffect(() => {
        let stale = false;

        apiFetch({ path: `/bsb/v1/acf-fields?post_type=${postType}` })
            .then(data => {
                // A slower request for the previous post type must not overwrite the current one.
                if (stale || !Array.isArray(data?.fields)) return;

                setFields(data.fields.map(f => ({
                    label: f.label,
                    value: f.value,
                    type: f.type,
                    // Both only travel for the types that have them — see `fields_for_post_type`.
                    choices: f.choices,
                    multiple: f.multiple
                })));
            })
            .catch(() => { if (!stale) setFields([]) });

        return () => { stale = true };
    }, [postType]);

    return fields;
};

export default useAcfFields;
