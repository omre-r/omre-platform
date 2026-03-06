import { useEffect, useState } from "react";
import { View, Flex, Text, Button, SelectField, Grid, SliderField, Table, TableRow, TableCell, TableHead } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { getActiveProductsReq, saveBlendReq, addBlendToCartReq, getUserSavedBlendsReq, deleteUserBlendReq, createCartItemReq } from "../requests.js";
import Navbar from "../components/Navbar";
import LuxuryBackground from "../assets/Luxury Background2.png";
import Omre2 from "../assets/Mixology/OMRE2.png";
import BottleFill from "../components/BottleFill";


/*
Custom Styles ------------------------------------------------------------------------------------------------
- Custom heading and body style using downloaded font
- Will be used through out to edit aspects of cards
*/
const luxuryHeadingStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 800,
  fontSize: "2.5rem",
  letterSpacing: "0.5px",
};
const luxurySubheadingStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 600,
  fontSize: "1.6rem",   
  letterSpacing: "0.3px",
};
const luxuryBodyStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 500,
  fontSize: "1.1rem",   
  letterSpacing: "0.2px",
};

// Styles to change font and outline of table headers and body ------------------------------
const tableHeaderStyle = {
    ...luxuryBodyStyle,
    fontSize: "1.45rem",  
    fontWeight: 550,
    letterSpacing: "0.3px",
    backgroundColor: "transparent",
    border: "none",
    boxShadow: "none",
    outline: "none",
}
const tableBodyStyle = {
    ...luxuryBodyStyle,
    fontSize: "1.2rem",  
    fontWeight: 400,
    letterSpacing: "0.2px",
    backgroundColor: "transparent",
    border: "none",
    boxShadow: "none",
    outline: "none",
}

