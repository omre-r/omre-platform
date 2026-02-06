import { Amplify } from "aws-amplify"; 

// Existing Cognito configuration
const authConfig = {
    Auth: {
        Cognito: {
            userPoolId: "us-east-1_jytrX6A4l", 
            userPoolClientId: '2tkp1h45fog0t93300kf1s9uaq',
            signUpVerificationMethod: 'code',
            loginWith: {
                email: true,
            }
        }
    }
};
// NEW: AWS API ENDPOINTS FOR PRODUCT CREATION
export const API_BASE_URL = 'https://vsazml20a1.execute-api.us-east-1.amazonaws.com/prod';

export const API_ENDPOINTS = {
  getPresignedUrl: `${API_BASE_URL}/products/presigned-url`,
  createProduct: `${API_BASE_URL}/products`
};

// Image validation constants from the guide
export const IMAGE_CONFIG = {
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_COUNT: 5
};

// Keep your existing configuration logic
Amplify.configure(authConfig);
export default authConfig;
