import { Card, Flex, View, Text, Button } from "@aws-amplify/ui-react";
import { Link } from "react-router-dom";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProductReq, getRelatedProductsReq, getRecommendationsReq, getIDToken, createCartItemReq } from "../requests";

import Navbar from "../components/Navbar";

import LuxuryBackground from "../assets/Luxury Background2.png";


const bodyStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 400,
  fontSize: "1.3rem",
  letterSpacing: "0.5px",
  color: "#FFFFFF",
};

const headingStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 800,
  fontSize: "2.5rem",
  letterSpacing: "0.5px",
  color: "#000000",
};

export default function Product(){
    const params = useParams()

    const [products, setProducts] = useState([])
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [loadingProduct, setLoadingProduct] = useState(true);
    const [loadingRecommendations, setLoadingRecommendations] = useState(true);    
    const [recommendations, setRecommendations] = useState([]);

    const [displayedImage, setDisplayedImage] = useState(0)
    const [errorMessage, setErrorMessage] = useState("")

    const [isAuthenticated, setIsAuthenticated] = useState(() => !!getIDToken());

    const [addToCartText, setAddToCartText] = useState("Add To Cart");

    useEffect(() => {
        loadProduct()
        loadRecommendations()
    },[params])
    useEffect(() => {
        if (!selectedProduct) return;
        const id = setInterval(() => {
            setDisplayedImage(prev => (prev + 1) % selectedProduct.images.length)
        }, 10000)
        return () => {
            clearInterval(id);
        }
    }, [selectedProduct])

    function displayTemporaryError(message){
        setErrorMessage(message);
        setTimeout(() => {
            setErrorMessage(prev => prev === message ? "" : prev);
        },5000);
    }

    async function handleAddToCart(){
        if (!isAuthenticated){
            displayTemporaryError("Please create an account first");
            return;
        }

        setAddToCartText("Adding...");

        const data = await createCartItemReq({
            customerid: getIDToken()?.sub,
            itemid: selectedProduct.id,
            type: "product"
        });
        if (!data.success){
            displayTemporaryError(data.message);
            return;
        }
        setAddToCartText("Added to cart!");
        setTimeout(() => {
            setAddToCartText("Add To Cart");
        }, 2500);
    }

    async function loadProduct() {
        setLoadingProduct(true);
        const data = await getRelatedProductsReq(params.parentid);
        setLoadingProduct(false)
        if (!data.success){
            setErrorMessage(data.message);
            return;
        }
        const products = data.data.products;
        setProducts(products)
        setSelectedProduct(products[0]);
    }
    async function loadRecommendations() {
        const idToken = getIDToken();
        if (!idToken || !idToken?.sub){
            setLoadingRecommendations(false);
            return;
        }
        setLoadingRecommendations(true);
        const data = await getRecommendationsReq(idToken.sub);
        setLoadingRecommendations(false);
        setRecommendations(data?.data?.recommendations || []);
    }
    if (loadingProduct) {
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
                    }}
                >
                    <Flex justifyContent="center" alignItems="center" height="60vh">
                        <Text style={headingStyle}>Loading product...</Text>
                    </Flex>
                </View>
            </>
        );
    }

    // Filter recommendations so they do not match the current product page
    const filteredRecommendations = recommendations.filter((prod) => String(prod.parentid) !== String(params.parentid));

    return (
        <>
        <Navbar/>
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
                }}
              >
    <Card
    display={"flex"}
    direction={"column"}    
    alignItems={"center"}
    padding={0}
    backgroundColor={"transparent"}
    style={{
        scrollbarWidth: "none",
        overflowX:"auto",
    }}
    >
        <Flex
        padding={"10px"}
        maxWidth={"1000px"}
        // border={"solid black"}
        borderWidth={"1px"}
        borderRadius={"10px"}
        margin={"10px"}
        >
            {/* product images */}
            <Flex
            flex={1}
            shrink={0}
            maxWidth={"500px"}
            direction={"column"}
            justifyContent={"center"}
            >
                <View 
                borderRadius={"30px"}
                overflow={"hidden"}
                >
                    <img src={selectedProduct.images[displayedImage]} alt="cover" 
                    style={{width:"100%", height: "100%", objectFit: "contain",display: "block"}}/>
                </View>
                <Flex>
                    {selectedProduct.images.map((url, i) => {
                        return (
                            <View
                            width={"50px"}
                            borderRadius={"10px"}
                            overflow={"hidden"}
                            opacity={displayedImage === i ? ".5": 1}
                            onClick={() => setDisplayedImage(i)}
                            >
                                <img src={url} alt={"miniimage"} 
                                style={{width:"100%", height: "100%", objectFit: "contain",display: "block"}}/>
                            </View>
                        )
                    })}
                </Flex>
            </Flex>
            {/* separator */}
            <View
            border={"solid rgba(0,0,0,.3)"}
            >
            </View>
            {/* product info */}
            <Flex
            flex={1}
            direction={"column"}
            shrink={0}     
            alignItems={"center"}        
            backgroundColor={"rgba(87, 86, 86, 0.22)"}   
            padding={"18px"}
            gap={"0.35rem"}
            borderRadius={"20px"}
            >
                <h1
                style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "1.8rem",
                    backgroundColor: "rgb(255, 255, 255)",
                    margin: 0,
                    padding: "10px",
                    borderRadius: "10px 10px"
                }}
                >
                    {selectedProduct.name}
                </h1>

                <Text
                width={"100%"}
                textAlign={"left"}
                >
                     <h2
                     style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: "1.8rem",
                        margin: 0,
                        backgroundColor: "rgba(255,255,255,.6)",
                        borderRadius: "8px",
                        textAlign: "center",
                     }}>
                        ${selectedProduct.price}
                    </h2>
                </Text>
                <View
                width={"100%"}
                >
                    <hr style={{border: "1px solid rgba(0,0,0,.2)"}} />

                    <h2
                    style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: "1.5rem",
                        fontStyle: "italic",
                        marginBottom: 0
                    }}
                    >
                        Sizes
                    </h2>
                    <Text 
                        textAlign={"left"} 
                        display="flex" 
                        style={{ 
                            gap: "10px", 
                            flexWrap: "wrap" 
                        }}
                    >
                        {products.map(p => {
                            const isSelected = selectedProduct.id === p.id;

                            return (
                                <button 
                                key={p.id} 
                                onClick={() => setSelectedProduct(p)}
                                style={{
                                    fontFamily: "'Cormorant Garamond', serif",
                                    padding: "8px 12px",
                                    borderRadius: "8px",
                                    backgroundColor: "rgba(255, 255, 255, 0.6)",
                                    fontSize: "1.35rem",
                                    ...(isSelected && {
                                        border: "4px solid rgba(0,0,0,0.65)",
                                    }),
                                }}
                                >
                                    {p.variation}
                                </button>
                            )
                        })}
                    </Text>
                    <hr style={{border: "1px solid rgba(0,0,0,.2)"}} />

                    <h2
                    style={{
                        fontSize: "1.2rem",
                        fontStyle: "italic",
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: "1.5rem",
                    }}
                    >
                        Description
                    </h2>
                    <Text
                    textAlign={"left"}
                    backgroundColor="rgba(255,255,255,.6)"
                    borderRadius ="8px"
                    padding={"8px"}
                    style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: "1.35rem"
                    }}
                    >
                        {selectedProduct.description}
                    </Text>
                <hr style={{border: "1px solid rgba(0,0,0,.2)"}} />

                <View
                width={"100%"}
                >
                    <h2
                    style={{
                        fontSize: "1.2rem",
                        fontStyle: "italic",
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: "1.5rem",
                    }}
                    >
                        Notes
                    </h2>
                    <Text
                    textAlign={"left"}
                    backgroundColor="rgba(255,255,255,.3)"
                    borderRadius ="8px"
                    padding={"6px"}
                    >
                        <h3
                            style={{
                                margin: "4px 0",
                                fontStyle: "italic",
                                fontFamily: "'Cormorant Garamond', serif",
                                fontSize: "1.35rem",
                                lineHeight: "1.05",
                            }}
                        >
                        Top</h3>
                        <Flex

                        wrap={"wrap"}>
                            {selectedProduct.notes.top.map(note => {
                                if (!note) return null 
                                return (
                                    <Text
                                    fontFamily={"'Cormorant Garamond', serif"}
                                    padding={"3px 8px"}
                                    borderRadius={"5px 10px"}
                                    backgroundColor={"rgba(54, 54, 54, 1)"}
                                    fontStyle={"italic"}
                                    color={"white"}
                                    fontWeight={"bold"}>
                                        {note}
                                    </Text>
                                )
                            })}
                        </Flex>
                        <h3
                            style={{
                                margin: "4px 0",
                                fontStyle: "italic",
                                fontFamily: "'Cormorant Garamond', serif",
                                fontSize: "1.35rem",
                                lineHeight: "1.05",
                            }}
                        >
                        Heart</h3>
                        <Flex
                        wrap={"wrap"}>
                            {selectedProduct.notes.heart.map(note => {
                                return (
                                    <Text
                                    fontFamily={"'Cormorant Garamond', serif"}
                                    padding={"3px 8px"}
                                    borderRadius={"5px 10px"}
                                    backgroundColor={"rgba(54, 54, 54, 1)"}
                                    fontStyle={"italic"}
                                    color={"white"}
                                    fontWeight={"bold"}>
                                        {note}
                                    </Text>
                                )
                            })}
                            {selectedProduct.notes.heart.length === 0 &&
                            <Text
                            paddingLeft={"20px"}

                            >
                                None
                            </Text>}
                        </Flex>
                        <h3
                            style={{
                                margin: "4px 0",
                                fontStyle: "italic",
                                fontFamily: "'Cormorant Garamond', serif",
                                fontSize: "1.35rem",
                                lineHeight: "1.05",
                            }}
                        >
                        Base</h3>
                        <Flex
                        wrap={"wrap"}>
                            {selectedProduct.notes.base.map(note => {
                                return (
                                    <Text
                                    fontFamily={"'Cormorant Garamond', serif"}
                                    padding={"3px 8px"}
                                    borderRadius={"5px 10px"}
                                    backgroundColor={"rgba(54, 54, 54, 1)"}
                                    fontStyle={"italic"}
                                    color={"white"}
                                    fontWeight={"bold"}>
                                        {note}
                                    </Text>
                                )
                            })}
                            {selectedProduct.notes.base.length === 0 &&
                            <Text
                            paddingLeft={"20px"}
                            >
                                None
                            </Text>}
                        </Flex>
                    </Text>
                </View>
                </View>
                <View
                flex={1}
                direction={"column"}
                display={"flex"}
                justifyContent={"flex-end"}
                alignItems={"center"}

                width={"100%"}
                >
                    <button
                    style={{
                        width: "75%",
                        padding: "12px",
                        borderRadius: "14px",
                        backgroundColor: "rgba(43, 30, 26, 0.95)", 
                        color: "white",
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: "1.35rem",
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                        border: "1px solid rgba(0,0,0,0.4)",
                        cursor: "pointer",
                        transition: "all 0.15s ease-in-out",
                    }}
                    // Implementation where if mouse touches button will raise and change color -------------
                    // AFter leaving button will go back to normal
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(107, 46, 34, 0.95)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 8px 18px rgba(0,0,0,0.25)";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "rgba(43, 30, 26, 0.95)";
                        e.currentTarget.style.transform = "translateY(0px)";
                        e.currentTarget.style.boxShadow = "none";
                    }}
                    onClick={handleAddToCart}
                    >
                        {addToCartText}
                    </button>   
                    {errorMessage && 
                    <Text style={{color:"red", fontSize: "1.2rem"}}>{errorMessage}</Text>}
                </View>
            </Flex>
        </Flex>
      {loadingRecommendations 
      ?
        <Text>Loading recommendations...</Text>
      :
      
        (isAuthenticated
        ?
            (
        <View>
            <Text style={headingStyle} marginBottom=".5rem">
            You May Also Like
            </Text>
            <Flex 
                wrap="wrap"
                justifyContent="center">
                {filteredRecommendations.map((prod) => (
                    <Card
                    key={prod.id}
                    variation="elevated"
                    width="12rem"
                    margin="1rem"
                    padding="1.25rem"
                    backgroundColor="rgba(0, 0, 0, 0.75)"
                    border="1px solid rgba(151, 33, 0, 0.72)"
                    borderRadius="8px"
                    >
                    <Link 
                        to={`/fragrances/${prod.parentid}`}
                        style={{ textDecoration: "none" }}
                    >
                        <img
                            src={prod.images?.[0]}
                            alt={prod.name}
                            style={{
                                width: "100%",
                                objectFit: "cover",
                                borderRadius: "10px",
                                display: "block",
                                alignContent: "center",
                            }}
                        />
                        <Text style={{...bodyStyle, fontSize: ".95rem"}} textAlign="center">
                        {prod.name}
                        </Text>
                        <Text
                        style={{ ...bodyStyle, fontSize: ".95rem", fontWeight: 600 }}
                        textAlign="center"
                        >
                        ${prod.price}
                        </Text>
                    </Link>
                    </Card>
                ))}
            </Flex>
        </View>
            )
        :
            null
      )}
    </Card>
    </View>
    </>
    )
}