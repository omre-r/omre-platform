import { Card, Flex, View, Text, Button } from "@aws-amplify/ui-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProductReq } from "../requests";

import Navbar from "../components/Navbar";

export default function Product(){
    const params = useParams()

    const [product, setProduct] = useState(null)
    const [loadingProduct, setLoadingProduct] = useState(true);
    const [displayedImage, setDisplayedImage] = useState(0)

    const [errorMessage, setErrorMessage] = useState("")
    useEffect(() => {
        loadProduct()
    },[])
    async function loadProduct() {
        setLoadingProduct(true);
        const data = await getProductReq(params.productID);
        setLoadingProduct(false)
        if (!data.success){
            setErrorMessage(data.message);
            return;
        }
        setProduct(data.data.product);
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
                    <img src={product.images[displayedImage]} alt="cover" 
                    style={{width:"100%", height: "100%", objectFit: "contain",display: "block"}}/>
                </View>
                <Flex>
                    {product.images.map((url, i) => {
                        return (
                            <View
                            width={"50px"}
                            borderRadius={"10px"}
                            overflow={"hidden"}
                            opacity={displayedImage === i ? ".5": 1}
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
            >
                <h1
                style={{
                    fontSize: "1.5rem",
                    backgroundColor: "rgba(228, 245, 227, 0.4)",
                    borderRadius: "",
                    margin: 0,
                    padding: "10px",
                    borderRadius: "10px 10px"
                }}
                >
                    {product.name}
                </h1>

                <Text
                width={"100%"}
                textAlign={"left"}
                >
                    Price: ${product.price}
                </Text>
                <View
                width={"100%"}
                >
                    <h2
                    style={{
                        fontSize: "1.2rem",
                    }}
                    >
                        Description
                    </h2>
                    <Text
                    textAlign={"left"}
                    >
                        {product.description}
                    </Text>
                <View
                width={"100%"}
                >
                    <h2
                    style={{
                        fontSize: "1.2rem"
                    }}
                    >
                        Notes
                    </h2>
                    <Text
                    textAlign={"left"}
                    >
                        <h3>Top</h3>
                        <Flex
                        wrap={"wrap"}>
                            {product.notes.top.map(note => {
                                return (
                                    <Text
                                    padding={"5px"}
                                    borderRadius={"5px 10px"}
                                    backgroundColor={"rgba(255, 255, 255, 0.32)"}>
                                        {note}
                                    </Text>
                                )
                            })}
                        </Flex>
                        <h3>Heart</h3>
                        <Flex
                        wrap={"wrap"}>
                            {product.notes.heart.map(note => {
                                return (
                                    <Text
                                    padding={"5px"}
                                    borderRadius={"5px 10px"}
                                    backgroundColor={"rgba(255, 255, 255, 0.32)"}>
                                        {note}
                                    </Text>
                                )
                            })}
                            {product.notes.heart.length === 0 &&
                            <Text
                            paddingLeft={"20px"}

                            >
                                None
                            </Text>}
                        </Flex>
                        <h3>Base</h3>
                        <Flex
                        wrap={"wrap"}>
                            {product.notes.base.map(note => {
                                return (
                                    <Text
                                    padding={"5px"}
                                    borderRadius={"5px 10px"}
                                    backgroundColor={"rgba(255, 255, 255, 0.32)"}>
                                        {note}
                                    </Text>
                                )
                            })}
                            {product.notes.base.length === 0 &&
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
                    <Button
                    width={"75%"}
                    >
                        Add To Cart
                    </Button>   
                </View>
            </Flex>
        </Flex>
        <Flex
        backgroundColor={"white"}
        direction={"column"}
        width={"100%"}
        >
            <h1
            >
                Recommendations Stuff
            </h1>
        </Flex>
    </Card>
    )
}