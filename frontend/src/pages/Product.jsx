import { Card, Flex, View, Text, Button } from "@aws-amplify/ui-react";
import { Link } from "react-router-dom";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getProductReq, getRelatedProductsReq, getRecommendationsReq, getIDToken, createCartItemReq, getProductReviewsReq, createReviewReq } from "../requests";

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
    const [searchParams, setSearchParams] = useSearchParams()

    const [products, setProducts] = useState([])
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [loadingProduct, setLoadingProduct] = useState(true);
    const [loadingRecommendations, setLoadingRecommendations] = useState(true);    
    const [recommendations, setRecommendations] = useState([]);

    const [displayedImage, setDisplayedImage] = useState(0)
    const [errorMessage, setErrorMessage] = useState("")

    const [isAuthenticated, setIsAuthenticated] = useState(() => !!getIDToken());

    const [addToCartText, setAddToCartText] = useState("Add To Cart");

    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [newReviewMessage, setNewReviewMessage] = useState("");
    const [newReviewrating, setNewReviewrating] = useState(5);
    const [uploadedImages, setUploadedImages] = useState([]);


    useEffect(() => {
        loadProduct();
        loadRecommendations();
        loadReviews();
    },[params.parentid])

    useEffect(() => {
        if (!selectedProduct) return;
        setSearchParams(prev => ({...prev, variation: selectedProduct.variation}))
    },[selectedProduct])

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
        const prods = data.data.products;
        prods.sort((a,b) => Number(a.variation.split("ml")?.[0]) - Number(b.variation.split("ml")?.[0]))
        setProducts(prods)

        const variation = searchParams.get("variation");
        setSelectedProduct(prods.find(p => p.variation === variation));
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
    async function loadReviews() {
        setLoadingReviews(true);
        const data = await getProductReviewsReq(params.parentid);
        setLoadingReviews(false);
        setReviews(data?.data?.reviews || []);
    }

    async function submitReview(){
        const idToken = getIDToken();
        if (!idToken || !idToken?.sub){
            return;
        }
        const reviewForm = {
            customerid: idToken.sub,
            productid: params.parentid,
            message: newReviewMessage,
            rating: newReviewrating,
            images: uploadedImages
        }
        const result = await createReviewReq(reviewForm);
        loadReviews()
    }

    function addImages(e){
        setUploadedImages([...e.target.files])
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
    }}>
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
            border={"solid rgba(54, 6, 6, 0.2)"}
            >
            </View>
            {/* product info */}
            <Flex
            flex={1}
            direction={"column"}
            shrink={0}     
            alignItems={"center"}    
            style={{
                background: "rgba(247, 231, 222, 0)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
                border: "1px solid rgba(90, 55, 45, 0.10)",
            }}
            padding={"18px"}
            gap={"0.35rem"}
            borderRadius={"24px"}
            >
                <h1
                style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "1.8rem",
                    backdropFilter: "blur(6px)",
                    background: "linear-gradient(145deg,  #480e0ee2, rgba(20, 20, 20, 0.65))",
                    color:"white",
                    margin: 0,
                    padding: "10px",
                    borderRadius: "10px 10px"
                }}
                >
                    <small style={{fontSize: ".9em", marginBottom: "5px", display: "block", fontWeight:"400"}}>{selectedProduct.type}</small>
                    {selectedProduct.name} <br></br>
                    <small style={{fontSize: ".9em", marginBottom: "5px", display: "block", fontWeight:"400"}}> ${selectedProduct.price} </small>

                </h1>
                <View
                width={"100%"}
                >
                    <hr style={{border: "1px solid rgba(0,0,0,.2)"}} />

                    <h2
                    style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: "1.5rem",
                        marginTop: "-.5rem",
                        marginBottom: "-.5rem",
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
                                        background: "linear-gradient(145deg,  #480e0ee2, rgba(20, 20, 20, 0.65))",
                                        borderRadius: "8px",
                                        fontSize: "1.55rem",
                                        fontWeight: "400",
                                        color:"white",
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
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: "1.5rem",
                        marginTop: "-.5rem",
                        marginBottom: ".3rem",
                    }}
                    >
                        Description
                    </h2>
                    <Text
                    className="scrollbar"
                    textAlign={"left"}
                    borderRadius ="8px"
                    backgroundColor="transparent"
                    padding={"8px"}
                    marginBottom={"1rem"}
                    style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: "1.4rem",
                        maxHeight: "300px",
                        overflowY: "auto",
                        background: "linear-gradient(145deg,  #480e0ee2, rgba(20, 20, 20, 0.65))",
                        color: "white",
                        
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
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: "1.5rem",
                        marginTop: "-.5rem",
                    }}
                    >
                        Notes
                    </h2>
                    <Text
                    textAlign={"left"}
                    borderRadius ="8px"
                    padding={"6px"}
                    marginBottom={"1rem"}
                    marginTop={"-2rem"}
                    >
                        <h3
                            style={{
                                margin: "4px 0",
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
                                    style={{
                                        background: "linear-gradient(145deg,  #480e0ee2, rgba(20, 20, 20, 0.65))",
                                    }}
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
                                    style={{
                                        background: "linear-gradient(145deg,  #480e0ee2, rgba(20, 20, 20, 0.65))",
                                    }}
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
                                    style={{
                                        background: "linear-gradient(145deg,  #480e0ee2, rgba(20, 20, 20, 0.65))",
                                    }}
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
                        disabled={Number(selectedProduct.stock_ml) <= 0}
                        style={{
                            width: "75%",
                            padding: "12px",
                            borderRadius: "14px",
                            background: Number(selectedProduct.stock_ml) <= 0
                                ? "linear-gradient(145deg, rgba(80,80,80,0.7), rgba(20,20,20,0.5))"
                                : "linear-gradient(145deg,  #480e0ee2, rgba(20, 20, 20, 0.65))",
                            color: Number(selectedProduct.stock_ml) <= 0 ? "rgba(255,255,255,0.4)" : "white",
                            backgroundSize: "200% 200%",
                            backgroundPosition: "0% 25%",
                            fontFamily: "'Cormorant Garamond', serif",
                            fontSize: "1.35rem",
                            fontWeight: 700,
                            letterSpacing: "0.5px",
                            border: "1px solid rgba(0,0,0,0.4)",
                            cursor: Number(selectedProduct.stock_ml) <= 0 ? "not-allowed" : "pointer",
                            transition: "background-position 1s ease, transform 0.3s ease, box-shadow 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                            if (Number(selectedProduct.stock_ml) <= 0) return;
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 8px 18px rgba(0,0,0,0.25)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0px)";
                            e.currentTarget.style.boxShadow = "none";
                        }}
                        onClick={handleAddToCart}
                    >
                        {Number(selectedProduct.stock_ml) <= 0 ? "Out of Stock" : addToCartText}
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
        <View
            marginTop="4rem"
            padding="2.5rem 2rem"
            borderRadius="28px"
            backgroundColor="rgba(255,255,255,0.10)"
            border="1px solid rgba(80, 50, 40, 0.10)"
            boxShadow="0 10px 28px rgba(0,0,0,0.08)"
            backdropFilter="blur(2px)">
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
                    width="13.5rem"
                    padding="1rem"
                    border="1px solid rgba(190, 160, 150, 0.18)"
                    borderRadius="20px"
                    boxShadow="0 14px 28px rgba(0,0,0,0.22)"
                    style={{
                        background: "linear-gradient(145deg,  #480e0ee2, rgba(20, 20, 20, 0.65))",
                    }}>
                    <Link 
                        to={`/fragrances/${prod.parentid}?variation=${prod.variation}`}
                        style={{ textDecoration: "none" }}
                    >
                        <img
                            src={prod.images?.[0]}
                            alt={prod.name}
                            style={{
                                width: "100%",
                                height: "200px",
                                objectFit: "cover",
                                borderRadius: "10px",
                                display: "block",
                                marginBottom: "1rem",
                            }}
                        />
                        <View minHeight="7.5rem">
                            <Text style={{...bodyStyle, fontSize: "1.2rem"}} textAlign="center">
                                {prod.name}
                            </Text>
                        </View>
                        <Text
                            style={{ ...bodyStyle, fontWeight: 600 }}
                            textAlign="center">
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
        <Flex
            direction={"column"}
            marginTop="4rem"
            padding="2.5rem 2rem"
            borderRadius="28px"
            backgroundColor="rgba(255,255,255,0.10)"
            border="1px solid rgba(80, 50, 40, 0.10)"
            boxShadow="0 10px 28px rgba(0,0,0,0.08)"
            backdropFilter="blur(2px)"
            width={"100%"}
            >
            <Text style={headingStyle} marginBottom=".5rem">
            Reviews
            </Text>
            <Flex 
                wrap="wrap"
                justifyContent="center">
                <View>
                    <h2>Leave a review!</h2>
                    
                    <textarea 
                    value={newReviewMessage}
                    onChange={(e) => setNewReviewMessage(e.target.value)}
                    style={{
                        borderTop: "none",
                        borderRight: 'none',
                        borderLeft: "none",
                        backgroundColor: "transparent",
                        resize: "none"
                    }}></textarea>
                    <button onClick={submitReview}>Submit review</button>
                    {/* {uploadedImages} */}
                    <label>
                        Upload
                        <input type="file" hidden multiple onChange={addImages}></input>
                    </label>
                    
                </View>
                {
                    reviews.map(review => (
                        <View>{JSON.stringify(review)}</View>
                    ))
                }
            </Flex>
        </Flex>
    </Card>
    </View>
    </>
    )
}