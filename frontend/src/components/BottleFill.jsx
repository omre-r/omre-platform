//  Take props from mixology page -----------------------------------
// p1, p2, p3 are the percentages of each fragrance, which determine where the color stops are in the gradient
// threeFragrances is a boolean that determines whether to render the gradient for 2 or 3 fragrances
export default function BottleFill({ p1, p2, p3, color1, color2, color3, threeFragrances }) {

    // The offsets for the color stops in the gradient, based on the percentages of each fragrance.
    const stop1 = p1;
    const stop2 = p1 + p2;

    // How soft the transitions are between colors, in percentage points. Higher means softer.
    const BLEND = 8;

    // Helper clamp so offsets never go below 0 or above 100
    const clamp = (v) => Math.max(0, Math.min(100, v));

    // Calculate the start and end points for the blends around each stop, clamping to ensure they stay within 0-100%
    const stop1StartBlend = clamp(stop1 - BLEND);
    const stop1EndBlend = clamp(stop1 + BLEND);
    const stop2StartBlend = clamp(stop2 - BLEND);
    const stop2EndBlend = clamp(stop2 + BLEND);

    // This returns the svg image we are calling in mixology, with a linear gradient fill that has color stops based on the fragrance percentages. The blend values create a smoother transition between colors.
    return (
    <svg
        // Viewbox set to original svg export dimensions from figma
        viewBox="0 0 245 334"
        style={{ 
            width: "100%", 
            height: "100%", 
            opacity: 0.55 
        }}>
        <defs>
            <linearGradient 
                // Defining my gradient with this id and calling it in the path fill attribute below with url(#liquidGrad)
                id="liquidGrad" 
                // Top to bottom gradient
                x1="0%" 
                y1="0%" 
                x2="0%" 
                y2="100%"
            >
            
            {/* Color 1 starting from 0% at the top  */}
            <stop offset="0%" stopColor={color1} />

            {/* Begin blending transition from color1 to color2 */}
            {/* Stops are used to define where the gradient changes color */}
            <stop offset={`${stop1StartBlend}%`} stopColor={color1} />

            {/* End blend transition from color1 to color2 */}
            {/* SVG creates the fade between the two blends */}
            <stop offset={`${stop1EndBlend}%`} stopColor={color2} />

            {/* If not in threeFragrance mode, we end at 100% with color2 */}
            {!threeFragrances && 
                <stop offset="100%" stopColor={color2} 
            />}

            {/* If in threeFragrance mode, we add a third color stop */}
            {threeFragrances && (
                <>
                    <stop offset={`${stop2StartBlend}%`} stopColor={color2} />
                    <stop offset={`${stop2EndBlend}%`} stopColor={color3} />
                    <stop offset="100%" stopColor={color3} />
                </>
            )}
            </linearGradient>
        </defs>

        <path
            // d is the path to the actual SVG created on figma, LIQUID_CLIP.svg
            d="M0 -5.44231e-06H113.231H245L233.476 298.267L229.969 316.63L219.949 327.548L201.912 334H123.252H77.1575H54.6115L31.5644 331.022L20.5419 322.585L14.5297 311.667L10.5215 298.267L0 -5.44231e-06Z"
            // fill with the gradient we defined above
            fill="url(#liquidGrad)"
        />
    </svg>
    );
}
