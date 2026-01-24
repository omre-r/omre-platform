// Importing useState hook from React for managing component state
import { useState } from "react";

// Iporting the Navbar component for consistent navigation across pages
import Navbar from "../components/Navbar";
import { Card, View, Flex, Heading, Text, TextField, Button, ToggleButton, ThemeProvider } from "@aws-amplify/ui-react";

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
    const [mode, setMode] = useState("login"); // == Either "login" or "signup" mode
    const isLogin = mode === "login"; // Boolean to check if current mode is login, will show login ui if true
    return (
    // Uncomment below when re-enabling theme !!!
    // Custom theme that will help change aspects of text field and toggle button
    //<ThemeProvider theme={omreTheme}>
    <>
        {/* Navbar that enables navigation across pages */}
        <Navbar />
        {/* Auth container which is the view */}
        <View
            height="80vh"
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
                height="31rem"
                width="30rem"
                margin="1rem auto"
                padding="2rem"
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
                        {isLogin ? "Access your curated collection." : "Join OMRE and define your essence."}
                    </Text>
                    {/* Textfield for email */}
                    <TextField color="#F5F5F5" style={luxuryBodyStyle}
                        label="Email"
                        type="email"
                        placeholder="Enter your email"
                        required
                        marginTop="1rem"
                    />
                    {/* Textfield for password */}
                    <TextField color="#F5F5F5" style={luxuryBodyStyle}
                        label="Password"
                        type="password"
                        placeholder="Enter your password"
                        required
                        marginTop="1rem"
                    />
                    {/* Button to submit form */}
                    <Button color="#F5F5F5" style={luxuryBodyStyle}
                        variation="primary"
                        marginTop=".9rem"
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
                        {isLogin ? "Join Omre" : "Login to Omre"}
                    </ToggleButton>
                </Flex>
            </Card>
        </View>
    </>
    // Uncomment below when re-enabling theme !!!
    //</ThemeProvider>
  );
}