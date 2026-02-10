import { useEffect, useState } from "react";
import { Card, Flex, Text, Button, View, TextField, SwitchField, Grid } from "@aws-amplify/ui-react";

import {getProductReq, updateProductReq, deleteProductReq, getProductsReq, createProductReq, createProductFlowReq_LOCAL} from'../requests.js';


// Custom Styling for fonts and amplify ui -------------------------------------- 
const luxuryHeadingStyle = {
    fontFamily: "'Cormorant Garamond', serif",
    fontWeight: 700,
    fontSize: "1.5rem",
    letterSpacing: "0.5px",
};
const luxuryBodyStyle = {
    fontFamily: "'Cormorant Garamond', serif",
    fontWeight: 500,
    fontSize: "1.2rem",   
    letterSpacing: "0.2px",
};
const compactStyle = {
    fontFamily: "'Cormorant Garamond', serif",
    fontWeight: 200,
    fontSize: "0.8rem",
    letterSpacing: "0.1px",
};
const MODES = {
    IDLE: "idle",
    ADD: "add",
    EDIT: "edit",
    REMOVE: "remove",
};

// Default Product Draft   ---------------------------------------
// When adding we set our draft to start with this where it holds no information
// When cancelling an add or finishing an add will set the draft to default after to remove any data being saved
const defaultProductDraft = {
        type: '',
        name: '',
        variation: '',
        price: '',
        quantity: '',
        notes: {
            top: [],
            heart: [],
            base: []
        },
        isfeatured: false,
        ishidden: false,
        images: [], // Images are list of file products (Requests.js)
};

