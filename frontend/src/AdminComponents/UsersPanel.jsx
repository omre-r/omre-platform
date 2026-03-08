import { useEffect, useState } from "react";
import { Card, Flex, Text, Button, View } from "@aws-amplify/ui-react";

import AdminIcon from "../assets/admin_icon.png"

// Custom Styling for fonts and amplify ui --------------------------------------
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

// API URL to reach user information -----------------------------------------------
const API_URL = 'https://6180u0u9xf.execute-api.us-east-1.amazonaws.com/prod';


// Users panel, a component used in admin dashboard --------------------------------------
// Will be called by admin dashboard and shown if users button is pressed
// Will show user email, when clicking will show deeper information on right card
export default function UsersPanel() {
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingUser, setLoadingUser] = useState(false);
    const [msg, setMessage] = useState("");

    // Load users ------------------------------------------------------------------
    // Pull user information from API URL and if fails show error message
    async function loadUsers() {
        setMessage("");
        setLoadingUsers(true);
        try {
            const response = await fetch(`${API_URL}/admin/users`);    
            if (!response.ok) {
                throw new Error(`Issue with load response: ${response.status}`)
            }
            const data = await response.json();
            setUsers(data.users);
        }
        catch (error) {
            setMessage(error.message || "Error loading users.");
        }
        finally {
            setLoadingUsers(false);
        }
    }

    // View user ------------------------------------------------------
    // After user information is loaded one can click on an email and show deeper information on card to the right
    // Will use API URL to get to user information
    async function viewUser(userId) {
        setMessage("");
        setLoadingUser(true);
        setSelectedUser(null);
        try {
            const response = await fetch(`${API_URL}/admin/users/${userId}`);
            if (!response.ok) {
                throw new Error(`Issue with load response: ${response.status}`)
            }
            const data = await response.json();
            setSelectedUser(data.user);
        }
        catch (error) {
            setMessage(error.message || "Error viewing user.");
        }
        finally {
            setLoadingUser(false);
        }
    }

    useEffect(() => {
        loadUsers();
    }, []);

    if (loadingUsers) {
        return (
        <Text 
            style={luxuryBodyStyle}>
            Loading users...
        </Text>);
    }
console.log("selectedUser object:", selectedUser);

// Getting the sorted list of users ------------------------------------------
const sortedUsers = [...users].sort((a, b) => a.email.localeCompare(b.email));

    return (
        <Flex 
            direction="row" 
            gap="1rem" 
            height="100%">

            {/* Left card holding emails ---------------------------------------------*/}
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
                        alignItems="center">   
                        <Text 
                            style={luxuryHeadingStyle}>
                            Users
                        </Text>
                        <Button 
                            style={luxuryBodyStyle}
                            onClick={loadUsers}>
                            Refresh
                        </Button>
                    </Flex>

                    {msg && (
                        <Text 
                            color="Black" 
                            style={luxuryBodyStyle} 
                            marginTop="0.5rem">
                            {msg}
                        </Text>
                    )}

                    <View 
                        overflow="auto" 
                        height="20rem"
                        marginTop="1rem">
                        {sortedUsers.map((currentUser) => (
                            <Button
                                key={currentUser.user_id}
                                style={luxuryBodyStyle}
                                variation="link"
                                marginBottom=".5rem"
                                border=".5px solid #111"
                                borderRadius="6px"
                                onClick={() => viewUser(currentUser.user_id)}
                                justifyContent="flex-start"
                                width="100%"
                                >
                                {currentUser.email}
                            </Button>
                        ))}
                    </View>
                    </Flex>
                </Card>
        
                {/* Right card holding single specific user information ----------------------------------------- */}
                <Card
                    flex="1.0" 
                    height="100%" 
                    padding="1rem" 
                    backgroundColor="whitesmoke"
                    position={"relative"}
                >
                    <Flex>
                        <Text 
                            width="100%"
                            textAlign="center"
                            style={luxuryHeadingStyle}>
                            User Information
                        </Text>              
                    </Flex>
                    {/* No user selected, select user ------------------------------ */}
                    {!loadingUser && !selectedUser && (
                        <Text 
                            style={luxuryBodyStyle}>
                            Please select a user
                        </Text>
                    )}   
                    {/* If user selected, will display loading -------------------------- */}
                    {loadingUser && (
                        <Text 
                            style={luxuryBodyStyle}>
                            Loading user information
                        </Text>
                    )}   
                    {/* Loading is false and user has been selected ----------------- */}
                    {/* Show that users information in detail */}
                    {/* TODO: Check back on last login with Ayman */}
                    {!loadingUser && selectedUser && (
                        <Flex
                        direction="column"
                        gap=".2rem" 
                        >
                            {
                                selectedUser.is_admin && 
                                <View 
                                position={"absolute"}
                                top={0}
                                right={0}
                                width={"80px"}
                                opacity={.7}
                                >
                                    <img src={AdminIcon} width={"100%"} alt="admin" />
                                </View>
                            }

                            <Text>Email: {selectedUser.email}</Text>
                            <Text>Name: {selectedUser.first_name} {selectedUser.last_name}</Text>
                            <Text>Favorite Notes: {selectedUser.favorite_notes ? selectedUser.favorite_notes : "--"}</Text>
                            <Text>Created: {new Date(selectedUser.created_at).toLocaleString()}</Text>
                            <Text>Last Login: {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString() : "Never"}</Text>

                            {/* TODO: Have last login implemented */}
                            {/* <Text>Last Login: {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleString(): "--"}</Text> */}

                            <Button 
                                style={luxuryBodyStyle}
                                onClick={() => setSelectedUser(null)}
                                height="auto"
                                width="auto">
                                Close Info
                            </Button>
                    </Flex>
                )} 
            </Card>
        </Flex>
    );
}

// To do list
// TODO: if no users make a condition, IE users = 0 
// TODO: Talk to Ayman about last login
// TODO: Check that user information isnt missing like response.ok check with the data