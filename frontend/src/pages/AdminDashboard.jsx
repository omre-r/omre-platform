import { useState } from "react";
import { Card, View, Flex, Link, Text, TextField, Button, Tabs } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import Navbar from "../components/Navbar";
import LuxuryBackground from "../assets/Luxury Background.png";

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

    const [usersArray, setUsersArray] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [loadingSelectedUser, setLoadingSelectedUser] = useState("");

    const [authError, setAuthError] = useState("");
    const [authSuccess, setAuthSuccess] = useState("");

    return (
        <>
            <Navbar />
                <View
                    height="150vh"
                    width="100%"
                    padding="1rem"
                    style={{
                        backgroundImage: `url(${LuxuryBackground})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                >   
                    <Card
                        variation="elevated"
                        height="30rem" // was "auto"
                        width="80rem"
                        margin="1rem auto"
                        padding="2rem"
                        marginTop="-30rem"
                        backgroundColor="rgba(0, 0, 0, 0.75)"
                        border="1px solid rgba(151, 33, 0, 0.72)"
                        borderRadius="8px"
                        >   
                        {/* Flex holding the sidebar and the main content ---------------------------- */}
                        <Flex direction="row" gap="1.5rem" alignItems="stretch">

                            {/* Sidebar flex showing tabs to choose from ---------------------------------- */}
                            <Flex direction="column" gap="6.0rem" alignItems="stretch">
                                <Button 
                                    justifyContent="center"
                                    color="#F5F5F5" 
                                    style={luxuryBodyStyle}
                                    variation="primary"
                                    marginTop=".9rem"
                                    border="1px solid rgba(245, 245, 245, 0.85)"
                                    onClick={() => setActiveTab("users")}
                                    >
                                    Users
                                </Button>
                                <Button 
                                    justifyContent="center"
                                    color="#F5F5F5" 
                                    style={luxuryBodyStyle}
                                    variation="primary"
                                    marginTop=".9rem"
                                    border="1px solid rgba(245, 245, 245, 0.85)"
                                    onClick={() => setActiveTab("products")}
                                    >
                                    Products
                                </Button>
                                <Button 
                                    justifyContent="center"
                                    color="#F5F5F5" 
                                    style={luxuryBodyStyle}
                                    variation="primary"
                                    marginTop=".9rem"
                                    border="1px solid rgba(245, 245, 245, 0.85)"
                                    onClick={() => setActiveTab("orders")}
                                    >
                                    Orders
                                </Button>
                            </Flex>

                            {/* Card to hold the actual dashboard information ---------------------- */}
                            {/* Depending on which button is clicked will show appropriate mode */}
                            <Card
                                height="25rem" // was "auto"
                                width="60rem"
                                margin="1rem auto"
                                padding="2rem"
                                backgroundColor="rgb(255, 255, 255)"
                                border="1px solid rgba(151, 33, 0, 0.72)"
                                borderRadius="8px"
                            >   
                            {usersMode && (
                                <Text 
                                    color="#000000" 
                                    style={luxuryBodyStyle}
                                    marginTop="-1.2rem">
                                    Users panel
                                </Text>
                            )}

                            {productsMode && (
                                <Text 
                                    color="#000000" 
                                    style={luxuryBodyStyle}
                                    marginTop="-1.2rem">
                                    Products panel
                                </Text>
                            )}

                            {ordersMode && (
                                <Text 
                                    color="#000000" 
                                    style={luxuryBodyStyle}
                                    marginTop="-1.2rem">
                                    Orders panel
                                </Text>
                            )}
                            </Card>
                        </Flex>
                    </Card>
                </View>
        </>
    );
};
