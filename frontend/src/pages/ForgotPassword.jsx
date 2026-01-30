import {useState }from 'react';

import Navbar from "../components/Navbar";
import LuxuryBackground from "../assets/Luxury Background.png";

import { Card, View, Flex, Link, Text, TextField, Button, Heading } from "@aws-amplify/ui-react";

import {resetPassword, confirmResetPassword} from "aws-amplify/auth";

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

const ForgotPassword = () => {
    const [authUI, setAuthUI] = useState("");
    const isVerify = authUI === "verify"; // Check if is verify to show the verify screen
    const [email, setEmail] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Get feedback from auth actions
    const [authError, setAuthError] = useState("");
    const [authSuccess, setAuthSuccess] = useState("");

    // Function for sending the reset code
    async function handleSendResetCode() {
        //Make sure error is cleared
        setAuthError("");
        setAuthSuccess("");

        // If email is not entered
        if (!email) {
            setAuthError("Please enter your email!");
            return;
        }
        try {
            await resetPassword({
                username: email // Username is always email in our db 
            })
            // On success
            setAuthUI("verify"); // change to the verify screen
            setAuthSuccess("Verification code sent. Check your email.");
        }
        catch (error) {
            setAuthError(error?.message || "Verification failed.");
        }
    }

    async function handleNewPassword() {
        // Reset messages
        setAuthError("");
        setAuthSuccess("");

        // Fill out everything that is require
        if (!email || !verificationCode || !newPassword || !confirmPassword) {
            setAuthError("Please fill out all required fields.");
            return;
        }

        // If passwords are not the same
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
            // On success
            setAuthSuccess("Password reset successfully.");
            // will bring us back to the reset password screen so we can see success message
            setAuthUI("");  
            // Possibly route back to the home page eventuall, easy change !!!
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
                        // Setting the luxury background image with proper sizing and positioning
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
                        height="auto" // Height will adjust for the sign up mode
                        width="30rem"
                        margin="1rem auto"
                        padding="2rem"
                        marginTop= { isVerify ? "-25rem" : "-30rem" }
                        backgroundColor="rgba(0, 0, 0, 0.75)"
                        // Subtle border to make the card stand out against the background
                        border="1px solid rgba(151, 33, 0, 0.72)"
                        borderRadius="8px"
                        >   
                        <Flex direction="column">
                            {/* If we are in the verify state condition where we are entering the code  */}
                            {authUI === "verify" ? (
                            <>
                            <Heading level={3} 
                                color="#F5F5F5" 
                                style={luxuryHeadingStyle}
                                marginTop="-.2rem"
                                marginBottom="1rem"
                                >
                                Enter information to reset password.
                            </Heading>
                            
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
                            <TextField
                                color="#F5F5F5"
                                style={luxuryBodyStyle}
                                label="Enter new password"
                                type="password"
                                placeholder="Enter new password"
                                required
                                marginTop="-.2rem"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <TextField
                                color="#F5F5F5"
                                style={luxuryBodyStyle}
                                label="Confirm new password"
                                type="password"
                                placeholder="Confirm new password"
                                required
                                marginTop="-.2rem"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            <Button
                                variation="primary"
                                marginTop="1rem"
                                onClick={handleNewPassword}
                                >
                                Submit
                            </Button>
                            </>
                            ) : 
                            // Regular reset password screen below 
                            (
                            <>
                            <Text 
                                style={luxuryHeadingStyle} 
                                color="#F5F5F5"
                                textAlign="center"
                                marginBottom="1.5rem"
                            >
                                Forgot Password?
                            </Text>
                            <Text 
                                style={luxuryBodyStyle} 
                                color="#F5F5F5"
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
                                color="#F5F5F5" 
                                style={luxuryBodyStyle}
                                label="Email"
                                type="email"
                                placeholder="Enter your email"
                                required
                                marginTop="-0rem"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <Button 
                                style={luxuryBodyStyle}
                                backgroundColor="rgba(82, 18, 0, 0.92)"
                                color="#F5F5F5"
                                borderColor="rgba(0,0,0,0.45)"
                                borderRadius="8px"
                                marginTop="2rem"
                                // On click will use the send reset code function 
                                onClick={() => handleSendResetCode()}
                            >
                                Send Reset Code
                            </Button>
                            {/* Link to navigate back to login page */} 
                            <Link 
                                href="/Auth" 
                                style={luxuryBodyStyle} color="#F5F5F5"
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