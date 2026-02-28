import { Card, Flex, View, Text } from "@aws-amplify/ui-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProductReq } from "../requests";

import Navbar from "../components/Navbar";

export default function Product(){
    const params = useParams()
    const [product, setProduct] = useState(null)
    const [errorMessage, setErrorMessage] = useState("")
    useEffect(() => {
        loadProduct()
    },[])
    async function loadProduct() {
        const data = await getProductReq(params.productID);
        if (!data.success){
            setErrorMessage(data.message);
            return;
        }
        setProduct(data.data.product);
    }

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
        <Flex
        padding={"10px"}
        minHeight={"90vh"}
        border={"solid black"}
        borderWidth={"1px"}
        margin={"10px"}
        >
            <Flex
            flex={1}
            >
            
            </Flex>
            {/* separator */}
            <View
            height="100%"
            border={"solid rgba(0,0,0,.3)"}
            >
            </View>
            <Flex
            flex={1}
            >

            </Flex>
        </Flex>
    </Card>
    )
}