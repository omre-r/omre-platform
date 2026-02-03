import { useEffect, useState } from "react";
import { Card, Flex, Text, Button, View, TextField, SwitchField, Grid } from "@aws-amplify/ui-react";

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
  fontWeight: 300,
  fontSize: "1.0rem",   
  letterSpacing: "0.2px",
};

// Form state for edit or adding ------------------
const defaultProductDraft = {
        type: '',
        name: '',
        variation: '',
        price: '',
        quantity: '',
        notesTop: '',
        notesHeart: '',
        notesBase: '',
        isfeatured: false,
        isHidden: false,
        images: []
};

export default function ProductsPanel() {
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadingProduct, setLoadingProduct] = useState(false);

    const [msg, setMessage] = useState("");

    // UI mode switch ---------------------------------------
    // Will switch depending on viewing, editing, removing, or adding
    const [activeMode, setActiveMode] = useState("none"); // none, add, view, edit, remove 

    const [draft, setDraft] = useState(defaultProductDraft);



    /*
    const MOCK_PRODUCTS = [
    {
        id: "mock-1",
        name: "Noir Vanilla",
        quantity: 42,
        type: "womens_perfume",
        variation: "30ml spray",
        price: 99.99,
        images: ["https://picsum.photos/seed/noir/400/400"],
        notes: { top: ["Vanilla"], heart: ["Jasmine"], base: ["Amber"] },
        isfeatured: true,
        ishidden: false,
    },
    {
        id: "mock-2",
        name: "Cedar Ember",
        quantity: 18,
        type: "mens_cologne",
        variation: "50ml spray",
        price: 64.5,
        images: ["https://picsum.photos/seed/cedar/400/400"],
        notes: { top: ["Bergamot"], heart: ["Cedarwood"], base: ["Musk"] },
        isfeatured: false,
        ishidden: false,
    },
    {
        id: "mock-3",
        name: "Silk Citrus",
        quantity: 0,
        type: "unisex_fragrance",
        variation: "5ml mini",
        price: 19.0,
        images: [],
        notes: { top: ["Yuzu"], heart: ["Neroli"], base: ["Sandalwood"] },
        isfeatured: false,
        ishidden: true,
    },
    ];
    */

    async function loadProducts() {
        setMessage("");
        setLoadingProducts(true);
        try {
            // For mock products
            //setProducts(MOCK_PRODUCTS);
            //setMessage("mock products.");
            //return;
            
            // TODO: When I have proper backend implementation 
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
            setActiveMode("view");
            const res = await getProductReq(productId);
            setSelectedProduct(res);
            setMessage("Success!");
        }
        catch (error) {
            setMessage(error?.message || "Error viewing product.");
        }
        finally {
            setLoadingProduct(false);
        }
    }

    async function removeProduct() {
        if (!selectedProduct) {
            return;
        }
        try {
            const id = selectedProduct.id;
            if (!id) {
                setMessage("ID Error in removing products")
                return;
            }
            await deleteProductReq(id)
            setMessage({selectedProduct} + " has been deleted");
            setSelectedProduct(null);
            setActiveMode('none');
            await loadProducts();
        } 
        catch (error) {
            setMessage(error?.message || "Error removing product.");
        }

    }

    async function addProduct() {
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
    
    function getProductId(p) {
        return p?.productid || p?.product_id || p?.id;
    }

    function setDraftField(field, value) {

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
                                // Copy selectedProduct to the form state to edit
                            }}
                            >
                            Edit
                        </Button>
                    </Flex>
                </Flex>
                
                {msg && (
                <Text style={luxuryBodyStyle} marginTop="0.5rem" color="black">
                    {msg}
                </Text>
                )}

                <View overflow="auto" height="20rem" marginTop="1rem"> 
                    {products.map((prod) => (
                        <Button
                            key={getProductId(prod)}
                            variation="link"
                            justifyContent="flex-start"
                            width="100%"
                            onClick={() => {
                                // For mock products
                                //setSelectedProduct(prod);
                                //setActiveMode("view");

                                // TODO: fix this when backend is active  !!!!
                                setSelectedProduct(prod);
                                viewProduct(prod.id)
                            }}
                            >
                            <Text>
                                {prod.name} — qty: {prod.quantity} {prod.quantity <= 5 && "(LOW!)"}
                            </Text>
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
                        <Grid templateColumns="1fr 1fr" gap="0.3rem" marginTop="-.2rem">
                            <Text 
                                style={luxuryBodyStyle}>
                                Add new product.
                            </Text>
                                <TextField 
                                    style={luxuryBodyStyle}
                                    placeholder="Type"
                                    value={draft.type} 
                                    onChange={(e) => setDraftField("type", e.target.value)} 
                                />
                                <TextField 
                                    style={luxuryBodyStyle}
                                    placeholder="Name"
                                    value={draft.name} 
                                    onChange={(e) => setDraftField("name", e.target.value)} 
                                />
                                <TextField 
                                    style={luxuryBodyStyle}
                                    placeholder="Variation"
                                    value={draft.variation} 
                                    onChange={(e) => setDraftField("variation", e.target.value)} 
                                />
                                <TextField 
                                    style={luxuryBodyStyle}
                                    placeholder="Price"
                                    type="number"
                                    value={draft.price} 
                                    onChange={(e) => setDraftField("price", e.target.value)} 
                                />
                                <TextField 
                                    style={luxuryBodyStyle}
                                    placeholder="Quantity"
                                    type="number"
                                    value={draft.quantity} 
                                    onChange={(e) => setDraftField("name", e.target.value)} 
                                />
                                <TextField 
                                    style={luxuryBodyStyle}
                                    placeholder="Notes Top"
                                    value={draft.notesTop} 
                                    onChange={(e) => setDraftField("notesTop", e.target.value)} 
                                />
                                <TextField 
                                    style={luxuryBodyStyle}
                                    placeholder="Notes Heart"
                                    value={draft.notesHeart} 
                                    onChange={(e) => setDraftField("notesHeart", e.target.value)} 
                                />
                                <TextField 
                                    style={luxuryBodyStyle}
                                    placeholder="Notes Base"
                                    value={draft.notesBase} 
                                    onChange={(e) => setDraftField("notesBase", e.target.value)} 
                                />
                                <SwitchField
                                    style={luxuryBodyStyle}
                                    label="Hidden?"
                                    isChecked={draft.isHidden} 
                                    onChange={(e) => setDraftField("isHidden", e.target.checked)} 
                                />
                                <SwitchField 
                                    style={luxuryBodyStyle}
                                    label="Featured"
                                    isChecked={draft.isfeatured}
                                    onChange={(e) => setDraftField("isFeatured", e.target.checked)} 
                                />
                                {/* 
                                <View>
                                    <Text style={luxuryBodyStyle}>Images</Text>
                                    <input type="file" multiple onChange={onImagesSelected} />
                                    <Text style={luxuryBodyStyle}>
                                    Selected: {Array.isArray(draft.images) ? draft.images.length : 0}
                                    </Text>
                                </View>
                                */}
                            <Flex 
                                direction="row" 
                                gap="0.08rem" 
                                wrap="wrap">
                                <Button
                                    style={luxuryBodyStyle}
                                    onClick={() => {
                                        addProduct()
                                    }}
                                >
                                    Create
                                </Button>
                                <Button
                                    style={luxuryBodyStyle}
                                    setSelectedProduct
                                    onClick={() => {
                                        setActiveMode("view")
                                    }}
                                >
                                    Cancel
                                </Button>
                            </Flex>
                        </Grid>
                        
                    )}    

                    {activeMode === "remove" && //selectedProduct && 
                    (
                        <Flex direction="column" gap="0.05rem" wrap="wrap">
                            {/* All adding info will go here for the product */}
                            <Flex direction="row" gap="0.05rem" wrap="wrap">
                                <Button>
                                    Hide
                                </Button>
                                <Button>
                                    Delete
                                </Button>
                                <Button
                                    setSelectedProduct
                                    onClick={() => {
                                        setSelectedProduct(null)
                                        setActiveMode("view")
                                    }}
                                >
                                    Cancel
                                </Button>
                            </Flex>
                        </Flex>
                    )}    

                    {activeMode === "edit" && selectedProduct && 
                    (
                        <Flex direction="column" gap="0.05rem" wrap="wrap">
                                {/* All adding info will go here for the product */}
                                <Flex direction="row" gap="0.05rem" wrap="wrap">
                                    <Button>
                                        Save Changes?
                                    </Button>
                                    <Button
                                        setSelectedProduct
                                        onClick={() => {
                                            setActiveMode("view")
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </Flex>
                            </Flex>
                    )}

                    {activeMode === "none" && (
                    <> 
                    <Flex
                        direction="column" 
                        gap="0.05rem" 
                        wrap="wrap">
                            <Text 
                                style={luxuryHeadingStyle}>
                                Product Information
                            </Text>
                            <Text 
                                style={luxuryBodyStyle}>
                                Please select a product
                            </Text>
                        </Flex>
                    </>
                    )}

                    {activeMode === "view" && selectedProduct &&  (
                    <Flex direction="column" gap="0.05rem" wrap="wrap">
                        <Text style={luxuryBodyStyle}>{selectedProduct.name}</Text>
                        <Text style={luxuryBodyStyle}>Type: {selectedProduct.type}</Text>
                        <Text style={luxuryBodyStyle}>Variation: {selectedProduct.variation}</Text>
                        <Text style={luxuryBodyStyle}>Price: ${selectedProduct.price}</Text>
                        <Text style={luxuryBodyStyle}>Quantity: {selectedProduct.quantity}</Text>
                        <Text style={luxuryBodyStyle}>Featured: {selectedProduct.isfeatured ? "Yes" : "No"}</Text>
                        <Text style={luxuryBodyStyle}>Hidden: {selectedProduct.ishidden ? "Yes" : "No"}</Text>
                        <Text style={luxuryBodyStyle}>
                            Notes: Top[{selectedProduct.notes?.top?.join(", ") || "—"}] / Heart[{selectedProduct.notes?.heart?.join(", ") || "—"}] / Base[{selectedProduct.notes?.base?.join(", ") || "—"}]
                        </Text>
                        <Text 
                            style={luxuryBodyStyle}>
                            Images: {selectedProduct.images.length ? selectedProduct.images.length : "None"}
                        </Text>
                    </Flex>
                    )} 
                </Flex>
            </Card>
        </Flex>
    );
}


// TODO: front end option to select main image to display on website and then other images