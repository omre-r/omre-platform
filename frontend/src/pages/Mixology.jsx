import { useEffect, useState } from "react";
import { View, Flex, Text, Button, SelectField, Grid, SliderField } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { getProductsReq, updateProductReq } from "../requests.js";
import Navbar from "../components/Navbar";
import LuxuryBackground from "../assets/Luxury Background2.png";
import Omre2 from "../assets/Mixology/OMRE2.png";

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
  fontWeight: 500,
  fontSize: "1.3rem",   
  letterSpacing: "0.3px",
};
const luxuryBodyStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 500,
  fontSize: "1.1rem",   
  letterSpacing: "0.2px",
};

export default function Mixology() {
    const [message, setMessage] = useState("");

    // Set cologne choices --------------------------------------------------------
    const [cologne1Id, setCologne1Id] = useState("");
    const [cologne2Id, setCologne2Id] = useState("");
    const [cologne3Id, setCologne3Id] = useState("");
    const [sizeMl, setSizeMl] = useState("30");
    const [thirdCologneSelectedMode, setThirdCologneSelectedMode] = useState(false);

    // Load and set products -------------------------------------------------------
    const [products, setProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);

    // Percentage of each cologne in the mix, default to 50/50 for two cologne mix
    const [fragrancepct1, setfragrancePct1] = useState(50);
    const [fragrancepct2, setfragrancePct2] = useState(50);
    const fragrancepct3 = thirdCologneSelectedMode ? Math.max(0, 100 - fragrancepct1 - fragrancepct2) : 0;

    // Clamp function to ensure percentages stay within bounds and total 100% when 3rd cologne selected ----------------------
    const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

    // Max and min percentages for 2 fragrance and 3 fragrance modes
    const MIN_PCT = 10;
    const MAX_PCT = 80;
    
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
        // Min of fragrance 1 will be 10 
        // Max of fragrance 1 will be 80
        const minP1 = Math.max(MIN_PCT, 20 - fragrancepct2);
        const maxP1 = Math.min(MAX_PCT, 90 - fragrancepct2);
        // Making sure between the set bounds and that fragrance 3 is at least 10% (so fragrance 1 + fragrance 2 is at most 90%)
        const p1 = clamp(value, minP1, maxP1);
        setfragrancePct1(p1);

        // For fragrance 2,
        // Math Example: 
        // min of fragrance 2 will be 10 (so that fragrance 1 + fragrance 2 is at least 20%)
        // max of fragrance 2 will be 80 (so that fragrance 1 + fragrance 2 is at most 90%)
        const minP2 = Math.max(MIN_PCT, 20 - p1);
        const maxP2 = Math.min(MAX_PCT, 90 - p1);
        setfragrancePct2((prevP2) => clamp(prevP2, minP2, maxP2));
    }

    // If 3rd cologne selected, changing fragrance 2 percentage ----------------------
    // Will be able to now slide the percentage and it will have change fragrance 3
    const handleFragrance2PctChange = (value) => {
        if (!thirdCologneSelectedMode) {
            return;
        }
        const minP2 = Math.max(MIN_PCT, 20 - fragrancepct1);
        const maxP2 = Math.min(MAX_PCT, 90 - fragrancepct1);
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
            setfragrancePct1(50);
            setfragrancePct2(50);
        }
        return next;
        });
    };

    // Get product ID from product object, accounting for different possible key names ---------------------------
    function getProductId(product) {
        return product.productid || product.product_id || product.id;
    }

    // Load products from backend ---------------------------------------
    async function loadProducts() {
        setMessage("");
        setLoadingProducts(true);
        try {
            const prods = await getProductsReq();
            setProducts(prods || [])
        }
        catch (error) {
            setMessage(error.message || "Error loading products.");
        }
        finally {
            setLoadingProducts(false);
        }
    }

    // Load products on component mount ---------------------------------------
    useEffect(() => {
        loadProducts();
    }, []);


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
            {message && (
            <Text 
                style={luxuryBodyStyle} 
                marginTop="0.5rem" 
                color="black">
                {message}
            </Text>
            )}
            <Text 
                style={luxuryHeadingStyle}
                marginTop="-2.5rem">
                Mixology
            </Text>
            <Text
                style={luxurySubheadingStyle}
                marginTop="-.5rem">   
                Create your own custom fragrance blend by selecting up to three of your favorite fragrances!
            </Text>
            <Flex direction="column" alignItems="center" gap="1.25rem">
                <View
                    maxWidth="600px">
                    <View>
                        {/* Placeholder for when we put the liquid */}
                        {/* style={{ 
                            inset: 0,
                            width: "70%",
                            height: "50%",
                            zIndex: 1, // Index 1 to make it behind the bottle image
                        }}  */}
                    </View>
                    <img
                        src={Omre2}
                        alt="OmreBottle"
                        style={{
                            inset: 0,
                            width: "75%",
                            height: "60%",
                            zIndex: 2,
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
                                {products.map((product) => (
                                    <option key={getProductId(product)} value={getProductId(product)}>
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
                                {products.map((product) => (
                                    <option key={getProductId(product)} value={getProductId(product)}>
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
                                {products.map((product) => (
                                    <option key={getProductId(product)} value={getProductId(product)}>
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
                            {thirdCologneSelectedMode ? "Remove 3rd Cologne" : "Add 3rd Cologne"}

                        </Button>
                        <Button
                            style={luxuryBodyStyle}>
                            Add to Cart
                        </Button>
                    </Flex>
                </View>
            </Flex>
        </View>
    </>
  );
}

