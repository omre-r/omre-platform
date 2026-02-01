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
    return data.data.user
}

