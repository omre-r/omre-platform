import Navbar from "../components/Navbar";
import { View, Flex, Text, Button, Grid, Table, TableRow, TableCell, TableHead, Heading, ToggleButton } from "@aws-amplify/ui-react";
import LuxuryBackground from "../assets/Luxury Background2.png";
import { useEffect, useState } from "react";
import { getUserSavedBlendsReq, getActiveProductsReq,deleteUserBlendReq, createCartItemReq, updatePreferredNotesReq, getUserReq, getUserOrdersReq } from "../requests.js";

// Fonts ----------------------------------------------
const luxuryHeadingStyle = {
    fontFamily: "'Cormorant Garamond', serif",
    fontWeight: 800,
    fontSize: "2.5rem",
    letterSpacing: "0.5px",
};
const luxuryHeadingStyle2 = {
    fontFamily: "'Cormorant Garamond', serif",
    fontWeight: 1000,
    fontSize: "2.0rem",
    letterSpacing: "0.5px",
};
const luxurySubheadingStyle = {
    fontFamily: "'Cormorant Garamond', serif",
    fontWeight: 600,
    fontSize: "1.6rem",   
    letterSpacing: "0.3px",
};
const luxuryBodyStyle = {
    fontFamily: "'Cormorant Garamond', serif",
    fontWeight: 500,
    fontSize: "1.1rem",   
    letterSpacing: "0.2px",
};

// Styles to change font and outline of table headers and body ------------------------------
const tableHeaderStyle = {
    ...luxuryBodyStyle,
    fontSize: "1.45rem",  
    fontWeight: 550,
    letterSpacing: "0.3px",
    backgroundColor: "transparent",
    border: "none",
    boxShadow: "none",
    outline: "none",
}
const tableBodyStyle = {
    ...luxuryBodyStyle,
    fontSize: "1.2rem",  
    fontWeight: 400,
    letterSpacing: "0.2px",
    backgroundColor: "transparent",
    border: "none",
    boxShadow: "none",
    outline: "none",
}
const cardStyle = {
    backgroundColor: "rgba(255, 248, 244, 0.35)",
    borderRadius: "18px",
    padding: "1.5rem",
    minHeight: "220px",
    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",
    backdropFilter: "blur(3px)",
    border: "1px solid rgba(255, 255, 255, 0.25)",
};

