import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Card, View, Flex, Link, Text, TextField, Button, Tabs } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import Navbar from "../components/Navbar";
import LuxuryBackground from "../assets/Luxury Background2.png";

import UsersPanel from "../AdminComponents/UsersPanel";
import ProductsPanel from "../AdminComponents/ProductsPanel";
import OrdersPanel from "../AdminComponents/OrdersPanel";

const luxuryHeadingStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 800,
  fontSize: "2.5rem",
  letterSpacing: "0.5px",
};

const luxuryBodyStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 400,
  fontSize: "1.3rem",   
  letterSpacing: "0.3px",
};

const buttonStyling = {
    ...luxuryBodyStyle, 
    fontSize: "1rem",
    padding: "0.9rem 2.2rem",
    border: "1px solid rgba(255,255,255,0.35)",
    borderRadius: "28px",
    background: "linear-gradient(145deg,  #480e0e, rgba(20,20,20,0.9))",
    color: "#FFFFFF",
    cursor: "pointer",
    boxShadow: "0 8px 18px rgba(0,0,0,0.35)",
    transition: "all 0.2s ease",
}

export default function AdminDashboard() {
    // UI Change for dashboard functions -----------------------
    const [activeTab, setActiveTab] = useState("users");
    const  usersMode = activeTab === "users";
    const productsMode = activeTab === "products";
    const ordersMode = activeTab === "orders";


    // Checks to make sure admin dash cannot be reached from searchbar ------------------------------------
    // Will navigate back to home page or sign in if not admin
    const { loadingAuth, isAuthenticated, isAdmin } = useAuth();
    const navigate = useNavigate();
    if (!isAdmin) {
        navigate("/");
    }
    if (!isAuthenticated) {
        navigate("/Auth");
    }

    return (
        <>
            <Navbar />
                <View
                    minHeight="100vh"
                    width="100%"
                    padding="1rem"
                    style={{
                        backgroundImage: `url(${LuxuryBackground})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "repeat",
                    }}
                    display="flex"
                    justifyContent="center"
                    alignItems="flex-start"
                >   
                    <Card
                        variation="elevated"
                        width="100%"
                        maxWidth="1500px"
                        margin="1rem auto"
                        padding="1.5rem"
                        borderRadius="8px"
                        style={{
                            background: "linear-gradient(145deg, #480e0e76, rgba(20, 20, 20, 0.05))"
                        }}
                        >   
                        {/* Flex holding the sidebar and the main content ---------------------------- */}
                        <Flex 
                            direction="row"
                            gap="1.5rem"
                            alignItems="stretch"
                            width="100%"
                            height="100%"
                            style={{
                                minWidth: 0,
                                overflowX: "auto",
                                overflowY: "hidden",
                            }}
                        >

                            {/* Sidebar flex showing tabs to choose from ---------------------------------- */}
                            <Flex
                                direction="column"
                                gap=".8rem"
                                alignItems="stretch"
                                flexShrink="0"
                                style={{ width: "180px" }}
                                >
                                <Button 
                                    justifyContent="center"
                                    style={{
                                        ...buttonStyling,
                                        boxShadow: activeTab === "users" ? "0 0 10px rgb(255, 208, 0)" : buttonStyling.boxShadow,
                                    }}
                                    variation="primary"
                                    marginTop=".9rem"
                                    onClick={() => setActiveTab("users")}
                                    >
                                    <Text style={{...luxuryBodyStyle, color: "#FFFFFF"}}>Users</Text> 
                                </Button>
                                <Button 
                                    justifyContent="center"
                                    color="#2B1E1A"
                                    style={{
                                        ...buttonStyling,
                                        boxShadow: activeTab === "products" ? "0 0 10px rgb(255, 208, 0)" : buttonStyling.boxShadow,
                                    }}
                                    variation="primary"
                                    marginTop=".9rem"
                                    onClick={() => setActiveTab("products")}
                                    >
                                    <Text style={{...luxuryBodyStyle, color: "#FFFFFF"}}>Products</Text> 
                                </Button>
                                <Button 
                                    justifyContent="center"
                                    color="#2B1E1A"
                                    style={{
                                        ...buttonStyling,
                                        boxShadow: activeTab === "orders" ? "0 0 10px rgb(255, 208, 0)" : buttonStyling.boxShadow,
                                    }}
                                    variation="primary"
                                    marginTop=".9rem"
                                    onClick={() => setActiveTab("orders")}
                                    >
                                    <Text style={{...luxuryBodyStyle, color: "#FFFFFF"}}>Orders</Text> 
                                </Button>
                            </Flex>

                            {/* Card to hold the actual dashboard information ---------------------- */}
                            {/* Depending on which button is clicked will show appropriate mode */}
                            <Card
                                minHeight="40em" // was "auto"
                                height="100%"
                                width="200%"
                                maxWidth="100%"
                                margin="1rem auto"
                                padding="2rem"
                                borderRadius="20px"
                                style={{
                                    background: "linear-gradient(145deg,  #480e0e, rgba(20,20,20,0.35))",
                                    boxSizing: "border-box",
                                    minWidth: 0,
                                    display: "flex",
                                    flexDirection: "column",
                                    //overflowX: "hidden",
                                }}
                            >   
                            {usersMode && <UsersPanel />}

                            {productsMode && <ProductsPanel />}

                            {ordersMode && <OrdersPanel />}

                            </Card>
                        </Flex>
                    </Card>
                </View>
        </>
    );
};
