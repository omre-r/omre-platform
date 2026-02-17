import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { View, Card, Flex, Text, Button, SelectField, Grid } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { getProductsReq, updateProductReq } from "../requests.js";
import Navbar from "../components/Navbar";
import LuxuryBackground from "../assets/Luxury Background2.png";
import Omre1 from "../assets/mixology/OMRE1.png";
import Omre2 from "../assets/mixology/OMRE2.png";

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
                    </Grid>
                    <Flex gap="1rem" marginTop="1rem" justifyContent="center">
                        <Button
                            style={luxuryBodyStyle}
                            onClick={() => setThirdCologneSelectedMode(!thirdCologneSelectedMode)}>
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

