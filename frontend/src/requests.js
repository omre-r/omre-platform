const backendURL = "http://localhost:5001"

function handleError(fn){
  return async (...args) => {
    try{
      return await fn(...args)
    }catch(err){
      console.error(err)
      return {success: false, message: `Error: ${err}`}
    }
  }
}


// users
async function getUserReq(id) {
    const response = await fetch(backendURL + `/users/${id}`, {
        headers: {"Authorization": `Bearer ${getToken()}`}
    });
    const data = await response.json();
    if (!data.success){
        console.error(data.message || "req failed")
    }
    return data;
}

async function getUsersReq() {
    const response = await fetch(backendURL + "/users", {
        headers: {"Authorization": `Bearer ${getToken()}`}
    });
    const data = await response.json();
    if (!data.success){
        console.error(data.message || "req failed")
    }
    return data;
}

async function createUserReq({id, email, firstname, lastname, preferrednotes}){
    const response = await fetch(backendURL + `/users`, {
        method: "POST",
        headers: {"Content-Type": "application/json", "Authorization": `Bearer ${getToken()}`},
        body: JSON.stringify({id, email, firstname, lastname, preferrednotes})
    });
    const data = await response.json();
    if (!data.success){
        console.error(data.message || "req failed")
    }
    return data;
}

async function deleteUserReq(id){
    const response = await fetch(backendURL + `/users/${id}`, {
        method: "DELETE",
        headers: {"Authorization": `Bearer ${getToken()}`}
    });
    const data = await response.json();
    if (!data.success){
        console.error(data.message || "req failed")
    }
    return data;
}

// User can update their preferred notes string 
async function updatePreferredNotesReq(id, preferrednotes) {
    const response = await fetch(backendURL + `/users/${id}/preferrednotes`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getToken()}`
        },
        body: JSON.stringify({ preferrednotes })
    });

    const data = await response.json();
    if (!data.success){
        console.error(data.message || "req failed");
    }
    return data;
}

// products
async function getProductReq(id){
    const response = await fetch(backendURL + `/products/${id}`);
    const data = await response.json();
    if (!data.success){
        console.error(data.message || "req failed")
    }

    return data;
}

// It would probably be better if the frontend ensured if images were URLs before calling update
async function updateProductReq(id, updatedFields){
    const response = await fetch(backendURL + `/products/${id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json", "Authorization": `Bearer ${getToken()}`},
        body: JSON.stringify(updatedFields)
    });
    const data = await response.json();
    if (!data.success){
        console.error(data.message || "req failed")
    }
    return data;
}

async function deleteProductReq(id){
    const response = await fetch(backendURL + `/products/${id}`, {
        method: "DELETE",
        headers: {"Authorization": `Bearer ${getToken()}`}
    });
    const data = await response.json();
    if (!data.success){
        console.error(data.message || "req failed")
    }
    return data;
}

async function getActiveProductsReq(){
    const response = await fetch(backendURL + `/products/active`);
    const data = await response.json();
    if (!data.success){
        console.error(data.message || "req failed")
    }
    return data;
}

async function getFilteredProductsReq(filters){
    const response = await fetch(backendURL + `/products/filter?filters=${JSON.stringify(filters)}`);
    const data = await response.json();
    if (!data.success){
        console.error(data.message || "req failed")
    }
    return data;
}

async function createProductReq({parentid = null, type, name, variation, price, images, stock_ml, notes, description, isfeatured, ishidden}){
    const response = await fetch(backendURL + `/products`, {
        method: "POST",
        headers: {"Content-Type": "application/json", "Authorization": `Bearer ${getToken()}`},
        body: JSON.stringify({parentid, type, name, variation, price, images, stock_ml, notes, description, isfeatured, ishidden})
    });
    const data = await response.json();
    if (!data.success){
        console.error(data.message || "req failed")
    }
    return data;
}

async function getProductsReq() {
    const response = await fetch(backendURL + `/products`);
    const data = await response.json();
    if (!data.success){
        console.error(data.message || "req failed")
    }
    return data;
}


