import { useEffect, useState } from "react";
import { Card, Flex, Text, Button, View, TextField, SwitchField, Grid } from "@aws-amplify/ui-react";

import {getProductReq, updateProductReq, deleteProductReq, getProductsReq, createProductReq, createProductFlowReq_LOCAL, uploadAndGetURlsReq} from'../requests.js';


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
        stock_ml: '',
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
// Will give user the option to add, edit, and remove products from this dashboard
export default function ProductsPanel() {

    // Products states ----------------------------------------------------
    const [products, setProducts] = useState([]);
    // Selected Product will be shown in right card
    const [selectedProduct, setSelectedProduct] = useState(null);

    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadingProduct, setLoadingProduct] = useState(false);
    const [message, setMessage] = useState("");

    // UI mode switch ---------------------------------------
    // Will switch depending on editing, removing, or adding
    const [activeMode, setActiveMode] = useState(MODES.IDLE);

    // Set draft based on default draft or product editing and use that information --------------------------------
    const [draft, setDraft] = useState(defaultProductDraft);

    const [showImages, setShowImages] = useState(false)
    const [files, setFiles]  = useState([])

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
            stock_ml: product.stock_ml != null ? String(product.stock_ml) : "",
            notes: {
                top: product.notes?.top ?? [],
                heart: product.notes?.heart ?? [],
                base: product.notes?.base ?? [],
            },
            isfeatured: product.isfeatured,
            ishidden: product.ishidden,
            images: product.images 
        };
    }

    // For images uploaded when editing or creating ------------------------------------------------------  
    function onImagesSelected(e) {
        const numAllowedFiles = 5 - draft.images.length
        const newFiles = Array.from(e.target.files || []).slice(0,numAllowedFiles);
        e.target.value = ""
        if (newFiles.length === 0 || numAllowedFiles <= 0) return; 
        
        const validFiles = []

        //check no duplicates
        for (const file of newFiles){    // when files is not empty, theuser is prompted to upload.

            //no unique ids available, so just comparing name + size + last modified
            if (files.some(f => `${f.name}${f.size}${f.lastModified}` === `${file.name}${file.size}${file.lastModified}`)){
                continue
            }
            validFiles.push(file)
            file.url = URL.createObjectURL(file)
        }
        if (validFiles.length === 0){
            return
        }
        setFiles(prev => [...prev, ...validFiles])
    }

    async function getS3Urls(){
        if (files.length === 0) return;

        const newFiles = [...files]
        for (const f of newFiles){
            URL.revokeObjectURL(f.url);
            delete f.url;
        }
        //files => urls
        /*files are tagged temporary on S3, 
        so unused images will be deleted in 2 days (may change)*/
        const imageurls = await uploadAndGetURlsReq(newFiles);
        setDraft(prev => {
            return {
                ...prev,
                images: [...prev.images, ...imageurls]
            }
        })
        setFiles([])
    }
    //Used when rearranging images
    async function handleImageDrag(event, i) {
        event.preventDefault()
        const elem = event.currentTarget;

        const initialElemRect = elem.getBoundingClientRect();
        initialElemRect.index = i;
        
        const initialX = event.clientX;
        let newPosition = i;
        const startDrag = (e) => {
            const shift =  e.clientX - initialX;
            elem.style.transform = `translate(${shift}px,0)`;

            //get sorted list of rects of image containers in increasing order
            let allImageRects = Array.from(document.querySelectorAll(".product-image-draggable"))
            .filter(item => item !== elem)
            .map(item => {
                const rect = item.getBoundingClientRect();
                rect.index = Number(item.dataset.index)
                return rect
            });
            allImageRects.push(initialElemRect);
            allImageRects.sort((a, b) => a.right - b.right)

            //checks who is closest to the mouse
            let closest = [99999999, i];
            for (const rect of allImageRects){
                const distance = Math.abs(rect.right - e.clientX)
                if (distance < closest[0]){
                    closest = [distance, rect.index]
                }
            }
            newPosition = closest[1];
        }
        const endDrag = (e) => {
            elem.style.zIndex = "auto";
            elem.style.transform = ``;
            
            if (newPosition !== i){
                const newImages = [...draft.images];
                const temp1 = newImages[newPosition];
                newImages[newPosition] = newImages[i];
                newImages[i] = temp1;
                setDraft(prev => {
                    return {
                        ...prev,
                        images: newImages
                    }
                })
            }
            document.removeEventListener("mousemove", startDrag);
            document.removeEventListener("mouseup", endDrag);
        }
        elem.style.zIndex = "1000";
        document.addEventListener("mousemove", startDrag);
        document.addEventListener("mouseup", endDrag);
    }


    // Form helper for #'s
    function validateNumbers(price, stock_ml) {
        if (!Number.isFinite(price) || price < 0) return "Price must be a valid number.";
        if (!Number.isFinite(stock_ml) || stock_ml < 0) return "Stock must be a valid number.";
        return null;
    }

    function resetToIdle() {
        for (const file of files){
            URL.revokeObjectURL(file.url)
        }
        setFiles([])
        setSelectedProduct(null);
        setDraft(defaultProductDraft);
        setActiveMode(MODES.IDLE);
    }

    function resetToAdd(){
        for (const file of files){
            URL.revokeObjectURL(file.url)
        }
        setFiles([])
        setSelectedProduct(null);
        setDraft(defaultProductDraft);
        setActiveMode(MODES.ADD);
    }

    function resetToEdit(prod){
        for (const file of files){
            URL.revokeObjectURL(file.url)
        }
        setFiles([])
        setSelectedProduct(prod);
        setDraft(makeDraftFromProduct(prod));
        setActiveMode(MODES.EDIT);
    }
    
    // Left card  loading---------------------------------------------------------------
    async function loadProducts() {
        setMessage("");
        setLoadingProducts(true);
        try {
            const data = await getProductsReq();
            if (!data.success){
                throw new Error(data.message)
            }
            setProducts(data.data.products)
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

            const data = await deleteProductReq(id);
            if (!data.success){
                throw new Error(data.message);
            }
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

            const data = await updateProductReq(id, { ishidden: hiddenStatus });
            if (!data.success){
                throw new Error(data.message);
            }
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
            if (draft.images.length === 0){
                setMessage("At least 1 image is required.");
                return;
            }
            // Pull info from draft 
            const form = {
                type: draft.type.trim(),
                name: draft.name.trim(),
                variation: draft.variation.trim(),
                price: draft.price === "" ? 0 : Number(draft.price),
                stock_ml: draft.stock_ml === "" ? 0 : Number(draft.stock_ml),
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
            const validNums = validateNumbers(form.price, form.stock_ml)
            if (validNums) {
                setMessage(validNums);
                return;
            }
            const data = await createProductReq(form);
            if (!data.success){
                throw new Error(data.message);
            }
            const newProduct = data.data.product;
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
                stock_ml: draft.stock_ml === "" ? 0 : Number(draft.stock_ml),
                notes: {
                    top: draft.notes.top,
                    heart: draft.notes.heart,
                    base: draft.notes.base,
                },
                isfeatured: !!draft.isfeatured,
                ishidden: !!draft.ishidden,
                images: draft.images
            };
            const validNums = validateNumbers(form.price, form.stock_ml)
            if (validNums) {
                setMessage(validNums);
                return;
            }
            // Only include images if user actually selected new files
            if (draft.images.length > 0) {
                form.images = draft.images;
            }
            const data = await updateProductReq(id, form);
            if (!data.success){
                throw new Error(data.message);
            }
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
                                onClick={resetToAdd}
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
                                    // On click we activate editing that specific product based on the id
                                    const id = getProductId(prod);
                                    if (!id) {
                                        setMessage("Product ID missing.");
                                        return;
                                    }
                                    setMessage("");
                                    resetToEdit(prod)
                                }}
                                >
                                <Text>
                                    {prod.name} — {prod.stock_ml}ml {prod.stock_ml < 1000 && "(LOW!)"}
                                </Text>
                            </Button>
                        ))}
                    </View>
                </Flex>
            </Card>
        
            {/* Right card edit, delete, or adds information ----------------------------------------- */}
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
                                placeholder="Stock (ml)"
                                type="number"
                                value={draft.stock_ml} 
                                onChange={(e) => setDraftField("stock_ml", e.target.value)} 
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
                            {
                            //     <View
                            //     columnSpan={2}>
                            //     <input 
                            //         id="product-images" 
                            //         type="file" 
                            //         multiple accept="image/*" 
                            //         style={{display: "none"}} 
                            //         onChange={onImagesSelected}/>
                            //     <Text 
                            //         style={compactStyle}
                            //         marginTop="-1rem">
                            //         {/* Making sure it is array, will display images length or 0 if nothing has been uploaded */}
                            //         Selected: {draft.images.length}
                            //     </Text>
                            //     <Button
                            //         style={compactStyle}
                            //         as="label"
                            //         htmlFor="product-images"
                            //         border="1px solid #111"
                            //         borderRadius="6px"
                            //         padding="0.35rem 0.75rem"
                            //     >
                            //         Choose Images
                            //     </Button>
                            // </View>
                            }
                            <View
                                columnSpan={2}>
                                <Text 
                                fontSize={".9em"}>
                                    Images: {draft.images.length}
                                </Text>

                                <Button
                                style={compactStyle}
                                border="1px solid #111"
                                borderRadius="6px"
                                padding="0.35rem 0.75rem"
                                as="label"
                                >

                                    <input 
                                        id="product-images" 
                                        type="file" 
                                        multiple accept="image/*" 
                                        style={{display: "none"}} 
                                        onChange={onImagesSelected}
                                        />
                                    Upload Images
                                </Button>
                                <Button
                                    style={compactStyle}
                                    border="1px solid #111"
                                    borderRadius="6px"
                                    padding="0.35rem 0.75rem"
                                    onClick={e => setShowImages(prev => !prev)}
                                >
                                    {showImages ? "Hide Images" : "Show Images"}
                                </Button>
                                {showImages && 
                                <View
                                position={"fixed"}
                                top={0}
                                left={0}
                                display={"flex"}
                                width={"100vw"}
                                height={"100vh"}
                                style={{backdropFilter: "blur(4px)"}}
                                justifyContent={"center"}
                                alignItems={"center"}
                                >

                                    <Card
                                    display={"flex"}
                                    width={"800px"}
                                    minHeight={"200px"}
                                    padding={0}
                                    border={"solid black"}
                                    borderWidth={"10px"}
                                    borderRadius={"20px"}
                                    backgroundColor={"#27231e"}
                                    color={"white"}
                                    position={"relative"}
                                    >
                                        <View
                                        position={"absolute"}
                                        top={0}
                                        right={0}
                                        transform={"translate(50%,-50%)"}
                                        color={"black"}
                                        backgroundColor={"white"}
                                        width={"40px"}
                                        height={"40px"}
                                        borderRadius={"40%"}
                                        border={"solid black"}
                                        display={"flex"}
                                        justifyContent={"center"}
                                        alignItems={"center"}
                                        fontSize={"1.3em"}
                                        onClick={e => setShowImages(prev => !prev)}
                                        >
                                            <strong>X</strong>
                                        </View>
                                        <Flex
                                        direction={"column"}
                                        flex={1}
                                        width={"100%"}
                                        
                                        >
                                            <h2>View / Rearrange Images</h2>
                                            <Flex
                                            border={"solid black"}
                                            borderRadius={"20px"}
                                            padding={"10px"}
                                            width={"100%"}
                                            height={"200px"}
                                            wrap={"nowrap"}
                                            
                                            gap={"12px"}
                                            alignItems={"center"}
                                            backgroundColor={"rgb(253, 248, 245)"}
                                            style={{overflowX: "auto", overflowY: "hidden", scrollbarWidth: "none"}}
                                            >
                                                {draft.images.map((url, i) => {
                                                    return (
                                                    <View 
                                                    key={url}
                                                    width={"200px"}
                                                    shrink={0}
                                                    border={"solid gray"}
                                                    borderWidth={"5px"}
                                                    borderRadius={"10px"}
                                                    height={"100%"}     
                                                    display={"flex"}
                                                    alignItems={"center"}  
                                                    position={"relative"}   
                                                    onMouseDown={(e) => handleImageDrag(e, i)}
                                                    className="product-image-draggable"
                                                    data-index={i}
                                                    >
                                                        <img src={url} alt="img" 
                                                        style={{
                                                            width: "100%",
                                                            height: "100%",
                                                            objectFit:"cover"
                                                            }} />

                                                        <View
                                                        position={"absolute"}
                                                        top={0}
                                                        right={0}
                                                        transform={"translate(50%,-50%)"}
                                                        color={"white"}
                                                        backgroundColor={"maroon"}
                                                        width={"30px"}
                                                        height={"30px"}
                                                        borderRadius={"40%"}
                                                        border={"solid black"}
                                                        display={"flex"}
                                                        justifyContent={"center"}
                                                        alignItems={"center"}
                                                        fontSize={"1.3em"}
                                                        onClick={e => {
                                                            if (draft.images.length <= 1) return
                                                        }}
                                                        >
                                                            <strong>X</strong>
                                                        </View>
                                                        {i === 0 &&
                                                        <Text
                                                        position={"absolute"}
                                                        bottom={0}
                                                        left={"50%"}
                                                        transform={"translateX(-50%)"}
                                                        backgroundColor={"white"}
                                                        width={"100%"}
                                                        opacity={.8}
                                                        color={"black"}
                                                        fontSize={"1.2em"}
                                                        >
                                                            Cover Photo
                                                        </Text>
                                                        }
                                                        
                                                    </View>)
                                                })}
                                            </Flex>
                                        </Flex>
                                        
                                    </Card>
                                </View>
                                }
                                {files.length !== 0 &&
                                <View
                                position={"fixed"}
                                top={0}
                                left={0}
                                display={"flex"}
                                width={"100vw"}
                                height={"100vh"}
                                style={{backdropFilter: "blur(4px)"}}
                                justifyContent={"center"}
                                alignItems={"center"}
                                >

                                    <Card
                                    display={"flex"}
                                    width={"800px"}
                                    minHeight={"200px"}
                                    padding={0}
                                    border={"solid black"}
                                    borderWidth={"10px"}
                                    borderRadius={"20px"}
                                    backgroundColor={"#27231e"}
                                    color={"white"}
                                    position={"relative"}
                                    >
                                        <View
                                        position={"absolute"}
                                        top={0}
                                        right={0}
                                        transform={"translate(50%,-50%)"}
                                        color={"black"}
                                        backgroundColor={"white"}
                                        width={"40px"}
                                        height={"40px"}
                                        borderRadius={"40%"}
                                        border={"solid black"}
                                        display={"flex"}
                                        justifyContent={"center"}
                                        alignItems={"center"}
                                        fontSize={"1.3em"}
                                        onClick={e => {
                                            for (const f of files){
                                                URL.revokeObjectURL(f.url)
                                            }
                                            setFiles([])
                                        }}
                                        >
                                            <strong>X</strong>
                                        </View>
                                        <Flex
                                        direction={"column"}
                                        flex={1}
                                        width={"100%"}
                                        >
                                            <h2>Upload Images</h2>
                                            <Flex
                                            border={"solid black"}
                                            borderRadius={"20px"}
                                            padding={"10px"}
                                            width={"100%"}
                                            height={"200px"}
                                            wrap={"nowrap"}
                                            gap={"12px"}
                                            alignItems={"center"}
                                            backgroundColor={"rgb(253, 248, 245)"}
                                            style={{overflowX: "auto", overflowY: "hidden", scrollbarWidth: "none"}}
                                            >
                                                {files.map((f, i) => {
                                                    return (
                                                    <View 
                                                    key={f.url}
                                                    width={"200px"}
                                                    border={"solid gray"}
                                                    borderWidth={"5px"}
                                                    borderRadius={"10px"}
                                                    height={"100%"}     
                                                    display={"flex"}
                                                    alignItems={"center"}  
                                                    position={"relative"}   
                                                    >
                                                        <img src={f.url} alt="img" 
                                                        style={{
                                                            width: "100%",
                                                            height: "100%",
                                                            objectFit:"cover"
                                                            }} />

                                                        <View
                                                        position={"absolute"}
                                                        top={0}
                                                        right={0}
                                                        transform={"translate(50%,-50%)"}
                                                        color={"white"}
                                                        backgroundColor={"maroon"}
                                                        width={"30px"}
                                                        height={"30px"}
                                                        borderRadius={"40%"}
                                                        border={"solid black"}
                                                        display={"flex"}
                                                        justifyContent={"center"}
                                                        alignItems={"center"}
                                                        fontSize={"1.3em"}
                                                        onClick={e => {
                                                            URL.revokeObjectURL(f.url)
                                                            setFiles(prev => prev.filter(file => file !== f))
                                                        }}
                                                        >
                                                            <strong>X</strong>
                                                        </View>                     
                                                    </View>)
                                                })}
                                            </Flex>
                                            <Button
                                            style={compactStyle}
                                            border="1px solid #111"
                                            borderRadius="6px"
                                            padding="0.35rem 0.75rem"
                                            fontSize={"1.5em"}
                                            fontWeight={"bold"}
                                            margin={"auto"}
                                            onClick={getS3Urls}
                                            >
                                                Upload
                                            </Button>
                                        </Flex>
                                        
                                    </Card>
                                </View>
                                }
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
                    {/* View product ------------------------------------------------- */}
                    {activeMode === MODES.VIEW && selectedProduct &&  !loadingProduct && (
                    <Flex direction="column" gap="0.1rem" wrap="wrap" textAlign="center">
                        <Text style={luxuryBodyStyle}>Name: {selectedProduct.name}</Text>
                        <Text style={luxuryBodyStyle}>Type: {selectedProduct.type}</Text>
                        <Text style={luxuryBodyStyle}>Variation: {selectedProduct.variation}</Text>
                        <Text style={luxuryBodyStyle}>Price: ${selectedProduct.price}</Text>
                        <Text style={luxuryBodyStyle}>Stock: {selectedProduct.stock_ml} ml</Text>
                        <Text style={luxuryBodyStyle}>Featured: {selectedProduct.isfeatured ? "Yes" : "No"}</Text>
                        <Text style={luxuryBodyStyle}>Hidden: {selectedProduct.ishidden ? "Yes" : "No"}</Text>
                        <Text style={luxuryBodyStyle}>
                            {/* Display the selected products Top, Heart, and Base notes in one line */}
                            Notes: Top[{selectedProduct.notes?.top.join(", ") || "—"}] / Heart[{selectedProduct.notes?.heart.join(", ") || "—"}] / Base[{selectedProduct.notes?.base.join(", ") || "—"}]
                        </Text>
                        <Text 
                            style={luxuryBodyStyle}>
                            Images: {Array.isArray(selectedProduct.images) ? selectedProduct.images.length : 0}
                        </Text>
                    </Flex>
                    )} 
                </Flex>
            </Card>
        </Flex>
    );
}



// TODO: front end option to select main image to display on website and then other images