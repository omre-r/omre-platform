import Navbar from "../components/Navbar";
import { View, Flex, Text, Button, Grid, Table, TableRow, TableCell, TableHead, ToggleButton, TextField } from "@aws-amplify/ui-react";
import LuxuryBackground from "../assets/Luxury Background2.png";
import { fetchAuthSession } from "aws-amplify/auth";
import { useEffect, useState } from "react";
import { getUserSavedBlendsReq, getActiveProductsReq,deleteUserBlendReq, createCartItemReq, updatePreferredNotesReq, getUserReq, getUserOrdersReq, cancelOrderReq, getFilteredOrdersReq , getSavedItemsReq, deleteSavedItemReq, getBlendByIdReq, getProductReq} from "../requests.js";
import SearchIcon from "../assets/search_icon.png";
import CustomMixImage from "../assets/CustomMixImage.png";

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
    fontSize: "2rem",  
    fontWeight: 600,
    letterSpacing: "0.3px",
    backgroundColor: "transparent",
    border: "none",
    boxShadow: "none",
    outline: "none",
    color: "black",
};

const tableBodyStyle = {
    ...luxuryBodyStyle,
    fontSize: "1.5rem",  
    fontWeight: 500,
    letterSpacing: "0.2px",
    backgroundColor: "transparent",
    border: "none",
    boxShadow: "none",
    outline: "none",
    color: "#ffffff",
};

const cardStyle = {
    background: "linear-gradient(145deg,  #9a2424, rgba(20,20,20,0.9))",
    borderRadius: "14px",
    padding: "1.5rem",
    minHeight: "250px",
    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",
    backdropFilter: "blur(3px)",
    border: "1px solid rgba(255, 255, 255, 0.25)",
};

const tableViewStyle = {
    padding: "1.2rem 1.5rem",
    border: "1px solid rgba(255,255,255,0.35)",
    borderRadius: "14px",
    background: "linear-gradient(145deg,  #9a2424, rgba(20,20,20,0.9))",
    boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",     
    justifyContent: "center", 
    minHeight: "120px",
    height: "100%",          
    width: "100%",
    boxSizing: "border-box"
};

