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
async function validateLoginReq(id, email, password){
    const response = await fetch(backendURL + `/users/login/${id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email, password})
    });
    const data = await response.json();
    if (!data.success){
        throw new Error(data.message || "req failed");
    }
    return data.data?.user
}

async function changePasswordReq(id, password) {
    const response = await fetch(backendURL + `/users/password/${id}`, {
        method: "PUT",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({password})
    });
    const data = await response.json();
    if (!data.success){
        throw new Error(data.message || "req failed");
    }
    return data
}

async function getUserReq(id) {
    const response = await fetch(backendURL + `/users/${id}`);
    const data = await response.json();
    if (!data.success){
        throw new Error(data.message || "req failed");
    }
    return data.data.user;
}

async function getUsersReq() {
    const response = await fetch(backendURL + "/users");
    const data = await response.json();
    if (!data.success){
        throw new Error(data.message || "req failed");
    }
    return data.data.users;
}

async function createUserReq({email, password, firstname, lastname, role, preferrednotes}){
    const response = await fetch(backendURL + `/users`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email, password, firstname, lastname, role, preferrednotes})
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

async function updateProductReq(id, updatedFields){
    const copy = {...updatedFields}
    const fd = new FormData()
    if (Object.hasOwn(copy, "images")){
        for (let img of copy["images"]){
            fd.append("images", img);
        }
        delete copy.images
    }
    fd.append("normalFields", JSON.stringify(copy));

    const response = await fetch(backendURL + `/products/${id}`, {
        method: "POST",
        body: fd
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

//images are a list of File objects
async function createProductReq({type, name, variation, price, images, quantity, notes, isfeatured, ishidden}){
    const normalFields = JSON.stringify({type, name, variation, price, quantity, notes, isfeatured, ishidden});
    const fd = new FormData()
    fd.append("normalFields", normalFields)
    for (let img of images){
        fd.append("images", img)
    }
    const response = await fetch(backendURL + `/products`, {
        method: "POST",
        body: fd
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
    const response = await fetch(backendURL + `/reviews/product/${customerid}`);
    const data = await response.json()
    if (!data.success){
        throw new Error(data.message || "req failed");
    }
    return data.data.reviews;
}

//as of now, can only update "responses"
async function updateReviewReq(id, updatedFields){
    const response = await fetch(backendURL + `/reviews/${id}`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(updatedFields)
    });
    const data = await response.json()
    if (!data.success){
        throw new Error(data.message || "req failed");
    }
    return data
}

async function createReviewReq({customerid, productid, message, rating, images, responses}){
    const normalFields = JSON.stringify({customerid, productid, message, rating, responses});
    const fd = new FormData()
    fd.append("normalFields", normalFields)
    for (let img of images){
        fd.append("images", img)
    }
    const response = await fetch(backendURL + `/reviews`, {
        method: "POST",
        body: fd
    });
    const data = await response.json()
    if (!data.success){
        throw new Error(data.message || "req failed");
    }
    return data
}

async function getReviewsReq(){
    const response = await fetch(backendURL + `/reviews`);
    const data = await response.json()
    if (!data.success){
        throw new Error(data.message || "req failed");
    }
    return data.data.reviews;
}


// orders
async function cancelOrderReq(id) {
    const response = await fetch(backendURL + `/orders/cancel/${id}`);
    const data = await response.json()
    if (!data.success){
        throw new Error(data.message || "req failed");
    }
    return data;
}

async function completeOrderReq(id) {
    const response = await fetch(backendURL + `/orders/complete/${id}`);
    const data = await response.json()
    if (!data.success){
        throw new Error(data.message || "req failed");
    }
    return data;
}

async function getOrderReq(id){
    const response = await fetch(backendURL + `/orders/${id}`);
    const data = await response.json()
    if (!data.success){
        throw new Error(data.message || "req failed");
    }
    return data.data.order;
}

async function createOrderReq({orderid, customerid, items, total}){
    const response = await fetch(backendURL + `/orders`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({orderid, customerid, items, total})
    });
    const data = await response.json();
    if (!data.success){
        throw new Error(data.message || "req failed");
    }
    return data.data.order;
}

validateLoginReq = handleError(validateLoginReq);
changePasswordReq = handleError(changePasswordReq);
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

cancelOrderReq = handleError(cancelOrderReq);
completeOrderReq = handleError(completeOrderReq);
getOrderReq = handleError(getOrderReq);
createOrderReq = handleError(createOrderReq)


export {
    validateLoginReq, changePasswordReq, getUserReq, getUsersReq, createUserReq, deleteUserReq,
    getProductReq, updateProductReq, deleteProductReq, getActiveProductsReq, createProductReq, getProductsReq,
    getProductReviewsReq, getUserReviewsReq, updateReviewReq, createReviewReq, getReviewsReq, 
    cancelOrderReq, completeOrderReq, getOrderReq, createOrderReq
}
