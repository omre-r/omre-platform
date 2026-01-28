

// This is a brief guide on programming with JavaScript as a team.
// We will find ourself doing the same thing over and over again,
// and so you may refer to this guide for consistency. 

// Note: I would not force my habits onto others, please view 
// this as a guide for others and myself.

// NAMING ------------------------------------------------------------------

// Regular functions: camelCase
function namingFunctions(){} 

// Component functions: PascalCase
function NamingComponents(){}

// Modifiable variables or constants with mutable values: camelCase
let namingVariables;
const namingConstantMutables = [];

// Constants with immutable values: CAPITAL_SNAKE_CASE
const CONSTANT_LITERAL = 10;

// Objects -----------------------------------------------------------------

// Access properties with dot operator, unless brackets are needed
const randomInfo = {
    color: "red",
    "height-imperial": "5'9",
}
if (randomInfo.color === "red" || randomInfo["height-imperial"]){}

// iterate using for (let val of iterable) syntax
for (let value of Object.values(randomInfo)){}


// Functions----------------------------------------------------------------

// Prefer traditional functions over arrow functions in primary / reusable methods
// Arrow functions are always preferred within other functions.
function mainFunction(){
    const helper = () => {}
}

// Prioritize early returns 
// Ensure variables and properties exist as well
const helperVariable = {value: 7}
function earlyReturn(){
    if (!helperVariable?.value || helperVariable.value !== 5){
        return
    }
    //process
}

// Creating Comments 
// Code can be self documenting, though try to explain when it is not

// unhelpful: Switches the color
// helpful: Switches the color between black and red
function handleColorSwitch(){}




// Data ----------------------------------------------------------------------

// when creating interfaces (for example with our API interface),
// store values in a meaningful way.
async function getPreferences(){
    const response = await fetch("https://somerandomurlthatmayormaynotexist/preferences");
    const data = await response.json();

    return data.data.preferences // This is better than "return data.data"
}

