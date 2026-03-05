/*
IMPORT LIST --------------------------------------------------------------------------------------------------
Explaining only necessary imports
    - Components brought in from amplfiy UI to use
    - functions reset password and confirmResetPassword from amplify/auth
*/ 
import {useState }from 'react';
import Navbar from "../components/Navbar";
import LuxuryBackground from "../assets/Luxury Background2.png";
import { Card, View, Flex, Link, Text, TextField, Button, Heading } from "@aws-amplify/ui-react";
import {resetPassword, confirmResetPassword} from "aws-amplify/auth";
import { Eye, EyeOff } from "lucide-react";

/*
Custom Styles ------------------------------------------------------------------------------------------------
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
const luxuryCompactStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 200,
  fontSize: "1.1rem",   
  letterSpacing: "0.15px",
};


// Forgot Password -----------------------------------------------------------------------------------------
// If user has forgot password will go throough the process of sending a reset code to their email and then 
// entering that reset code with new password and new password confirmation, after submitted will take 
// user back to normal AuthUI
const ForgotPassword = () => {
    // Variables and UI checks -------------------------------------------------------------------
    const [authUI, setAuthUI] = useState("");
    const isVerify = authUI === "verify";
    const [email, setEmail] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [passwordRequirements, setPasswordRequirements] = useState({
        length: false,
        uppercase: false,
        number: false,
        specialChar: false,
        });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Feedback Messages ------------------------------------------------------------------------
    const [authError, setAuthError] = useState("");
    const [authSuccess, setAuthSuccess] = useState("");


    // Real-time password requirements checker -----------------------------------------
    const handlePasswordChange = (e) => {
    const value = e.target.value;
        setNewPassword(value);

        setPasswordRequirements({
            length: value.length >= 8,
            uppercase: /[A-Z]/.test(value),
            number: /[0-9]/.test(value),
            // Special character is any character that is not these characters "^"
            specialChar: /[^A-Za-z0-9]/.test(value)
        });
    };

    // Function to send reset code -------------------------------------------------------
    // user enters email (username), if no error will send and change ui to verification mode
    async function handleSendResetCode() {
        setAuthError("");
        setAuthSuccess("");
        if (!email) {
            setAuthError("Please enter your email!");
            return;
        }
        try {
            await resetPassword({
                username: email 
            })
            setAuthUI("verify");
            setAuthSuccess("Verification code sent. Check your email.");
        }
        catch (error) {
            setAuthError(error?.message || "Verification failed.");
        }
    }

    // Function to handle new password ---------------------------------------------------------------
    // Fill out all required fields with email, verification code sent, and new password
    // Has validation to check that passwords match
    async function handleNewPassword() {
        setAuthError("");
        setAuthSuccess("");
        if (!email || !verificationCode || !newPassword || !confirmPassword) {
            setAuthError("Please fill out all required fields.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setAuthError("Passwords do not match.");
            return;
        }
        try {
            await confirmResetPassword({
                username: email,
                confirmationCode: verificationCode,
                newPassword: newPassword,
            });
            setAuthSuccess("Password reset successfully.");
            setAuthUI("");  
        }
        catch(error) {
            setAuthError(error?.message || "Failed to reset password.");
        }
    }

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
                        height="auto" 
                        width="30rem"
                        margin="1rem auto"
                        padding="2rem"
                        marginTop= { isVerify ? "-15rem" : "-30rem" }
                        backgroundColor="#f6f1ecbc"
                        border="none"
                        box-shadow="0 14px 36px rgba(75, 15, 15, 0.15)"
                        >   
                        <Flex direction="column">

                            {/* UI for new password and verification ----------------------------------------------- */}
                            {/* Confirm verify code and enter information for new password  */}
                            {authUI === "verify" ? (
                            <>
                            <Heading level={3} 
                                color="#2B1E1A" 
                                style={luxuryHeadingStyle}
                                marginTop="-.2rem"
                                marginBottom="1rem"
                                >
                                Enter information to reset password.
                            </Heading>

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
                                placeholder="123456"
                                type="text"
                                required
                                marginTop="-.2rem"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                            />
                                <TextField
                                    color="#2B1E1A"
                                    style={luxuryBodyStyle}
                                    label="Enter new password"
                                    placeholder="************"
                                    maxLength={50}
                                    type={showPassword ? "text" : "password"}
                                    required
                                    marginTop="-.2rem"
                                    value={newPassword}
                                    onChange={handlePasswordChange}
                                    inputStyles={{
                                        paddingRight: "1rem",
                                    }}
                                    innerEndComponent={
                                        <View
                                            as="button"
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            style={{
                                            all: "unset",
                                            cursor: "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            paddingRight: "0.5rem",
                                            height: "100%",
                                            pointerEvents: "auto",
                                            }}
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </View>
                                    }
                                />
                                <TextField
                                    color="#2B1E1A"
                                    style={luxuryBodyStyle}
                                    label="Confirm new password"
                                    placeholder="************"
                                    type={showConfirmPassword ? "text" : "password"}
                                    maxLength={50}
                                    required
                                    marginTop="-.2rem"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    inputStyles={{
                                        paddingRight: "1rem",
                                    }}
                                    innerEndComponent={
                                    <View
                                        as="button"
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        style={{
                                        all: "unset",
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        paddingRight: "0.5rem",
                                        height: "100%",
                                        pointerEvents: "auto",
                                        }}
                                    >
                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </View>
                                    }
                                />
                                <View marginTop="-.6rem">
                                    <Text style={luxuryBodyStyle}>Password must include:</Text>
                                    <Text style={{ ...luxuryCompactStyle, color: passwordRequirements.length ? "green" : "red" }}>
                                        At least 8 characters
                                    </Text>
                                    <Text style={{ ...luxuryCompactStyle, color: passwordRequirements.uppercase ? "green" : "red" }}>
                                        At least one uppercase letter
                                    </Text>
                                    <Text style={{ ...luxuryCompactStyle, color: passwordRequirements.number ? "green" : "red" }}>
                                        At least one number
                                    </Text>
                                    <Text style={{ ...luxuryCompactStyle, color: passwordRequirements.specialChar ? "green" : "red" }}>
                                        At least one special character
                                    </Text>
                                </View>
                            <Button
                                variation="primary"
                                marginTop="1rem"
                                color="#2B1E1A"
                                style={luxuryBodyStyle} 
                                onClick={handleNewPassword}
                                >
                                Submit
                            </Button>
                            </>
                            ) : 
                            (
                            <>
                            {/* Normal Forgot Password UI -------------------------------------------------- */}
                            {/* Will send reset code to email if correct information entered */}
                            <Text 
                                style={luxuryHeadingStyle} 
                                color="#2B1E1A"
                                textAlign="center"
                                marginBottom="1.5rem"
                            >
                            Forgot Password?
                            </Text>
                            <Text 
                                style={luxuryBodyStyle} 
                                color="#2B1E1A"
                                textAlign="center"
                                marginTop="-2.5rem"
                            >
                            We will send you an email to reset your password.
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
                                label="Email"
                                type="email"
                                placeholder="e.g., john.smith@email.com"
                                maxLength={50}
                                required
                                marginTop="-0rem"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <Button 
                                style={luxuryBodyStyle}
                                color="#2B1E1A"
                                borderRadius="8px"
                                marginTop="2rem"
                                onClick={() => handleSendResetCode()}
                            >
                                Send Reset Code
                            </Button>
                            <Link 
                                href="/Auth" 
                                style={luxuryBodyStyle} color="#2B1E1A"
                                textAlign="center"
                                marginTop="1.5rem"
                                >
                                Need to login?
                            </Link>
                            </>
                            )}
                        </Flex>
                    </Card>
                </View>
        </>
    );
};

export default ForgotPassword;