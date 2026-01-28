// Importing useState hook from React for managing component state
import { useState } from "react";

// Iporting the Navbar component for consistent navigation across pages
import Navbar from "../components/Navbar";

import { Card, View, Flex, Heading, Text, TextField, Button, ToggleButton, Link, Grid } from "@aws-amplify/ui-react";

// Importing AWS Amplify Auth module to handle authentication actions
// These functions will be used to sign up, confirm sign up and log in users
// will be used on form submit
import { signUp, confirmSignUp, signIn, signOut} from "aws-amplify/auth";

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

    // come back to these later for confirm sign up and verification code
    const [verificationCode, setVerificationCode] = useState("");

    // Use this function to show different UI for verification code
    const [authUI, setAuthUI] = useState("");
    const [verifyEmail, setVerifyEmail] = useState("");

    // Get feedback from auth actions
    const [authError, setAuthError] = useState("");
    const [authSuccess, setAuthSuccess] = useState("");

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

    // Handles sign up form submission
    async function handleSignUpSubmit() {
        // clear previous messages so we can show new ones to test
        setAuthError("");
        setAuthSuccess("");

        // Check to make sure all is filled out within the sign up form
        if (!email || !password || !confirmPassword || !firstname || !lastname) {
            setAuthError("Please fill out all required fields.");
            return;
        }

        // Basic validation to check if password and confirm password match
        if (password !== confirmPassword) {
            setAuthError("Passwords do not match.");
            return;
        }

        // This creates a comma separated string of selected notes for easy display or submission
        const favoriteNotesString = selectedNotes.join(", ");

        try {
            // Call the signUp function from Amplify Auth
            // {isSignUpComplete, userId, nextStep } these are returned from the signUp function
            const {isSignUpComplete, userId, nextStep } = await signUp({
                username: email, // email will be treated as username
                password: password,
                options: {
                    userAttributes: {
                        // Standard attributes are email, given_name and family_name for first and last name and custom attribute for scent profile
                        email,
                        given_name: firstname,
                        family_name: lastname,
                        "custom:favorite_notes": favoriteNotesString || "", // custom attribute for favorite notes
                    }
                }
            });
            // Set the email for verification step
            setVerifyEmail(email);

            // Switch to verification code UI
            setAuthUI("verify");

            // Show success message, optional for now
            // setAuthSuccess("Sign up successful! Check email for verification code.");
        } catch (error) {
            setAuthError(error?.message || "Sign up failed.");
            // Add other error handling as needed like:
            // User already exists, weak password, invalid email, etc.
        }
    }

    async function handleVerifyCode() {
        // clear previous messages so we can show new ones to test
        setAuthError("");
        setAuthSuccess("");

        // Ensure we have the email to verify against if user refreshes
        if (!verifyEmail) {
            setAuthError("Missing email to verify. Please sign up again.");
            return;
        }

        
        // Basic validation to ensure verification code is entered
        if (!verificationCode) {
            setAuthError("Please enter the verification code.");
            return;
        }

        try {
            // Call confirmSignUp function from Amplify Auth
            // This confirms the user's email with the provided verification code
            const result = await confirmSignUp({
                username: verifyEmail,
                confirmationCode: verificationCode,
            });
            setAuthSuccess("Email verified successfully! You can now log in."); // Success message
            setAuthUI(""); // Clear authUI to show normal login/signup UI
            setMode("login"); // Switch to login mode after successful verification
            setEmail(verifyEmail); // Pre-fill email field for convenience
            setVerificationCode(""); // Clear verification code field
        }
        catch (error) {
            // Handle errors during verification
            setAuthError(error?.message || "Verification failed.");
        }
    }

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
                variation="elevated" // Elevated card style for better visibility
                height="auto" // Height will adjust for the sign up mode
                width="30rem" // Fixed width for consistency
                margin="1rem auto" // Centering the card
                padding="2rem" // Padding inside the card
                marginTop={isLogin ? "-25rem" : "0rem"} // Adjust margin top based on mode
                backgroundColor="rgba(0, 0, 0, 0.75)" // Semi-transparent dark background for luxury feel
                // Subtle border to make the card stand out against the background
                border="1px solid rgba(151, 33, 0, 0.72)" // Luxurious border color, MAY CHANGE LATER
                borderRadius="8px" // Rounded corners for a softer look
            >
                {/* All of this below is within the card */}
                <Flex 
                direction="column"
                >
                    {authUI === "verify" ? (
                        <>
                            <Heading
                            level={3} 
                            color="#F5F5F5" 
                            style={luxuryHeadingStyle}
                            marginTop="-.2rem"
                            >
                            Verify Your Email
                            </Heading>
                            <Text
                            color="#F5F5F5" 
                            style={luxuryBodyStyle}
                            marginTop="-1.2rem"
                            >
                            Please enter verification code!
                            </Text>
                            {/* This is the verification error and success messages */}
                            {authError && (
                            <Text color="red">
                                {authError}
                            </Text>
                            )}
                            {authSuccess && (
                            <Text 
                            color="green">
                                {authSuccess}
                            </Text>
                            )}

                            <TextField
                                color="#F5F5F5"
                                style={luxuryBodyStyle}
                                label="Verification Code"
                                type="text"
                                placeholder="Enter verification code"
                                required
                                marginTop="-.2rem"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                            />
                            <Button
                                variation="primary"
                                marginTop="1rem"
                                onClick={handleVerifyCode}
                                >
                                Verify
                            </Button>
                        </>
                    ) : 
                    (
                    <>
                    {/* Heading and description text */}
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

                    {/* Display authentication error or success messages below the heading for creating and getting verification code */}
                    {authError && (
                    <Text color="red">
                        {authError}
                    </Text>
                    )}
                    {authSuccess && (
                    <Text 
                    color="green">
                        {authSuccess}
                    </Text>
                    )}

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
                    <TextField 
                        color="#F5F5F5" 
                        style={luxuryBodyStyle}
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

                    {/* Button to submit for login */}
                    {isLogin && (
                    <Button color="#F5F5F5" style={luxuryBodyStyle}
                        variation="primary"
                        marginTop=".9rem"
                        //backgroundColor="rgba(82, 18, 0, 0.72)"
                        border="1px solid rgba(245, 245, 245, 0.85)"
                        loadingText=""
                    >
                        Login
                    </Button>
                    )}

                    {/* Button to submit sign up */}
                    {!isLogin && (
                    <Button color="#F5F5F5" style={luxuryBodyStyle}
                        variation="primary"
                        marginTop="-.1rem"
                        //backgroundColor="rgba(82, 18, 0, 0.72)"
                        border="1px solid rgba(245, 245, 245, 0.85)"
                        loadingText=""
                        onClick={() => handleSignUpSubmit()}
                    >
                        {/* Button text based on login/signup mode */}
                        Sign Up
                    </Button>
                    )}

                    {/* Toggle button to switch between login and signup modes */}
                    <ToggleButton 
                        color="#F5F5F5" 
                        style={luxuryBodyStyle}
                        backgroundColor="rgba(82, 18, 0, 0.72)"
                        isPressed={!isLogin}
                        // Toggle the mode on click
                        onClick={() => setMode(isLogin ? "signup" : "login")}
                        alignSelf="center"
                        marginTop=".8rem"
                        marginBottom=".5rem"
                        >
                        {/* Toggle text based on login/signup mode */}
                        {isLogin ? "Join OMRÉ" : "Login to OMRÉ"}
                    </ToggleButton>
                    {isLogin && (
                    <Link href="/ForgotPassword" 
                        style={luxuryBodyStyle} 
                        color="#F5F5F5">
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
                    </>
                    )}
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
// 7. Possibly make the scent part expandable/collapsible to save space