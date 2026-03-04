import { Card, Flex, View, Text, Button } from "@aws-amplify/ui-react";
import { Link } from "react-router-dom";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProductReq, getRelatedProductsReq, getRecommendationsReq, getIDToken, createCartItemReq } from "../requests";

import Navbar from "../components/Navbar";


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

    useEffect(() => {
        loadProduct()
        loadRecommendations()
    },[])
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
        const data = await createCartItemReq({
            customerid: getIDToken()?.sub,
            itemid: selectedProduct.id,
            type: "product"
        });
        if (!data.success){
            displayTemporaryError(data.message);
            return;
        }
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
    if (loadingProduct){
        return (
            <Card
            display={"flex"}
            direction={"column"}
            padding={0}
            height={"100vh"}
            width={"100vw"}
            backgroundColor={"transparent"}
            >
                <Navbar/>
            </Card>
        )

    }
    return (
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
        <Navbar/>
        <Flex
        padding={"10px"}
        minHeight={"80vh"}
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
            padding={"30px"}
            borderRadius={"20px"}
            >
                <h1
                style={{
                    fontSize: "1.5rem",
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
                        fontSize: "1.2rem",
                        fontStyle: "italic",
                        marginBottom: 0
                    }}
                    >
                        Sizes
                    </h2>
                    <Text
                    textAlign={"left"}
                    >
                        {products.map(p => {
                            return (
                                <button 
                                key={p.id} 
                                onClick={() => setSelectedProduct(p)}
                                style={{
                                    padding: "8px",
                                    borderRadius: "8px",
                                    backgroundColor: "rgba(255, 255, 255, 0.6)"
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
                        fontStyle: "italic"
                    }}
                    >
                        Description
                    </h2>
                    <Text
                    textAlign={"left"}
                    backgroundColor="rgba(255,255,255,.6)"
                    borderRadius ="8px"
                    padding={"10px"}
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
                        fontStyle: "italic"
                    }}
                    >
                        Notes
                    </h2>
                    <Text
                    textAlign={"left"}
                    backgroundColor="rgba(255,255,255,.3)"
                    borderRadius ="8px"
                    padding={"10px"}
                    >
                        <h3
                        style={{
                            fontStyle: "italic"
                        }}
                        >Top</h3>
                        <Flex

                        wrap={"wrap"}>
                            {selectedProduct.notes.top.map(note => {
                                if (!note) return null 
                                return (
                                    <Text
                                    padding={"5px"}
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
                            fontStyle: "italic"
                        }}
                        >Heart</h3>
                        <Flex
                        wrap={"wrap"}>
                            {selectedProduct.notes.heart.map(note => {
                                return (
                                    <Text
                                    padding={"5px"}
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
                            fontStyle: "italic"
                        }}
                        >Base</h3>
                        <Flex
                        wrap={"wrap"}>
                            {selectedProduct.notes.base.map(note => {
                                return (
                                    <Text
                                    padding={"5px"}
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
                        padding: "8px",
                        borderRadius: "10px",
                        backgroundColor: 'rgb(255, 253, 145)',
                        fontSize: "1.2rem",
                        fontWeight: "bold"
                    }}
                    onClick={handleAddToCart}
                    >
                        Add To Cart
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
                {recommendations.map((prod) => (
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
                    <Link to={`/fragrances/${prod.parentid}`}>
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
    )
}