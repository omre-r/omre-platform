import { useEffect, useState } from "react";
import { Card, Flex, Text, Button, View } from "@aws-amplify/ui-react";

import {getProductReq, updateProductReq, deleteProductReq, getActiveProductsReq, getProductsReq, createProductReq} from'../requests.js';


// Custom Styling for fonts and amplify ui --------------------------------------
const luxuryHeadingStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 600,
  fontSize: "1.5rem",
  letterSpacing: "0.5px",
};
const luxuryBodyStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 400,
  fontSize: "1.3rem",   
  letterSpacing: "0.3px",
};

export default function ProductsPanel() {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadingProduct, setLoadingProduct] = useState(false);
    const [msg, setMessage] = useState("");

    // UI mode switch ---------------------------------------
    // Will switch depending on viewing, editing, removing, or adding
    const [activeMode, setActiveMode] = useState("none"); 

    async function loadProducts() {
        setMessage("");
        setLoadingProducts(true);
        try {
            // !!!!!!!!!!!!!!!!!!!!!!!!!
            const res = await getProductsReq();
            setProducts(res || [])
            setMessage("Success!");
        }
        catch (error) {
            setMessage(error?.message || "Error loading products.");
        }
        finally {
            setLoadingProducts(false);
        }
    }

    async function viewProduct(productId) {
        setMessage("");
        setLoadingProduct(true);
        try {
            setActiveMode("view")
            const res = await getProductReq(productId)
            setSelectedProduct(res)
            setMessage("Success!");
        }
        catch (error) {
            setMessage(error?.message || "Error viewing product.");
        }
        finally {
            setLoadingProduct(false);
        }
    }

    useEffect(() => {
        loadProducts();
    }, []);

    if (loadingProducts) {
        return (
        <Text 
            style={luxuryBodyStyle}>
            Loading Products...
        </Text>);
    }
    
    // FIGURE OUT LATER
    function getProductId(p) {
        return p?.productid || p?.product_id || p?.id;
    }

    return (
        <Flex 
            direction="row" 
            gap="1rem" 
            height="100%">

            {/* Left card holding emails ---------------------------------------------*/}
            <Card
                width="45%" 
                height="100%" 
                padding="1rem" 
                backgroundColor="whitesmoke"
                >
                <Flex 
                    justifyContent="space-between" 
                    alignItems="center"
                    wrap="wrap">
                       
                    {/* {msg && ( 
                        <Text 
                            color="Black" 
                            style={luxuryBodyStyle} 
                            marginTop="0.5rem">
                            {msg}
                        </Text>
                    )} */}
                    <Text 
                        style={luxuryHeadingStyle}>
                        Products
                    </Text>
                    <Flex 
                        direction="row"
                        gap="0.75rem" 
                        wrap="wrap" 
                        justifyContent="flex-end">
                        <Button 
                            style={luxuryBodyStyle}
                            onClick={() => {
                                setSelectedProduct(null);
                                setActiveMode("add");
                            }}
                            >
                            Add
                        </Button>
                        <Button 
                            style={luxuryBodyStyle}
                            disabled={!selectedProduct}
                            onClick={() => {
                                if (!selectedProduct) return;
                                setActiveMode("remove");
                            }}
                            >
                            Remove
                        </Button>
                        <Button 
                            style={luxuryBodyStyle}
                            disabled={!selectedProduct}
                            onClick={() => {
                                if (!selectedProduct) return;
                                setActiveMode("edit");
                            }}
                            >
                            Edit
                        </Button>
                    </Flex>
                </Flex>
                <View overflow="auto" height="20rem" marginTop="1rem"> 
                    {products.map((prod) => (
                        <Button
                            // FIGURE OUT LATER !!!!
                            key={getProductId(prod)}
                            variation="link"
                            justifyContent="flex-start"
                            width="100%"
                            onClick={() => {
                                setSelectedProduct(prod);
                                setActiveMode("view");
                            }}
                            >
                            {prod.name} — qty: {prod.quantity}
                        </Button>
                    ))}
                </View>
            </Card>
        
            {/* Right card views, handles delete, or adds information ----------------------------------------- */}
            <Card
                width="45%" 
                height="100%" 
                padding="1rem" 
                backgroundColor="whitesmoke"
            >
                <Flex 
                    justifyContent="space-between" 
                    alignItems="center">
                    {activeMode === "add" &&
                    (
                        <Text 
                            style={luxuryBodyStyle}>
                            add
                        </Text>
                    )}    

                    {activeMode === "remove" && //selectedProduct && 
                    (
                        <Text 
                            style={luxuryBodyStyle}>
                            remove
                        </Text>
                    )}    

                    {activeMode === "edit" && //selectedProduct && 
                    (
                        <Text 
                            style={luxuryBodyStyle}>
                            edit
                        </Text>
                    )}

                    {activeMode === "view" && //selectedProduct && 
                    (
                        <Text 
                            style={luxuryBodyStyle}>
                            edit
                        </Text>
                    )}    
                </Flex>
            </Card>
        </Flex>
    );
}

//What are the exact function names you want me to call for: list, get by id, create, update, delete?

//What product fields does the backend return? (ids + image fields + stock + featured + active)

//For images: are we storing imageUrl directly, or are we doing upload to S3/Amplify and storing key/url?
// We are gonna be storing imageURL, for now I upload images, if not will need 2 roundtrips uplload to s3 and store keys
// treat as array of file objects 

// Is remove product hard delete or soft delete (isActive=false)?
// Called ishidden, get active products will hide is hidden.
// isfeatured isnt used anywhere so far


// Confirm data shape
/*ex : 
{
  product_id: "string",
  name: "string",
  description: "string",
  price: number,
  imageUrl: "string",
  stock: number,
  isFeatured: boolean,
  isActive: boolean,  // soft delete / hide
  created_at: "string"
}
*/



// server.js is basically api.js, what end points to hit directly 
// handlers come from the controllers 

// controllers.js has endpoints on top of each function, functions that handle endpoints
// all wrapped in handle error, prevents server crashes
// The functions comm with db

// db.js
// connects to database
// creates tables
// users table
// products table
// type in products will be men or womens fragrances
// name is prodname
// variation, 5ML spray or something else
// price 
// images, will be url's
// Notes top heart and base
// review table has a bunch of good information as well, responses only retaj can respond

// request.js, 
// do the function and fill in the variables


// Ayman we import the function from AWS
// Murad we have the functions in the files on the backend folder

// local development will stick with murads functions 
