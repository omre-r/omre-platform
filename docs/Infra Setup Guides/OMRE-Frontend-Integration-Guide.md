# OMRE Product Creation - Frontend Integration Guide


This guide explains how to integrate the CREATE PRODUCT AND UPLOAD URL FUNCTIONS FROM THE backend with your frontend for product creation. The system uses "presigned URLs" which means images are uploaded directly from the browser to S3 — they never pass through our servers.




# API Endpoints

`https://vsazml20a1.execute-api.us-east-1.amazonaws.com/prod/products/presigned-url` | POST | Get upload URL for an image |
 
`https://vsazml20a1.execute-api.us-east-1.amazonaws.com/prod/products` | POST | Create product in database |

# Image Requirements
5MB Max per image , 5 images allowed per product


# Step-by-Step Integration

### Step 1: API Configuration

In your JavaScript file where you handle API calls (could be a config file, utils file, or directly in your component):

```
javascript
// API CONFIGURATION
const API_BASE_URL = 'https://vsazml20a1.execute-api.us-east-1.amazonaws.com/prod';

const API_ENDPOINTS = {
  getPresignedUrl: `${API_BASE_URL}/products/presigned-url`,
  createProduct: `${API_BASE_URL}/products`
};

// Image validation constants
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
const MAX_IMAGES = 5;
```

---

### Step 2: Image Validation Function

In the same JS file or a utilities file: Like Request.js or ProductsPanel.js

```javascript

// IMAGE VALIDATION


/**
 * Validates a single image file
 * @param {File} file - The file object from input
 * @returns {Object} - { valid: boolean, error: string | null }
 */
function validateImage(file) {
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Allowed: JPG, PNG, WEBP`
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File too large: ${sizeMB}MB. Maximum: 5MB`
    };
  }

  return { valid: true, error: null };
}

/**
 * Validates all selected images
 * @param {FileList | File[]} files - Array of files
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
function validateAllImages(files) {
  const errors = [];

  if (files.length === 0) {
    return { valid: false, errors: ['At least one image is required'] };
  }

  if (files.length > MAX_IMAGES) {
    return { valid: false, errors: [`Maximum ${MAX_IMAGES} images allowed`] };
  }

  for (let i = 0; i < files.length; i++) {
    const result = validateImage(files[i]);
    if (!result.valid) {
      errors.push(`Image ${i + 1}: ${result.error}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

---

# Step 3: Get Presigned URL Function

```javascript

// GET PRESIGNED URL


/**
 * Gets a presigned URL for uploading an image to S3
 * @param {File} file - The file to upload
 * @returns {Promise<Object>} - { uploadUrl, publicUrl, expiresIn }
 */
async function getPresignedUrl(file) {
  const response = await fetch(API_ENDPOINTS.getPresignedUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      fileSize: file.size
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get upload URL');
  }

  return response.json();
}
```

---

# Step 4: Upload Image to S3 Function

```javascript

// UPLOAD IMAGE TO S3


/**
 * Uploads an image directly to S3 using presigned URL
 * @param {string} uploadUrl - The presigned URL from Lambda
 * @param {File} file - The file to upload
 * @returns {Promise<void>}
 */
async function uploadImageToS3(uploadUrl, file) {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type
    },
    body: file  // Send raw file binary
  });

  if (!response.ok) {
    throw new Error(`Failed to upload ${file.name} to S3`);
  }
}
```

---

# Step 5: Upload Single Image (Combined)

```javascript

// UPLOAD SINGLE IMAGE (GET URL + UPLOAD)


/**
 * Handles the complete upload process for a single image
 * @param {File} file - The file to upload
 * @param {Function} onProgress - Optional callback for progress updates
 * @returns {Promise<string>} - The public CloudFront URL
 */


async function uploadImage(file, onProgress = null) {
  // Step 1: Validate
  const validation = validateImage(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  if (onProgress) onProgress('Getting upload URL...');

  // Step 2: Get presigned URL
  const { uploadUrl, publicUrl } = await getPresignedUrl(file);

  if (onProgress) onProgress('Uploading to cloud...');

  // Step 3: Upload to S3
  await uploadImageToS3(uploadUrl, file);

  if (onProgress) onProgress('Upload complete!');

  // Return the public URL (this is what gets saved to database)
  return publicUrl;
}
```

---

# Step 6: Upload Multiple Images

