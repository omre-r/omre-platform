const backendURL = "http://localhost:5001"

function handleError(fn){
  return async (...args) => {
    try{
      return await fn(...args)
    }catch(err){
      console.error(err)
      return null
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
        throw new Error(data.message || "req failed");
    }
    return data.data.user;
}

async function getUsersReq() {
    const response = await fetch(backendURL + "/users", {
        headers: {"Authorization": `Bearer ${getToken()}`}
    });
    const data = await response.json();
    if (!data.success){
        throw new Error(data.message || "req failed");
    }
    return data.data.users;
}

async function createUserReq({id, email, firstname, lastname, preferrednotes}){
    const response = await fetch(backendURL + `/users`, {
        method: "POST",
        headers: {"Content-Type": "application/json", "Authorization": `Bearer ${getToken()}`},
        body: JSON.stringify({id, email, firstname, lastname, preferrednotes})
    });
    const data = await response.json();
    if (!data.success){
        throw new Error(data.message || "req failed");
    }
    return data.data.user;
}

async function deleteUserReq(id){
    const response = await fetch(backendURL + `/users/${id}`, {
        method: "DELETE",
        headers: {"Authorization": `Bearer ${getToken()}`}
    });
    const data = await response.json();
    if (!data.success){
        throw new Error(data.message || "req failed");
    }
    return data;
}

// products
async function getProductReq(id){
    const response = await fetch(backendURL + `/products/${id}`);
    const data = await response.json();
    if (!data.success){
        throw new Error(data.message || "req failed");
    }
    return data.data.product;
}

// It would probably be better if the frontend ensured if images were URLs before calling update
async function updateProductReq(id, updatedFields){
    // if (updatedFields.hasOwn("images")){
    //     if (!validateAllImages(updatedFields.images).valid) throw new Error("invalid images");
    //     const uploadUrls = await Promise.all(updatedFields.images.map(f => getPresignedUrlReq_LOCAL(f)));
    //     if (uploadUrls.some(url => url === null)) return null;
        
    //     const uploadResults = await Promise.all(uploadUrls.map((data, i) => uploadImageToS3Req(data.uploadUrl, updatedFields.images[i])));
    //     if (uploadResults.some(res => res === null)) return null;
    //     updatedFields.images = uploadUrls.map(data => data.publicUrl);
    // }
    const response = await fetch(backendURL + `/products/${id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json", "Authorization": `Bearer ${getToken()}`},
        body: JSON.stringify(updatedFields)
    });
    const data = await response.json();
    if (!data.success){
        throw new Error(data.message || "req failed");
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
        throw new Error(data.message || "req failed");
    }
    return data;
}

async function getActiveProductsReq(){
    const response = await fetch(backendURL + `/products/active`);
    const data = await response.json();
    if (!data.success){
        throw new Error(data.message || "req failed");
    }
    return data.data.products;
}

async function createProductReq({type, name, variation, price, images, stock_ml, notes, description, isfeatured, ishidden}){
    const response = await fetch(backendURL + `/products`, {
        method: "POST",
        headers: {"Content-Type": "application/json", "Authorization": `Bearer ${getToken()}`},
        body: JSON.stringify({type, name, variation, price, images, stock_ml, notes, description, isfeatured, ishidden})
    });
    const data = await response.json();
    if (!data.success){
        throw new Error(data.message || "req failed");
    }
    return data.data.product;
}

async function getProductsReq() {
    const response = await fetch(backendURL + `/products`);
    const data = await response.json();
    if (!data.success){
        throw new Error(data.message || "req failed");
    }
    return data.data.products;
}


// reviews
async function getProductReviewsReq(productid){
    const response = await fetch(backendURL + `/reviews/product/${productid}`);
    const data = await response.json()
    if (!data.success){
        throw new Error(data.message || "req failed");
    }
    return data.data.reviews;
}

async function getUserReviewsReq(customerid){
    const response = await fetch(backendURL + `/reviews/user/${customerid}`);
    const data = await response.json()
    if (!data.success){
        throw new Error(data.message || "req failed");
    }
    return data.data.reviews;
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
        throw new Error(data.message || "req failed");
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
        throw new Error(data.message || "req failed");
    }
    return data.data.review
}

async function getReviewsReq(){
    const response = await fetch(backendURL + `/reviews`);
    const data = await response.json()
    if (!data.success){
        throw new Error(data.message || "req failed");
    }
    return data.data.reviews;
}

async function deleteReviewReq(id){
    const response = await fetch(backendURL + `/reviews/${id}`, {
        method: "DELETE",
        headers: {"Authorization": `Bearer ${getToken()}`}
    });
    const data = await response.json();
    if (!data.success){
        throw new Error(data.message || "req failed");
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
        throw new Error(data.message || "req failed");
    }
    return data;
}

async function completeOrderReq(id) {
    const response = await fetch(backendURL + `/orders/complete/${id}`, {
        method: "PUT",
        headers: {"Authorization": `Bearer ${getToken()}`}
    });
    const data = await response.json()
    if (!data.success){
        throw new Error(data.message || "req failed");
    }
    return data;
}

async function getOrderReq(id){
    const response = await fetch(backendURL + `/orders/${id}`, {
        headers: {"Authorization": `Bearer ${getToken()}`}
    });
    const data = await response.json()
    if (!data.success){
        throw new Error(data.message || "req failed");
    }
    return data.data.order;
}

async function createOrderReq({customerid, items, total}){
    const response = await fetch(backendURL + `/orders`, {
        method: "POST",
        headers: {"Content-Type": "application/json", "Authorization": `Bearer ${getToken()}`},
        body: JSON.stringify({customerid, items, total})
    });
    const data = await response.json();
    if (!data.success){
        throw new Error(data.message || "req failed");
    }
    return data.data.order;
}

async function deleteOrderReq(id){
    const response = await fetch(backendURL + `/orders/${id}`, {
        method: "DELETE",
        headers: {"Authorization": `Bearer ${getToken()}`}
    });
    const data = await response.json();
    if (!data.success){
        throw new Error(data.message || "req failed");
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

async function createProductFlowReq_LOCAL({type, name, variation, price, images, stock_ml, notes, description, isfeatured, ishidden}){
    if (!validateAllImages(images).valid) throw new Error("invalid images");
    const uploadUrls = await Promise.all(images.map(f => getPresignedUrlReq_LOCAL(f)));
    if (uploadUrls.some(url => url === null)) return null
    
    const uploadResults = await Promise.all(uploadUrls.map((data, i) => uploadImageToS3Req(data.uploadUrl, images[i])));
    if (uploadResults.some(res => res === null)) return null

    return await createProductReq({type, name, variation, price, images: uploadUrls.map(data => data.publicUrl), stock_ml, notes, description, isfeatured, ishidden})
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



getUserReq = handleError(getUserReq);
getUsersReq = handleError(getUsersReq);
createUserReq = handleError(createUserReq);
deleteUserReq = handleError(deleteUserReq);

getProductReq = handleError(getProductReq);
updateProductReq = handleError(updateProductReq);
deleteProductReq = handleError(deleteProductReq);
getActiveProductsReq = handleError(getActiveProductsReq);
createProductReq = handleError(createProductReq);
getProductsReq = handleError(getProductsReq);

getProductReviewsReq = handleError(getProductReviewsReq);
getUserReviewsReq = handleError(getUserReviewsReq);
updateReviewReq = handleError(updateReviewReq);
createReviewReq = handleError(createReviewReq);
getReviewsReq = handleError(getReviewsReq);
deleteReviewReq = handleError(deleteReviewReq);

cancelOrderReq = handleError(cancelOrderReq);
completeOrderReq = handleError(completeOrderReq);
getOrderReq = handleError(getOrderReq);
createOrderReq = handleError(createOrderReq);
deleteOrderReq = handleError(deleteOrderReq);

uploadImageToS3Req = handleError(uploadImageToS3Req);
getPresignedUrlReq_LOCAL = handleError(getPresignedUrlReq);
createProductFlowReq_LOCAL = handleError(createProductFlowReq_LOCAL)
getPresignedUrlReq = handleError(getPresignedUrlReq);
createProductAWSReq = handleError(createProductAWSReq);
createProductAWSFlowReq = handleError(createProductAWSFlowReq);


export {
    getUserReq, getUsersReq, createUserReq, deleteUserReq,
    getProductReq, updateProductReq, deleteProductReq, getActiveProductsReq, createProductReq, getProductsReq,
    getProductReviewsReq, getUserReviewsReq, updateReviewReq, createReviewReq, getReviewsReq, deleteReviewReq,
    cancelOrderReq, completeOrderReq, getOrderReq, createOrderReq, deleteOrderReq,
    validateAllImages, uploadImageToS3Req, getPresignedUrlReq_LOCAL, createProductFlowReq_LOCAL, getPresignedUrlReq, createProductAWSReq, createProductAWSFlowReq
}