export default function Profile() {
    const [message, setMessage] = useState("");
    const [activeTab, setActiveTab] = useState("overview");    
    const [selectedNotes, setSelectedNotes] = useState([]); 
    const [loadedBlends, setLoadedBlends] = useState([]);
    const [products, setProducts] = useState([]);
    const [blendLoading, setBlendLoading] = useState(false);

    // Order states ----------------------------
    const [userOrders, setUserOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    // User information states -----------------------------
    const [firstName, setfirstName] = useState("");
    const [lastName, setlastName] = useState("");
    const [email, setemailName] = useState("");
    const [createdAt, setCreatedAt] = useState("");


    // Load products from backend ---------------------------------------
    async function loadProducts() {
        setMessage("");
        try {
            const data = await getActiveProductsReq();  
            if (!data.success){
                throw new Error(data.message)
            }
            setProducts(data.data.products)
        }
        catch (error) {
            setMessage(error.message || "Error loading products.");
        }
    }

    async function loadBlends() {
        let userid;
        for (let key of Object.keys(localStorage)){
            if (key.includes("idToken")){
                const idToken = localStorage.getItem(key)        
                const base64 = idToken.split(".")[1]
                const decoded = JSON.parse(atob(base64))
                userid = decoded.sub
                break
            };
        }
        setMessage("");
        try {
            const data = await getUserSavedBlendsReq(userid);
            if (!data.success){
                throw new Error(data.message);
            }
            setLoadedBlends(data.data.blends);
        }
        catch (error) {
            setMessage(error.message || "Error loading saved blends.");
        }
    }

    async function handleDeleteBlend(blendId) {
        let userid;
        for (let key of Object.keys(localStorage)){
            if (key.includes("idToken")){
                const idToken = localStorage.getItem(key)        
                const base64 = idToken.split(".")[1]
                const decoded = JSON.parse(atob(base64))
                userid = decoded.sub
                break
            };
        }
        setMessage("");
        try {
            const data = await deleteUserBlendReq(userid, blendId);
            if (!data.success) {
                setMessage(data.message || "Failed to delete blend.");
                return;
            }
            // Remove deleted blend from loaded blends to update table
            // This is done here after a successful delete request to the backend to ensure the frontend state matches the backend data
            setLoadedBlends((prev) => prev.filter((b) => b.id !== blendId));

            setMessage("Blend deleted successfully!");
        } catch (err) {
            setMessage("Failed to delete blend.");
        }
    }

    // Taking a saved blend and adding it to the cart ---------------------------------------
    // Making sure that we create the payload, check userid, product stock,
    async function handleAddSavedBlendToCart(savedBlend) {
    setBlendLoading(true);
    setMessage("");
    try {
        let userid;
        for (let key of Object.keys(localStorage)){
            if (key.includes("idToken")){
                const idToken = localStorage.getItem(key)        
                const base64 = idToken.split(".")[1]
                const decoded = JSON.parse(atob(base64))
                userid = decoded.sub
                break
            };
        }
        if (!userid) {
            setMessage("User not found. Please log in again.");
            return;
        }

        // Pass existing blend ID directly — no new blend row created
        const cartRes = await createCartItemReq({
            customerid: userid,
            itemid: savedBlend.id,
            type: "blend",
        });

        if (cartRes.stockUnavailable) {
            setMessage(cartRes.message || "Not enough stock for this blend.");
            return;
        }
        if (!cartRes.success) {
            setMessage(cartRes.message || "Failed to add blend to cart.");
            return;
        }

        setMessage("Blend added to cart!");
    } catch (err) {
        console.error(err);
        setMessage("Failed to add blend to cart.");
    } finally {
        setBlendLoading(false);
    }
}

    // function to save user selected fragrances to profile ------------------------------------------
    async function saveFragranceToProfile() {
        let userid;
        for (let key of Object.keys(localStorage)) {
            if (key.includes("idToken")) {
                const idToken = localStorage.getItem(key);
                const base64 = idToken.split(".")[1];
                const decoded = JSON.parse(atob(base64));
                userid = decoded.sub;
                break;
            }
        }
        setMessage("");
        // update preferred notes sending the selectedNotes array with userId
        try {
            const data = await updatePreferredNotesReq(userid, selectedNotes);
            if (!data.success) {
                throw new Error(data.message);
            }
            setMessage("Preferred fragrances saved to profile!");
        } 
        catch (error) {
            setMessage(error.message || "Failed to save fragrance preferences.");
        }
    }


    // Function to load users saved favorite notes -------------------------
    // Will have them displayed on overview and favorite notes ta
    // Favorite notes tab will have buttons pressed because the array will be loaded
    async function loadUserInformation() {
        let userid;
        for (let key of Object.keys(localStorage)) {
            if (key.includes("idToken")) {
                const idToken = localStorage.getItem(key);
                const base64 = idToken.split(".")[1];
                const decoded = JSON.parse(atob(base64));
                userid = decoded.sub;
                break;
            }
        }
        try {
            const data = await getUserReq(userid);

            if (!data.success) {
                throw new Error(data.message);
            }

            const user = data.data.user;

            setfirstName(user.first_name || "Null");
            setlastName(user.last_name || "");
            setemailName(user.email || "Null");
            setCreatedAt(user.created_at || "Null");
    
            const notesString = user.favorite_notes || "";
            const notesArray = notesString ? notesString.split(",").map((note) => note.trim()).filter(Boolean) : [];

            setSelectedNotes(notesArray);
        } 
        catch (error) {
            console.error("Failed to load user profile:", error);
        }
    }

async function loadUserOrders() {
    let userid;
    for (let key of Object.keys(localStorage)) {
        if (key.includes("idToken")) {
            const idToken = localStorage.getItem(key);
            const base64 = idToken.split(".")[1];
            const decoded = JSON.parse(atob(base64));
            userid = decoded.sub;
            break;
        }
    }
    setMessage("");
    setOrdersLoading(true);
    try {
        const orders = await getUserOrdersReq(userid);
        if (!orders.success) {
            throw new Error(orders.message);
        }
        const parsedOrders = (orders.data.orders || []).map((order) => {
            let parsedItems = order.items;

            if (typeof parsedItems === "string") {
                try {
                    parsedItems = JSON.parse(parsedItems);
                } catch (err) {
                    console.error("Failed to parse order items:", err);
                    parsedItems = [];
                }
            }
            // creating new order object by ...order (spread operator) from original order (copying all original information) but updating the items with the parsedItems
            return {
                ...order,
                items: parsedItems || [],
            };
        });
        parsedOrders.sort((a, b) => new Date(b.created) - new Date(a.created));
        setUserOrders(parsedOrders);
    } 
    catch (error) {
        setMessage(error.message || "Error loading orders.");
    }
    finally {
        setOrdersLoading(false);
    }
}

    // Get product ID from product object, accounting for different possible key names ---------------------------
    function getProductId(product) {
        return product.productid || product.product_id || product.id;
    }

    // Grab the product name by using the ID ------------------------------------------
    function getProductNameById(productId) {
        // If no product id return empty string, this will happen if a blend does not have a third fragrance
        if (!productId) { 
            return "";
        }
        // Find the product in the products list that matches the id, accounting for different possible key names for the id in the product object
        const match = products.find((p) => String(getProductId(p)) === String(productId));
        return match?.name || "Unknown";
    }

    // Toggle Note -----------------------------------------------------------
    // Once note is toggled you take that note and add/remove it from selectedNotes array
    // Can toggle multiple notes
    // Toggles a note in selectedNotes
    const toggleNote = (note) => {
        setSelectedNotes((prev) => {
            if (prev.includes(note)) 
                return prev.filter((n) => n !== note);
            return [...prev, note];
        });
    };

    // If activeTab mixes will load blends --------------------------------------
    // Making sure to check length of products to begin the load
    useEffect(() => {
        if (activeTab === "mixes" && products.length > 0) {
            loadBlends();
        }
    }, [activeTab, products]);

    // Load products, favorite notes, and user orders on component mount ---------------------------------------
    useEffect(() => {
        loadProducts();
        loadUserInformation();
        loadUserOrders();

    }, []);

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
                }}>
                {/* TODO: Implementation of showing the users first name will be here
                    Make sure that I implement where if user name doesnt load properly 
                    just make it show different message that doesnt require name
                    */}
                <Text 
                    style={luxuryHeadingStyle}
                    marginTop="1rem">
                    Welcome {firstName || "Guest"}!
                </Text>
                <Flex
                    direction="row"
                    justifyContent="center"
                    gap="5rem"
                    marginTop="2rem"
                    >
                    {[
                    { key: "overview", label: "Overview" },
                    { key: "orders", label: "Orders" },
                    { key: "sfl", label: "Saved For Later" },
                    { key: "mixes", label: "Saved Mixes" },
                    { key: "preferences", label: "Favorite Notes" },].map((tab) => (
                    <Text
                        key={tab.key}
                        style={{
                            ...luxurySubheadingStyle,
                            borderBottom: activeTab === tab.key ? "2px solid black" : "2px solid transparent",
                            paddingBottom: "0.25rem",
                        }}
                        onClick={() => setActiveTab(tab.key)}>
                    {tab.label}
                    </Text>
                ))}
                </Flex>
                <View
                    marginTop="3rem"
                    padding="2rem"
                    maxWidth="1200px"
                    marginLeft="auto"
                    marginRight="auto"
                    style={{
                        backgroundColor: "#300a0a38",
                        borderRadius: "16px",
                        minHeight: "500px",
                    }}
                    >
                    {activeTab === "overview" && (
                        <View>
                            <Text style={luxuryHeadingStyle2} marginBottom="1rem">
                                Your Profile Overview
                            </Text> 
                            <Grid
                                templateColumns="repeat(2, 1fr)"
                                gap="1.5rem"
                            >
                                <View style={cardStyle}>
                                    <Text style={luxuryHeadingStyle2}>
                                        Account Information
                                    </Text>
                                    
                                    <Text style={luxurySubheadingStyle} textAlign={"left"}>
                                        Full Name: {firstName} {lastName} <br></br>
                                        Email: {email} <br></br>
                                        Member Since: {new Date(createdAt).toLocaleString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })} 
                                        <br></br>
                                        <Flex direction="row" gap="0.5rem" marginTop="1rem">
                                            <Button
                                                style={luxuryBodyStyle}>
                                                Edit Profile
                                            </Button>
                                        </Flex>
                                        
                                    </Text>
                                </View>
                                <View style={cardStyle}> 
                                    <Text style={luxuryHeadingStyle2}>
                                        Order Statistics
                                    </Text>
                                    <Text style={luxurySubheadingStyle} textAlign={"left"}>
                                        Total Orders: <br></br>
                                        Last Order Date: <br></br>
                                        Total Spent: 
                                    </Text>
                                </View>
                                <View style={cardStyle}>
                                    <Text style={luxuryHeadingStyle2}>
                                        Mixology Statistics
                                    </Text>
                                    <Text style={luxurySubheadingStyle} textAlign={"left"}>
                                        Saved Mixes: <br></br>
                                        Two Note Blends: <br></br>
                                        Three Note Blends: <br></br>
                                    </Text>
                                </View>
                                <View style={cardStyle}>
                                    <Text style={luxuryHeadingStyle2}>
                                        Favorite Notes:
                                    </Text>
                                    
                                    <Text style={luxurySubheadingStyle}>
                                        {selectedNotes.length > 0 ? selectedNotes.sort().join(", ") : "None saved yet"}<br></br>
                                    </Text>
                                </View>
                            </Grid>


                            

                            {/*  
                            <Text style={luxuryHeadingStyle2}>
                                Recommended for you
                                {/* Let this text links to recommended fragrances */}
                            {/* </Text> */}
                            
                        </View>
                    )}

                    {activeTab === "orders" && (
                        <View>
                            <Text style={luxurySubheadingStyle}>
                                Your Orders
                            </Text>
                            {ordersLoading ? (
                                <Text style={luxuryBodyStyle}>Loading orders...</Text>
                            ) 
                            : userOrders.length === 0 ? (
                                <Text style={luxuryBodyStyle}>No orders found yet.</Text>
                            ) 
                            : (
                                <View marginTop="1rem">
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell style={tableHeaderStyle}>Order ID</TableCell>
                                                <TableCell style={tableHeaderStyle}>Order Items</TableCell>
                                                <TableCell style={tableHeaderStyle}>Status</TableCell>
                                                <TableCell style={tableHeaderStyle}>Total</TableCell>
                                                <TableCell style={tableHeaderStyle}>Created</TableCell>
                                            </TableRow>
                                        </TableHead>

                                        {userOrders.map((order) => (
                                            <TableRow
                                                key={order.id}
                                                style={{
                                                    borderTop: "1px solid rgba(0, 0, 0, 0.15)"
                                                }}
                                            >
                                                <TableCell style={tableBodyStyle}>
                                                    {order.id.slice(0, 8)}
                                                </TableCell>
                                                <TableCell style={{...tableBodyStyle, textAlign: "left"}}>
                                                    <View
                                                        style={{marginLeft: "7rem"}}>
                                                        {Array.isArray(order.items) && order.items.length > 0 ? (
                                                            order.items.map((orderItem, index) => {
                                                                if (orderItem.type === "product") {
                                                                    return (
                                                                        <Text key={index} style={luxuryBodyStyle}>
                                                                            {orderItem.item.name || "Product"} x{orderItem.quantity}
                                                                        </Text>
                                                                    );
                                                                }
                                                                if (orderItem.type === "blend") {
                                                                    const blend = orderItem.item;
                                                                    return (
                                                                        <View key={index} marginBottom="0.5rem">
                                                                            <Text style={luxuryBodyStyle}>
                                                                                Custom Blend - {blend?.size_ml}ml x{orderItem.quantity}
                                                                            </Text>

                                                                            {blend.frag1_productid && (
                                                                                <Text style={luxuryBodyStyle}>
                                                                                    • {blend.frag1_pct}% {getProductNameById(blend.frag1_productid) || "Unknown Fragrance"}
                                                                                </Text>
                                                                            )}

                                                                            {blend.frag2_productid && (
                                                                                <Text style={luxuryBodyStyle}>
                                                                                    • {blend.frag2_pct}% {getProductNameById(blend.frag2_productid) || "Unknown Fragrance"}
                                                                                </Text>
                                                                            )}

                                                                            {blend.frag3_productid && (
                                                                                <Text style={luxuryBodyStyle}>
                                                                                    • {blend.frag3_pct}% {getProductNameById(blend.frag3_productid) || "Unknown Fragrance"}
                                                                                </Text>
                                                                            )}
                                                                        </View>
                                                                    );
                                                                }

                                                                return (
                                                                    <Text key={index} style={luxuryBodyStyle}>
                                                                        Unknown item
                                                                    </Text>
                                                                );
                                                            })
                                                        ) : (
                                                            <Text style={luxuryBodyStyle}>No items found</Text>
                                                        )}
                                                    </View>
                                                </TableCell>
                                                <TableCell style={tableBodyStyle}>
                                                    {order.status}
                                                </TableCell>
                                                <TableCell style={tableBodyStyle}>
                                                    ${order.total}
                                                </TableCell>
                                                <TableCell style={tableBodyStyle}>
                                                    {new Date(order.created).toLocaleString()}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </Table>
                                </View>
                            )}
                        </View>
                    )}

                    {activeTab === "sfl" && (
                        <View>
                            <Text style={luxurySubheadingStyle}>
                                Fragrances Saved For Later
                            </Text>
                        </View>
                    )}
                    
                    {activeTab === "mixes" && (
                        <View marginTop="1rem"  >
                            <Text 
                                style={luxurySubheadingStyle}>
                                Your Saved Blends
                            </Text>
                            {message && (
                            <Text
                                style={{
                                    ...luxuryBodyStyle,
                                    marginTop: "0.5rem",
                                    color: "#2B1E1A"
                                }}
                            >
                                {message}
                            </Text>)}
                            {/* If no blends are currently saved to users profile */}
                            {loadedBlends.length === 0 ? (
                                <Text style={luxuryBodyStyle}>
                                    No saved blends yet. Create one above and press “Save Fragrance”.
                                </Text>
                            ) : ( 
                                <View
                                    style={{
                                        backgroundColor: "#300a0a38",
                                        borderRadius: "14px",
                                    }}
                                >
                                <Table
                                    style={{             
                                    }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell style={tableHeaderStyle}>Fragrance 1</TableCell>
                                        <TableCell style={tableHeaderStyle}>Fragrance 2</TableCell>
                                        <TableCell style={tableHeaderStyle}>Fragrance 3</TableCell>
                                        <TableCell style={tableHeaderStyle}>Size</TableCell>
                                        <TableCell style={tableHeaderStyle}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                {loadedBlends.map((blend) => (
                                    <TableRow 
                                        key={blend.id}
                                        style={{
                                        borderTop: "1px solid rgba(0,0,0,0.15)"
                                    }}>
                                        <TableCell style={tableBodyStyle}>{getProductNameById(blend.frag1_productid)} ({blend.frag1_pct}%)</TableCell>
                                        <TableCell style={tableBodyStyle}>{getProductNameById(blend.frag2_productid)} ({blend.frag2_pct}%)</TableCell>
                                        <TableCell style={tableBodyStyle}>{getProductNameById(blend.frag3_productid)} ({blend.frag3_pct ? `${blend.frag3_pct}%` : "~"})</TableCell>
                                        <TableCell style={{...tableBodyStyle, whiteSpace: "nowrap" }}>{blend.size_ml} ML</TableCell>
                                        <TableCell style={tableBodyStyle}>
                                            <Flex direction="row" gap="0.2rem">
                                            <Button
                                                style={luxuryBodyStyle}
                                                onClick={() => handleAddSavedBlendToCart(blend)}>
                                                Add to Cart
                                            </Button>
                                            <Button
                                                style={luxuryBodyStyle}
                                                onClick={() => { 
                                                    handleDeleteBlend(blend.id);
                                                }}>
                                                Delete Blend
                                            </Button>
                                            </Flex>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                </Table>
                            </View>
                            )}
                        </View>
                    )}

                    {activeTab === "preferences" && (
                        <View>
                            <Text marginBottom="1.5rem"
                                style={luxurySubheadingStyle}>
                                Which notes are you drawn to?
                            </Text>

                            <Grid
                                templateColumns="repeat(3, 1fr)"
                                gap="0.3rem"
                                marginBottom=".5rem">
                                <ToggleButton isPressed={selectedNotes.includes("Almond")} onClick={() => toggleNote("Almond")}>Almond</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Amber")} onClick={() => toggleNote("Amber")}>Amber</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Benzoin")} onClick={() => toggleNote("Benzoin")}>Benzoin</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Bergamot")} onClick={() => toggleNote("Bergamot")}>Bergamot</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Cedarwood")} onClick={() => toggleNote("Cedarwood")}>Cedarwood</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Chocolate")} onClick={() => toggleNote("Chocolate")}>Chocolate</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Cinnamon")} onClick={() => toggleNote("Cinnamon")}>Cinnamon</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Clove")} onClick={() => toggleNote("Clove")}>Clove</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Coconut")} onClick={() => toggleNote("Coconut")}>Coconut</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Coffee")} onClick={() => toggleNote("Coffee")}>Coffee</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Eucalyptus")} onClick={() => toggleNote("Eucalyptus")}>Eucalyptus</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Fig")} onClick={() => toggleNote("Fig")}>Fig</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Gardenia")} onClick={() => toggleNote("Gardenia")}>Gardenia</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Ginger")} onClick={() => toggleNote("Ginger")}>Ginger</ToggleButton>   
                                <ToggleButton isPressed={selectedNotes.includes("Honey")} onClick={() => toggleNote("Honey")}>Honey</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Jasmine")} onClick={() => toggleNote("Jasmine")}>Jasmine</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Leather")} onClick={() => toggleNote("Leather")}>Leather</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Lemon")} onClick={() => toggleNote("Lemon")}>Lemon</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Mandarin")} onClick={() => toggleNote("Mandarin")}>Mandarin</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Mint")} onClick={() => toggleNote("Mint")}>Mint</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Musk")} onClick={() => toggleNote("Musk")}>Musk</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Oak")} onClick={() => toggleNote("Oak")}>Oak</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Oud")} onClick={() => toggleNote("Oud")}>Oud</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Patchouli")} onClick={() => toggleNote("Patchouli")}>Patchouli</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Peony")} onClick={() => toggleNote("Peony")}>Peony</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Pine")} onClick={() => toggleNote("Pine")}>Pine</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Rose")} onClick={() => toggleNote("Rose")}>Rose</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Saffron")} onClick={() => toggleNote("Saffron")}>Saffron</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Sandalwood")} onClick={() => toggleNote("Sandalwood")}>Sandalwood</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Suede")} onClick={() => toggleNote("Suede")}>Suede</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Tobacco")} onClick={() => toggleNote("Tobacco")}>Tobacco</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Vanilla")} onClick={() => toggleNote("Vanilla")}>Vanilla</ToggleButton>
                                <ToggleButton isPressed={selectedNotes.includes("Yuzu")} onClick={() => toggleNote("Yuzu")}>Yuzu</ToggleButton>  
                            </Grid>
                            {message && (
                            <Text
                                style={{
                                    ...luxuryBodyStyle,
                                    color: message === "Preferred fragrances saved to profile!" ? "#2d6a2d" : "#8B0000",
                                    textAlign: "center",
                                    marginTop: "1rem",
                                    marginBottom: "1rem",
                                    fontSize: "1.6rem"
                                }}>
                                {message}
                            </Text>
                            )}
                            <Button
                                style={luxuryBodyStyle}
                                onClick={saveFragranceToProfile}
                                >
                                 {/* onClick={() => saveFragrancesToProfile()}> */}
                                Save To Profile
                            </Button>
                        </View>
                    )}
                </View>
            </View>
        </>
    );
}