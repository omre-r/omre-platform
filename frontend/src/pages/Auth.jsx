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
import { Eye, EyeOff } from "lucide-react";


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
    const [passwordRequirements, setPasswordRequirements] = useState({
        length: false,
        uppercase: false,
        number: false,
        specialChar: false,
        });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Real-time password requirements checker
    const handlePasswordChange = (e) => {
    const value = e.target.value;
        setPassword(value);

        setPasswordRequirements({
            length: value.length >= 8,
            uppercase: /[A-Z]/.test(value),
            number: /[0-9]/.test(value),
            specialChar: /[!@#$%^&*]/.test(value),
        });
};

    // Verification ----------------------------------------------
    // sets the code and email when submitting sign up
    const [verificationCode, setVerificationCode] = useState("");
    const [verifyEmail, setVerifyEmail] = useState("");

    // Feedback ---------------------------------------------------
    // Recieving the error or success messages when creating an account, verifying, or signing in. 
    const [authError, setAuthError] = useState("");
    const [authSuccess, setAuthSuccess] = useState("");

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
        setAuthError("");
        setAuthSuccess("");
        if (!email || !password || !confirmPassword || !firstname || !lastname) {
            setAuthError("Please fill out all required fields.");
            return;
        }
        if (password !== confirmPassword) {
            setAuthError("Passwords do not match.");
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
            setAuthSuccess("Sign up successful! Check email for verification code.");
        } catch (error) {
            setAuthError(error.message || "Sign up failed.");
        }
    }



    // Handling verification --------------------------------------------------------------------
    // Ensure we have the email to verify against if user refreshes and basic validation to make sure verification code is entered.
    // Call confirmSignUp function from Amplify Auth, confirms user email with sent verification code
    // After success clear authUI and go send user to the login mode, their email will be initially set for login
    async function handleVerifyCode() {
        setAuthError("");
        setAuthSuccess("");
        if (!verifyEmail) {
            setAuthError("Missing email to verify. Please sign up again.");
            return;
        }
        if (!verificationCode) {
            setAuthError("Please enter the verification code.");
            return;
        }
        try {
            const result = await confirmSignUp({
                username: verifyEmail,
                confirmationCode: verificationCode,
            });
            setAuthSuccess("Email verified successfully! You can now log in.");
            setAuthUI("");
            setMode("login");
            setEmail(verifyEmail);
            setVerificationCode(""); 
        }
        catch (error) {
            setAuthError(error.message || "Verification failed.");
        }
    }

    // Handling user sign in -------------------------------------------------------------
    // When signing in make sure that all user fields are required to be entered
    // After call the amplify sign in function using their email (username) and password to sign them in
    // After success call refreshAuth function from AuthContext to show proper user authorization if admin, will navigate back to the homepage 
    async function handleSignIn() {
        setAuthError("");
        setAuthSuccess("");
        if (!email || !password) {
            setAuthError("Please fill out all required fields.");
            return;
        }
        try {
            const result = await signIn({
                username: email,
                password: password, 
            });
            // How to make conditional where if user is not verified they will have to resend verification and reconfirm
            // What would this line of code look like? Have to do more research
            // if (result) ... {
            // setVerifyEmail(email);
            // setAuthUI("verify");
            // await handleResendCode;
            // return;
            // }

            await refreshAuth();
            navigate("/");
        }
        catch (error) {
            setAuthError(error.message || "Sign in failed.");
        }
    }

    // Handling verification if user tries to sign in when unverified -----------------------------------
    async function handleResendCode(email) {
        setAuthError("");
        setAuthSuccess("");
        try {
            await resendSignUpCode({ 
                username: email,  
            });
            setAuthSuccess("New verification code sent. Check your email.");
        }
        catch (error) {
            setAuthError(error.message || "Resend verification failed.");
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
                    isLogin ? "-25rem" : "2rem" 
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
                            <Button
                                variation="primary"
                                color="#2B1E1A"
                                style={luxuryBodyStyle}
                                marginTop="1rem"
                                onClick={handleVerifyCode}
                                >
                                Verify
                            </Button>
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

                    {authError && ( 
                    <Text 
                        color="red">
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
                                color="#2B1E1A"
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
                                color="#2B1E1A"
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

                    <TextField 
                        color="#2B1E1A" 
                        style={luxuryBodyStyle}
                        label="Email"
                        type="email"
                        placeholder="Enter your email"
                        required
                        marginTop="-.2rem"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <Flex direction="row" alignItems="flex-end" gap="0.5rem" marginTop="-.2rem">
                    <TextField
                        color="#2B1E1A"
                        style={luxuryBodyStyle}
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        required
                        value={password}
                        onChange={handlePasswordChange}
                        width="100%"
                    />
                    <span onClick={() => setShowPassword(!showPassword)} style={{ cursor: "pointer" }}>
                        {showPassword ? <EyeOff size={25} /> : <Eye size={25} />}
                    </span>
                    </Flex>

                    {!isLogin && (
                    <View marginTop="0.2rem">
                        <Text style={luxuryBodyStyle}>Password must include:</Text>
                        <Text style={{ ...luxuryBodyStyle, color: passwordRequirements.length ? "green" : "red" }}>
                          At least 8 characters
                        </Text>
                        <Text style={{ ...luxuryBodyStyle, color: passwordRequirements.uppercase ? "green" : "red" }}>
                          At least one uppercase letter
                        </Text>
                        <Text style={{ ...luxuryBodyStyle, color: passwordRequirements.number ? "green" : "red" }}>
                          At least one number
                        </Text>
                        <Text style={{ ...luxuryBodyStyle, color: passwordRequirements.specialChar ? "green" : "red" }}>
                          At least one special character
                        </Text>
                    </View>
                    )}

                    {!isLogin && (
                        <>
                    <Flex direction="row" alignItems="flex-end" gap="0.5rem" marginTop="-.2rem">
                    <TextField
                        color="#2B1E1A"
                        style={luxuryBodyStyle}
                        label="Confirm Password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        width="100%"
                    />
                    <span 
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                        style={{ cursor: "pointer" }}
                    >
                        {showConfirmPassword ? <EyeOff size={25} /> : <Eye size={25} />}
                    </span>
                    </Flex>

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
                        </Grid>
                        </>
                    )}

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
                        onClick={() => setMode(isLogin ? "signup" : "login")}
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

// TODO: When signing up make sure that verification is done, can sign up, leave verification page and sign in. 
// Made HandleResendCode helper, will be send to the specific email but need to figure out how conditonal
// will look for HandleSignIn so we can see that this person is not verified and force them to verify
// as well maybe on verify ui make a button to resend verification code. 
