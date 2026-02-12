import { Amplify } from "aws-amplify"; 

// AWS Amplify configuration for authentication using Amazon Cognito
const authConfig = {
    Auth: {
        Cognito: {
            // user pool id and client id for the Cognito user pool, this is where user data is stored and managed
            // Keeps user authentication and management secure and scalable
            userPoolId: "us-east-1_jytrX6A4l", 
            userPoolClientId: '2tkp1h45fog0t93300kf1s9uaq',
            signUpVerificationMethod: 'code', // sign up verification via code sent to email
            loginWith: {
                email: true, // login with email, email will be treated as username
            }
        }
    }
};

// This configures Amplify with the authentication settings defined above
Amplify.configure(authConfig);
// Exporting the authConfig for use in other parts of the application
export default authConfig;