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
import {
  Card,
  View,
  Flex,
  Heading,
  Text,
  TextField,
  Button,
  ToggleButton,
  Link,
  Grid,
} from "@aws-amplify/ui-react";
import {
  signUp,
  confirmSignUp,
  signIn,
  resendSignUpCode,
} from "aws-amplify/auth";
import LuxuryBackground from "../assets/Luxury Background2.png";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import { updateLastLoginReq, getIDToken } from "../requests";

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
const luxuryCompactStyle = {
  fontFamily: "'Cormorant Garamond', serif",
  fontWeight: 200,
  fontSize: "1.1rem",
  letterSpacing: "0.15px",
};
const inputStyle = {
  ...luxuryBodyStyle,
  borderRadius: "12px",
  color: "#2B1E1A",
  padding: ".75rem .75rem",
};
const eyeStyling = {
  all: "unset",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  paddingRight: "0.5rem",
  height: "100%",
  pointerEvents: "auto",
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
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    number: false,
    specialChar: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // If a user misses a field when signing up or signing in -------------------------------
  const [showMissingField, setShowMissingField] = useState(false);
  const emailMissing = showMissingField && !email.trim();
  const passwordMissing = showMissingField && !password.trim();
  const confirmPasswordMissing = showMissingField && !confirmPassword.trim();
  const firstnameMissing = showMissingField && !firstname.trim();
  const lastnameMissing = showMissingField && !lastname.trim();

  // Real-time password requirements checker
  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);

    setPasswordRequirements({
      length: value.length >= 8,
      uppercase: /[A-Z]/.test(value),
      number: /[0-9]/.test(value),
      // Special character is any character that is not these characters "^"
      specialChar: /[^A-Za-z0-9]/.test(value),
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

  // Handle Sign Up ---------------------------------------------------------------
  // Initially clear previous messages if testing before
  // Make sure that everything is filled out for sign up form and that passwords match
  async function handleSignUpSubmit() {
    setAuthError("");
    setAuthSuccess("");
    if (!email || !password || !confirmPassword || !firstname || !lastname) {
      setShowMissingField(true);
      setAuthError("Please fill out all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      setShowMissingField(true);
      setAuthError("Passwords do not match.");
      return;
    }
    try {
      // Calling sign up function from Amplify Auth
      // {isSignUpComplete, userId, nextStep } these are returned from the signUp function
      // Email is treated as the username
      // UserAttributes are very simple, custom attribute is the custom favorite notes string
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: email,
        password: password,
        options: {
          userAttributes: {
            email,
            given_name: firstname,
            family_name: lastname,
            "custom:favorite_notes": favoriteNotesString || "",
          },
        },
      });
      // Set the email for verification step and switch to the verify UI so we can confirm verification code
      setVerifyEmail(email);
      setAuthUI("verify");
      setAuthSuccess("Sign up successful! Check email for verification code.");
    } catch (error) {
      if (error.code === "UsernameExistsException") {
        setVerifyEmail(email);
        setAuthUI("verify");
        await handleResendCode(email);
        setAuthError(
          "Email already exists. Please verify your email or log in.",
        );
        return;
      }
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
    } catch (error) {
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
      setShowMissingField(true);
      setAuthError("Please fill out all required fields.");
      return;
    }
    try {
      const result = await signIn({
        username: email,
        password: password,
      });
      // Making sure user has verified their email and signIn result is not successful because of that, if so will switch to verify UI and resend code just in case
      if (
        !result?.isSignedIn &&
        result?.nextStep?.signInStep === "CONFIRM_SIGN_UP"
      ) {
        setVerifyEmail(email);
        setAuthUI("verify");

        await handleResendCode(email);
        setAuthError("Please verify your email before signing in.");
        return;
      }
      await refreshAuth();

      //This could be awaited, change this if you prefer.
      const userid = getIDToken()?.sub;
      updateLastLoginReq(userid).then(
        (res) => !res.success && console.log("failed to update lastlogin"),
      );

      navigate("/");
    } catch (error) {
      setAuthError(error.message || "Sign in failed.");
    }
  }

  // Handling verification if user tries to sign in when unverified -----------------------------------
  async function handleResendCode(email) {
    setAuthError("");
    setAuthSuccess("");
    try {
      if (!email) {
        setAuthError("Missing email to resend code.");
        return;
      }
      await resendSignUpCode({
        username: email,
      });
      setAuthSuccess("New verification code sent. Check your email.");
    } catch (error) {
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
          marginTop={isVerify ? "-38rem" : isLogin ? "-23rem" : "-5rem"}
          backgroundColor="#f6f1ec2a"
          border="none"
          boxShadow="0 14px 36px rgba(75, 15, 15, 0.15)"
          style={{
            background: "rgba(255, 248, 244, 0.05)",
            backdropFilter: "blur(8px)",
            borderRadius: "34px",
          }}
        >
          <Flex direction="column">
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
                {authError && <Text color="red">{authError}</Text>}
                {authSuccess && <Text color="green">{authSuccess}</Text>}

                <TextField
                  color="#2B1E1A"
                  style={luxuryBodyStyle}
                  label="Verification Code"
                  type="text"
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
            ) : (
              <>
                {/* Sign up or Login UI --------------------------------------------------------------- */}
                {/* Based on whichever mode will display proper UI pertaining to it */}
                {/* Will display success or error messages below text and heading */}
                {/* Farther below is the scent selection that will be sent above to create a string of user chosen scents */}
                <Heading
                  level={3}
                  color="#2B1E1A"
                  style={luxuryHeadingStyle}
                  marginTop="-.2rem"
                >
                  {isLogin ? "Return to Your Scent." : "Define Your Essence."}
                </Heading>

                <Text
                  color="#2B1E1A"
                  style={luxuryBodyStyle}
                  marginTop="-1.2rem"
                >
                  {isLogin
                    ? "Access your curated collection."
                    : "Join OMRÉ and define your essence."}
                </Text>

                {authError && <Text color="red">{authError}</Text>}

                {authSuccess && <Text color="green">{authSuccess}</Text>}

                {!isLogin && (
                  <Grid
                    templateColumns="1fr 1fr"
                    gap="0.75rem"
                    marginTop="-.2rem"
                  >
                    <TextField
                      color="#2B1E1A"
                      style={{
                        ...inputStyle,
                      }}
                      label={
                        <span>
                          Enter First Name{" "}
                          <span
                            style={{
                              color: firstnameMissing
                                ? "#ff002f"
                                : "rgba(43, 30, 26, 0)",
                            }}
                          >
                            *
                          </span>
                        </span>
                      }
                      placeholder="e.g., John"
                      maxLength={20}
                      type="text"
                      required
                      marginTop="-.2rem"
                      value={firstname}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                    <TextField
                      color="#2B1E1A"
                      style={{
                        ...inputStyle,
                      }}
                      label={
                        <span>
                          Enter Last Name{" "}
                          <span
                            style={{
                              color: lastnameMissing
                                ? "#ff002f"
                                : "rgba(43, 30, 26, 0)",
                            }}
                          >
                            *
                          </span>
                        </span>
                      }
                      placeholder="e.g., Smith"
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
                  style={{
                    ...inputStyle,
                  }}
                  label={
                    <span>
                      Email{" "}
                      <span
                        style={{
                          color: emailMissing
                            ? "#ff002f"
                            : "rgba(43, 30, 26, 0)",
                        }}
                      >
                        *
                      </span>
                    </span>
                  }
                  type="email"
                  placeholder="e.g., john.smith@email.com"
                  maxLength={50}
                  required
                  marginTop="-.2rem"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                  }}
                  hasError={emailMissing}
                />

                <Flex
                  direction="row"
                  alignItems="flex-end"
                  gap="0.5rem"
                  marginTop="-.2rem"
                >
                  <TextField
                    color="#2B1E1A"
                    style={{
                      ...inputStyle,
                    }}
                    label={
                      <span>
                        Password{" "}
                        <span
                          style={{
                            color: passwordMissing
                              ? "#ff002f"
                              : "rgba(43, 30, 26, 0)",
                          }}
                        >
                          *
                        </span>
                      </span>
                    }
                    type={showPassword ? "text" : "password"}
                    placeholder="************"
                    maxLength={50}
                    required
                    value={password}
                    onChange={(e) => {
                      handlePasswordChange(e);
                    }}
                    hasError={passwordMissing}
                    width="100%"
                    inputStyles={{
                      paddingRight: "1rem",
                    }}
                    innerEndComponent={
                      <View
                        as="button"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          ...eyeStyling,
                        }}
                      >
                        {showPassword ? (
                          <Eye size={20} />
                        ) : (
                          <EyeOff size={20} />
                        )}
                      </View>
                    }
                  />
                </Flex>

                {!isLogin && (
                  <>
                    <Flex
                      direction="row"
                      alignItems="flex-end"
                      gap="0.5rem"
                      marginTop="-.2rem"
                    >
                      <TextField
                        color="#2B1E1A"
                        style={{
                          ...inputStyle,
                        }}
                        label={
                          <span>
                            Confirm Password{" "}
                            <span
                              style={{
                                color: confirmPasswordMissing
                                  ? "#ff002f"
                                  : "rgba(43, 30, 26, 0)",
                              }}
                            >
                              *
                            </span>
                          </span>
                        }
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        placeholder="************"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        width="100%"
                        inputStyles={{
                          paddingRight: "1rem",
                        }}
                        innerEndComponent={
                          <View
                            as="button"
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            style={{
                              ...eyeStyling,
                            }}
                          >
                            {showConfirmPassword ? (
                              <Eye size={20} />
                            ) : (
                              <EyeOff size={20} />
                            )}
                          </View>
                        }
                      />
                    </Flex>

                    {/* When on the login tab will display criteria for user password -------------------------------------- */}
                    {!isLogin && (
                      <View marginTop="-.6rem">
                        <Text style={luxuryBodyStyle}>
                          Password must include:
                        </Text>
                        <Text
                          style={{
                            ...luxuryCompactStyle,
                            color: passwordRequirements.length
                              ? "green"
                              : "red",
                          }}
                        >
                          At least 8 characters
                        </Text>
                        <Text
                          style={{
                            ...luxuryCompactStyle,
                            color: passwordRequirements.uppercase
                              ? "green"
                              : "red",
                          }}
                        >
                          At least one uppercase letter
                        </Text>
                        <Text
                          style={{
                            ...luxuryCompactStyle,
                            color: passwordRequirements.number
                              ? "green"
                              : "red",
                          }}
                        >
                          At least one number
                        </Text>
                        <Text
                          style={{
                            ...luxuryCompactStyle,
                            color: passwordRequirements.specialChar
                              ? "green"
                              : "red",
                          }}
                        >
                          At least one special character
                        </Text>
                      </View>
                    )}
                  </>
                )}

                {/* If logging in will display the button to handleSignIn */}
                {isLogin && (
                  <Button
                    style={{
                      ...luxuryBodyStyle,
                      fontSize: "1rem",
                      padding: "0.9rem 2.2rem",
                      border: "1px solid rgba(255,255,255,0.35)",
                      borderRadius: "28px",
                      background:
                        "linear-gradient(145deg,  #9a2424, rgba(20,20,20,0.9))",
                      color: "#FFFFFF",
                      cursor: "pointer",
                      boxShadow: "0 8px 18px rgba(0,0,0,0.35)",
                      transition: "all 0.2s ease",
                    }}
                    variation="primary"
                    marginTop=".9rem"
                    border="1px solid rgba(245, 245, 245, 0.85)"
                    loadingText=""
                    onClick={() => handleSignIn()}
                  >
                    <Text style={{ ...luxuryBodyStyle, color: "#FFFFFF" }}>
                      Login
                    </Text>
                  </Button>
                )}

                {!isLogin && (
                  <Button
                    style={{
                      ...luxuryBodyStyle,
                      fontSize: "1rem",
                      padding: "0.9rem 2.2rem",
                      border: "1px solid rgba(255,255,255,0.35)",
                      borderRadius: "28px",
                      background:
                        "linear-gradient(145deg,  #9a2424, rgba(20,20,20,0.9))",
                      color: "#FFFFFF",
                      cursor: "pointer",
                      boxShadow: "0 8px 18px rgba(0,0,0,0.35)",
                      transition: "all 0.2s ease",
                    }}
                    variation="primary"
                    marginTop="-.1rem"
                    border="1px solid rgba(245, 245, 245, 0.85)"
                    loadingText=""
                    onClick={() => handleSignUpSubmit()}
                  >
                    <Text style={{ ...luxuryBodyStyle, color: "#FFFFFF" }}>
                      Sign Up
                    </Text>
                  </Button>
                )}

                {/* Toggle button to switch between login and signup modes */}
                <ToggleButton
                  color="#2B1E1A"
                  style={{
                    ...luxuryBodyStyle,
                    fontSize: "1.15rem",
                    padding: "0.9rem 1rem",
                    minHeight: "58px",
                    borderRadius: "14px",
                    border: "1px solid rgba(255,255,255,0.18)",
                    background:
                      "linear-gradient(145deg,  #9a2424, rgba(20,20,20,0.9))",
                    boxShadow: "0 8px 18px rgba(0,0,0,0.25)",
                  }}
                  isPressed={!isLogin}
                  onClick={() => {
                    setMode(isLogin ? "signup" : "login");
                    setAuthError("");
                    setAuthSuccess("");
                    setShowMissingField(false);
                  }}
                  alignSelf="center"
                  marginTop=".8rem"
                  marginBottom=".5rem"
                >
                  <Text style={{ ...luxuryBodyStyle, color: "#FFFFFF" }}>
                    {isLogin ? "Join OMRÉ" : "Login to OMRÉ"}
                  </Text>
                </ToggleButton>

                {isLogin && (
                  <Link
                    href="/ForgotPassword"
                    style={luxuryBodyStyle}
                    color="#2B1E1A"
                  >
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
