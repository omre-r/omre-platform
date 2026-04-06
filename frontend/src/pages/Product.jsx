import { Card, Flex, View, Text, Button } from "@aws-amplify/ui-react";
import { Link } from "react-router-dom";
import styles from "../styles/Product.module.css"

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getProductReq, getRelatedProductsReq, getRecommendationsReq, getIDToken, createCartItemReq, getProductReviewsReq, createReviewReq, uploadAndGetURlsReq, getAccessToken, respondToReviewReq, deleteReviewReq } from "../requests";

import {isProfane} from "no-profanity";
import Navbar from "../components/Navbar";

import LuxuryBackground from "../assets/Luxury Background2.png";
import ProfileIcon from "../assets/profileIconClean.png";
import { useToast } from "../components/ToastContext";

import rating0 from "../assets/ratings/0.png";
import rating1 from "../assets/ratings/1.png";
import rating2 from "../assets/ratings/2.png";
import rating3 from "../assets/ratings/3.png";
import rating4 from "../assets/ratings/4.png";
import rating5 from "../assets/ratings/5.png";
import rating6 from "../assets/ratings/6.png";
import rating7 from "../assets/ratings/7.png";
import rating8 from "../assets/ratings/8.png";
import rating9 from "../assets/ratings/9.png";
import rating10 from "../assets/ratings/10.png";
const ratings = [rating0, rating1, rating2, rating3, rating4, rating5, rating6, rating7, rating8, rating9, rating10];

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

    const [isAuthenticated, setIsAuthenticated] = useState(() => !!getIDToken());

    const [addToCartText, setAddToCartText] = useState("Add To Cart");

    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);
    const [newReviewMessage, setNewReviewMessage] = useState("");
    const [attachedImages, setAttachedImages] = useState([]);
    const [userInfo, setUserInfo] = useState(null);
    const [replyID, setReplyID] = useState("")
    const [replyMessage, setReplyMessage] = useState("")
    const [selectedRating, setSelectedRating] = useState(0);
    const [averageRating, setAverageRating] = useState(0);

    const { toast } = useToast();
    

    useEffect(() => {
        const decodedAccessToken = getAccessToken();
        const decodedIdToken = getIDToken();
        if (decodedIdToken && decodedAccessToken){
            setUserInfo({
                sub: decodedIdToken.sub,
                firstname: decodedIdToken.given_name,
                lastname: decodedIdToken.family_name,
                isAdmin: !!decodedAccessToken?.["cognito:groups"]?.includes("admin")
            });
        }
    }, [])

    useEffect(() => {
        loadProduct();
        loadRecommendations();
        loadReviews();
    },[params.parentid])


    useEffect(() => {
        if (!selectedProduct) return;
        setSearchParams(prev => ({...prev, variation: selectedProduct.variation}))

        const id = setInterval(() => {
            setDisplayedImage(prev => (prev + 1) % selectedProduct.images.length)
        }, 10000)
        return () => {
            clearInterval(id);
        }
    }, [selectedProduct])

    

    async function handleAddToCart(){
        if (!isAuthenticated){
            toast("Please create an account first.", "error")
            return;
        }

        setAddToCartText("Adding...");

        const data = await createCartItemReq({
            customerid: getIDToken()?.sub,
            itemid: selectedProduct.id,
            type: "product"
        });
        if (!data.success){
            toast(data.message, "error")
            return;
        }
        toast("Added to cart!", "success");

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
            toast(data.message, "error")
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
        setLoadingReviews(false)
        if (!data.success){
            return;
        }
        setReviews(data.data.reviews);

        let total = 0;
        for (const review of data.data.reviews){
            total += Number(review.rating);
        }
        const average = total / data.data.reviews.length;
        setAverageRating(Math.round((average * 10)) / 10);
    }

    async function submitReview(){
        const idToken = getIDToken();
        if (!idToken || !idToken?.sub){
            return;
        }
        if (newReviewMessage === ""){
            toast("Please enter a message!", "error")
            return;
        }
        if (selectedRating === 0){
            toast("Please select a rating!", "error")
            return;
        }
        if (isProfane(newReviewMessage)){
           toast("Please keep your message appropriate!", "error")
            return;
        }
        let imageUrls = [];
        if (attachedImages.length > 0){
            imageUrls = await uploadAndGetURlsReq(attachedImages, "reviews");
            if (!imageUrls){
                toast("Failed to upload images.", "error")
                return;
            }
        }
        const reviewForm = {
            customerid: idToken.sub,
            productid: params.parentid,
            message: newReviewMessage,
            rating: selectedRating * .5,
            images: imageUrls
        }
        const result = await createReviewReq(reviewForm);
        if (!result.success){
            toast(result.message, "error")
            return;
        }
        setNewReviewMessage("");
        setSelectedRating(0);
        for (const f of attachedImages){
            URL.revokeObjectURL(f.url);
        }
        setAttachedImages([]);
        loadReviews()
    }
    function applyRating(e){
        const ratingRect = e.target.getBoundingClientRect();
        const amountSelected = (e.clientX - ratingRect.left) / ratingRect.width;
        setSelectedRating(Math.floor(amountSelected * ratings.length))
    }

    async function submitReply(review){
        if (replyMessage === "") {
            toast("Please enter a message!", "error")
            return;
        };
        if (isProfane(replyMessage)){ 
            toast("Please keep your reply appropriate!", "error")
            return;
        }
        const result = await respondToReviewReq(replyID, {message: replyMessage, isadmin: (userInfo.isAdmin && userInfo.sub !== review.customerid)})
        if (!result.success){
           toast(result.message, "error")
            return;
        }
        loadReviews()
        setReplyMessage("");
        setReplyID(null);
    }

    async function removeReview(id) {
        const result = await deleteReviewReq(id);
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
                toast("You can't upload images over 5MB.", "error")
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
                    background: "linear-gradient(145deg,  #9a2424, rgba(20,20,20,0.9))",
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
                                        background: "linear-gradient(145deg,  #9a2424, rgba(20,20,20,0.9))",
                                        borderRadius: "8px",
                                        fontSize: "1.55rem",
                                        fontWeight: "400",
                                        color:"white",
                                        ...(isSelected && {
                                            border: "3px solid rgba(0,0,0,0.65)",
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
                        background: "linear-gradient(145deg,  #9a2424, rgba(20,20,20,0.9))",
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
                                        background: "linear-gradient(145deg,  #9a2424, rgba(20,20,20,0.9))",
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
                                        background: "linear-gradient(145deg,  #9a2424, rgba(20,20,20,0.9))",
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
                            fontFamily={"'Cormorant Garamond', serif"}
                            fontSize={"1.3rem"}
                            fontWeight={"800"}
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
                                        background: "linear-gradient(145deg,  #9a2424, rgba(20,20,20,0.9))",
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
                            fontFamily={"'Cormorant Garamond', serif"}
                            fontSize={"1.3rem"}
                            fontWeight={"800"}
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
                                : "linear-gradient(145deg,  #9a2424, rgba(20,20,20,0.9))",
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
                        background: "linear-gradient(145deg,  #9a2424, rgba(20,20,20,0.9))",
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
                        <View minHeight="3.5rem">
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
            {reviews.length !== 0 &&
                <View>
                    <Flex
                    direction={"column"}
                    alignItems={"center"}
                    gap={"5px"}
                    >
                        <Text style={{...bodyStyle, color: "Black", fontWeight: 700, fontSize: "1.5rem",}}>Average Rating</Text>
                        <Flex
                        alignItems={"center"}>
                            <View 
                            width={"200px"}
                            borderRadius={"10px"}
                            backgroundColor={"rgba(80, 19, 19, 0.13)"}>
                                <Text style={{...bodyStyle, color: "Black", fontWeight: 700, fontSize: "1.5rem",}}>{Number(averageRating)} / 5</Text>
                                <img src={ratings[Math.round(averageRating * 2)]} width={"100%"} alt="" />
                            </View>
                        </Flex>
                    </Flex>
                </View>
            }
            {/* leave a review section */}
            {userInfo !== null &&
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
                        <Flex
                        direction={"column"}
                        gap={"3px"}>
                            <h2 style={{marginBlock: "3px"}}>
                                <Text style={{...bodyStyle, color: "Black", fontWeight: 700, fontSize: "1.5rem",}}>{userInfo.firstname} {userInfo.lastname}</Text>
                            </h2>
                            <View 
                            className={styles.rating}
                            position={"relative"}
                            overflow={"hidden"}
                            width={"200px"}
                            onClick={applyRating}
                            borderRadius={"10px"}
                            backgroundColor={"rgba(80, 19, 19, 0.13)"}>
                                <View className={styles.ratingOverlay}>
                                </View>
                                <img src={ratings[selectedRating]} width={"100%"} alt="" />
                            </View>
                            
                        </Flex>

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
                        alignItems={"end"}>
                            <textarea 
                            value={newReviewMessage}
                            onChange={(e) => setNewReviewMessage(e.target.value)}
                            maxLength={"500"}
                            style={{
                                ...bodyStyle,
                                color: "Black",
                                flex: "1",
                                borderTop: "none",
                                borderLeft: "none",
                                borderRight: "none",
                                borderBottom: "3px solid",
                                borderRadius: "5px",
                                backgroundColor: "transparent",
                                fontSize: "2em",
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
                                <Text style={{...bodyStyle, color: "Black", fontWeight: 700, fontSize: "1.5rem",}}>Attatch Images</Text>
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
                            ><Text style={{...bodyStyle, color: "Black", fontWeight: 700, fontSize: "1.5rem",}}>Submit</Text>
                            </button>
                        </Flex>
                    </Flex>
                </Flex>
            </View>
            }
            {/* List of past reviews */}
            {reviews.length === 0 && 
            <h2>
                <Text style={{...bodyStyle, color: "Black", fontWeight: 700, fontSize: "1.5rem",}}>No reviews yet...</Text>
            </h2>}
            <Flex 
                direction={"column"}
                justifyContent="center"
                textAlign={"left"}>

                {
                    reviews.map(review => (
                        <Flex
                        direction={"column"}>
                            <Flex
                            className={styles.respondable}
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
                                    <Flex
                                    alignItems={"center"}>
                                        <h3 style={{marginBlock: "0"}}>
                                            <Text style={{...bodyStyle, color: "Black", fontWeight: 700, fontSize: "1.8rem",}}>{review.user.first_name} {review.user.last_name}</Text>
                                        </h3>

                                        <View 
                                        width={"200px"}
                                        borderRadius={"10px"}
                                        backgroundColor={"rgba(80, 19, 19, 0.13)"}>
                                            <img src={ratings[review.rating / .5]} width={"100%"} alt="" />
                                        </View>
                                        <strong>{Number(review.rating)} / 5</strong>
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
                                                    <a href={url} target="_blank">
                                                        <img style={{objectFit: "cover", width: "100%", height: "100%"}} src={url} alt="image" />
                                                    </a>
                                                    
                                                </View>
                                            ))}                                       
                                            <Text style={{...bodyStyle, color: "Black", fontWeight: 700, fontSize: "1.5rem",}}>{review.message}</Text>
                                        </View>
                                    </Flex>
                                </Flex>
                                {/* additional options */}
                                {(userInfo?.sub === review.customerid || userInfo?.isAdmin) &&
                                <Flex
                                className={styles.more_options}
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
                                    ><Text style={{...bodyStyle, color: "Black", fontWeight: 700, fontSize: "1.5rem",}}>Reply</Text></button>
                                    {userInfo?.sub === review.customerid &&
                                    <button
                                    onClick={() => removeReview(review.id)}
                                    style={{
                                        backgroundColor: "transparent",
                                        borderRadius: "5px"
                                    }}
                                    ><Text style={{...bodyStyle, color: "Black", fontWeight: 700, fontSize: "1.5rem",}}>Delete</Text></button>
                                    }
                                </Flex>
                                }
                            </Flex>
                            <Flex
                            direction={"column"}
                            gap={"0"}>
                                {review.responses.map((res, i) => (
                                    <Flex
                                    className={styles.respondable}
                                    key={`${res.message}${i}`}
                                    marginLeft={"55px"}
                                    padding={"5px"}
                                    position={"relative"}
                                    fontSize={"1.2rem"}
                                    gap={"25px"}
                                    style={{borderLeft: "2px solid"}}
                                    >
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

                                            {!res.isadmin 
                                            ?
                                                <h3 style={{marginBlock: "0"}}> 
                                                    <Text style={{...bodyStyle, color: "Black", fontWeight: 700, fontSize: "1.8rem",}}>{review.user.first_name} {review.user.last_name}</Text>
                                                </h3>
                                            :
                                                <h3 style={{marginBlock: "0"}}> 
                                                   <Text style={{...bodyStyle, color: "Black", fontWeight: 700, fontSize: "1.8rem",}}>OMRE Fragrances</Text>
                                                </h3>
                                            }
                                            <Flex
                                            direction={"column"}
                                            justifyContent={"left"}>
                                                <View 
                                                fontSize={"1.2em"}
                                                style={{overflowWrap: "break-word", wordBreak: "break-word"}}
                                                >                                     
                                                    <Text style={{...bodyStyle, color: "Black", fontWeight: 700, fontSize: "1.5rem",}}>{res.message}</Text>
                                                </View>
                                            </Flex>
                                        </Flex>
                                    </Flex>
                                ))}
                            {replyID === review.id && 
                            <Flex
                            marginLeft={"55px"}
                            padding={"5px"}
                            borderLeft={"1px solid"}
                            position={"relative"}
                            fontSize={"1.2rem"}
                            gap={"25px"}
                            style={{borderLeft: "2px solid"}}>
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
                                    {userInfo?.isAdmin && userInfo?.sub !== review.customerid
                                    ?
                                        <h3 style={{marginBlock: "0"}}>
                                            <Text style={{...bodyStyle, color: "Black", fontWeight: 700, fontSize: "1.5rem",}}>OMRE Fragrances</Text>
                                        </h3>
                                    :
                                        <h3 style={{marginBlock: "0"}}>
                                            <Text style={{...bodyStyle, color: "Black", fontWeight: 700, fontSize: "1.5rem",}}>{userInfo?.firstname} {userInfo?.lastname}</Text>
                                        </h3>
                                    }
                                    
                                    <Flex
                                    justifyContent={"left"}>
                                        <View 
                                        flex={"1"}
                                        display={"flex"}
                                        alignItems={"end"}
                                        style={{overflowWrap: "break-word", wordBreak: "break-word"}}
                                        >                                     
                                        <textarea 
                                        value={replyMessage}
                                        onChange={(e) => setReplyMessage(e.target.value)}
                                        maxLength={"500"}
                                        style={{
                                            flex: "1",
                                            borderTop: "none",
                                            borderLeft: "none",
                                            borderRight: "none",
                                            borderBottom: "3px solid",
                                            borderRadius: "5px",
                                            backgroundColor: "transparent",
                                        }}
                                        onFocus={e => {e.target.style.outline = "2px solid rgba(0,0,0,.2)"}}
                                        onBlur={e => {e.target.style.outline = "none"}}
                                        />

                                        <button
                                        style={{
                                            border: "1px solid gray",
                                            padding: "5px",
                                            borderRadius: "6px",
                                            fontWeight: "bold",
                                            fontSize: ".8em",
                                            backgroundColor: "rgba(250,250,250,.3)"
                                        }}
                                        onClick={() => {setReplyID(null);setReplyMessage("")}}
                                        ><Text style={{...bodyStyle, color: "Black", fontWeight: 700, fontSize: "1.5rem",}}>Cancel</Text></button>
                                        <button
                                            onClick={() => submitReply(review)}
                                            style={{
                                                border: "1px solid gray",
                                                padding: "5px",
                                                borderRadius: "6px",
                                                fontWeight: "bold",
                                                fontSize: ".8em",
                                                backgroundColor: "rgba(250,250,250,.3)"
                                            }}
                                            ><Text style={{...bodyStyle, color: "Black", fontWeight: 700, fontSize: "1.5rem",}}>Submit</Text>
                                        </button>
                                        </View>
                                    </Flex>
                                </Flex>
                            </Flex>
                            }
                            </Flex>

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