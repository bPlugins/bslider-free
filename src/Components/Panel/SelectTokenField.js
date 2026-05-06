import { useEffect, useRef, useState } from "react";
import "./style.scss";

/**
 * SelectTokenField Component
 * @param {Object} props
 * @param {boolean} props.multiple - Enable multiple selection mode. Default: false
 * @param {string|string[]} props.defaultValue - Initial selected value(s). For multiple mode, use array of strings
 * @param {string|string[]} props.value - Controlled value(s). Takes precedence over defaultValue
 * @param {Function} props.onChange - Callback function when selection changes. Receives selected value(s)
 * @param {Array<{value: string, label: string}>} props.options - Array of options to display
 *		Each option should have:
 *		- value: unique identifier
 *		- label: display text
 */
const SelectTokenField = ({ multiple = true, defaultValue, value, onChange = () => { }, options = [] }) => {
    const [inputVal, setInputVal] = useState("");
    const [toggle, setToggle] = useState(false);
    const toggleRef = useRef();

    const defaultWithValue = value ? value : defaultValue;

    const activeItem = options && options.find((option) => option.value === defaultWithValue);

    const activeMultipleItem = options && options.filter((option) => defaultWithValue?.includes(option.value));

    useEffect(() => {
        const handle = (e) => {
            if (!toggleRef?.current?.contains(e.target)) {
                setToggle(false);
            }
        };
        document.addEventListener("mousedown", handle);
        return () => {
            document.removeEventListener("mousedown", handle);
        };
    }, [toggle]);

    const searchTerm = options.filter((option) => option.label.toLowerCase().includes(inputVal.toLowerCase()))
    const id = Math.floor(Math.random() * 999999)
    return (
        <div className="bPl-token-field-main-wrapper">
            <div
                className="bPl-single-token-field-wrapper"
                {...(multiple ? { style: { width: "100%" } } : {})}
                ref={toggleRef}
            >
                {!multiple && (
                    <div
                        onClick={() => setToggle(!toggle)}
                        className={`bPl-single-token-field ${toggle ? "activeField" : ""}`}
                    >
                        {activeItem ? (
                            <span className="bPl-token-field-value">{activeItem.label}</span>
                        ) : (
                            <span className="bPl-token-field-value">Select an option</span>
                        )}
                        <span onClick={() => onChange("")} className="bPl-xMark-icon">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 384 512"
                                height="14px"
                            >
                                <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" />
                            </svg>
                        </span>
                        <span
                            onClick={() => setToggle(!toggle)}
                            style={{ transform: toggle ? "rotate(180deg)" : "rotate(0deg)" }}
                            className="bPl-arrow-icon"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 448 512"
                                height="14px"
                            >
                                <path d="M201.4 374.6c12.5 12.5 32.8 12.5 45.3 0l160-160c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L224 306.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160z" />
                            </svg>
                        </span>
                    </div>
                )}
                {multiple && (
                    <div className="bPl-token-multiple-filed-wrapper">
                        <label htmlFor={`searchText${id}`}>
                            <div
                                onClick={() => setToggle(true)}
                                className={`bPl-token-multiple-filed-wrapper-item ${toggle ? "focusItem" : ""
                                    }`}
                                style={{ cursor: "text" }}
                            >
                                {!toggle && !defaultWithValue?.length > 0 && (
                                    <div className="bPl-empty-token-field">
                                        <span>Select an option</span>
                                    </div>
                                )}
                                {activeMultipleItem?.map((item, i) => (
                                    <div key={i} className={`bPl-multiple-token-field`}>
                                        <span className="bPl-multiple-token-field-value">
                                            {item.label}
                                        </span>

                                        <span onClick={() => onChange(defaultWithValue?.filter((val) => val !== item.value))} className="bPl-xMark-icon">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" height="14px" >
                                                <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" />
                                            </svg>
                                        </span>
                                    </div>
                                ))}
                                <input type="text" name="" id={`searchText${id}`} className="bPl-multiple-search" onChange={(e) => setInputVal(e.target.value)} />
                            </div>
                        </label>
                    </div>
                )}
                {options?.length > 0 && toggle && (
                    <div className="bPl-token-field-dropdown-wrapper">
                        <ul className="bPl-token-field-dropdown-list">
                            {searchTerm.map((option, index) => (
                                <li
                                    className={`${multiple
                                        ? activeMultipleItem.find(
                                            (item) => item.value === option.value
                                        )
                                            ? "multipleActiveItem"
                                            : ""
                                        : option.value === defaultWithValue
                                            ? "activeItemInList"
                                            : ""
                                        }`}
                                    onClick={() => {
                                        if (multiple) {
                                            if (defaultWithValue) {
                                                onChange([...defaultWithValue, option.value]);
                                            } else {
                                                onChange([option.value]);
                                            }
                                            if (defaultWithValue?.includes(option.value)) {
                                                setToggle(true);
                                            } else {
                                                setToggle(false);
                                            }
                                        } else {
                                            onChange(option.value);
                                            setToggle(false);
                                        }
                                    }}
                                    key={index}
                                >
                                    {option.label}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SelectTokenField;