// reviews
async function getProductReviewsReq(productid){
    const response = await fetch(backendURL + `/reviews/product/${productid}`);
    const data = await response.json()
    if (!data.success){
        console.error(data.message || "req failed")
    }
    return data;
}

async function getUserReviewsReq(customerid){
    const response = await fetch(backendURL + `/reviews/user/${customerid}`);
    const data = await response.json()
    if (!data.success){
        console.error(data.message || "req failed")
    }
    return data;
}

//as of now, can only update "responses"
async function updateReviewReq(id, updatedFields){
    const response = await fetch(backendURL + `/reviews/${id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json", "Authorization": `Bearer ${getToken()}`},
        body: JSON.stringify(updatedFields)
    });
    const data = await response.json()
    if (!data.success){
        console.error(data.message || "req failed")
    }
    return data
}


async function createReviewReq({customerid, productid, message, rating, images}){
    const response = await fetch(backendURL + `/reviews`, {
        method: "POST",
        headers: {"Content-Type": "application/json", "Authorization": `Bearer ${getToken()}`},
        body: JSON.stringify({customerid, productid, message, rating, images})
    });
    const data = await response.json();
    if (!data.success){
        console.error(data.message || "req failed")
    }
    return data
}

async function getReviewsReq(){
    const response = await fetch(backendURL + `/reviews`);
    const data = await response.json()
    if (!data.success){
        console.error(data.message || "req failed")
    }
    return data;
}

async function deleteReviewReq(id){
    const response = await fetch(backendURL + `/reviews/${id}`, {
        method: "DELETE",
        headers: {"Authorization": `Bearer ${getToken()}`}
    });
    const data = await response.json();
    if (!data.success){
        console.error(data.message || "req failed")
    }
    return data;
}

// orders
async function cancelOrderReq(id, cancelreason) {
    const response = await fetch(backendURL + `/orders/cancel/${id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json", "Authorization": `Bearer ${getToken()}`},
        body: JSON.stringify({cancelreason})
    });
    const data = await response.json()
    if (!data.success){
        console.error(data.message || "req failed")
    }
    return data;
}

async function updateOrderStatusReq(id, status) {
    const response = await fetch(backendURL + `/orders/${id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json", "Authorization": `Bearer ${getToken()}`},
        body: JSON.stringify({status})
    });
    const data = await response.json()
    if (!data.success){
        console.error(data.message || "req failed")
    }
    return data;
}

async function getOrderReq(id){
    const response = await fetch(backendURL + `/orders/${id}`, {
        headers: {"Authorization": `Bearer ${getToken()}`}
    });
    const data = await response.json()
    if (!data.success){
        console.error(data.message || "req failed")
    }
    return data;
}

async function getUserOrdersReq(customerid){
    const response = await fetch(backendURL + `/orders/user/${customerid}`, {
        headers: {"Authorization": `Bearer ${getToken()}`}
    });
    const data = await response.json()
    if (!data.success){
        console.error(data.message || "req failed")
    }
    return data;
}


async function createOrderReq({customerid}){
    const response = await fetch(backendURL + `/orders`, {
        method: "POST",
        headers: {"Content-Type": "application/json", "Authorization": `Bearer ${getToken()}`},
        body: JSON.stringify({customerid})
    });
    const data = await response.json();
    if (!data.success){
        console.error(data.message || "req failed")
    }
    return data;
}

async function deleteOrderReq(id){
    const response = await fetch(backendURL + `/orders/${id}`, {
        method: "DELETE",
        headers: {"Authorization": `Bearer ${getToken()}`}
    });
    const data = await response.json();
    if (!data.success){
        console.error(data.message || "req failed")
    }
    return data;
}

// blends
async function saveBlendReq({ userid, frag1_productid, frag2_productid, frag3_productid, frag1_pct, frag2_pct, frag3_pct, size_ml }) {
    const response = await fetch(backendURL + `/blends/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` },
        body: JSON.stringify({ userid, frag1_productid, frag2_productid, frag3_productid, frag1_pct, frag2_pct, frag3_pct, size_ml })
    });
    const data = await response.json();
    if (!data.success) {
        console.error(data.message || "req failed");
    }
    return data;
}

async function addBlendToCartReq({ userid, frag1_productid, frag2_productid, frag3_productid, frag1_pct, frag2_pct, frag3_pct, size_ml }) {
    const response = await fetch(backendURL + `/blends/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` },
        body: JSON.stringify({ userid, frag1_productid, frag2_productid, frag3_productid, frag1_pct, frag2_pct, frag3_pct, size_ml })
    });
    const data = await response.json();
    if (!data.success){
        console.error(data.message || "req failed")
    }
    // stockUnavailable is NOT a throw — return it so the frontend can show the right message
    return data;
}

// Getting user saved blends to show in mixology page, also for users to load previous blends
async function getUserSavedBlendsReq(userid) {
    const response = await fetch(backendURL + `/blends/${userid}`, {
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` },
    });
    const data = await response.json();
    if (!data.success) {
        console.error(data.message || "req failed")
    }
    return data; 
}

