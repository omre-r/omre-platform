// Importing useState hook from React for managing component state
import { useState } from "react";

// Iporting the Navbar component for consistent navigation across pages
import Navbar from "../components/Navbar";
import { Card, View, Flex, Heading, Text, TextField, Button, ToggleButton, ThemeProvider, Link, Grid } from "@aws-amplify/ui-react";

// Importing our custom made theme that will change customization of odd UI components like toggle button and text fields
//import { omreTheme } from "../theme/omreTheme.js";

// Importing AI generated luxury background image so no source
import LuxuryBackground from "../assets/Luxury Background.png";

// Custom styles for heading and body text to enhance the luxurious feel using a imported font from google 
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


export default function Auth() {
    const [mode, setMode] = useState("login"); // == Either "login" or "signup" mode, we will manually set it to login for now
    const isLogin = mode === "login"; // Boolean to check if current mode is login, will show login ui if true

    // State variables for form inputs (not yet connected to any backend logic)
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [email, setEmail] = useState("");
    const [firstname, setFirstName] = useState("");
    const [lastname, setLastName] = useState("");

    // State variable for selected fragrance notes during signup, will be a list of strings
    const [selectedNotes, setSelectedNotes] = useState([]);

    // Takes toggled note vanilla lets say and adds/removes it from selectedNotes array
    // Can be used for all notes by passing in different note strings
    const toggleNote = (note) => {
        // prev is previous state of selectedNotes
        setSelectedNotes((prev) => {
            // If note is already selected, remove it
            if (prev.includes(note)) 
                // This filters out the note to remove it
                return prev.filter((n) => n !== note);
            // Otherwise, add the note to the array
            return [...prev, note];
        });
    };



    return (
    // Uncomment below when re-enabling theme !!!
    // Custom theme that will help change aspects of text field and toggle button
    //<ThemeProvider theme={omreTheme}>
    <>
        {/* Navbar that enables navigation across pages */}
        <Navbar />
        {/* Auth container which is the view */}
        <View
            height="150vh"
            width="100%"
            padding="1rem"
            style={{
                // Setting the luxury background image with proper sizing and positioning
                backgroundImage: `url(${LuxuryBackground})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
            display="flex"
            justifyContent="center"
            alignItems="center"
        >
            {/* Card container inside the view */}
            <Card
                variation="elevated"
                height="auto" // Height will adjust for the sign up mode
                width="30rem"
                margin="1rem auto"
                padding="2rem"
                marginTop={isLogin ? "-30rem" : "-5rem"}
                backgroundColor="rgba(0, 0, 0, 0.75)"
                // Subtle border to make the card stand out against the background
                border="1px solid rgba(151, 33, 0, 0.72)"
                borderRadius="8px"
            >
                {/* All of this below is within the card */}
                <Flex direction="column">
                    <Heading level={3} 
                    color="#F5F5F5" 
                    style={luxuryHeadingStyle}
                    marginTop="-.2rem"
                    >
                        {/* Display the appropriate heading based on login/signup mode */}
                        {isLogin ? "Return to Your Scent." : "Define Your Essence."}  
                    </Heading>
                    <Text 
                    color="#F5F5F5" 
                    style={luxuryBodyStyle}
                    marginTop="-1.2rem">
                        {/* Display the appropriate description based on login/signup mode */}
                        {isLogin ? "Access your curated collection." : "Join OMRÉ and define your essence."}
                    </Text>
                    {!isLogin && (
                        <Grid templateColumns="1fr 1fr" gap="0.75rem" marginTop="-.2rem">
                            <TextField
                                color="#F5F5F5"
                                style={luxuryBodyStyle}
                                label="Enter First Name"
                                type="text"
                                placeholder="First Name"
                                required
                                marginTop="-.2rem"
                                value={firstname}
                                onChange={(e) => setFirstName(e.target.value)}
                            />
                            <TextField
                                color="#F5F5F5"
                                style={luxuryBodyStyle}
                                label="Enter Last Name"
                                type="text"
                                placeholder="Last Name"
                                required
                                marginTop="-.2rem"
                                value={lastname}
                                onChange={(e) => setLastName(e.target.value)}
                            />
                        </Grid>
                    )}


                    {/* Textfield for email */}
                    <TextField color="#F5F5F5" style={luxuryBodyStyle}
                        label="Email"
                        type="email"
                        placeholder="Enter your email"
                        required
                        marginTop="-.2rem"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    {/* Textfield for password */}
                    <TextField color="#F5F5F5" style={luxuryBodyStyle}
                        label="Password"
                        type="password"
                        placeholder="Enter your password"
                        required
                        marginTop="-.2rem"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {/* Textfield for confirm password, if we are not in login mode it will toggle 
                    and make the confirm password textfield visible */}
                    {!isLogin && (
                        <>
                        <TextField
                            color="#F5F5F5"
                            style={luxuryBodyStyle}
                            label="Confirm Password"
                            type="password"
                            placeholder="Confirm your password"
                            required
                            marginTop="-.2rem"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        <Heading level={3} 
                        color="#F5F5F5" 
                        style={luxuryBodyStyle}
                        >
                        {"Which notes are you drawn to?"}
                    </Heading>

                    {/* This section allows users to select their favorite notes and lets them toggle them creating a string above */}
                    {/* If isPressed it will make selected notes include that note */}
                    {/* Toggle note then takes that note sends it to the function and adds it to the list */}
                    
                    <Grid
                    templateColumns="repeat(2, 1fr)"
                    gap="0.5rem"
                    marginBottom="1rem"
                    >
                    <ToggleButton isPressed={selectedNotes.includes("Vanilla")} onClick={() => toggleNote("Vanilla")}>Vanilla</ToggleButton>
                    <ToggleButton isPressed={selectedNotes.includes("Rose")} onClick={() => toggleNote("Rose")}>Rose</ToggleButton>
                    <ToggleButton isPressed={selectedNotes.includes("Oud")} onClick={() => toggleNote("Oud")}>Oud</ToggleButton>
                    <ToggleButton isPressed={selectedNotes.includes("Bergamot")} onClick={() => toggleNote("Bergamot")}>Bergamot</ToggleButton>
                    <ToggleButton isPressed={selectedNotes.includes("Sandalwood")} onClick={() => toggleNote("Sandalwood")}>Sandalwood</ToggleButton>
                    <ToggleButton isPressed={selectedNotes.includes("Jasmine")} onClick={() => toggleNote("Jasmine")}>Jasmine</ToggleButton>
                    <ToggleButton isPressed={selectedNotes.includes("Cedarwood")} onClick={() => toggleNote("Cedarwood")}>Cedarwood</ToggleButton>
                    <ToggleButton isPressed={selectedNotes.includes("Amber")} onClick={() => toggleNote("Amber")}>Amber</ToggleButton>
                    </Grid>
                        </>
                    )}

                    {/* Button to submit form */}
                    <Button color="#F5F5F5" style={luxuryBodyStyle}
                        variation="primary"
                        marginTop="-.1rem"
                        backgroundColor="rgba(82, 18, 0, 0.72)"
                        border="1px solid rgba(0, 0, 0, 0.55)"
                        loadingText=""
                        // Remove alert later, just for testing
                        onClick={() => alert(isLogin ? "Logging in..." : "Signing up...")}
                    >
                        {/* Button text based on login/signup mode */}
                        {isLogin ? "Login" : "Sign Up"}
                    </Button>
                    {/* Toggle button to switch between login and signup modes */}
                    <ToggleButton color="#F5F5F5" style={luxuryBodyStyle}
                        backgroundColor="rgba(82, 18, 0, 0.72)"
                        isPressed={!isLogin}
                        // Toggle the mode on click
                        onClick={() => setMode(isLogin ? "signup" : "login")}
                        alignSelf="center"
                        >
                        {/* Toggle text based on login/signup mode */}
                        {isLogin ? "Join OMRÉ" : "Login to OMRÉ"}
                    </ToggleButton>
                    {isLogin && (<Link href="/ForgotPassword" style={luxuryBodyStyle} color="#F5F5F5">
                        Forgot Password?
                    </Link>
                    )}

                        
                        {/* Placeholder text to test that my functions are working properly 
                        for setting email password and confirm password */}
                        {/* <Text
                            color="#F5F5F5" 
                            style={luxuryBodyStyle}
                            alignSelf="center"
                            marginTop="1rem"
                        >
                            Email: {email}<br></br>
                            Password: {password}<br></br>
                            Confirm Password: {confirmPassword}<br></br>
                            Notes: {selectedNotes.join(", ")}
                        </Text> */}
                </Flex>
            </Card>
        </View>
    </>
    // Uncomment below when re-enabling theme !!!
    //</ThemeProvider>
  );
}


// Notes on future improvements:
// 1. Obviously connection to backend for authentication
// 2. Form validation for email format, password strength, matching passwords
// 3. Better error handling and user feedback on failed login/signup attempts
// 4. Fixing the theme issues with text fields and toggle buttons as noted in OmreTheme.js
// 7. Possibly make the scent part expandable/collapsible to save space