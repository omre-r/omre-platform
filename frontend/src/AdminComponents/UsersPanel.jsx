import { useEffect, useState } from "react";
import { Card, Flex, Text, Button, View } from "@aws-amplify/ui-react";


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
            const data = await response.json();
            setUsers(data.users);
            setMessage("Success!");
        }
        catch (error) {
            setMessage(error?.message || "Error loading users.");
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
            const data = await response.json();
            setSelectedUser(data.user);
            setMessage("Success!");
        }
        catch (error) {
            setMessage(error?.message || "Error viewing user.");
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
                    alignItems="center">   
                    {msg && (
                        <Text 
                            color="Black" 
                            style={luxuryBodyStyle} 
                            marginTop="0.5rem">
                            {msg}
                        </Text>
                    )}
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

                <View 
                    overflow="auto" 
                    height="20rem"
                    marginTop="1rem">
                    {users.map((currentUser) => (
                        <Button
                            key={currentUser.user_id}
                            variation="link"
                            onClick={() => viewUser(currentUser.user_id)}
                            justifyContent="flex-start"
                            width="100%"
                            >
                            {currentUser.email}
                        </Button>
                    ))}
                </View>
            </Card>
      
            {/* Right card holding single specific user information ----------------------------------------- */}
            <Card
                width="45%" 
                height="100%" 
                padding="1rem" 
                backgroundColor="whitesmoke"
            >
                <Flex 
                    justifyContent="space-between" 
                    alignItems="center">
                    <Text 
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
                        <Text>Email: {selectedUser.email}</Text>
                        <Text>First Name: {selectedUser.first_name} </Text>
                        <Text>Last Name: {selectedUser.last_name} </Text>
                        <Text>Favorite Notes: {selectedUser.favorite_notes}</Text>
                        <Text>Admin Status: {selectedUser.is_admin ? "Yes" : "No"}</Text>
                        <Text>Created: {selectedUser.created_at}</Text>
                        <Text>Last Login: {selectedUser.last_login ? selectedUser.last_login : "Null"}</Text>

                        <Button 
                            style={luxuryBodyStyle}
                            onClick={() => setSelectedUser(null)}
                            height="50%">
                            Close Info
                        </Button>
                    </Flex>
                )} 
            </Card>
        </Flex>
    );
}

// To do list
// TODO: Make the styling of the cards and information better eventually for the panels