// Deleting a user saved blend from the mixology page
async function deleteUserBlendReq(userid, blendid) {
    const response = await fetch(backendURL + `/blends/${blendid}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}`},
        body: JSON.stringify({userid})
    });
    const data = await response.json();
    if (!data.success) {
        console.error(data.message || "req failed")
    }
    return data; 
}

// cart items
async function createCartItemReq({customerid, itemid, type}) {
    const response = await fetch(backendURL + `/cartitems`, {
        method: "POST",
        headers: {"Authorization": `Bearer ${getToken()}`, "Content-Type": "application/json"},
        body: JSON.stringify({customerid, itemid, type})
    });
    const data = await response.json()
    if (!data.success){
        console.error(data.message || "req failed")
    }
    return data;
}

async function deleteCartItemReq(id) {
    const response = await fetch(backendURL + `/cartitems/${id}`, {
        method: "DELETE",
        headers: {"Authorization": `Bearer ${getToken()}`},
    });
    const data = await response.json()
    if (!data.success){
        console.error(data.message || "req failed")
    }
    return data;
}

async function getCartReq(customerid) {
    const response = await fetch(backendURL + `/cartitems/${customerid}`, {
        headers: {"Authorization": `Bearer ${getToken()}`}
    });
    const data = await response.json()
    if (!data.success){
        console.error(data.message || "req failed")
    }
    return data;
}

async function updateCartReq(customerid, items) {
    const response = await fetch(backendURL + `/cartitems/${customerid}`, {
        method: "PUT",
        headers: {"Authorization": `Bearer ${getToken()}`, "Content-Type": "application/json"},
        body: JSON.stringify({items})
    });
    const data = await response.json()
    if (!data.success){
        console.error(data.message || "req failed")
    }
    return data; //no "item" field per object (compared to getCartReq)
}

async function clearCartReq(customerid) {
    const response = await fetch(backendURL + `/cartitems/clear/${customerid}`, {
        method: "DELETE",
        headers: {"Authorization": `Bearer ${getToken()}`}
    });
    const data = await response.json()
    if (!data.success){
        console.error(data.message || "req failed")
    }
    return data;
}


async function getRecommendationsReq() {
    const response = await fetch(backendURL + `/recommendations`, {
        headers: { "Authorization": `Bearer ${getToken()}` }
    });
    const data = await response.json();
    if (!data.success) {
        console.error(data.message || "req failed");
    }
    return data;
}

// miscellaneous

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];    //We are allowing upto 4 images types
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB max size per image allowed
const MAX_IMAGES = 5;

