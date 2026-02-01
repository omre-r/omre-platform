const backendURL = "http://localhost:3000"

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

async function createUserReq(userInfo) {
    const response = await fetch(backendURL + `/users`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(userInfo)
    });
    const data = await response.json();
    if (!data.success){
        throw new Error(data.message || "req failed");
    }
    return data.data.user;
}


// products
async function getProductReq(id) {
    const response = await fetch(backendURL + `/products/${id}`);
    const data = await response.json();
    if (!data.success){
        throw new Error(data.message || "req failed");
    }
    return data.data.product;
}

async function updateProductReq(id, newProductInfo) {
    const response = await fetch(backendURL + `/products/${id}`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(newProductInfo)
    });
    const data = await response.json();
    if (!data.success){
        throw new Error(data.message || "req failed");
    }
    return data;
}

async function deleteProductReq(id) {
    const response = await fetch(backendURL + `/products/${id}`, {
        method: "DELETE",
    });
    const data = await response.json();
    if (!data.success){
        throw new Error(data.message || "req failed");
    }
    return data;
}

async function getActiveProductsReq() {
    const response = await fetch(backendURL + `/products/active`);
    const data = await response.json();
    if (!data.success){
        throw new Error(data.message || "req failed");
    }
    return data.data.products;
}

async function createProductReq(productInfo) {
    const response = await fetch(backendURL + `/products`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(productInfo)
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
    return data.data.reviewsl
}

async function updateReviewReq(id, newReviewInfo){
    const response = await fetch(backendURL + `/reviews/${id}`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(newReviewInfo)
    });
    const data = await response.json()
    if (!data.success){
        throw new Error(data.message || "req failed");
    }
    return data
}

async function createReviewReq(reviewInfo){
    const response = await fetch(backendURL + `/reviews`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(reviewInfo)
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

async function createOrderReq(){
    const response = await fetch(backendURL + `/orders`);
    const data = await response.json()
    if (!data.success){
        throw new Error(data.message || "req failed");
    }
    return data.data.order;
}