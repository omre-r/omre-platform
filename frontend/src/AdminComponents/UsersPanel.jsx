import { useEffect, useState } from "react";
import { Card, Flex, Text, Button, View, TextField, SwitchField,  } from "@aws-amplify/ui-react";

import AdminIcon from "../assets/admin_icon.png"
import SearchIcon from "../assets/search_icon.png"
import OptionsIcon from "../assets/options_icon.png"

import { getFilteredUsersReq } from "../requests";
import { data } from "react-router-dom";


// Custom Styling for fonts and amplify ui --------------------------------------
const bodyStyle2 = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 400,
  fontSize: "1.3rem",
  letterSpacing: "0.5px",
  color: "#000000",
};

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

    // search and filter
    const [search, setSearch] = useState("")
    const [includeSearch, setIncludeSearch] = useState(false)
    const [firstname, setFirstname] = useState("")
    const [lastname, setLastname] = useState("")
    const [getAdmins, setGetAdmins] = useState(true)
    const [getNonadmins, setGetNonadmins] = useState(true)
    const [getLoggedIn, setGetLoggedIn] = useState(true)
    const [getNeverLoggedIn, setGetNeverLoggedIn] = useState(true)
    const [showFilters, setShowFilters] = useState(false)
    


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

    async function filterUsers(filters) {
        setMessage("");
        setLoadingUsers(true);
        try {
            const response = await getFilteredUsersReq(filters)
            if (!response.success) {
                throw new Error(`Issue with load response: ${response.message}`)
            }
            setUsers(response.data.users);
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

   function handleFilterSubmit(){
        const filters = {}
        if (firstname !== "") filters.first_name = firstname;
        if (lastname !== "") filters.last_name = lastname;
        if (!getLoggedIn && !getNeverLoggedIn){
            setUsers([]);
            return;
        }
        if (getLoggedIn && !getNeverLoggedIn) filters.last_login = true;
        if (!getLoggedIn && getNeverLoggedIn) filters.last_login = false;
        if (!getAdmins && !getNonadmins){
            setUsers([]);
            return;
        }
        if (getAdmins && !getNonadmins) filters.is_admin = true;
        if (!getAdmins && getNonadmins) filters.is_admin = false;
        if (includeSearch) filters.email = search;

        if (Object.keys(filters).length === 0){
            loadUsers();
            return;
        }
        filterUsers(filters)
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

// Getting the sorted list of users ------------------------------------------
const sortedUsers = [...users].sort((a, b) => a.email.localeCompare(b.email));

    return (
        <Flex
        direction={"column"}
        height={"100%"}
        >
            <Flex  
            padding={"5px"}    
            alignItems={"center"}
            justifyContent={"center"}
            gap={"3px"}
            style={{zIndex: "2000", background: "linear-gradient(to right, white, whitesmoke, white)"}}
            >

                <View
                position={"relative"}>
                <TextField
                    labelHidden
                    type="text"
                    placeholder="Search by email..."
                    textAlign={"left"}
                    width={"300px"}
                    style={{borderRadius:"10px", ...bodyStyle2}}
                    border=".5px solid #111"
                    borderRadius="10px"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyDown={async (e) =>  {
                        if (e.key !== "Enter") return;
                        const res = await getFilteredUsersReq({email: search});
                        console.log(res)
                        setUsers(res.data.users)
                    }}
                />
                <section 
                style={{
                    display: "flex",
                    width:"30px", 
                    paddingRight: "5px",
                    overflow:"hidden",
                    position:"absolute",
                    right:"0",
                    top: "50%",
                    transform: "translateY(-50%)"}}
                    onClick={e => {}}>
                    <img src={SearchIcon} alt="search" style={{width: "100%"}} />
                </section>
                </View>
                <View 
                position={"relative"}
                padding={"2px"}
                backgroundColor={"white"}
                borderRadius={"10px"}
                style={{width: "40px"}}
                onClick={e => {e.currentTarget.blur(); setShowFilters(prev=>!prev);}}
                >
                <img src={OptionsIcon} alt="options" style={{width:"100%", display:"block"}}/>
                {showFilters && 
                <Card

                position={"absolute"}
                top={"110%"}
                left={"50%"}
                transform={"translateX(-50%)"}
                border={"1px solid"}
                borderRadius={"10px"}
                minWidth={"420px"}
                onClick={e => e.stopPropagation()}
                >
                    <Flex 
                    direction={"column"}
                    gap={0}>
                    <Flex>
                        {/* first name container */}
                        <Flex
                        alignItems={"center"}>
                            <Text
                            marginRight={"auto"}>First name: </Text>
                            <TextField 
                            value={firstname}
                            onChange={e => setFirstname(e.target.value)}
                            />
                        </Flex>
                        {/* last name container */}
                        <Flex
                        alignItems={"center"}>
                            <Text
                            marginRight={"auto"}>Last name: </Text>
                            <TextField 
                            value={lastname}
                            onChange={e => setLastname(e.target.value)}
                            />
                        </Flex>
                    </Flex>
                    <hr style={{width: "100%", marginBlock: "10px"}}/>
                    <Flex>
                        {/* get logged in container */}
                        <Flex
                        alignItems={"center"}>
                            <Text
                            marginRight={"auto"}>Show logged in:</Text>
                            <SwitchField 
                            isChecked={getLoggedIn}
                            onChange={e => setGetLoggedIn(e.target.checked)}>
                            </SwitchField>
                        </Flex>

                        {/* get not logged in container */}
                        <Flex
                        alignItems={"center"}>
                            <Text
                            marginRight={"auto"}>Show never logged in:</Text>
                            <SwitchField 
                            isChecked={getNeverLoggedIn}
                            onChange={e => setGetNeverLoggedIn(e.target.checked)}>
                            </SwitchField>
                        </Flex>
                    </Flex>
                    <hr style={{width: "100%", marginBlock: "10px"}}/>
                    <Flex>
                        {/* get is admin container */}
                        <Flex
                        alignItems={"center"}>
                            <Text
                            marginRight={"auto"}>Show admins:</Text>
                            <SwitchField 
                            isChecked={getAdmins}
                            onChange={e => setGetAdmins(e.target.checked)}>
                            </SwitchField>
                        </Flex>

                        {/* get nonadmins container */}
                        <Flex
                        alignItems={"center"}>
                            <Text
                            marginRight={"auto"}>Show normal users:</Text>
                            <SwitchField 
                            isChecked={getNonadmins}
                            onChange={e => setGetNonadmins(e.target.checked)}>
                            </SwitchField>
                        </Flex>
                    </Flex>

                    <hr style={{width: "100%", marginBlock: "10px"}}/>


                    {/* "include search" container */}
                    <Flex
                    direction={"column"}
                    gap={"3px"}
                    alignItems={"center"}>
                        <Flex
                        width={"100%"}>
                        <Text
                        marginRight={"auto"}>
                            Include Email Search:
                        </Text>
                        <SwitchField 
                        isChecked={includeSearch}
                        onChange={e => setIncludeSearch(e.target.checked)}>
                        </SwitchField>
                        </Flex>
                        {includeSearch && <Text style={{fontSize: ".8rem"}}>"{search}"</Text>}
                    </Flex>
                    <hr style={{width: "100%", marginBlock: "10px"}}/>

                    <Button 
                    onClick={handleFilterSubmit}>
                        Filter
                    </Button>
                    </Flex>
                </Card>
                }
                </View>
            </Flex>
            <Flex
            direction="row" 
            gap="1rem" 
            flex={"1"}
            >
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
                        style={{overflowY: "auto"}}
                        height={"25rem"}
                        marginTop="1rem">
                        {sortedUsers.length === 0 &&
                        <Text>No users found!</Text>}
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
        </Flex>
    );
}

// To do list
// TODO: if no users make a condition, IE users = 0 
// TODO: Talk to Ayman about last login
// TODO: Check that user information isnt missing like response.ok check with the data