```javascript

// UPLOAD MULTIPLE IMAGES

/**
 * Uploads multiple images and returns their public URLs
 * @param {File[]} files - Array of files to upload
 * @param {Function} onProgress - Optional callback (receives: currentIndex, totalCount, status)
 * @returns {Promise<string[]>} - Array of public CloudFront URLs
 */


async function uploadMultipleImages(files, onProgress = null) {
  const publicUrls = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    if (onProgress) {
      onProgress(i + 1, files.length, `Uploading ${file.name}...`);
    }

    const publicUrl = await uploadImage(file);
    publicUrls.push(publicUrl);
  }

  return publicUrls;
}
```

---

# Step 7: Create Product Function

```javascript

// CREATE PRODUCT IN DATABASE

/**
 * Creates a product with images in the database
 * @param {Object} productData - The product information
 * @param {string} productData.name - Product name (required)
 * @param {number} productData.price - Product price (required, must be > 0)
 * @param {string} productData.description - Product description (optional)
 * @param {Array} productData.images - Array of image objects (required)
 * @param {string} productData.images[].url - CloudFront URL
 * @param {boolean} productData.images[].is_main - True for main image (exactly one required)
 * @param {number} productData.images[].display_order - Display order (0, 1, 2, etc.)
 * @returns {Promise<Object>} - { success, productId, message }
 */

async function createProduct(productData) {
  // Validate required fields
  if (!productData.name || productData.name.trim() === '') {
    throw new Error('Product name is required');
  }

  if (!productData.price || productData.price <= 0) {
    throw new Error('Valid price is required');
  }

  if (!productData.images || productData.images.length === 0) {
    throw new Error('At least one image is required');
  }

  // Validate exactly one main image
  const mainImages = productData.images.filter(img => img.is_main === true);
  if (mainImages.length !== 1) {
    throw new Error('Exactly one image must be marked as the main image');
  }

  // Send to API
  const response = await fetch(API_ENDPOINTS.createProduct, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(productData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create product');
  }

  return response.json();
}
```

---

## Step 8: Complete Product Creation Flow

This is the main function you'll call when the admin submits the product form:

```javascript

// COMPLETE PRODUCT CREATION FLOW

/**
 * Handles the entire product creation process:
 * 1. Validates all inputs
 * 2. Uploads all images to S3
 * 3. Creates product in database
 * 
 * @param {Object} formData - Data from the product form
 * @param {string} formData.name - Product name
 * @param {number} formData.price - Product price
 * @param {string} formData.description - Product description
 * @param {File[]} formData.imageFiles - Array of File objects from input
 * @param {number} formData.mainImageIndex - Index of the main image (0-based)
 * @param {Function} onStatusUpdate - Callback for status updates
 * @returns {Promise<Object>} - { success, productId }
 */


async function handleProductCreation(formData, onStatusUpdate = console.log) {
  try {
    const { name, price, description, imageFiles, mainImageIndex } = formData;

    // ========== VALIDATION ==========
    onStatusUpdate('Validating inputs...');

    if (!name || name.trim() === '') {
      throw new Error('Product name is required');
    }

    if (!price || isNaN(price) || price <= 0) {
      throw new Error('Valid price is required');
    }

    const imageValidation = validateAllImages(imageFiles);
    if (!imageValidation.valid) {
      throw new Error(imageValidation.errors.join('\n'));
    }

    if (mainImageIndex === undefined || mainImageIndex < 0 || mainImageIndex >= imageFiles.length) {
      throw new Error('Please select a main image');
    }

    // ========== UPLOAD IMAGES ==========
    onStatusUpdate('Uploading images...');

    const uploadedUrls = [];

    for (let i = 0; i < imageFiles.length; i++) {
      onStatusUpdate(`Uploading image ${i + 1} of ${imageFiles.length}...`);
      
      const publicUrl = await uploadImage(imageFiles[i]);
      uploadedUrls.push(publicUrl);
    }

    onStatusUpdate('All images uploaded successfully!');

    // ========== CREATE PRODUCT ==========
    onStatusUpdate('Saving product to database...');

    // Build images array with is_main and display_order
    const images = uploadedUrls.map((url, index) => ({
      url: url,
      is_main: index === mainImageIndex,
      display_order: index
    }));

    const result = await createProduct({
      name: name.trim(),
      price: parseFloat(price),
      description: description ? description.trim() : null,
      images: images
    });

    onStatusUpdate('Product created successfully!');

    return {
      success: true,
      productId: result.productId
    };

  } catch (error) {
    onStatusUpdate(`Error: ${error.message}`);
    throw error;
  }
}
```

---