export default function Mixology() {
    const [message, setMessage] = useState("");
    const [blendLoading, setBlendLoading] = useState(false);  // prevents double clicks

    // Set cologne choices --------------------------------------------------------
    const [cologne1Id, setCologne1Id] = useState("");
    const [cologne2Id, setCologne2Id] = useState("");
    const [cologne3Id, setCologne3Id] = useState("");
    const [sizeMl, setSizeMl] = useState("30");

    // Third Cologne Selected Mode -------------------------------------------------------
    const [thirdCologneSelectedMode, setThirdCologneSelectedMode] = useState(false);

    // Load and set products -------------------------------------------------------
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadTable, setLoadTable] = useState(false);

    // Show instructions when i is clicked -------------------------------------------
    const [showInstructions, setShowInstructions] = useState(false);

    // Loading blends -------------------------------------------------------
    // Calling load blends on button click, getting user saved blends from backend and setting.
    const [loadedBlends, setLoadedBlends] = useState([]);
    async function loadBlends() {
        let userid;
        for (let key of Object.keys(localStorage)){
            if (key.includes("idToken")){
                const idToken = localStorage.getItem(key)        
                const base64 = idToken.split(".")[1]
                const decoded = JSON.parse(atob(base64))
                userid = decoded.sub
                break
            };
        }
        setMessage("");
        try {
            const data = await getUserSavedBlendsReq(userid);
            if (!data.success){
                throw new Error(data.message);
            }
            setLoadedBlends(data.data.blends);
        }
        catch (error) {
            setMessage(error.message || "Error loading saved blends.");
        }
    }

    // Max and min percentages for 2 fragrance and 3 fragrance modes
    const MIN_PCT = 5;
    const MAX_PCT = 95;

    // Percentage of each cologne in the mix, default to 50/50 for two cologne mix
    const [fragrancepct1, setfragrancePct1] = useState(50);
    const [fragrancepct2, setfragrancePct2] = useState(50);
    const fragrancepct3 = thirdCologneSelectedMode ? Math.max(MIN_PCT, 100 - fragrancepct1 - fragrancepct2) : 0;

    // Clamp function to ensure percentages stay within bounds and total 100% when 3rd cologne selected ----------------------
    const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
    
    // Changing fragrance 1 percentage ----------------------
    const handleFragrance1PctChange = (value) => {
        // 2 Fragrance mode --------------------------------
        if (!thirdCologneSelectedMode) {
            // Making sure between the set bounds and that they add to 100%
            // Math example: 
            // Value is 60 for fragrance 1, then fragrance 2 will be set to 40 to add to 100%
            const p1 = clamp(value, 100 - MAX_PCT, MAX_PCT);
            setfragrancePct1(p1);
            setfragrancePct2(100 - p1);
            return;
        }

        // 3 Fragrance mode -------------------------------- ------
        // Math example:
        // If value is 60 for fragrance 1
        // Min of fragrance 1 will be 5 
        // Max of fragrance 1 will be 95
        const minP1 = Math.max(MIN_PCT, 5 - fragrancepct2);
        const maxP1 = Math.min(MAX_PCT, 95 - fragrancepct2);
        // Making sure between the set bounds and that fragrance 3 is at least 5% (so fragrance 1 + fragrance 2 is at most 95%)
        const p1 = clamp(value, minP1, maxP1);
        setfragrancePct1(p1);
        const minP2 = Math.max(MIN_PCT, 5 - p1);
        const maxP2 = Math.min(MAX_PCT, 95 - p1);
        setfragrancePct2((prevP2) => clamp(prevP2, minP2, maxP2));
    }

    // If 3rd cologne selected, changing fragrance 2 percentage ----------------------
    // Will be able to now slide the percentage and it will have change fragrance 3
    const handleFragrance2PctChange = (value) => {
        if (!thirdCologneSelectedMode) {
            return;
        }
        const minP2 = Math.max(MIN_PCT, 5 - fragrancepct1);
        const maxP2 = Math.min(MAX_PCT, 95 - fragrancepct1);
        setfragrancePct2(clamp(value, minP2, maxP2));
    }

    // If third is toggled set initial fragrance percentages accordingly
    const toggleThird = () => { setThirdCologneSelectedMode((prev) => {
        const next = !prev;
        if (next) {
            setfragrancePct1(34);
            setfragrancePct2(33);
        } 
        else {
            setCologne3Id("");
            setfragrancePct1(50);
            setfragrancePct2(50);
        }
        return next;
        });
    };

    // Making sure that a product that is already selected in another slot cannot be selected again to prevent duplicate selections ----------------------
    const isAlreadyPicked = (productId, slotNumber) => {
        // List of id's of currently selected colognes in the other slots
        const picked = [
            slotNumber != 1 ? cologne1Id : null,
            slotNumber != 2 ? cologne2Id : null,
            slotNumber != 3 ? cologne3Id : null,
        ];
        // Returns true or false if the product id is in the list of picked colognes for the other slots
        return picked.includes(productId);
    };

    // Get product ID from product object, accounting for different possible key names ---------------------------
    function getProductId(product) {
        return product.productid || product.product_id || product.id;
    }

    // Grab the product name by using the ID ------------------------------------------
    function getProductNameById(productId) {
        // If no product id return empty string, this will happen if a blend does not have a third fragrance
        if (!productId) { 
            return "";
        }
        // Find the product in the products list that matches the id, accounting for different possible key names for the id in the product object
        const match = products.find((p) => String(getProductId(p)) === String(productId));
        return match?.name || "Unknown";
    }

    // Load products from backend ---------------------------------------
    async function loadProducts() {
        setMessage("");
        setLoadingProducts(true);
        try {
            const data = await getActiveProductsReq();  
            if (!data.success){
                throw new Error(data.message)
            }
            setProducts(data.data.products)
        }
        catch (error) {
            setMessage(error.message || "Error loading products.");
        }
        finally {
            setLoadingProducts(false);
        }
    }

    async function handleDeleteBlend(blendId) {
        let userid;
        for (let key of Object.keys(localStorage)){
            if (key.includes("idToken")){
                const idToken = localStorage.getItem(key)        
                const base64 = idToken.split(".")[1]
                const decoded = JSON.parse(atob(base64))
                userid = decoded.sub
                break
            };
        }
        setMessage("");
        try {
            const data = await deleteUserBlendReq(userid, blendId);
            if (!data.success) {
                setMessage(data.message || "Failed to delete blend.");
                return;
            }
            // Remove deleted blend from loaded blends to update table
            // This is done here after a successful delete request to the backend to ensure the frontend state matches the backend data
            setLoadedBlends((prev) => prev.filter((b) => b.id !== blendId));

            setMessage("Blend deleted successfully!");
        } catch (err) {
            setMessage("Failed to delete blend.");
        }
    }

    // Builds the blend payload from current state to send to backend
    function buildBlendPayload() {
        let userid;
        for (let key of Object.keys(localStorage)){
            if (key.includes("idToken")){
                const idToken = localStorage.getItem(key)        
                const base64 = idToken.split(".")[1]
                const decoded = JSON.parse(atob(base64))
                userid = decoded.sub
                break
            };
        }
        return {
            userid,
            frag1_productid: cologne1Id,
            frag2_productid: cologne2Id,
            frag3_productid: thirdCologneSelectedMode && cologne3Id ? cologne3Id : null,
            frag1_pct: fragrancepct1,
            frag2_pct: fragrancepct2,
            frag3_pct: thirdCologneSelectedMode ? fragrancepct3 : null,
            size_ml: Number(sizeMl)
        };
    }

    // Build payload from a previously saved blend ----------------------------------
    function buildBlendPayloadFromSavedBlend(blend) {
        let userid;
        for (let key of Object.keys(localStorage)){
            if (key.includes("idToken")){
                const idToken = localStorage.getItem(key)        
                const base64 = idToken.split(".")[1]
                const decoded = JSON.parse(atob(base64))
                userid = decoded.sub
                break
            };
        }
        return {
            userid,
            frag1_productid: blend.frag1_productid,
            frag2_productid: blend.frag2_productid,
            frag3_productid: blend.frag3_productid || null,
            frag1_pct: blend.frag1_pct,
            frag2_pct: blend.frag2_pct,
            frag3_pct: blend.frag3_pct || null,
            size_ml: Number(blend.size_ml),
        };
    }

    // Frontend validation before hitting the backend
    function validateBlendSelections() {
        if (!cologne1Id || !cologne2Id) {
            setMessage("Please select at least 2 fragrances.");
            return false;
        }
        if (thirdCologneSelectedMode && !cologne3Id) {
            setMessage("Please select a 3rd fragrance or remove it.");
            return false;
        }
        return true;
    }

    async function handleSaveBlend() {
        if (!validateBlendSelections()) return;
        setBlendLoading(true);
        setMessage("");
        try {
            const data = await saveBlendReq(buildBlendPayload());
            if (!data.success) {
                setMessage(data.message || "Failed to save blend.");
                return;
            }
            setMessage("Blend saved successfully!");
        } catch (err) {
            setMessage("Failed to save blend.");
        } finally {
            setBlendLoading(false);
        }
    }

    async function handleAddToCart() {
    if (!validateBlendSelections()) return;
    setBlendLoading(true);
    setMessage("");
    try {
        const blendPayload = buildBlendPayload();
        const res = await addBlendToCartReq(blendPayload);

        // stockUnavailable comes back as success: false but is NOT a crash
        if (res.stockUnavailable) {
            setMessage(res.message || "Not enough stock for this blend.");
            return;
        }
        if (!res.success) {
            setMessage(res.message || "Failed to add blend to cart.");
            return;
        }

        // success + cartReady
        // Create cart items row pointing to the blend
        // Taking the responses data and grabbing the blend by id
        const blendId = res.data.blend.id;
        if (!blendId) {
            setMessage("Failed getting blendId");
            return;
        }

        // Write information to cart_item table
        const cartRes = await createCartItemReq({
            customerid: blendPayload.userid,
            itemid: blendId,
            type: "blend",
        });

        if (!cartRes.success) {
            setMessage(cartRes.message || "Issue adding blend to cart.");
            return;
        }

        setMessage("Blend added to cart!");
    } catch (err) {
        setMessage("Failed to add blend to cart.");
    } finally {
        setBlendLoading(false);
    }
}

