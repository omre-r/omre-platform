import { Card, Flex, View, Text, Button } from "@aws-amplify/ui-react";
import { Link } from "react-router-dom";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getProductReq, getRelatedProductsReq, getRecommendationsReq, getIDToken, createCartItemReq, getProductReviewsReq, createReviewReq, uploadAndGetURlsReq } from "../requests";

import Navbar from "../components/Navbar";

import LuxuryBackground from "../assets/Luxury Background2.png";
import ProfileIcon from "../assets/profileIconClean.png"

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
    const [attachedImages, setAttachedImages] = useState([]);
    const [tokenInfo, setTokenInfo] = useState(null);
    const [replyID, setReplyID] = useState("")
    const [replyMessage, setReplyMessage] = useState("")


    useEffect(() => {
        loadProduct();
        loadRecommendations();
        loadReviews();
        const decodedToken = getIDToken();
        if (decodedToken){
            setTokenInfo(decodedToken);
        }
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
        let imageUrls = [];
        if (attachedImages.length > 0){
            imageUrls = await uploadAndGetURlsReq(attachedImages);
            if (!imageUrls){
                return;
            }
        }
        const reviewForm = {
            customerid: idToken.sub,
            productid: params.parentid,
            message: newReviewMessage,
            rating: newReviewrating,
            images: imageUrls
        }
        const result = await createReviewReq(reviewForm);
        loadReviews()
    }

    function addImages(e){
        const MAX_SIZE = 1024 * 1024 * 5
        const numAllowedFiles = 2 - attachedImages.length
        const newFiles = Array.from(e.target.files || []).slice(0,numAllowedFiles);
        e.target.value = ""
        if (newFiles.length === 0 || numAllowedFiles <= 0) return; 
        
        const validFiles = []
        //check no duplicates
        for (const file of newFiles){   
            //no unique ids available, so just comparing name + size + last modified
            if (attachedImages.some(f => `${f.name}${f.size}${f.lastModified}` === `${file.name}${file.size}${file.lastModified}`)){
                continue
            }
            if (file.size >= MAX_SIZE){
                setAttachedImages([])
                //setMessage("You can't upload images over 5MB");
                //setTimeout(() => setMessage(""), 5000);
                for (const f of validFiles){
                    URL.revokeObjectURL(f.url);
                }
                return
            }
            validFiles.push(file)
            file.url = URL.createObjectURL(file)
        }
        if (validFiles.length === 0){
            return
        }
        setAttachedImages(prev => [...prev, ...validFiles])
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
            {/* leave a review section */}
            {tokenInfo !== null &&
            <View
            textAlign={"left"}>
                <h2 style={{marginBottom: "0"}}> Leave a Review!</h2>
                <Flex
                border={"1px solid rgba(161, 45, 27, 0.29)"}
                borderRadius={"15px"}
                padding={"15px"}
                boxShadow={"0 0 5px inset gray"}
                backgroundColor={"rgba(194, 245, 172, 0.08)"}>
                    {/* left area */}
                    <View>
                        <View 
                        style={{
                            width: "70px",
                            height: "70px",
                            borderRadius: "50%",
                             border: "2px solid"}}>
                            <img src={ProfileIcon} style={{width:"100%"}} alt="profile" />
                        </View>
                    </View>
                    {/* right area */}
                    <Flex 
                    direction={"column"}
                    flex={"1"}
                    >
                        
                        <h2 style={{marginBlock: "3px"}}>
                            {tokenInfo.given_name} {tokenInfo.family_name}
                        </h2>
                        <Flex>
                            {attachedImages.map(f => (
                                <View
                                width={"100px"}
                                height={"100px"}
                                border={"1px solid"}
                                borderRadius={"10px"}
                                position={"relative"}
                                >
                                    <View
                                    position={"absolute"}
                                    top={"0"}
                                    right={"0"}
                                    transform={"translate(50%, -50%)"}
                                    backgroundColor={"rgba(255, 0, 0, 0.72)"}
                                    width={"30px"}
                                    height={"30px"}
                                    fontWeight={"bold"}
                                    display={"flex"}
                                    justifyContent={"center"}
                                    alignItems={"center"}
                                    borderRadius={"30%"}
                                    onClick={() => {URL.revokeObjectURL(f.url); setAttachedImages(prev => prev.filter(val => val !== f));}}
                                    >
                                        X
                                    </View>
                                    <img style={{objectFit: "cover", width: "100%", height: "100%"}} src={f.url} alt="image" />
                                </View>
                            ))}  
                        </Flex>   
                        <Flex
                        alignItems={"center"}>
                            <textarea 
                            value={newReviewMessage}
                            onChange={(e) => setNewReviewMessage(e.target.value)}
                            maxLength={"500"}
                            style={{
                                flex: "1",
                                borderTop: "none",
                                borderLeft: "none",
                                borderRight: "none",
                                borderBottom: "3px solid",
                                borderRadius: "5px",
                                backgroundColor: "transparent",
                                fontSize: "2em"
                            }}
                            onFocus={e => {e.target.style.outline = "2px solid rgba(0,0,0,.2)"}}
                            onBlur={e => {e.target.style.outline = "none"}}
                            />

                            <label 
                            style={{
                                border: "1px solid gray",
                                padding: "5px",
                                borderRadius: "6px",
                                fontWeight: "bold",
                                fontSize: "1.5em",
                                backgroundColor: "rgba(250,250,250,.3)"
                            }}>
                                Attach Images
                                <input type="file" hidden multiple onChange={addImages}></input>
                            </label>
                            <button
                            onClick={submitReview}
                            style={{
                                border: "1px solid gray",
                                padding: "5px",
                                borderRadius: "6px",
                                fontWeight: "bold",
                                fontSize: "1.5em",
                                backgroundColor: "rgba(250,250,250,.3)"
                            }}
                            >Submit
                            </button>
                        </Flex>
                    </Flex>
                </Flex>
            </View>
            }
            {/* List of past reviews */}
            <Flex 
                direction={"column"}
                justifyContent="center"
                textAlign={"left"}>

                {
                    reviews.map(review => (
                        <Flex
                        direction={"column"}>
                            <Flex
                            key={review.id}
                            position={"relative"}
                            fontSize={"1.2rem"}
                            gap={"25px"}>
                                {/* left area */}
                                <View>
                                    <View 
                                    style={{
                                        width: "70px",
                                        height: "70px",
                                        borderRadius: "50%",
                                        border: "2px solid"}}>
                                        <img src={ProfileIcon} style={{width:"100%"}} alt="profile" />
                                    </View>
                                    <Flex
                                    direction={"column"}
                                    gap={0}
                                    fontSize={".7em"}
                                    opacity={".5"}
                                    display={"flex"}
                                    alignItems={"center"}
                                    >
                                        <span>{new Date(review.created).toLocaleString(undefined, {year: "2-digit", month: "2-digit", day: "numeric"})}</span>
                                        <span>{new Date(review.created).toLocaleString(undefined, {hour: "2-digit", minute: "2-digit"})}</span>
                                    </Flex>
                                </View>
                                {/* right area */}
                                <Flex 
                                direction={"column"}
                                flex={"1"}
                                >      
                                    <Flex>
                                        <h3 style={{marginBlock: "0"}}>
                                            {review.user.first_name} {review.user.last_name}
                                        </h3>
                                        <View
                                        display={"flex"}
                                        justifyContent={"center"}
                                        alignItems={"center"}>
                                            <strong>Rating: {Number(review.rating)} / 5</strong>
                                        </View>
                                    </Flex>
                                    <Flex
                                    direction={"column"}
                                    justifyContent={"left"}>
                                        <View 
                                        fontSize={"1.2em"}
                                        style={{overflowWrap: "break-word", wordBreak: "break-word"}}
                                        >
                                            {review.images.map(url => (
                                                <View
                                                width={"100px"}
                                                height={"100px"}
                                                border={"1px solid"}
                                                borderRadius={"10px"}
                                                >
                                                    <img style={{objectFit: "cover", width: "100%", height: "100%"}} src={url} alt="image" />
                                                </View>
                                            ))}                                       
                                            {review.message}
                                        </View>
                                    </Flex>
                                </Flex>
                                {/* additional options */}
                                <Flex
                                gap={"3px"}
                                position={"absolute"}
                                top={"0"}
                                right={"0"}
                                fontSize={".9em"}>
                                    <button 
                                    style={{
                                        backgroundColor: "transparent",
                                        borderRadius: "5px"
                                    }}
                                    onClick={() => setReplyID(review.id)}
                                    >Reply</button>
                                    <button
                                    style={{
                                        backgroundColor: "transparent",
                                        borderRadius: "5px"
                                    }}
                                    >Delete</button>
                                </Flex>
                            </Flex>
                            {review.responses.map((res, i) => {
                                <Flex
                                key={`${res.message}${i}`}
                                marginLeft={"30px"}
                                borderLeft={"1px solid"}
                                position={"relative"}
                                fontSize={"1.2rem"}
                                gap={"25px"}>
                                    {/* left area */}
                                    <View>
                                        <View 
                                        style={{
                                            width: "70px",
                                            height: "70px",
                                            borderRadius: "50%",
                                            border: "2px solid"}}>
                                            <img src={ProfileIcon} style={{width:"100%"}} alt="profile" />
                                        </View>
                                    </View>
                                    {/* right area */}
                                    <Flex 
                                    direction={"column"}
                                    flex={"1"}
                                    >      
                                        {res.isadmin 
                                        ?
                                            <h3 style={{marginBlock: "0"}}>
                                                OMRE Fragrances
                                            </h3>
                                        :
                                            <h3 style={{marginBlock: "0"}}>
                                                {review.user.first_name} {review.user.last_name}
                                            </h3>
                                        }
                                        <Flex
                                        direction={"column"}
                                        justifyContent={"left"}>
                                            <View 
                                            fontSize={"1.2em"}
                                            style={{overflowWrap: "break-word", wordBreak: "break-word"}}
                                            >                                     
                                                {res.message}
                                            </View>
                                        </Flex>
                                    </Flex>
                                    {/* additional options */}
                                    <Flex
                                    gap={"3px"}
                                    position={"absolute"}
                                    top={"0"}
                                    right={"0"}
                                    fontSize={".9em"}>
                                        <button 
                                        style={{
                                            backgroundColor: "transparent",
                                            borderRadius: "5px"
                                        }}
                                        onClick={() => setReplyID(review.id)}
                                        >Reply</button>
                                        <button
                                        style={{
                                            backgroundColor: "transparent",
                                            borderRadius: "5px"
                                        }}
                                        >Delete</button>
                                    </Flex>
                                </Flex>
                            })}
                        </Flex>
                    ))
                }
            </Flex>
        </Flex>
    </Card>
    </View>
    </>
    )
}