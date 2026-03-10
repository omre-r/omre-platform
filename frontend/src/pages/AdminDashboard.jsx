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
                    minHeight="80vh"
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
                        // height="35rem" // was "auto"
                        width="100%"
                        maxWidth="1500px"
                        margin="1rem auto"
                        padding="1.5rem"
                        marginTop="rem"
                        backgroundColor="rgba(0, 0, 0, 0.75)"
                        borderRadius="8px"
                        >   
                        {/* Flex holding the sidebar and the main content ---------------------------- */}
                        <Flex direction="row" gap="1.5rem" alignItems="stretch">

                            {/* Sidebar flex showing tabs to choose from ---------------------------------- */}
                            <Flex direction="column" gap=".8rem" alignItems="stretch">
                                <Button 
                                    color="#2B1E1A"
                                    justifyContent="center"
                                    style={luxuryBodyStyle}
                                    variation="primary"
                                    marginTop=".9rem"
                                    onClick={() => setActiveTab("users")}
                                    >
                                    Users
                                </Button>
                                <Button 
                                    justifyContent="center"
                                    color="#2B1E1A"
                                    style={luxuryBodyStyle}
                                    variation="primary"
                                    marginTop=".9rem"
                                    onClick={() => setActiveTab("products")}
                                    >
                                    Products
                                </Button>
                                <Button 
                                    justifyContent="center"
                                    color="#2B1E1A"
                                    style={luxuryBodyStyle}
                                    variation="primary"
                                    marginTop=".9rem"
                                    onClick={() => setActiveTab("orders")}
                                    >
                                    Orders
                                </Button>
                            </Flex>

                            {/* Card to hold the actual dashboard information ---------------------- */}
                            {/* Depending on which button is clicked will show appropriate mode */}
                            <Card
                                minHeight="40em" // was "auto"
                                width="80rem"
                                margin="1rem auto"
                                padding="2rem"
                                backgroundColor="rgb(255, 255, 255)"
                                border="1px solid rgba(0, 0, 0, 0.72)"
                                borderRadius="8px"
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