// Taking a saved blend and adding it to the cart ---------------------------------------
// Making sure that we create the payload, check userid, product stock,
async function handleAddSavedBlendToCart(savedBlend) {
    setBlendLoading(true);
    setMessage("");
    try {
        const blendPayload = buildBlendPayloadFromSavedBlend(savedBlend);
        if (!blendPayload.userid) {
            setMessage("User not found. Please log in again.");
            return;
        }

        const res = await addBlendToCartReq(blendPayload);
        if (res.stockUnavailable) {
            setMessage(res.message || "Not enough stock for this blend.");
            return;
        }
        if (!res.success) {
            setMessage(res.message || "Failed to add blend to cart.");
            return;
        }

        const blendId = res.data.blend.id;
        if (!blendId) {
            setMessage("Failed getting blendId");
            return;
        }

        const cartRes = await createCartItemReq({
            customerid: blendPayload.userid,
            itemid: blendId,
            type: "blend",
        });

        if (!cartRes.success) {
            setMessage(cartRes.message || "Issue adding blend to cart.");
            return;
        }

        setMessage("Blend added to cart!");
    } 
    catch (err) {
        console.error(err);
        setMessage("Failed to add blend to cart.");
        } 
    finally {
        setBlendLoading(false);
    }
}

    // Colors for the liquid in the bottl ---------------------------------------------------
    // Mock for now, fragrances may include color details in the backend in the future
    const color1 = "#b07ac4"; 
    const color2 = "#e3615b"; 
    const color3 = "#a12d0f"; 

    // Load products on component mount ---------------------------------------
    useEffect(() => {
        loadProducts();
    }, []);

    // Getting the sorted list of products ------------------------------------------
    const sortedProducts = [...products].sort((a, b) => a.name.localeCompare(b.name));


    return (
    <>
        <Navbar />
        <View
            width="100%"
            minHeight="100vh"
            paddingTop="3rem"
            paddingLeft="3rem"
            paddingRight="3rem"
            paddingBottom="3rem"
            style={{
                backgroundImage: `url(${LuxuryBackground})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "repeat",
            }}>
            <Text 
                style={luxuryHeadingStyle}
                marginTop="-2.5rem">
                Mixology
            </Text>
            <Flex 
                direction="row"
                alignItems="center"
                justifyContent="Center">
                    <Text
                        style={luxurySubheadingStyle}
                        marginTop="-.5rem">   
                        Create your own custom fragrance blend by selecting up to three of your favorite fragrances!
                    </Text>
                    <Text
                        style={{ 
                            fontSize: "1.6rem",
                            marginLeft: "-.75rem",
                            color: showInstructions ? "darkgray" : "black"
                        }}
                        variation="link"
                        onClick={() => setShowInstructions((prev) => !prev)}
                    >
                    🛈
                    </Text>
                </Flex>
                {showInstructions && (
                    <View>
                        <Text
                            style={{...luxurySubheadingStyle, fontSize: "1.35rem", textDecoration: "underline"}}>
                            Instructions<br/> 
                        </Text>
                        
                        <Text
                            style={{...luxurySubheadingStyle, fontSize: "1.25rem", textAlign: "left", marginLeft: "25rem"}}>
                            1. Select desired fragrance size. <br/>
                            2. Select desired fragrances from drop down fields. <br/>
                            3. If wanted, can select "Add 3rd Fragrance" button to add a 3rd fragrance to the mix. <br/>
                            4. Can use sliders to change percentages of fragrances within mix. <br/>
                            5. When satisfied user can add blend to their cart or save blend to their profile. <br/>
                            6. User can press "Load Blends" button to show a table below of all previously made blends. <br/>
                        </Text>
                    </View>
                )}
            <Flex direction="column" alignItems="center" gap="1.25rem">
                <View 
                    style={{ 
                        position: "relative",
                         width: "600px", 
                         maxWidth: "600px" 
                    }}>
                    <View 
                        style={{ 
                            position: "absolute",
                            left: "50%",
                            top: "55.5%",
                            transform: "translate(-50%, -50%)",
                            // Below will directly adjust the bottle fill size
                            width: "194.6px",      
                            height: "211px",     
                            zIndex: 2, // In front of the bottle image 
                            pointerEvents: "none",
                        }}>
                        <BottleFill
                            p1={fragrancepct1}
                            p2={fragrancepct2}
                            p3={fragrancepct3}
                            color1={color1}
                            color2={color2}
                            color3={color3}
                            threeFragrances={thirdCologneSelectedMode}
                        />
                    </View>
                    <img
                        src={Omre2}
                        alt="OmreBottle"
                        style={{ 
                            width: "75%", 
                            height: "auto", 
                            zIndex: 1, 
                            position: "relative", 
                            display: "block", 
                            margin: "0 auto" 
                        }}
                    />
                </View>
                <View>
                    <Grid
                        templateColumns={{ base: "1fr", large: "160px 1fr 1fr 1fr" }}
                        gap="1rem"
                        width="100%"
                        maxWidth="1100px"
                        alignItems="start"
                        >

                        <View>
                            <SelectField
                                style={luxuryBodyStyle}
                                descriptiveText="Select fragrance size."
                                variation="quiet"
                                size="small"
                                value={sizeMl}
                                onChange={(e) => setSizeMl(e.target.value)}>
                                <option value="30">30ML</option>
                                <option value="50">50ML</option>
                            </SelectField>
                        </View>

                        <Flex direction="column" gap="0.35rem">
                            <SelectField
                                style={luxuryBodyStyle}
                                variation="quiet"
                                size="small"
                                descriptiveText="Select fragrance 1"
                                value={cologne1Id}
                                onChange={(e) => setCologne1Id(e.target.value)}>
                                <option 
                                    // Default non selectable placeholder
                                    value="" 
                                    disabled hidden>
                                        {/* Removed text as prof doesnt want placeholders */}
                                        {/* Select a fragrance */}
                                </option>
                                {sortedProducts.map((product) => (
                                    <option 
                                        key={getProductId(product)} 
                                        value={getProductId(product)}
                                        // Disable option if already selected in another cologne slot to prevent duplicate selections
                                        disabled={isAlreadyPicked(getProductId(product), 1)}>
                                        {product.name}
                                    </option>
                                ))}
                            </SelectField>
                            <SliderField 
                                style={luxuryBodyStyle}
                                label={"Fragrance 1 Percentage"}
                                min={0}
                                max={100}
                                value={fragrancepct1}
                                onChange={handleFragrance1PctChange}
                                formatValue={(value) => `${value}%`}>
                            </SliderField>
                        </Flex>

                        <Flex direction="column" gap="0.35rem">
                            <SelectField
                                style={luxuryBodyStyle}
                                variation="quiet"
                                size="small"
                                descriptiveText="Select fragrance 2"
                                value={cologne2Id}
                                onChange={(e) => setCologne2Id(e.target.value)}>
                                <option 
                                    value="" 
                                    disabled hidden>
                                </option>
                                {sortedProducts.map((product) => (
                                    <option 
                                        key={getProductId(product)} 
                                        value={getProductId(product)}
                                        disabled={isAlreadyPicked(getProductId(product), 2)}>
                                        {product.name}
                                    </option>
                                ))}
                            </SelectField>
                            <SliderField 
                                style={luxuryBodyStyle}
                                label={"Fragrance 2 Percentage"}
                                min={0}
                                max={100}
                                value={fragrancepct2}
                                onChange={thirdCologneSelectedMode ? handleFragrance2PctChange : undefined}
                                disabled={!thirdCologneSelectedMode}
                                formatValue={(value) => `${value}%`}>
                            </SliderField>
                        </Flex>

                        <Flex 
                            className={!thirdCologneSelectedMode ? "mixology-disabled" : ""}
                            direction="column" 
                            gap="0.35rem">
                            <SelectField
                                style={luxuryBodyStyle}
                                variation="quiet"
                                size="small"
                                disabled={!thirdCologneSelectedMode}
                                descriptiveText="Select fragrance 3"
                                value={cologne3Id}
                                onChange={(e) => setCologne3Id(e.target.value)}>
                                <option 
                                    value="" 
                                    disabled hidden>
                                </option>
                                {sortedProducts.map((product) => (
                                    <option 
                                        key={getProductId(product)} 
                                        value={getProductId(product)}
                                        disabled={isAlreadyPicked(getProductId(product), 3)}>
                                        {product.name}
                                    </option>
                                ))}
                            </SelectField>
                            <SliderField 
                                style={luxuryBodyStyle}
                                label={"Fragrance 3 Percentage"}
                                min={0}
                                max={100}
                                value={fragrancepct3}
                                disabled={true}
                                formatValue={(value) => `${value}%`}>
                            </SliderField>
                        </Flex>
                    </Grid>
                    <Flex gap="1rem" marginTop="1rem" justifyContent="center">
                        <Button
                            style={luxuryBodyStyle}
                            onClick={toggleThird}>
                            {thirdCologneSelectedMode ? "Remove 3rd Fragrance" : "Add 3rd Fragrance"}
                        </Button>
                        <Button
                            style={luxuryBodyStyle}
                            isLoading={blendLoading}
                            onClick={handleAddToCart}>
                            Add to Cart
                        </Button>
                        <Button
                            style={luxuryBodyStyle}
                            isLoading={blendLoading}
                            onClick={handleSaveBlend}>
                            Save Fragrance
                        </Button>
                        
                        <Button 
                            // Can load and hide blends depending on click -----------------------
                            style={luxuryBodyStyle}
                            onClick={async () => {
                                if (!loadTable) {
                                    await loadBlends();
                                }
                                setLoadTable((prev) => !prev);
                            }}>
                            {loadTable ? "Hide blends" : "Load blends"}
                        </Button>
                    </Flex>
                    {message && (
                        <Text
                            style={{
                                ...luxuryBodyStyle,
                                color: message === "Blend Ready!" || message === "Blend saved successfully!" ? "#2d6a2d" : "#8B0000",
                                textAlign: "center",
                                marginTop: "0.75rem"
                            }}>
                            {message}
                        </Text>
                    )}
                </View>

                {loadTable && (
                    <View marginTop="1rem"  >
                        {/* This is used to verify that a user has created a specific amount of blends */}
                        {/* <Text>Loaded Blends Count: {loadedBlends.length}</Text> */}

                        <Text 
                            style={luxurySubheadingStyle}>
                            Your Saved Blends
                        </Text>
                        {/* If no blends are currently saved to users profile */}
                        {loadedBlends.length === 0 ? (
                            <Text style={luxuryBodyStyle}>
                                No saved blends yet. Create one above and press “Save Fragrance”.
                            </Text>
                        ) : ( 
                            <View
                                style={{
                                    backgroundColor: "#300a0a38",
                                    borderRadius: "14px",
                                }}
                            >
                            <Table
                                style={{             
                                }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell style={tableHeaderStyle}>Fragrance 1</TableCell>
                                    <TableCell style={tableHeaderStyle}>Fragrance 2</TableCell>
                                    <TableCell style={tableHeaderStyle}>Fragrance 3</TableCell>
                                    <TableCell style={tableHeaderStyle}>Size</TableCell>
                                    <TableCell style={tableHeaderStyle}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            {loadedBlends.map((blend) => (
                                <TableRow 
                                    key={blend.id}
                                    style={{
                                    borderTop: "1px solid rgba(0,0,0,0.15)"
                                }}>
                                    <TableCell style={tableBodyStyle}>{getProductNameById(blend.frag1_productid)} ({blend.frag1_pct}%)</TableCell>
                                    <TableCell style={tableBodyStyle}>{getProductNameById(blend.frag2_productid)} ({blend.frag2_pct}%)</TableCell>
                                    <TableCell style={tableBodyStyle}>{getProductNameById(blend.frag3_productid)} ({blend.frag3_pct ? `${blend.frag3_pct}%` : "~"})</TableCell>
                                    <TableCell style={{...tableBodyStyle, whiteSpace: "nowrap" }}>{blend.size_ml} ML</TableCell>
                                    <TableCell style={tableBodyStyle}>
                                        <Flex direction="row" gap="0.2rem">
                                        <Button
                                            style={luxuryBodyStyle}
                                            onClick={() => handleAddSavedBlendToCart(blend)}>
                                            Add to Cart
                                        </Button>
                                        <Button
                                            style={luxuryBodyStyle}
                                            onClick={() => { 
                                                handleDeleteBlend(blend.id);
                                            }}>
                                            Delete Blend
                                        </Button>
                                        </Flex>
                                    </TableCell>
                                </TableRow>
                            ))}
                            </Table>
                        </View>
                        )}
                    </View>
                )}
            </Flex>
        </View>
    </>
  );
}

