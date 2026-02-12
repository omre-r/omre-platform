/*
IMPORT LIST ------------------------------------------------------------
Explaining only necessary imports
- useNavigate will let us redirect to other pages after finishing an action such as logging in
- @aws-amplify/ui-react components to build out layout
- aws-amplify/auth to handle authentication actions to sign up, confirm sign up, and sign in, they are used on form submit
- 2/1 resendSignUpCode was added, if a user signs up but does not verify they will have to reenter sign up code when signing in for first time
- useAuth from authContext, will call refreshAuth from authContext to refresh page after logging in updating ui
*/ 
import { useState } from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { Card, View, Flex, Heading, Text, TextField, Button, ToggleButton, Link, Grid } from "@aws-amplify/ui-react";
import { signUp, confirmSignUp, signIn, resendSignUpCode} from "aws-amplify/auth";
import LuxuryBackground from "../assets/Luxury Background2.png";
import { useAuth } from "../context/AuthContext";


/*
Custom Styles ----------------------------------------------------
- Custom heading and body style using downloaded font
- Will be used through out to edit aspects of cards
*/
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
    // Routing between pages ----------------------------------------------------
    const navigate = useNavigate();

    // UI Modes ----------------------------------------------------
    // Mode will drive the main form, login vs sign up modes
    // AuthUI is a mode for email confirmation that comes after signin up
    const [mode, setMode] = useState("login");
    const isLogin = mode === "login";
    const [authUI, setAuthUI] = useState("");
    const isVerify = authUI === "verify";

    // Form fields ----------------------------------------------------
    // Shared between login and sign up
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Sign up only
    const [confirmPassword, setConfirmPassword] = useState("");
    const [firstname, setFirstName] = useState("");
    const [lastname, setLastName] = useState("");
    const [selectedNotes, setSelectedNotes] = useState([]); // MAY NOT BE SIGN UP ONLY LATER !!!

    // Verification ----------------------------------------------
    // sets the code and email when submitting sign up
    const [verificationCode, setVerificationCode] = useState("");
    const [verifyEmail, setVerifyEmail] = useState("");

    // Feedback ---------------------------------------------------
    // Recieving error or success messages
    const [message, setMessage] = useState("");

    // Show password toggle ---------------------------------------------------
    const [showPassword, setShowPassword] = useState(false);

    // Auth Context ---------------------------------------------------
    // Syncs authorization app wide after signing in, will refresh after signing in so user can log out or acess admin page
    const { refreshAuth } = useAuth();


    // Toggle Note -----------------------------------------------------------
    // Once note is toggled you take that note and add/remove it from selectedNotes array
    // Can toggle multiple notes
    // Toggles a note in selectedNotes

    const toggleNote = (note) => {
        setSelectedNotes((prev) => {
            if (prev.includes(note)) 
                return prev.filter((n) => n !== note);
            return [...prev, note];
        });
    };

    // Handle Sign Up ---------------------------------------------------------------
    // Initially clear previous messages if testing before
    // Make sure that everything is filled out for sign up form and that passwords match
    // Creates a comma separated string of the selected notes, will be sent to backend with other user information
    async function handleSignUpSubmit() {
        setMessage("");
        if (!email || !password || !confirmPassword || !firstname || !lastname) {
            setMessage("Please fill out all required fields.");
            return;
        }
        if (password !== confirmPassword) {
            setMessage("Passwords do not match.");
            return;
        }
        const favoriteNotesString = selectedNotes.join(", ");
        try {
            // Calling sign up function from Amplify Auth
            // {isSignUpComplete, userId, nextStep } these are returned from the signUp function
            // Email is treated as the username
            // UserAttributes are very simple, custom attribute is the custom favorite notes string
            const {isSignUpComplete, userId, nextStep } = await signUp({
                username: email,
                password: password,
                options: {
                    userAttributes: {
                        email,
                        given_name: firstname,
                        family_name: lastname,
                        "custom:favorite_notes": favoriteNotesString || "",
                    }
                }
            });
            // Set the email for verification step and switch to the verify UI so we can confirm verification code
            setVerifyEmail(email);
            setAuthUI("verify");
            setMessage("Sign up successful! Check email for verification code.");
        } catch (error) {
            if (error.code === "UsernameExistsException") {
                setVerifyEmail(email);
                setAuthUI("verify");
                await handleResendCode(email);
                setMessage("Email already exists. Please verify your email or log in.");
                return;
            }
            setMessage(error.message || "Sign up failed.");
        }
    }



    // Handling verification --------------------------------------------------------------------
    // Ensure we have the email to verify against if user refreshes and basic validation to make sure verification code is entered.
    // Call confirmSignUp function from Amplify Auth, confirms user email with sent verification code
    // After success clear authUI and go send user to the login mode, their email will be initially set for login
    async function handleVerifyCode() {
        setMessage("");
        if (!verifyEmail) {
            setMessage("Missing email to verify. Please sign up again.");
            return;
        }
        if (!verificationCode) {
            setMessage("Please enter the verification code.");
            return;
        }
        try {
            const result = await confirmSignUp({
                username: verifyEmail,
                confirmationCode: verificationCode,
            });
            setMessage("Email verified successfully! You can now log in.");
            setAuthUI("");
            setMode("login");
            setEmail(verifyEmail);
            setVerificationCode(""); 
        }
        catch (error) {
            setMessage(error.message || "Verification failed.");
        }
    }

    // Handling user sign in -------------------------------------------------------------
    // When signing in make sure that all user fields are required to be entered
    // After call the amplify sign in function using their email (username) and password to sign them in
    // After success call refreshAuth function from AuthContext to show proper user authorization if admin, will navigate back to the homepage 
    async function handleSignIn() {
        setMessage("");
        if (!email || !password) {
            setMessage("Please fill out all required fields.");
            return;
        }
        try {
            const result = await signIn({
                username: email,
                password: password, 
            });
            // Making sure user has verified their email and signIn result is not successful because of that, if so will switch to verify UI and resend code just in case
            if (!result?.isSignedIn && result?.nextStep?.signInStep === "CONFIRM_SIGN_UP") {
                setVerifyEmail(email);
                setAuthUI("verify");

                await handleResendCode(email);
                setMessage("Please verify your email before signing in.");
                return;
            }

            await refreshAuth();
            navigate("/");
        }
        catch (error) {
            setMessage(error.message || "Sign in failed.");
        }
    }

    async function handleResendCode(email) {
        setMessage("");
        try {
            if (!email) {
                setMessage("Missing email to resend code.");
                return;
            }
            await resendSignUpCode({ 
                username: email,  
            });
            setMessage("New verification code sent. Check your email.");
        }
        catch (error) {
            setMessage(error.message || "Resend verification failed.");
        }

    }

    return (
    <>
        {/* Navbar ------------------------------------------------------ */}
        <Navbar />
        
        {/* View, where the cards and all information will be held in ---------------------------------------- */}
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

            {/* Card ----------------------------------------------------------------- */}
            {/* will contain necessary information to login, signing up, and verification */}
            {/* For marginTop if isVerify, then we will have the margin top be -41 for proper view, else if its login it will be -25, if not will be 0 */}
            {/* For background went for a darker semi transparent, border is a reddish bronze color with some transparency, border radius to have rounded corners */}
            <Card
                variation="elevated" 
                height="auto"
                width="30rem"
                margin="1rem auto" 
                padding="2rem" 
                marginTop={ isVerify ? "-38rem" : 
                    isLogin ? "-20rem" : "-10rem" 
                }
                backgroundColor="#f6f1ecbc" 
                border="none"
                box-shadow="0 14px 36px rgba(75, 15, 15, 0.15)"
            >
                <Flex 
                direction="column"
                >
                    {/* Verify UI ------------------------------------------------------------- */}
                    {/* Will display success or error messages as well handle submitting the verification code */}
                    {authUI === "verify" ? (
                        <>
                            <Heading
                            level={3} 
                            color="#2B1E1A" 
                            style={luxuryHeadingStyle}
                            marginTop="0rem"
                            >
                            Verify Your Email
                            </Heading>
                            <Text
                            color="#2B1E1A" 
                            style={luxuryBodyStyle}
                            marginTop="-1.2rem"
                            >
                            Please enter verification code!
                            </Text>
                            {message && (
                            <Text>
                                {message}
                            </Text>
                            )}

                            <TextField
                                color="#2B1E1A"
                                style={luxuryBodyStyle}
                                label="Verification Code"
                                type="text"
                                placeholder="Enter verification code"
                                required
                                marginTop="-.2rem"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                            />
                            <Flex direction="row" justifyContent="space-between" gap="1rem">
                                <Button
                                    variation="primary"
                                    color="#2B1E1A"
                                    style={luxuryBodyStyle}
                                    marginTop="1rem"
                                    onClick={handleVerifyCode}
                                    >
                                    Verify
                                </Button>
                                <Button
                                    variation="primary"
                                    color="#2B1E1A"
                                    style={luxuryBodyStyle}
                                    marginTop=".5rem"
                                    onClick={() => handleResendCode(verifyEmail)}
                                    >
                                    Resend Code
                                </Button>
                            </Flex>
                        </>
                    ) 
                    : 
                    (<>
                    
                    {/* Sign up or Login UI --------------------------------------------------------------- */}
                    {/* Based on whichever mode will display proper UI pertaining to it */}
                    {/* Will display success or error messages below text and heading */}
                    {/* Farther below is the scent selection that will be sent above to create a string of user chosen scents */}
                    <Heading level={3} 
                        color="#2B1E1A" 
                        style={luxuryHeadingStyle}
                        marginTop="-.2rem"
                        >
                        {isLogin ? "Return to Your Scent." : "Define Your Essence."}  
                    </Heading>

                    <Text 
                        color="#2B1E1A" 
                        style={luxuryBodyStyle}
                        marginTop="-1.2rem">
                        {isLogin ? "Access your curated collection." : "Join OMRÉ and define your essence."}
                    </Text>

                    {message && ( 
                    <Text>
                        {message}
                    </Text>
                    )}

                    {!isLogin && (
                        <Grid templateColumns="1fr 1fr" gap="0.75rem" marginTop="-.2rem">
                            <TextField
                                color="#2B1E1A"
                                style={luxuryBodyStyle}
                                label="Enter First Name"
                                maxLength={20}
                                type="text"
                                required
                                marginTop="-.2rem"
                                value={firstname}
                                onChange={(e) => setFirstName(e.target.value)}
                            />
                            <TextField
                                color="#2B1E1A"
                                style={luxuryBodyStyle}
                                label="Enter Last Name"
                                maxLength={20}
                                type="text"
                                required
                                marginTop="-.2rem"
                                value={lastname}
                                onChange={(e) => setLastName(e.target.value)}
                            />
                        </Grid>
                    )}

                    <TextField 
                        color="#2B1E1A" 
                        style={luxuryBodyStyle}
                        label="Email"
                        type="email"
                        maxLength={50}
                        required
                        marginTop="-.2rem"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <TextField color="#2B1E1A" style={luxuryBodyStyle}
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        maxLength={50}
                        required
                        marginTop="-.2rem"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    {!isLogin && (
                        <>
                        <TextField
                            color="#2B1E1A"
                            style={luxuryBodyStyle}
                            label="Confirm Password"
                            type={showPassword ? "text" : "password"}
                            maxLength={30}
                            required
                            marginTop="-.2rem"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        
                        {/* TODO: Reimplement on another page for Retaj */}

                        {/*
                        <Heading level={3} 
                            color="#2B1E1A" 
                            style={luxuryBodyStyle}
                            >
                            {"Which notes are you drawn to?"}
                        </Heading>
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
                        </Grid> */}
                        </>
                    )}
                    <Flex direction="row" alignItems="center" justifyContent="space-between" marginTop="0.25rem">
                        <ToggleButton
                            isPressed={showPassword}
                            onClick={() => 
                                setShowPassword((prev) => !prev)
                            }
                        >
                            {showPassword ? "Hide Password" : "Show Password"}
                        </ToggleButton>
                        </Flex>
                    {isLogin && (
                    <Button 
                        color="#2B1E1A" 
                        style={luxuryBodyStyle}
                        variation="primary"
                        marginTop=".9rem"
                        border="1px solid rgba(245, 245, 245, 0.85)"
                        loadingText=""
                        onClick={() => handleSignIn()}
                    >
                    Login
                    </Button>
                    )}

                    {!isLogin && (
                    <Button 
                        color="#2B1E1A" 
                        style={luxuryBodyStyle}
                        variation="primary"
                        marginTop="-.1rem"
                        border="1px solid rgba(245, 245, 245, 0.85)"
                        loadingText=""
                        onClick={() => handleSignUpSubmit()}
                    >
                    Sign Up
                    </Button>
                    )}

                    {/* Toggle button to switch between login and signup modes */}
                    <ToggleButton 
                        color="#2B1E1A" 
                        style={luxuryBodyStyle}
                        isPressed={!isLogin}
                    
                        onClick={() => 
                            {setMode(isLogin ? "signup" : "login")
                            setMessage("")}
                        }
                        alignSelf="center"
                        marginTop=".8rem"
                        marginBottom=".5rem"
                        >
                        {isLogin ? "Join OMRÉ" : "Login to OMRÉ"}
                    </ToggleButton>

                    {isLogin && (
                    <Link href="/ForgotPassword" 
                        style={luxuryBodyStyle} 
                        color="#2B1E1A">
                        Forgot Password?
                    </Link>
                    )}
                    </>
                    )}
                </Flex>
            </Card>
        </View>
    </>
  );
}


// Notes on future improvements:
// TODO: Remove scent choice part and make it part of its own page