const buttonStyling = {
    ...luxuryBodyStyle, 
    fontSize: "1.2rem",
    padding: ".9rem .2rem",
    border: "2px solid rgba(0, 0, 0)",
    borderRadius: "10px",
    background: "linear-gradient(145deg,  #9a2424, rgba(20,20,20,0.9))",
    color: "#FFFFFF",
    cursor: "pointer",
    boxShadow: "0 6px 14px rgba(0,0,0,0.22)",
    transition: "all 0.2s ease",
}

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

    // Grabbing user order statistics --------------------------------------------
    const totalOrders = userOrders.length;
    const totalCanceledOrders = userOrders.filter((order) => order.status.toLowerCase() === "canceled").length;

    // Load user saved items ----------------------------------
    const [savedItems, setSavedItems] = useState([]);
    const [loadingSavedItems, setLoadingSavedItems] = useState(true);

    // If order was canceled we do not include it in the total spent 
    const totalSpent = userOrders.reduce((sum, order) => { 
        if (order.status.toLowerCase() === "canceled") return sum;
        return sum + Number(order.total || 0); 
    }, 0);

    const lastOrderDate = userOrders.length > 0 ? 
        new Date(userOrders[0].created).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
          }) : "No orders yet";

    // Grabbing user mix statistics ------------------------------------------------------
    const totalMixes = loadedBlends.length;
    const twoNoteBlends = loadedBlends.filter((blend) => !blend.frag3_productid).length;
    const threeNoteBlends = loadedBlends.filter((blend) => blend.frag3_productid).length;

    const [confirmCancelOrder, setConfirmCancelOrder] = useState(null);
    const [cancelReason, setCancelReason] = useState("");

    // Filter and search ------------------------------------------------------------------
    const [orderIdSearch, setOrderIdSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const fragranceNotes = [
        "Almond", "Amber", "Benzoin",
        "Bergamot", "Cedarwood", "Chocolate",
        "Cinnamon", "Clove", "Coconut",
        "Coffee", "Eucalyptus", "Fig",
        "Gardenia", "Ginger", "Honey",
        "Jasmine", "Leather", "Lemon",
        "Mandarin", "Mint", "Musk",
        "Oak", "Oud", "Patchouli",
        "Peony", "Pine", "Rose",
        "Saffron", "Sandalwood", "Suede",
        "Tobacco", "Vanilla", "Yuzu"
    ];

      async function getCustomerId() {
        try {
          const session = await fetchAuthSession();
          const idToken = session.tokens?.idToken?.toString();
          if (!idToken) return null;
    
          const payload = JSON.parse(atob(idToken.split(".")[1]));
          return payload.sub;
        } catch {
          return null;
        }
      }

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

    // Function to clear notes from user profile --------------------------------------------------------------------
    async function clearAllNotes() {
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
        try {
            // Clear the users selected notes with empty array
            const data = await updatePreferredNotesReq(userid, []);
            if (!data.success) {
                throw new Error(data.message);
            }
            setSelectedNotes([]);
            setMessage("Preferred fragrances cleared from profile!");
        } catch (error) {
            setMessage(error.message || "Failed to clear fragrance preferences.");
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

// load users saved items -------------------------------------------
async function loadSavedItems() {
const customerid = await getCustomerId();
    if (!customerid) {
    setLoadingSavedItems(false);
    return;
    }
    try {
    const response = await getSavedItemsReq(customerid);
    const savedItemRows = response?.data?.savedItems || [];
    if (!Array.isArray(savedItemRows) || savedItemRows.length === 0) {
        setSavedItems([]);
        return;
    }

    const fullSavedItems = await Promise.all(
    savedItemRows.map(async (row) => {
        let item;

        if (row.type === "blend") {
        const blendRes = await getBlendByIdReq(row.itemid);
        const blend = blendRes?.data?.data?.blend || blendRes?.data?.blend;
        if (!blend) {
            await deleteSavedItemReq(row.id);
            return null;
        }
        let price = 0;
        if (blend.size_ml === 30) price = 50;
        if (blend.size_ml === 50) price = 75;
        const frag1Res = await getProductReq(blend.frag1_productid);
        const frag2Res = await getProductReq(blend.frag2_productid);
        const frag1 = frag1Res?.data?.product;
        const frag2 = frag2Res?.data?.product;
        let frag3 = null;
        if (blend.frag3_productid) {
            const frag3Res = await getProductReq(blend.frag3_productid);
            frag3 = frag3Res?.data?.product;
        }
        if (
            !frag1 ||
            !frag2 ||
            frag1.ishidden ||
            frag2.ishidden ||
            (frag3 && frag3.ishidden)
        ) {
            await deleteSavedItemReq(row.id);
            return null;
        }
        const imageArray = frag1?.images || [];
        const name = `${frag1?.name || "Unknown"} ${blend.frag1_pct}% /
                        ${frag2?.name || "Unknown"} ${blend.frag2_pct}%${
                        frag3 ? ` / ${frag3.name} ${blend.frag3_pct}%` : ""
                        } Blend`
            .replace(/\s+/g, " ")
            .trim();
        item = {
            name,
            price,
            images: imageArray,
            size_ml: blend.size_ml,
        };

        } else {
        const productRes = await getProductReq(row.itemid);
        item = productRes?.data?.product;
        if (!item || item.ishidden) {
            await deleteSavedItemReq(row.id);
            return null;
        }
        }

        return { ...row, item };
    })
    );

    setSavedItems(fullSavedItems.filter(Boolean));
} catch (err) {
    console.error(err);
    setMessage("Failed to load saved items.");
} finally {
    setLoadingSavedItems(false);
}
}

// Remove a saved item -------------------------------------------
async function removeSavedItem(savedItem) {
    const deletedItem = await deleteSavedItemReq(savedItem.id)
    if (!deletedItem.success){
      setMessage(deletedItem.message);
      setTimeout(() => setMessage(""), 5000);
      return;
    }
    loadSavedItems();
  }

  // Add saved item to cart ----------------------------------
async function addToCart(savedItem) {
      const newCartItem = await createCartItemReq({
        customerid: savedItem.customerid,
        itemid: savedItem.itemid,
        type: savedItem.type
      });
      if (!newCartItem.success){
        setMessage(newCartItem.message);
        setTimeout(() => setMessage(""), 5000);
        return;
      }
      loadCart();
    }

// Cancel Order 
async function cancelOrder(orderId, reason) {
    try {
        const data = await cancelOrderReq(orderId, reason);

        if (!data.success) {
            setMessage(data.message || "Error cancelling order.");
            return;
        }

        await loadUserOrders();
        setMessage("Order cancelled successfully.");
    } 
    catch (error) {
        setMessage(error.message || "Error cancelling order.");
    }
}

    // Get product ID from product object, accounting for different possible key names ---------------------------
    function getProductId(product) {
        return product.productid || product.product_id || product.id;
    }

    // Grab the product name by using the ID ------------------------------------------
    // Remove the inspired by text splitting the string
    function getProductNameById(productId) {
        if (!productId) {
            return "";
        }
                // Find the product in the products list that matches the id, accounting for different possible key names for the id in the product object
        const match = products.find((p) => String(getProductId(p)) === String(productId));
        // clean product name removing the inspired by stuff
        return match?.name;
    }

    // Function to get style for each button based on if a note is selected or not -----------------------------------------
    function getNoteButtonStyle(note) {
        const isSelected = selectedNotes.includes(note);
        return {
            ...luxuryBodyStyle,
            fontSize: "1.15rem",
            padding: "0.5rem .1rem",
            minHeight: "auto",
            width: "100%",
            borderRadius: "10px",
            border: isSelected ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(0,0,0,0.12)",
            background: isSelected ? "linear-gradient(145deg,  #9a2424, rgba(20,20,20,0.9))" : "linear-gradient(145deg,  #FDDDBE, #f9dad2)",
            boxShadow: isSelected ? "0 8px 18px rgba(0,0,0,0.25)" : "0 2px 6px rgba(0,0,0,0.06)",
        };
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

    const statusStyles = {
        pending: "#ff6117",
        mixing: "#d3006d",
        ready: "#028fb2",
        fulfilled: "#009e59",
        canceled: "#e22424",
    };

    // Load products, favorite notes, and user orders on component mount ---------------------------------------
    useEffect(() => {
        loadProducts();
        loadUserInformation();
        loadUserOrders();
        loadBlends();
        loadSavedItems();
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
                    {/* Ability to switch between tabs of the page to access different user information ------------------------------ */}
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
                    maxWidth="1400px"
                    marginLeft="auto"
                    marginRight="auto"
                    style={{
                        background: "linear-gradient(145deg,  #480e0e76, rgba(20, 20, 20, 0.05))",
                        borderRadius: "14px",
                        minHeight: "500px",
                    }}
                    >   
                    {/* User overview tab ---------------------------------------------------------
                    Shows users specific profile information */}
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
                                    <Text style={{...luxuryHeadingStyle2, color:"#FFFFFF"}}>
                                        Account Information
                                    </Text>
                                    
                                    <Text style={{...luxurySubheadingStyle, color:"#FFFFFF"}} textAlign={"left"}>
                                        Full Name: {firstName} {lastName} <br></br>
                                        Email: {email} <br></br>
                                        Member Since: {new Date(createdAt).toLocaleString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })} 
                                        <br></br>
                                    </Text>
                                </View>
                                <View style={cardStyle}> 
                                    <Text style={{...luxuryHeadingStyle2, color:"#FFFFFF"}}>
                                        Order Statistics
                                    </Text>
                                    <Text style={{...luxurySubheadingStyle, color:"#FFFFFF"}} textAlign={"left"}>
                                        Total Orders: {totalOrders} <br></br>
                                        Total Canceled Orders: {totalCanceledOrders} <br></br>
                                        Last Order Date: {lastOrderDate}  <br></br>
                                        Total Spent: ${totalSpent.toFixed(2)}
                                    </Text>
                                </View>
                                <View style={cardStyle}>
                                    <Text style={{...luxuryHeadingStyle2, color:"#FFFFFF"}}>
                                        Mixology Statistics
                                    </Text>
                                    <Text style={{...luxurySubheadingStyle, color:"#FFFFFF"}} textAlign={"left"}>
                                        Saved Mixes: {totalMixes}<br></br>
                                        Two Note Blends: {twoNoteBlends} <br></br>
                                        Three Note Blends: {threeNoteBlends} <br></br>
                                    </Text>
                                </View>
                                <View style={cardStyle}>
                                    <Text style={{...luxuryHeadingStyle2, color:"#FFFFFF"}}>
                                        Favorite Notes:
                                    </Text>
                                    
                                    <Text style={{...luxurySubheadingStyle, color:"#FFFFFF"}}>
                                        {selectedNotes.length > 0 ? selectedNotes.sort().join(", ") : "None saved yet"}<br></br>
                                    </Text>
                                </View>
                            </Grid>                    
                        </View>
                    )}
                    {/* Users order tab ----------------------------------------- */}
                    {/* Displays information on previous orders of user and grants ability to user to cancel orders */}
                    {/* Displays images of products within orders */}
                    {activeTab === "orders" && (
                        <View>
                            <Flex
                                marginTop="1.25rem"
                                justifyContent="center"
                                alignItems="center"
                                gap="1rem">
                                {/* Ability to search by order id within orders ----------------------------------- */}
                                <View position={"relative"}>
                                    <input
                                        type="text"
                                        value={orderIdSearch}
                                        onChange={(e) => setOrderIdSearch(e.target.value)}
                                        onKeyDown={async (e) => {
                                            if (e.key !== "Enter") return;
                                            const res = await getFilteredOrdersReq({ id: orderIdSearch });
                                            const sortedOrders = [...(res.data.orders || [])].sort((a, b) => new Date(b.created) - new Date(a.created));
                                            setUserOrders(sortedOrders);
                                        }}
                                        style={{
                                            width: "300px",
                                            height: "50px",
                                            paddingLeft: "18px",
                                            paddingRight: "42px",
                                            borderRadius: "8px",
                                            border: "2px solid rgba(0, 0, 0)",
                                            background: "linear-gradient(145deg,  #9a2424, rgba(20,20,20,0.9))",
                                            color: "#FFFFFF",
                                            caretColor: "#FFFFFF",
                                            fontFamily: "'Cormorant Garamond', serif",
                                            fontSize: "1.3rem",
                                            outline: "none",
                                            boxSizing: "border-box",
                                        }}
                                    />

                                    {!orderIdSearch && (
                                        <Text
                                            style={{
                                                position: "absolute",
                                                left: "18px",
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                color: "white",
                                                pointerEvents: "none",
                                                fontFamily: "'Cormorant Garamond', serif",
                                                fontSize: "1.3rem",
                                            }}
                                        >
                                            Search by order id...
                                        </Text>
                                    )}
                                    {/* Ability to filter orders by status ----------------------------------- */}
                                    <section
                                        style={{
                                            display: "flex",
                                            width: "30px",
                                            paddingRight: "5px",
                                            overflow: "hidden",
                                            position: "absolute",
                                            right: "0",
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            cursor: "pointer",
                                        }}
                                        onClick={async () => {
                                            const res = await getFilteredOrdersReq({ id: orderIdSearch });
                                            const sortedOrders = [...(res.data.orders || [])].sort((a, b) => new Date(b.created) - new Date(a.created));
                                            setUserOrders(sortedOrders);
                                        }}
                                    >
                                        <img
                                            src={SearchIcon}
                                            alt="search"
                                            style={{
                                                width: "20px",
                                                height: "20px",
                                                filter: "brightness(0) invert(1)",
                                            }}
                                        />
                                    </section>
                                </View>
                                <View position="relative">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    style={{
                                        ...luxuryBodyStyle, 
                                        fontSize: "1.2rem",
                                        padding: "0.7rem 1.2rem",
                                        border: "2px solid rgba(0, 0, 0)",
                                        borderRadius: "10px",
                                        background: "linear-gradient(145deg,  #9a2424, rgba(20,20,20,0.9))",
                                        color: "#FFFFFF",
                                        cursor: "pointer",
                                        boxShadow: "0 6px 14px rgba(0,0,0,0.22)",
                                        transition: "all 0.2s ease",
                                        outline: "none",
                                    }}
                                >
                                    <option value="all" style={{ backgroundColor: "#9a2424", color: "#FFFFFF" }}>All Statuses</option>
                                    <option value="pending" style={{ backgroundColor: "#9a2424", color: "#FFFFFF" }}>Pending</option>
                                    <option value="mixing" style={{ backgroundColor: "#9a2424", color: "#FFFFFF" }}>Mixing</option>
                                    <option value="ready" style={{ backgroundColor: "#9a2424", color: "#FFFFFF" }}>Ready</option>
                                    <option value="fulfilled" style={{ backgroundColor: "#9a2424", color: "#FFFFFF" }}>Fulfilled</option>
                                    <option value="canceled" style={{ backgroundColor: "#9a2424", color: "#FFFFFF" }}>Canceled</option>
                                </select>
                            </View>
                            </Flex>
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
                                                <TableCell style={tableHeaderStyle}>Your Order Information</TableCell>
                                            </TableRow>
                                        </TableHead>

                                        {/* Listing order information in multiple rows --------------------------------------------- */}
                                        {userOrders.filter((order) => statusFilter === "all" ? true : order.status?.toLowerCase() === statusFilter).map((order) => {
                                            const status = order.status.toLowerCase();
                                            const canCancel = ["pending", "mixing"].includes(status);

                                            return (
                                            <TableRow
                                                key={order.id}
                                                style={{
                                                    borderTop: "1px solid rgba(0, 0, 0, 0.15)"
                                                }}>
                                                <TableCell style={{...tableBodyStyle, textAlign: "left"}}>
                                                    <View
                                                        style={{
                                                            ...tableViewStyle,
                                                            marginLeft: "0rem",
                                                            alignItems: "flex-start",
                                                            justifyContent: "flex-start",
                                                            textAlign: "left",
                                                            width: "70%",
                                                            margin: "0 auto"
                                                        }}>
                                                        <View>
                                                            Order ID: #{order.id.slice(0, 8)} <br></br>
                                                            Order Total: ${order.total}<br></br>
                                                            Order Date: {new Date(order.created).toLocaleString()} <br></br>
                                                            Order Items: 
                                                        </View>
                                                        {Array.isArray(order.items) && order.items.length > 0 ? (
                                                            <Flex
                                                            direction="row"
                                                            wrap="wrap"
                                                            gap="1rem"
                                                            marginTop="0.75rem"
                                                            marginBottom="0.75rem"
                                                            >
                                                            {order.items.map((orderItem, index) => {
                                                                if (orderItem.type === "product") {
                                                                return (
                                                                    <View
                                                                        key={index}
                                                                        style={{
                                                                            width: "220px",
                                                                            padding: "0.9rem",
                                                                            borderRadius: "16px",
                                                                            background: "rgba(255,255,255,0.06)",
                                                                            border: "1px solid rgba(255,255,255,0.15)",
                                                                            boxShadow: "0 4px 10px rgba(0,0,0,0.18)",
                                                                            textAlign: "left",
                                                                        }}
                                                                    >
                                                                        {orderItem.item.images?.[0] && (
                                                                            <View
                                                                                style={{
                                                                                    borderRadius: "14px",
                                                                                    overflow: "hidden",
                                                                                    border: "2px solid rgba(0,0,0,0.55)",
                                                                                    marginBottom: "0.75rem",
                                                                                }}
                                                                            >
                                                                                <img
                                                                                    src={orderItem.item.images[0]}
                                                                                    alt={orderItem.item.name}
                                                                                    style={{
                                                                                        width: "100%",
                                                                                        height: "170px",
                                                                                        objectFit: "cover",
                                                                                        display: "block",
                                                                                    }}
                                                                                />
                                                                            </View>
                                                                        )}

                                                                        <Text style={{ ...luxuryBodyStyle, color: "#FFFFFF", fontSize: "1.3rem" }}>
                                                                            ✦ {orderItem.item.name} <br />
                                                                            Size: {orderItem.item.variation} <br />
                                                                            Quantity: x{orderItem.quantity}
                                                                        </Text>
                                                                    </View>
                                                                );
                                                            }
                                                                if (orderItem.type === "blend") {
                                                                    const blend = orderItem.item;
                                                                    return (
                                                                    <View
                                                                        key={index}
                                                                        style={{
                                                                            width: "220px",
                                                                            padding: "0.9rem",
                                                                            borderRadius: "16px",
                                                                            background: "rgba(255,255,255,0.06)",
                                                                            border: "1px solid rgba(255,255,255,0.15)",
                                                                            boxShadow: "0 4px 10px rgba(0,0,0,0.18)",
                                                                            textAlign: "left",
                                                                        }}
                                                                    >
                                                                        <View
                                                                            style={{
                                                                                borderRadius: "14px",
                                                                                overflow: "hidden",
                                                                                border: "2px solid rgba(0,0,0,0.55)",
                                                                                marginBottom: "0.75rem",
                                                                            }}
                                                                        >
                                                                            <img
                                                                                src={CustomMixImage}
                                                                                alt="Custom Mix"
                                                                                style={{
                                                                                    width: "100%",
                                                                                    height: "170px",
                                                                                    objectFit: "cover",
                                                                                    display: "block",
                                                                                }}
                                                                            />
                                                                        </View>

                                                                        <Text style={{ ...luxuryBodyStyle, color: "#FFFFFF", fontSize: "1.3rem" }}>
                                                                            ✦ Custom Mix <br />
                                                                        </Text>
                                                                        <View style={{ marginTop: "0.35rem" }}>
                                                                            {blend.frag1_productid && (
                                                                                <Text style={{ ...luxuryBodyStyle, color: "#FFFFFF", fontSize: "1.05rem" }}>
                                                                                    ▸ {blend.frag1_pct}% {getProductNameById(blend.frag1_productid) || "Unknown Fragrance"}
                                                                                </Text>
                                                                            )}

                                                                            {blend.frag2_productid && (
                                                                                <Text style={{ ...luxuryBodyStyle, color: "#FFFFFF", fontSize: "1.05rem" }}>
                                                                                    ▸ {blend.frag2_pct}% {getProductNameById(blend.frag2_productid) || "Unknown Fragrance"}
                                                                                </Text>
                                                                            )}

                                                                            {blend.frag3_productid && (
                                                                                <Text style={{ ...luxuryBodyStyle, color: "#FFFFFF", fontSize: "1.05rem" }}>
                                                                                    ▸ {blend.frag3_pct}% {getProductNameById(blend.frag3_productid) || "Unknown Fragrance"}
                                                                                </Text>
                                                                            )}
                                                                        </View>
                                                                        <Text style={{ ...luxuryBodyStyle, color: "#FFFFFF", fontSize: "1.3rem" }}>
                                                                            Size: {blend?.size_ml}ml <br />
                                                                            Quantity: x{orderItem.quantity}
                                                                        </Text>
                                                                    </View>
                                                                );
                                                            }
                                                                return (
                                                                    <Text key={index} style={{...luxuryBodyStyle, color:"#FFFFFF"}}>
                                                                        Unknown item
                                                                    </Text>
                                                                );
                                                            })}
                                                            </Flex>
                                                        ) : (
                                                            <Text style={luxuryBodyStyle}>No items found</Text>
                                                        )}
                                                        <Text style={{ color: "#FFFFFF" }}>Current Status: </Text>
                                                        <Flex
                                                            justifyContent="space-between"
                                                            alignItems="center"
                                                            marginTop="1rem"
                                                            width="100%"
                                                        >
                                                            <View style={{
                                                                ...buttonStyling,
                                                                cursor: "default",
                                                                background: "linear-gradient(145deg, #341111c6, rgba(20, 20, 20, 0.71))",
                                                                border: `2px solid ${statusStyles[order.status.toLowerCase()] || "black"}`,
                                                                fontWeight: 600,
                                                                fontSize: "1.5rem",   
                                                                textShadow: "0px 0px 3px #000000",
                                                                padding: ".9rem 3rem",
                                                                color: statusStyles[order.status.toLowerCase()] || "black",
                                                                }}>
                                                                {order.status}
                                                            </View>
                                                            <View 
                                                                isDisabled={canCancel}
                                                                style={{
                                                                    ...buttonStyling, 
                                                                    border: !canCancel ? "2px solid #808080" : "2px solid #8f0000",
                                                                    cursor: "pointer", 
                                                                    
                                                                    padding: "1rem 1rem",
                                                                    background: !canCancel ? "linear-gradient(145deg, #9f9f9f, rgba(20,20,20,0.92))" : "linear-gradient(145deg, #e22424, rgba(20,20,20,0.92))",
                                                                }}
                                                                onClick={() => { 
                                                                    if (canCancel) {
                                                                        setConfirmCancelOrder(order.id);
                                                                    }
                                                                }}>
                                                                <Text style={{
                                                                    ...luxuryBodyStyle, 
                                                                    color: "#ffffff", 
                                                                    fontSize: "1.5rem",  
                                                                    fontWeight: 500,
                                                                }}>
                                                                    {!canCancel ? "Unavailable" : "Cancel Order"}
                                                                </Text>
                                                            </View>
                                                        </Flex>
                                                    </View>
                                                </TableCell>                    
                                            </TableRow>
                                            );
                                        })}
                                    </Table>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Tab to access fragrances a user saves for later ---------------------------------------------------- */}
                    {activeTab === "sfl" && (
                        <View>
                            <Text style={luxuryHeadingStyle2} marginBottom="1.5rem">
                                Fragrances Saved For Later
                            </Text>
                            <View
                                style={{
                                    width: "100%",
                                    borderTop: "1px solid rgba(0,0,0,0.15)",
                                    marginBottom: "1.5rem",
                                }}
                            />
                            <View
                                    minWidth={"500px"}
                                    maxWidth={"120%"}
                                    margin={"auto"}>
                                      {savedItems.length === 0 && (
                                        <Text style={{...luxuryHeadingStyle2, marginTop: "2rem"}}>
                                            No items saved
                                        </Text>
                                      )}
                                    {savedItems.map((savedItem) => (
                                        <View
                                            key={savedItem.id}
                                            style={{
                                            ...tableViewStyle,
                                            margin: "0 auto 1.5rem auto",
                                            width: "35%",
                                            textAlign: "left",
                                            alignItems: "flex-start",
                                            justifyContent: "flex-start",
                                            minHeight: "unset",
                                            padding: "1.8rem",
                                            }}
                                        >
                                            <View width="100%">
                                            <Flex
                                                direction="column"
                                                alignItems="flex-start"
                                                gap="1.2rem"
                                            >
                                                {savedItem.item?.images?.[0] && (
                                                <View
                                                    style={{
                                                    width: "300px",
                                                    padding: "0.9rem",
                                                    borderRadius: "16px",
                                                    background: "rgba(255,255,255,0.06)",
                                                    border: "1px solid rgba(255,255,255,0.15)",
                                                    boxShadow: "0 4px 10px rgba(0,0,0,0.18)",
                                                    alignSelf: "center",
                                                    }}
                                                >
                                                    <View
                                                    style={{
                                                        borderRadius: "14px",
                                                        overflow: "hidden",
                                                        border: "2px solid rgba(0,0,0,0.55)",
                                                    }}
                                                    >
                                                    <img
                                                        src={savedItem.item.images[0]}
                                                        alt={savedItem.item.name}
                                                        style={{
                                                        width: "100%",
                                                        height: "260px",
                                                        objectFit: "cover",
                                                        display: "block",
                                                        }}
                                                    />
                                                    </View>

                                                    <View style={{ marginTop: "0.9rem" }}>
                                                    <Text style={{ ...luxuryBodyStyle, color: "#FFFFFF", fontSize: "1.5rem" }}>
                                                        ✦ {savedItem.item?.name}
                                                    </Text>

                                                    <Text style={{ ...luxuryBodyStyle, color: "#FFFFFF", fontSize: "1.25rem", marginTop: "0.2rem" }}>
                                                        {savedItem.item?.variation
                                                        ? `Size: ${savedItem.item.variation}`
                                                        : savedItem.item?.size_ml
                                                        ? `Size: ${savedItem.item.size_ml} mL`
                                                        : ""}
                                                    </Text>

                                                    <Text style={{ ...luxuryBodyStyle, color: "#FFFFFF", fontSize: "1.35rem", marginTop: "0.3rem" }}>
                                                        Price: ${savedItem.item.price}
                                                    </Text>
                                                    </View>
                                                </View>
                                                )}

                                                <Flex
                                                direction="row"
                                                gap="2rem"
                                                justifyContent="center"
                                                alignItems="center"
                                                width="100%"
                                                marginTop="0.8rem"
                                                >
                                                <View
                                                    style={{
                                                    ...buttonStyling,
                                                    border: "2px solid #8f0000",
                                                    cursor: "pointer",
                                                    padding: ".5rem 1rem",
                                                    background: "linear-gradient(145deg, #e22424, rgba(20,20,20,0.92))",
                                                    }}
                                                    onClick={() => removeSavedItem(savedItem)}
                                                >
                                                    <Text
                                                    style={{
                                                        ...luxuryBodyStyle,
                                                        color: "#ffffff",
                                                        fontSize: "1.5rem",
                                                        fontWeight: 500,
                                                    }}
                                                    >
                                                    Remove Item
                                                    </Text>
                                                </View>

                                                <View
                                                    style={{
                                                    ...buttonStyling,
                                                    border: "2px solid #000000",
                                                    cursor: "pointer",
                                                    background: "linear-gradient(145deg, #00ff91, rgba(40, 35, 35, 0.82))",
                                                    padding: ".5rem 1rem",
                                                    }}
                                                    onClick={() => addToCart(savedItem)}
                                                >
                                                    <Text
                                                    style={{
                                                        ...luxuryBodyStyle,
                                                        color: "#ffffff",
                                                        fontSize: "1.5rem",
                                                        fontWeight: 500,
                                                    }}
                                                    >
                                                    Add to Cart
                                                    </Text>
                                                </View>
                                                </Flex>
                                            </Flex>
                                            </View>
                                        </View>
                                        ))}
                                    </View>
                            </View>
                        )}
                    
                    {/* Tab to access a users saved mixes from mixology ---------------------------------------------------- */}
                    {activeTab === "mixes" && (
                        <View marginTop="1rem"  >
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

                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell style={tableHeaderStyle}>Your Saved Blends</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    {loadedBlends.map((blend) => (
                                        <TableRow 
                                            key={blend.id}
                                            style={{
                                            borderTop: "1px solid rgba(0,0,0,0.15)"
                                        }}>
                                            <TableCell style={tableBodyStyle}>
                                                <View  
                                                    style={{
                                                        ...tableViewStyle,
                                                        margin: "0 auto",
                                                        width: "55%",
                                                        textAlign: "left",
                                                        alignItems: "flex-start",
                                                        justifyContent: "flex-start",
                                                        minHeight: "unset",
                                                        padding: "1.8rem",
                                                    }}>
                                                    <View width="100%">
                                                        <View marginBottom="2rem">
                                                            <Flex
                                                                direction="row"
                                                                gap="1rem"
                                                                justifyContent="flex-start"
                                                                alignItems="stretch"
                                                                wrap="wrap"
                                                                marginBottom="1.25rem"
                                                            >
                                                                {/* Building a list of the fragrances by productID and percetange ------------------------------------------ */}
                                                                {[
                                                                    {
                                                                        productId: blend.frag1_productid,
                                                                        pct: blend.frag1_pct,
                                                                    },
                                                                    {
                                                                        productId: blend.frag2_productid,
                                                                        pct: blend.frag2_pct,
                                                                    },
                                                                    // if fragrance 3 exists then add it to the array otherwise skip it
                                                                    ...(blend.frag3_productid
                                                                        ? [
                                                                            {
                                                                                productId: blend.frag3_productid,
                                                                                pct: blend.frag3_pct,
                                                                            },
                                                                        ]
                                                                        : []),
                                                                ].map((frag, index) => { // Then we loop through every item of our previously created array
                                                                    const matchedProduct = products.find(
                                                                        // Look through products array to find matching product id to get the fragrance name and image for each fragrance in the blend
                                                                        (p) => String(getProductId(p)) === String(frag.productId)
                                                                    );
                                                                    if (!matchedProduct) return null;
                                                                    return (
                                                                        <View
                                                                            key={index}
                                                                            style={{
                                                                                width: "200px",
                                                                                padding: "1rem",
                                                                                borderRadius: "16px",
                                                                                background: "rgba(255,255,255,0.06)",
                                                                                border: "1px solid rgba(255,255,255,0.15)",
                                                                                boxShadow: "0 4px 10px rgba(0,0,0,0.18)",
                                                                                textAlign: "left",
                                                                            }}
                                                                        >
                                                                            {matchedProduct.images?.[0] && (
                                                                                <View
                                                                                    style={{
                                                                                        borderRadius: "14px",
                                                                                        overflow: "hidden",
                                                                                        border: "2px solid rgba(0,0,0,0.55)",
                                                                                        marginBottom: "0.75rem",
                                                                                    }}
                                                                                >
                                                                                    <img
                                                                                        src={matchedProduct.images[0]}
                                                                                        alt={matchedProduct.name}
                                                                                        style={{
                                                                                            width: "120%",
                                                                                            height: "160px",
                                                                                            objectFit: "cover",
                                                                                            display: "block",
                                                                                        }}
                                                                                    />
                                                                                </View>
                                                                            )}

                                                                            <Text
                                                                                style={{
                                                                                    ...luxuryBodyStyle,
                                                                                    color: "#FFFFFF",
                                                                                    fontSize: "1.2rem",
                                                                                    lineHeight: "1.35",
                                                                                }}
                                                                            >
                                                                                ✦ {matchedProduct.name}
                                                                            </Text>

                                                                            <Text
                                                                                style={{
                                                                                    ...luxuryBodyStyle,
                                                                                    color: "#FFFFFF",
                                                                                    fontSize: "1.2rem",
                                                                                    marginTop: "0.2rem",
                                                                                }}
                                                                            >
                                                                                Percentage: {frag.pct}%
                                                                            </Text>
                                                                        </View>
                                                                    );
                                                                })}
                                                            </Flex>

                                                            <Text
                                                                style={{
                                                                    ...luxuryBodyStyle,
                                                                    color: "#FFFFFF",
                                                                    fontSize: "1.5rem",
                                                                }}
                                                            >
                                                                Size: {blend.size_ml}ml
                                                            </Text>
                                                        </View>
                                                    </View>
                                                    {/* Ability to add blend to cart or delete from profile -------------------------------------------------- */}
                                                    <Flex 
                                                        direction="row" 
                                                        gap="2rem"
                                                        justifyContent="center"
                                                        alignItems="center"
                                                        width="100%">
                                                            <View 
                                                                style={{
                                                                        ...buttonStyling, 
                                                                        border: "2px solid #000000",
                                                                        cursor: "pointer", 
                                                                        background: "linear-gradient(145deg, #00ff91, rgba(40, 35, 35, 0.82))",
                                                                        padding: ".5rem 1rem",
                                                                    }}
                                                                onClick={() => handleAddSavedBlendToCart(blend)}>
                                                                <Text 
                                                                    style={{
                                                                        ...luxuryBodyStyle, 
                                                                        color: "#ffffff", 
                                                                        fontSize: "1.5rem",  
                                                                        fontWeight: 500,
                                                                    }}>
                                                                    Add to Cart
                                                                </Text>
                                                            </View>
                                                            <View 
                                                                style={{
                                                                    ...buttonStyling, 
                                                                    border: "2px solid #8f0000",
                                                                    cursor: "pointer", 
                                                                    padding: ".5rem 1rem",
                                                                    background: "linear-gradient(145deg, #e22424, rgba(20,20,20,0.92))",
                                                                }}
                                                                onClick={() => { handleDeleteBlend(blend.id); }}>
                                                                <Text 
                                                                    style={{
                                                                        ...luxuryBodyStyle, 
                                                                        color: "#ffffff", 
                                                                        fontSize: "1.5rem",  
                                                                        fontWeight: 500,
                                                                    }}>
                                                                    Delete Blend
                                                                </Text>
                                                            </View>
                                                        </Flex>
                                                </View>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    </Table>
                            )}
                        </View>
                    )}
                    {/* Tab so user can update preferences for their profile ---------------------------------------------------- */}
                    {activeTab === "preferences" && (
                        <View>
                            <Text 
                                marginBottom=".3rem"
                                style={luxuryHeadingStyle2}>
                                Which notes are you drawn to?
                            </Text>
                            <Text 
                                style={luxurySubheadingStyle}
                                marginBottom="1rem"
                            >
                                Select the fragrance notes that best match your taste. <br></br> 
                                These preferences help personalize your Omré experience. 
                            </Text>

                            <Grid
                                templateColumns="repeat(3, 1fr)"
                                gap="0.4rem"
                                marginBottom=".5rem"
                                maxWidth="800px"
                                margin="0 auto">
                                {/* List the notes from the state and show them all as toggable buttons */}
                                {fragranceNotes.map((note) => {
                                    const isSelected = selectedNotes.includes(note);
                                    return (
                                        <ToggleButton
                                            key={note}
                                            isPressed={isSelected}
                                            onClick={() => toggleNote(note)}
                                            style={getNoteButtonStyle(note)}
                                        >
                                            <Text
                                                style={{
                                                    ...luxuryBodyStyle,
                                                    // Font color change based on isSelected
                                                    color: isSelected ? "#F8F4F0" : "#1F1A17",
                                                    fontSize: "1.15rem",
                                                }}
                                            >
                                                {note}
                                            </Text>
                                        </ToggleButton>
                                    );
                                })}
                            </Grid>
                            <Flex 
                                direction="row"
                                justifyContent="center"
                                gap="1.5rem"
                                marginTop="2rem">
                                <Button
                                    style={{
                                        padding: "0.9rem 2.2rem",
                                        border: "1px solid rgba(255,255,255,0.35)",
                                        borderRadius: "28px",
                                        background: "linear-gradient(145deg,  #9a2424, rgba(20,20,20,0.9))",
                                        boxShadow: "0 8px 18px rgba(0,0,0,0.35)",
                                        transition: "all 0.2s ease",
                                    }}
                                    onClick={saveFragranceToProfile}>
                                    <Text style={{...luxuryBodyStyle, color: "#FFFFFF"}}>Save To Profile</Text>
                                </Button>
                                <Button
                                    style={{
                                        padding: "0.9rem 2.2rem",
                                        border: "1px solid rgba(255,255,255,0.35)",
                                        borderRadius: "28px",
                                        background: "linear-gradient(145deg,  #9a2424, rgba(20,20,20,0.9))",
                                        cursor: "pointer",
                                        boxShadow: "0 8px 18px rgba(0,0,0,0.35)",
                                        transition: "all 0.2s ease",
                                    }}
                                    onClick={clearAllNotes}>
                                    <Text style={{...luxuryBodyStyle, color: "#FFFFFF"}}>Clear All</Text>
                                </Button>
                            </Flex>
                            {message && (
                            <Text
                                style={{
                                    ...luxuryBodyStyle,
                                    color: message === "Preferred fragrances saved to profile!" || message === "Preferred fragrances cleared from profile!" ? "#2d6a2d" : "#8B0000",
                                    textAlign: "center",
                                    marginTop: "1rem",
                                    marginBottom: "1rem",
                                    fontSize: "1.6rem"
                                }}>
                                {message}
                            </Text>
                            )}
                        </View>
                    )}
                    {/* Cancel order confirmation for orders ------------------------------------------ */}
                    {/* This pop-up appears when the user wants to cancel an order and appears above everything */}
                    {confirmCancelOrder && (
                        <View
                            style={{
                                position: "fixed",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                // making the background translucent and darker when the box pops up
                                backgroundColor: "rgba(0,0,0,0.6)",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                zIndex: 1000,
                            }}
                        >
                            <View
                                style={{
                                    background: "linear-gradient(145deg,  #480e0ee0, rgb(20, 20, 20))",
                                    padding: "50px",
                                    borderRadius: "24px",
                                    width: "400px",
                                    textAlign: "center",
                                }}
                            >
                                <Text style={{ ...luxuryHeadingStyle2, color: "White" }}>
                                    Cancel Order?
                                </Text>
                                <Text style={{ ...luxuryBodyStyle, marginTop: "10px", color: "White", fontSize: "1.2rem" }}>
                                    Are you sure you want to cancel this order?
                                </Text>
                                {/* User must enter a cancellation reason for an order, if not button will be grayed out to submit */}
                                <TextField
                                    value={cancelReason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    placeholder="Provide a cancellation reason."
                                    style={{
                                        ...luxuryBodyStyle,
                                        width: "100%",
                                        minHeight: "90px",
                                        marginTop: "18px",
                                        padding: "10px",
                                        borderRadius: "12px",
                                        border: "2px solid rgba(255,255,255,0.2)",
                                        background: "rgba(255,255,255,0.08)",
                                        color: "#FFFFFF",
                                        fontSize: "1.2rem",
                                        boxSizing: "border-box",
                                    }}
                                />
                                <Flex justifyContent="space-between" marginTop="20px">
                                    <Button
                                        onClick={() => {
                                                setConfirmCancelOrder(null);
                                                setCancelReason("");
                                            }}
                                        style={{...buttonStyling,  padding: ".5rem 3rem",}}>
                                        <Text color="White" fontSize="1.2rem">No</Text>
                                    </Button>
                                    <Button
                                           onClick={async () => {
                                                if (!cancelReason.trim()) {
                                                    setMessage("Please provide a cancellation reason.");
                                                    return;
                                                }

                                                await cancelOrder(confirmCancelOrder, cancelReason.trim());
                                                setConfirmCancelOrder(null);
                                            }}
                                            style={{...buttonStyling,  
                                            padding: ".5rem 2rem",
                                            background: cancelReason.trim() ? "linear-gradient(145deg, #ff2525d7, rgba(20,20,20,0.92))" : "linear-gradient(145deg, #f4f4f4, rgba(40,40,40,0.92))",
                                            cursor: cancelReason.trim() ? "pointer" : "not-allowed",
                                         }}>
                                        <Text style={{ color: "White", fontSize: "1.2rem" }}>Cancel</Text>
                                    </Button>
                                </Flex>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </>
    );
}