// Products Admin Panel ---------------------------------------------
// Will give user the option to view, add, edit, and remove products from this dashboard
export default function ProductsPanel() {

    // Products states ----------------------------------------------------
    const [products, setProducts] = useState([]);
    // Selected Product will be shown in right card
    const [selectedProduct, setSelectedProduct] = useState(null);

    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadingProduct, setLoadingProduct] = useState(false);
    const [message, setMessage] = useState("");

    // UI mode switch ---------------------------------------
    // Will switch depending on viewing, editing, removing, or adding
    const [activeMode, setActiveMode] = useState(MODES.IDLE);

    // Set draft based on default draft or product editing and use that information --------------------------------
    const [draft, setDraft] = useState(defaultProductDraft);

    // When editing or adding to draft, name and type cannot be left blank but other information can
    const canSave = draft.type.trim() !== "" && draft.name.trim() !== "";

    // Lets us handle inconsistent ID field names across backend -----------------------------------
    function getProductId(product) {
        return product.productid || product.product_id || product.id;
    }

    // Form Change Handler --------------------------------------------------------------------------
    function setDraftField(field, value) {
        setDraft(prevState => ({
            ...prevState,
            [field]: value
        }));
    }

    // Takes product information and creates draft based on it ------------------------------------------------
    function makeDraftFromProduct(product) {
        return {
            type: product.type ?? "",
            name: product.name ?? "",
            variation: product.variation ?? "",
            price: product.price != null ? String(product.price) : "",
            quantity: product.quantity != null ? String(product.quantity) : "",
            notes: {
                top: product.notes?.top ?? [],
                heart: product.notes?.heart ?? [],
                base: product.notes?.base ?? [],
            },
            isfeatured: product.isfeatured,
            ishidden: product.ishidden,
            images: [] // Images are list of file products (Requests.js)
        };
    }

    // For images uploaded when editing or creating ------------------------------------------------------  
    function onImagesSelected(e) {
        const files = Array.from(e.target.files || []);
        setDraft(prev => ({
            ...prev,
            images: files
        }));
    }

    // Form helper for #'s
    function validateNumbers(price, quantity) {
        if (!Number.isFinite(price) || price < 0) return "Price must be a valid number.";
        if (!Number.isFinite(quantity) || quantity < 0) return "Quantity must be a valid number.";
        return null;
    }

    function resetToIdle() {
        setSelectedProduct(null);
        setDraft(defaultProductDraft);
        setActiveMode(MODES.IDLE);
    }

    // Left card  loading---------------------------------------------------------------
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


    // Removing a product ---------------------------------------------------------------------------------
    // get the product id of the select product and send the id to the backend deleteProductReq function
    async function removeProduct() {
        setMessage("")
        if (!selectedProduct) {
            return;
        }
        try {
            const id = getProductId(selectedProduct);
            if (!id) {
                setMessage("ID Error in removing products")
                return;
            }

            await deleteProductReq(id);
            setMessage("Deleted product: " + selectedProduct.name);
            resetToIdle();
            await loadProducts();
        } 
        catch (error) {
            setMessage(error.message || "Error removing product.");
        }
    }

    // Hide a product from website display -----------------------------------
    // Gather the products id and check the status if it is hidden or not, will update status on button click
    async function hideProduct() {
        setMessage("")
        try {
            if (!selectedProduct) {
                setMessage("No product selected");
                return;
            }
            const id = getProductId(selectedProduct);
            if (!id) {
                setMessage("Product does not have id");
                return;
            }
            // Check if product is hidden, will hide or unhide depending on which
            const hiddenStatus = !selectedProduct.ishidden;

            await updateProductReq(id, { ishidden: hiddenStatus });
            setMessage(`${hiddenStatus ? "Hidden" : "Unhidden"}: ${selectedProduct.name}`);
            await loadProducts();
            resetToIdle();
        }
        catch(error) {
            setMessage(error.message || "Error hiding product.");
        }
    }

    // Adding a product to the backend ---------------------------------------------------------------------------
    // Type and name of product must be required but other information is not mandatory at this point
    async function addProduct() {
        setMessage("")
        try {
            if (!canSave) {
                setMessage("Type and name are required.");
                return;
            }
            // Pull info from draft 
            const form = {
                type: draft.type.trim(),
                name: draft.name.trim(),
                variation: draft.variation.trim(),
                price: draft.price === "" ? 0 : Number(draft.price),
                quantity: draft.quantity === "" ? 0 : Number(draft.quantity),
                // To match the backend format of the notes, we have top, heart, and base
                // which will be respectively their own scents.
                notes: {
                    top: draft.notes.top,
                    heart: draft.notes.heart,
                    base: draft.notes.base,
                },
                description: "test description",
                isfeatured: !!draft.isfeatured,
                ishidden: !!draft.ishidden,
                images: draft.images ?? [],
            };
            const validNums = validateNumbers(form.price, form.quantity)
            if (validNums) {
                setMessage(validNums);
                return;
            }
            const newProduct = await createProductFlowReq_LOCAL(form);
            console.log("createProductReq returned:", newProduct);
            setMessage(`Created: ${newProduct.name}`);
            resetToIdle();
            await loadProducts();
        }
        catch(error) {
            setMessage(error.message || "Error adding product.");
        }
    }

    // When updating a products information ---------------------------------------------------------
    // Gather the product id and create the form based on information already entered
    async function updateProduct() {
        setMessage("")
        try {
            if(!selectedProduct) {
                return;
            }
            const id = getProductId(selectedProduct);
            if (!id) {
                setMessage("Product does not have id");
                return;
            }
            if (!canSave) {
                setMessage("Type and name are required.");
                return;
            }
            // makeDraftFromProduct function will be called and that will be setting the draft with the existing info
            const form = {
                type: draft.type.trim(),
                name: draft.name.trim(),
                variation: draft.variation.trim(),
                price: draft.price === "" ? 0 : Number(draft.price),
                quantity: draft.quantity === "" ? 0 : Number(draft.quantity),
                notes: {
                    top: draft.notes.top,
                    heart: draft.notes.heart,
                    base: draft.notes.base,
                },
                isfeatured: !!draft.isfeatured,
                ishidden: !!draft.ishidden,
            };
            const validNums = validateNumbers(form.price, form.quantity)
            if (validNums) {
                setMessage(validNums);
                return;
            }
            // Only include images if user actually selected new files
            if (draft.images.length > 0) {
                form.images = draft.images;
            }
            await updateProductReq(id, form);
            setMessage(`Updated: ${form.name}`);
            await loadProducts();
            resetToIdle();
        }
        catch(error) {
            setMessage(error.message || "Error updating product.");
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
    
    return (
        <Flex 
            direction="row" 
            gap="1rem" 
            height="100%">

            {/* Left card holding products ---------------------------------------------*/}
            {/* Will be shown as a list where each product is clickable  */}
            <Card
                flex="1.2" 
                height="100%" 
                padding="1rem" 
                backgroundColor="whitesmoke"
                >
                <Flex 
                    direction="column" 
                    height="100%">
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
                            {/* Button : add mode -------------------------------------------------- */}
                            <Button 
                                style={luxuryBodyStyle}
                                onClick={() => {
                                    setActiveMode(MODES.ADD);
                                    setSelectedProduct(null);
                                    setDraft(defaultProductDraft);
                                }}
                                >
                                Add
                            </Button>
                            {/* Button : remove mode ---------------------------------------------------- */}
                            <Button 
                                style={luxuryBodyStyle}
                                disabled={!selectedProduct}
                                onClick={() => {
                                    if (!selectedProduct) return;
                                    setActiveMode(MODES.REMOVE);
                                }}
                                >
                                Remove
                            </Button>
                        </Flex>
                    </Flex>

                    {message && (
                    <Text style={luxuryBodyStyle} marginTop="0.5rem" color="black">
                        {message}
                    </Text>
                    )}
                    <View overflow="auto" height="20rem" marginTop="1rem"> 
                        {/* Below creating a list of all the products ---------------------------- */}
                        {products.map((prod) => (
                            <Button
                                key={getProductId(prod)}
                                style={luxuryBodyStyle}
                                variation="link"
                                justifyContent="flex-start"
                                width="100%"
                                marginBottom=".5rem"
                                border=".5px solid #111"
                                borderRadius="6px"
                                onClick={() => {
                                    // On click we activate viewing that specific product based on the id
                                    const id = getProductId(prod);
                                    if (!id) {
                                        setMessage("Product ID missing.");
                                        return;
                                    }
                                    setMessage("");
                                    setSelectedProduct(prod);
                                    setDraft(makeDraftFromProduct(prod));
                                    setActiveMode(MODES.EDIT);
                                }}
                                >
                                <Text>
                                    {prod.name} — qty: {prod.quantity} {prod.quantity <= 5 && "(LOW!)"}
                                </Text>
                            </Button>
                        ))}
                    </View>
                </Flex>
            </Card>
        
            {/* Right card views, edit, delete, or adds information ----------------------------------------- */}
            <Card
                flex="1.0"  
                height="100%" 
                padding="1rem" 
                backgroundColor="whitesmoke">
                <Flex 
                    direction="column"
                    height="100%"
                    width="100%"
                    justifyContent="center"
                    alignItems="center">
                    {loadingProduct && (
                    <Flex direction="column" gap="0.25rem">
                        <Text style={luxuryHeadingStyle}>Product Information</Text>
                        <Text style={luxuryBodyStyle}>Loading Product...</Text>
                    </Flex>
                    )}

                    {/* Add mode: Will pull up a blank draft to be filled out with information of a product they want to add */}
                    {/* Edit mode: Will take existing product and show its information in the draft instead of being blank */}
                    {(activeMode === MODES.ADD || activeMode === MODES.EDIT) && (
                        <Grid 
                            templateColumns="12rem 10rem"
                            gap="0.3rem" 
                            marginTop="-.2rem"
                            >
                            <TextField 
                                style={compactStyle}
                                placeholder="Type"
                                value={draft.type} 
                                onChange={(e) => setDraftField("type", e.target.value)} 
                            />
                            <TextField 
                                style={compactStyle}
                                placeholder="Name"
                                value={draft.name} 
                                onChange={(e) => setDraftField("name", e.target.value)} 
                            />
                            <TextField 
                                style={compactStyle}
                                placeholder="Variation"
                                value={draft.variation} 
                                onChange={(e) => setDraftField("variation", e.target.value)} 
                            />
                            <TextField 
                                style={compactStyle}
                                placeholder="Price"
                                type="number"
                                value={draft.price} 
                                onChange={(e) => setDraftField("price", e.target.value)} 
                            />
                            <TextField 
                                style={compactStyle}
                                placeholder="Quantity"
                                type="number"
                                value={draft.quantity} 
                                onChange={(e) => setDraftField("quantity", e.target.value)} 
                            />
                            {/* Entering Top, Heart, and Base notes ------------------------------------------------------------*/}
                            <TextField
                                style={compactStyle}
                                placeholder="Notes Top (, separated)"
                                // If array exists for top use it and separate by commas
                                value={(draft.notes.top || []).join(",")}   
                                onChange={(e) => {
                                    const arr = e.target.value
                                    .split(",") 
                                    .map(s => s.trim()) 
                                    setDraft(prev => ({
                                        ...prev,
                                        notes: { ...prev.notes, top: arr }
                                    }));
                                }}
                            />
                            <TextField
                                style={compactStyle}
                                placeholder="Notes Heart (, separated)"
                                value={(draft.notes.heart || []).join(",")}   
                                onChange={(e) => {
                                    const arr = e.target.value
                                    .split(",")
                                    .map(s => s.trim())
                                    setDraft(prev => ({
                                        ...prev,
                                        notes: { ...prev.notes, heart: arr }
                                    }));
                                }}
                            />
                            <TextField
                                style={compactStyle}
                                placeholder="Notes Base (, separated)"
                                value={(draft.notes.base || []).join(",")}   
                                onChange={(e) => {
                                    const arr = e.target.value
                                    .split(",")
                                    .map(s => s.trim())
                                    setDraft(prev => ({
                                        ...prev,
                                        notes: { ...prev.notes, base: arr }
                                    }));
                                }}
                            />
                            {/* Hidden or featured switches -------------------- */}
                            <SwitchField
                                style={compactStyle}
                                label="Hidden?"
                                isChecked={draft.ishidden} 
                                onChange={(e) => setDraftField("ishidden", e.target.checked)} 
                            />
                            <SwitchField 
                                style={compactStyle}
                                label="Featured"
                                isChecked={draft.isfeatured}
                                onChange={(e) => setDraftField("isfeatured", e.target.checked)} 
                            />
                            {/* Inputting image files ---------------------------------------------------- */}
                            <View
                                columnSpan={2}>
                                <input 
                                    id="product-images" 
                                    type="file" 
                                    multiple accept="image/*" 
                                    style={{display: "none"}} 
                                    onChange={onImagesSelected}/>
                                <Text 
                                    style={compactStyle}
                                    marginTop="-1rem">
                                    {/* Making sure it is array, will display images length or 0 if nothing has been uploaded */}
                                    Selected: {draft.images.length}
                                </Text>
                                <Button
                                    style={compactStyle}
                                    as="label"
                                    htmlFor="product-images"
                                    border="1px solid #111"
                                    borderRadius="6px"
                                    padding="0.35rem 0.75rem"
                                >
                                    Choose Images
                                </Button>
                            </View>
                            <View 
                                columnSpan={2}>
                                <Flex 
                                    direction="row" 
                                    gap="0.08rem" 
                                    justifyContent="center">
                                    {/* Save button --------------------------------------------------- */}
                                    <Button
                                        style={compactStyle}
                                        onClick={() => {
                                            if (!canSave) {
                                                setMessage("Please fill out type and name information.");
                                                return;
                                            }
                                            if (activeMode === MODES.ADD) addProduct();
                                            else updateProduct();
                                            
                                        }}
                                    >
                                        Save
                                    </Button>
                                    {/* Cancel button ------------------------------------------------------------------- */}
                                    <Button
                                        style={compactStyle}
                                        onClick={() => {
                                            if (activeMode === MODES.EDIT && selectedProduct) {
                                                // Context : If you are editing the selected product, just take the products orignal
                                                // info and set it back as draft as if no changes were made
                                                setDraft(makeDraftFromProduct(selectedProduct)); 
                                                setActiveMode(MODES.IDLE);
                                                return;
                                            }
                                            // If adding a product and cancel just to default and return to no active mode
                                            setMessage("");
                                            resetToIdle();
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </Flex>
                            </View>
                        </Grid>
                        
                    )}    
                    {/* Removal mode -------------------------------------------------- */}
                    {activeMode === MODES.REMOVE && selectedProduct && 
                    (
                        <Flex direction="column" gap="0.05rem" wrap="wrap">
                            <Flex direction="row" gap="0.05rem" wrap="wrap">
                                <Button
                                    onClick={() => hideProduct()}>
                                    {selectedProduct.ishidden ? "Unhide" : "Hide"}
                                </Button>
                                <Button
                                onClick={() => removeProduct()}>
                                    Delete
                                </Button>
                                <Button
                                    onClick={() => {
                                        setMessage("");
                                        if (selectedProduct) {
                                            setActiveMode(MODES.IDLE);
                                            setSelectedProduct(null);
                                            return;
                                        }
                                        setActiveMode(MODES.IDLE)
                                    }}
                                >
                                    Cancel
                                </Button>
                            </Flex>
                        </Flex>
                    )}   
                    {/* Base mode when no product is selected ----------------------------------------------- */}
                    {activeMode === MODES.IDLE && (
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
                    
                </Flex>
            </Card>
        </Flex>
    );
}



// TODO: front end option to select main image to display on website and then other images