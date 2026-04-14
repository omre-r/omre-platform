import { useEffect, useState } from "react";
import {
  Card,
  Flex,
  Text,
  Button,
  View,
  TextField,
  SwitchField,
} from "@aws-amplify/ui-react";

import AdminIcon from "../assets/admin_icon.png";
import SearchIcon from "../assets/search_icon.png";
import OptionsIcon from "../assets/options_icon.png";

import { getFilteredUsersReq } from "../requests";
import { data } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { useToast } from "../components/ToastContext";

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

const buttonStyling = {
  ...luxuryBodyStyle,
  fontSize: "1.2rem",
  padding: "0.5rem 1.2rem",
  border: "2px solid rgba(0, 0, 0)",
  borderRadius: "28px",
  background:
    "linear-gradient(145deg, rgba(90, 20, 20, 0.92), rgba(40, 35, 35, 0.82))",
  color: "#FFFFFF",
  cursor: "pointer",
  boxShadow: "0 6px 14px rgba(0,0,0,0.22)",
  transition: "all 0.2s ease",
};

// API URL to reach user information -----------------------------------------------
const API_URL = "https://6180u0u9xf.execute-api.us-east-1.amazonaws.com/prod";

// Users panel, a component used in admin dashboard --------------------------------------
// Will be called by admin dashboard and shown if users button is pressed
// Will show user email, when clicking will show deeper information on right card
export default function UsersPanel() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingUser, setLoadingUser] = useState(false);
  const { toast } = useToast();
  // search and filter
  const [search, setSearch] = useState("");
  const [includeSearch, setIncludeSearch] = useState(false);
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [getAdmins, setGetAdmins] = useState(true);
  const [getNonadmins, setGetNonadmins] = useState(true);
  const [getLoggedIn, setGetLoggedIn] = useState(true);
  const [getNeverLoggedIn, setGetNeverLoggedIn] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Load users ------------------------------------------------------------------
  // Pull user information from API URL and if fails show error message
  async function loadUsers() {
    setLoadingUsers(true);
    try {
      const response = await fetch(`${API_URL}/admin/users`);
      if (!response.ok) {
        throw new Error(`Issue with load response: ${response.status}`);
      }
      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      toast(error.message || "Error loading users.", "error");
    } finally {
      setLoadingUsers(false);
    }
  }

  async function filterUsers(filters) {
    setLoadingUsers(true);
    try {
      const response = await getFilteredUsersReq(filters);
      if (!response.success) {
        throw new Error(`Issue with load response: ${response.message}`);
      }
      setUsers(response.data.users);
    } catch (error) {
      toast(error.message || "Error loading users.", "error");
    } finally {
      setLoadingUsers(false);
    }
  }

  // View user ------------------------------------------------------
  // After user information is loaded one can click on an email and show deeper information on card to the right
  // Will use API URL to get to user information
  async function viewUser(userId) {
    setLoadingUser(true);
    setSelectedUser(null);
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}`);
      if (!response.ok) {
        throw new Error(`Issue with load response: ${response.status}`);
      }
      const data = await response.json();
      setSelectedUser(data.user);
    } catch (error) {
      toast(error.message || "Error viewing user.", "error");
    } finally {
      setLoadingUser(false);
    }
  }

  function handleFilterSubmit() {
    const filters = {};
    if (firstname !== "") filters.first_name = firstname;
    if (lastname !== "") filters.last_name = lastname;
    if (!getLoggedIn && !getNeverLoggedIn) {
      setUsers([]);
      return;
    }
    if (getLoggedIn && !getNeverLoggedIn) filters.last_login = true;
    if (!getLoggedIn && getNeverLoggedIn) filters.last_login = false;
    if (!getAdmins && !getNonadmins) {
      setUsers([]);
      return;
    }
    if (getAdmins && !getNonadmins) filters.is_admin = true;
    if (!getAdmins && getNonadmins) filters.is_admin = false;
    if (includeSearch) filters.email = search;

    if (Object.keys(filters).length === 0) {
      loadUsers();
      return;
    }
    filterUsers(filters);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  if (loadingUsers) {
    return (
      <Text style={{ ...luxuryBodyStyle, color: "white" }}>
        Loading users...
      </Text>
    );
  }

  // Getting the sorted list of users ------------------------------------------
  const sortedUsers = [...users].sort((a, b) => a.email.localeCompare(b.email));

  return (
    <Flex direction={"column"} height={"100%"}>
      <Flex
        direction="row"
        gap="1rem"
        flex="1"
        alignItems="stretch"
        height="100%"
      >
        {/* Left card holding emails ---------------------------------------------*/}
        <Card
          flex="1.2"
          height="100%"
          padding="1rem"
          style={{
            background:
              "linear-gradient(145deg, rgba(255, 240, 235, 0.35), rgba(245, 225, 218, 0.28))",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(120, 80, 70, 0.18)",
            borderRadius: "22px",
            overflow: "visible",
            zIndex: 20,
          }}
        >
          <Flex direction="column" height="100%">
            <Flex justifyContent="space-between" alignItems="center">
              <Flex
                padding={"10px"}
                alignItems={"center"}
                justifyContent={"center"}
                gap={"15px"}
                style={{ zIndex: "2000", background: "#ffffff00" }}
              >
                <View position={"relative"}>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key !== "Enter") return;
                      const res = await getFilteredUsersReq({ email: search });
                      setUsers(res.data.users);
                    }}
                    style={{
                      width: "300px",
                      height: "50px",
                      paddingLeft: "18px",
                      paddingRight: "42px",
                      borderRadius: "8px",
                      border: "2px solid rgba(0, 0, 0)",
                      background:
                        "linear-gradient(145deg, rgba(90, 20, 20, 0.92), rgba(40, 35, 35, 0.82))",
                      color: "#FFFFFF",
                      caretColor: "#FFFFFF",
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: "1.3rem",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                  {!search && (
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
                      Search by email...
                    </Text>
                  )}
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
                    }}
                    onClick={async (e) => {
                      const res = await getFilteredUsersReq({ email: search });
                      setUsers(res.data.users);
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
                <View
                  position={"relative"}
                  padding="8px"
                  borderRadius={"10px"}
                  style={{
                    ...buttonStyling,
                    border: "2px solid rgba(0, 0, 0)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    setShowFilters((prev) => !prev);
                  }}
                >
                  {/* Image for the filter icon ------------------------------------------------------ */}
                  <img
                    src={OptionsIcon}
                    alt="options"
                    style={{
                      width: "32px",
                      height: "32px",
                      display: "block",
                      filter: "brightness(0) invert(1)",
                    }}
                  />
                  {/* If filter button is pressed ------------------------------------------------------ */}
                  {showFilters && (
                    <Card
                      position={"absolute"}
                      top={"110%"}
                      left={"50%"}
                      transform={"translateX(-50%)"}
                      border={"1px solid"}
                      borderRadius={"10px"}
                      minWidth={"420px"}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Flex direction={"column"} gap={0}>
                        <Flex>
                          {/* first name container */}
                          <Flex alignItems={"center"}>
                            <Text marginRight={"auto"}>First name: </Text>
                            <TextField
                              value={firstname}
                              onChange={(e) => setFirstname(e.target.value)}
                            />
                          </Flex>
                          {/* last name container */}
                          <Flex alignItems={"center"}>
                            <Text marginRight={"auto"}>Last name: </Text>
                            <TextField
                              value={lastname}
                              onChange={(e) => setLastname(e.target.value)}
                            />
                          </Flex>
                        </Flex>
                        <hr style={{ width: "100%", marginBlock: "10px" }} />
                        <Flex>
                          {/* get logged in container */}
                          <Flex alignItems={"center"}>
                            <Text marginRight={"auto"}>Show logged in:</Text>
                            <SwitchField
                              isChecked={getLoggedIn}
                              onChange={(e) => setGetLoggedIn(e.target.checked)}
                            ></SwitchField>
                          </Flex>

                          {/* get not logged in container */}
                          <Flex alignItems={"center"}>
                            <Text marginRight={"auto"}>
                              Show never logged in:
                            </Text>
                            <SwitchField
                              isChecked={getNeverLoggedIn}
                              onChange={(e) =>
                                setGetNeverLoggedIn(e.target.checked)
                              }
                            ></SwitchField>
                          </Flex>
                        </Flex>
                        <hr style={{ width: "100%", marginBlock: "10px" }} />
                        <Flex>
                          {/* get is admin container */}
                          <Flex alignItems={"center"}>
                            <Text marginRight={"auto"}>Show admins:</Text>
                            <SwitchField
                              isChecked={getAdmins}
                              onChange={(e) => setGetAdmins(e.target.checked)}
                            ></SwitchField>
                          </Flex>

                          {/* get nonadmins container */}
                          <Flex alignItems={"center"}>
                            <Text marginRight={"auto"}>Show normal users:</Text>
                            <SwitchField
                              isChecked={getNonadmins}
                              onChange={(e) =>
                                setGetNonadmins(e.target.checked)
                              }
                            ></SwitchField>
                          </Flex>
                        </Flex>

                        <hr style={{ width: "100%", marginBlock: "10px" }} />

                        {/* "include search" container */}
                        <Flex
                          direction={"column"}
                          gap={"3px"}
                          alignItems={"center"}
                        >
                          <Flex width={"100%"}>
                            <Text marginRight={"auto"}>
                              Include Email Search:
                            </Text>
                            <SwitchField
                              isChecked={includeSearch}
                              onChange={(e) =>
                                setIncludeSearch(e.target.checked)
                              }
                            ></SwitchField>
                          </Flex>
                          {includeSearch && (
                            <Text style={{ fontSize: ".8rem" }}>
                              "{search}"
                            </Text>
                          )}
                        </Flex>
                        <hr style={{ width: "100%", marginBlock: "10px" }} />

                        <Button onClick={handleFilterSubmit}>Filter</Button>
                      </Flex>
                    </Card>
                  )}
                </View>
                <View
                  position={"relative"}
                  onClick={async () => {
                    await loadUsers();
                  }}
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "10px",
                    border: "2px solid black",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    flexShrink: 0,
                    background:
                      "linear-gradient(145deg, rgba(90, 20, 20, 0.92), rgba(40, 35, 35, 0.82))",
                    boxShadow: "0 6px 14px rgba(0,0,0,0.22)",
                  }}
                >
                  <RefreshCw color="white" size={22} />
                </View>
              </Flex>
            </Flex>
            <View
              className="users-scroll"
              style={{ overflowY: "auto" }}
              height={"25rem"}
              marginTop="1rem"
              padding="0.6rem"
            >
              {sortedUsers.length === 0 && <Text>No users found!</Text>}
              {sortedUsers.map((currentUser) => (
                <Button
                  key={currentUser.user_id}
                  onClick={() => viewUser(currentUser.user_id)}
                  style={{
                    ...buttonStyling,
                    width: "100%",
                    justifyContent: "flex-start",
                    marginBottom: ".8rem",
                    border:
                      selectedUser?.user_id === currentUser.user_id
                        ? "2px solid gold"
                        : "2px solid rgba(0,0,0,0.8)",
                    boxShadow:
                      selectedUser?.user_id === currentUser.user_id
                        ? "0 0 12px gold"
                        : buttonStyling.boxShadow,
                    transform:
                      selectedUser?.user_id === currentUser.user_id
                        ? "scale(1.02)"
                        : "scale(1)",
                    textAlign: "left",
                    background: currentUser.is_admin
                      ? "linear-gradient(145deg, #007f3f, #005f28)"
                      : buttonStyling.background,
                    color: currentUser.is_admin
                      ? "#ffffff"
                      : buttonStyling.color,
                  }}
                >
                  <Text
                    style={{
                      ...luxuryBodyStyle,
                      fontWeight: "600",
                      color: currentUser.is_admin ? "#ffffff" : "#FFFFFF",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      textAlign: "left",
                      flex: 1,
                    }}
                  >
                    {currentUser.email}
                  </Text>
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
          position={"relative"}
          style={{
            background:
              "linear-gradient(145deg, rgba(255, 240, 235, 0.35), rgba(245, 225, 218, 0.28))",
            backdropFilter: "blur(6px)",
            border: "1px solid rgba(120, 80, 70, 0.18)",
            borderRadius: "22px",
          }}
        >
          <Flex
            alignItems="center"
            justifyContent="center"
            style={{
              padding: ".5rem .5rem",
              border: "2px solid rgba(0, 0, 0)",
              borderRadius: "10px",
              background:
                "linear-gradient(145deg, rgba(90, 20, 20, 0.92), rgba(40, 35, 35, 0.82))",
              width: "fit-content",
              margin: "0 auto",
            }}
          >
            <Text
              style={{
                ...luxuryHeadingStyle,
                fontSize: "2.2rem",
                color: "#FFFFFF",
              }}
            >
              User Information
            </Text>
          </Flex>
          {/* No user selected, select user ------------------------------ */}
          {!loadingUser && !selectedUser && (
            <View
              marginTop="1rem"
              style={{
                borderRadius: "24px",
                background:
                  "linear-gradient(145deg, rgba(90, 20, 20, 0.92), rgba(40, 35, 35, 0.82))",
                padding: ".5rem .5rem",
                border: "2px solid rgba(0, 0, 0)",
                width: "fit-content",
                margin: "0 auto",
              }}
            >
              <Text style={{ ...luxuryBodyStyle, color: "White" }}>
                Please select a user
              </Text>
            </View>
          )}
          {/* If user selected, will display loading -------------------------- */}
          {loadingUser && (
            <View
              marginTop="1rem"
              style={{
                borderRadius: "24px",
                background:
                  "linear-gradient(145deg, rgba(90, 20, 20, 0.92), rgba(40, 35, 35, 0.82))",
                padding: ".5rem .5rem",
                border: "2px solid rgba(0, 0, 0)",
                width: "fit-content",
                margin: "0 auto",
              }}
            >
              <Text style={{ ...luxuryBodyStyle, color: "White" }}>
                Loading user information
              </Text>
            </View>
          )}
          {/* Loading is false and user has been selected ----------------- */}
          {/* Show that users information in detail */}
          {!loadingUser && selectedUser && (
            <Flex direction="column" gap=".2rem">
              {selectedUser.is_admin && (
                <View
                  position={"absolute"}
                  top={0}
                  right={0}
                  width={"80px"}
                  opacity={0.7}
                >
                  <img src={AdminIcon} width={"100%"} alt="admin" />
                </View>
              )}

              <View
                marginTop="1.5rem"
                marginBottom="1.5rem"
                style={{
                  border: "2px solid rgba(0, 0, 0)",
                  borderRadius: "24px",
                  background:
                    "linear-gradient(145deg, rgba(90, 20, 20, 0.92), rgba(40, 35, 35, 0.82))",
                }}
              >
                <View
                  style={{
                    flex: 1,
                    textAlign: "left",
                    paddingLeft: "1rem",
                  }}
                >
                  <Text
                    style={{
                      ...luxuryBodyStyle,
                      fontWeight: "500",
                      color: "White",
                    }}
                  >
                    Email: {selectedUser.email}
                  </Text>
                  <Text
                    style={{
                      ...luxuryBodyStyle,
                      fontWeight: "500",
                      color: "White",
                    }}
                  >
                    Name: {selectedUser.first_name} {selectedUser.last_name}
                  </Text>
                  <Text
                    style={{
                      ...luxuryBodyStyle,
                      fontWeight: "500",
                      color: "White",
                    }}
                  >
                    Favorite Notes:{" "}
                    {selectedUser.favorite_notes
                      ? selectedUser.favorite_notes
                      : "--"}
                  </Text>
                  <Text
                    style={{
                      ...luxuryBodyStyle,
                      fontWeight: "500",
                      color: "White",
                    }}
                  >
                    Created:{" "}
                    {new Date(selectedUser.created_at).toLocaleString()}
                  </Text>
                  <Text
                    style={{
                      ...luxuryBodyStyle,
                      fontWeight: "500",
                      color: "White",
                    }}
                  >
                    Last Login:{" "}
                    {selectedUser.last_login
                      ? new Date(selectedUser.last_login).toLocaleString()
                      : "Never"}
                  </Text>
                </View>
              </View>
              <Button
                style={buttonStyling}
                onClick={() => setSelectedUser(null)}
                width="fit-content"
                alignSelf="center"
              >
                <Text
                  style={{
                    ...luxuryBodyStyle,
                    fontWeight: "500",
                    color: "White",
                  }}
                >
                  Close Info
                </Text>
              </Button>
            </Flex>
          )}
        </Card>
      </Flex>
    </Flex>
  );
}