// Validates image count, type, and size
function validateAllImages(files) {
  if (files.length === 0) return { valid: false, errors: ['At least one image is required'] };
  if (files.length > MAX_IMAGES) return { valid: false, errors: [`Maximum ${MAX_IMAGES} images allowed`] };
  
  const errors = [];
  files.forEach((file, i) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      errors.push(`Image ${i + 1}: Invalid type. Allowed: JPG, PNG, WEBP`);
    }
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`Image ${i + 1}: Too large. Max 5MB`);
    }
  });
  return { valid: errors.length === 0, errors };
}

// Direct upload to S3 bucket from frontend
async function uploadImageToS3Req(uploadUrl, file) {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file 
  });
  if (!response.ok) throw new Error(`Failed to upload ${file.name}`);
  return response.ok
}

//SERVER BASED

//returns a temporary url to upload an image
async function getPresignedUrlReq_LOCAL(file) {
  const response = await fetch(backendURL + `/uploadurl?filename=${file.name}&contentType=${file.contentType}&fileSize=${file.fileSize}`,{
    headers: {"Authorization": `Bearer ${getToken()}`}
  });
  if (!response.ok) throw new Error('Failed to get upload URL');
  return response.json();
}

async function uploadAndGetURlsReq(imageFiles) {
    if (!validateAllImages(imageFiles).valid) throw new Error("invalid images");
    const uploadUrls = await Promise.all(imageFiles.map(f => getPresignedUrlReq_LOCAL(f)));
    const uploadResults = await Promise.all(uploadUrls.map((data, i) => uploadImageToS3Req(data.uploadUrl, imageFiles[i])));
    if (uploadResults.some(res => res === null)) return null
    return uploadUrls.map(data => data.publicUrl)
}

async function createProductFlowReq_LOCAL({parentid = null, type, name, variation, price, images, stock_ml, notes, description, isfeatured, ishidden}){
    if (!validateAllImages(images).valid) throw new Error("invalid images");
    const uploadUrls = await Promise.all(images.map(f => getPresignedUrlReq_LOCAL(f)));
    if (uploadUrls.some(url => url === null)) throw new Error("Failed to get upload URLs");
    
    const uploadResults = await Promise.all(uploadUrls.map((data, i) => uploadImageToS3Req(data.uploadUrl, images[i])));
    if (uploadResults.some(res => res === null)) throw new Error("Failed to upload images");

    return await createProductReq({parentid, type, name, variation, price, images: uploadUrls.map(data => data.publicUrl), stock_ml, notes, description, isfeatured, ishidden})
}


//LAMBDA BASED 

// Cloud function 1: Returns uploadUrl (S3) and publicUrl (CDN)
async function getPresignedUrlReq(file) {
  const response = await fetch("https://vsazml20a1.execute-api.us-east-1.amazonaws.com/prod/products/presigned-url", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, contentType: file.type, fileSize: file.size })
  });
  if (!response.ok) throw new Error('Failed to get upload URL');
  return response.json();
}
// CloudFunction 2: Saves product and public URLs to database.
async function createProductAWSReq(productData) {
  const response = await fetch("https://vsazml20a1.execute-api.us-east-1.amazonaws.com/prod/products", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData)
  });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.message || 'Failed to create product');
  return data;
}
// Orchestrates the full upload and save flow
async function createProductAWSFlowReq({ name, price, description, imageFiles, mainImageIndex = 0, notes }, onProgress = null) { // <--- DELETED "export"
  const validation = validateAllImages(imageFiles);
  if (!validation.valid) throw new Error(validation.errors.join('\n'));

  const uploadedUrls = [];
  for (let i = 0; i < imageFiles.length; i++) {
    if (onProgress) onProgress(`Uploading image ${i + 1} of ${imageFiles.length}...`);
    const { uploadUrl, publicUrl } = await getPresignedUrlReq(imageFiles[i]);
    await uploadImageToS3Req(uploadUrl, imageFiles[i]);
    uploadedUrls.push(publicUrl);
  }

  if (onProgress) onProgress('Saving product...');
  const images = uploadedUrls.map((url, i) => ({
    url,
    is_main: i === mainImageIndex,
    display_order: i
  }));

  // Passing everything to Lambda 2
  return await createProductAWSReq({
    name: name.trim(),
    price: parseFloat(price),
    description: description?.trim() || null,
    images,
    notes // Lambda 2 will now receive the {top: [], heart: [], base: []} object
  });
}

