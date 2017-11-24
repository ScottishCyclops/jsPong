"use strict"

// math
/**
 * Returns a pseudo random number between the min and max
 * @param {number} min
 * @param {number} max
 */
const rand = (min, max) => Math.random() * (max - min) + min;
/**
 * Clamps a number between the min and max
 * @param {number} value the value to limit
 * @param {number} min
 * @param {number} max
 */
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
/**
 * If the number is smaller than 0, returns -1,
 * if the numer is geater than 0, returns 1
 * @param {number} value
 */
const normalize = value => value < 0 ? -1 : value > 0 ? 1 : 0;
/**
 * Adds the suffix `px` to the given value
 * @param {string | number} value
 */
const px = value => value.toString() + "px";
/**
 * Is the `pos2` inside the box `pos - size`
 * @param {{x: number, y: number}} pos
 * @param {{x: number, y: number}} size
 * @param {{x: number, y: number}} pos2
 */
const isInside = (pos, size, pos2) =>
(
    pos2.x >= pos.x &&
    pos2.x <= pos.x + size.x &&
    pos2.y >= pos.y &&
    pos2.y <= pos.y + size.y
);

// obj helper
const setProps = (obj, ...properties) =>
{
    for(const props of properties)
    {
        Object.assign(obj, props);
    }
    return obj;
};

// DOM helper
/**
 * Applies styling to a DOM element
 * @param {HTMLElement} elem
 * @param {any[]} styles list of style objects
 * @return {HTMLElement} the given `elem`
 */
const applyStyle = (elem, ...styles) =>
{
    setProps(elem.style, ...styles);
    return elem;
};
/**
 * Sets the CSS transform based on the given vector
 * @param {HTMLElement} elem the DOM element to move
 * @param {{x: number, y: number}} pos position vector
 */
const translate = (elem, pos) => applyStyle(elem, { transform: `translate(${px(pos.x)}, ${px(pos.y)})` });
/**
 * Adds a DOM element to the body of the document
 * @param {HTMLElement} elem
 * @return {HTMLElement} the given `elem`
 */
const addToDom = elem =>
{
    document.body.appendChild(elem);
    return elem;
};
/**
 * Removes a DOM element from the body of the document
 * @param {HTMLElement} elem
 * @return {HTMLElement} the given `elem`
 */
const removeFromDom = elem =>
{
    document.body.removeChild(elem);
    return elem;
};

// vec math
/**
 * Creates a 2D vector
 * @param {number} x
 * @param {number} y
 */
const vec2 = (x, y) => ({ x, y });
/**
 * Adds a scalar to a 2D vector
 * @param {{x: number, y: number}} vec
 * @param {number} scalar
 */
const subScal = (vec, scalar) => vec2(vec.x - scalar, vec.y - scalar);
/**
 * Multiply a 2D vector by a scalar
 * @param {{x: number, y: number}} vec
 * @param {number} scalar
 */
const multScal = (vec, scalar) => vec2(vec.x * scalar, vec.y * scalar);

/**
 * Calls the callback with the value of the first passing test
 * @param {(value: any) => any} callback
 * @param {{value: () => any, call: () => boolean}[]} tests
 */
const multiTestCallback = (callback, ...tests) =>
{
    for(const test of tests)
    {
        // using a function makes it lazy: the other conditions wont be
        // computed if one before them passes
        if(!test.condition())
        {
            continue;
        }

        // lazy too
        return callback(test.value());
    }
};

/**
 * Functional if
 * @param {boolean} condition the condition to test
 * @param {Function} ifTrue the function to call if true (optional)
 * @param {Function} ifFalse the function to call if false (optional)
 * @return {any} the return value of the called callback
 */
const branch = (condition, ifTrue, ifFalse) => condition ? (ifTrue || (()=>{}))() : (ifFalse || (()=>{}))();