function getToken(){
    for (let key of Object.keys(localStorage)){
        if (key.includes("accessToken")) return localStorage.getItem(key);
    }
    return ""
}


// Users
getUserReq = handleError(getUserReq);
getUsersReq = handleError(getUsersReq);
createUserReq = handleError(createUserReq);
deleteUserReq = handleError(deleteUserReq);
updatePreferredNotesReq = handleError(updatePreferredNotesReq);

// Products
getProductReq = handleError(getProductReq);
updateProductReq = handleError(updateProductReq);
deleteProductReq = handleError(deleteProductReq);
getActiveProductsReq = handleError(getActiveProductsReq);
createProductReq = handleError(createProductReq);
getProductsReq = handleError(getProductsReq);
getFilteredProductsReq = handleError(getFilteredProductsReq);

// Product Reviews
getProductReviewsReq = handleError(getProductReviewsReq);
getUserReviewsReq = handleError(getUserReviewsReq);
updateReviewReq = handleError(updateReviewReq);
createReviewReq = handleError(createReviewReq);
getReviewsReq = handleError(getReviewsReq);
deleteReviewReq = handleError(deleteReviewReq);

// Orders
cancelOrderReq = handleError(cancelOrderReq);
updateOrderStatusReq = handleError(updateOrderStatusReq);
getOrderReq = handleError(getOrderReq);
createOrderReq = handleError(createOrderReq);
deleteOrderReq = handleError(deleteOrderReq);
getUserOrdersReq = handleError(getUserOrdersReq);

// Blends
saveBlendReq = handleError(saveBlendReq);
addBlendToCartReq = handleError(addBlendToCartReq);
getUserSavedBlendsReq = handleError(getUserSavedBlendsReq);
deleteUserBlendReq = handleError(deleteUserBlendReq);

// Cart
createCartItemReq = handleError(createCartItemReq);
deleteCartItemReq = handleError(deleteCartItemReq);
getCartReq = handleError(getCartReq);
clearCartReq = handleError(clearCartReq);
updateCartReq = handleError(updateCartReq);

// Recommendations
getRecommendationsReq = handleError(getRecommendationsReq);


// Misc
uploadAndGetURlsReq = handleError(uploadAndGetURlsReq)
uploadImageToS3Req = handleError(uploadImageToS3Req);
getPresignedUrlReq_LOCAL = handleError(getPresignedUrlReq);
createProductFlowReq_LOCAL = handleError(createProductFlowReq_LOCAL)
getPresignedUrlReq = handleError(getPresignedUrlReq);
createProductAWSReq = handleError(createProductAWSReq);
createProductAWSFlowReq = handleError(createProductAWSFlowReq);

export {
    getUserReq, getUsersReq, createUserReq, deleteUserReq, updatePreferredNotesReq,
    getProductReq, updateProductReq, deleteProductReq, getActiveProductsReq, createProductReq, getProductsReq, getFilteredProductsReq,
    getProductReviewsReq, getUserReviewsReq, updateReviewReq, createReviewReq, getReviewsReq, deleteReviewReq,
    cancelOrderReq, updateOrderStatusReq, getOrderReq, createOrderReq, deleteOrderReq, getUserOrdersReq,
    saveBlendReq, addBlendToCartReq, getUserSavedBlendsReq, deleteUserBlendReq,
    createCartItemReq, deleteCartItemReq, getCartReq, clearCartReq, updateCartReq,
    getRecommendationsReq,
    validateAllImages, uploadImageToS3Req, getPresignedUrlReq_LOCAL, createProductFlowReq_LOCAL, getPresignedUrlReq, createProductAWSReq, createProductAWSFlowReq, uploadAndGetURlsReq
}
