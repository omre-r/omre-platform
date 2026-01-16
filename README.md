# omre-platform
This repository hosts the OMRÉ platform, a system designed for iterative development across multiple semesters.
The platform focuses on scalable architecture, evolving features, and real-world business workflows rather than one-off implementations.

# Tech-stack
Frontend - React (with Vite) - used for building the user interface and fast development server and modern tooling

Download: 
Vite: https://vite.dev/
React: https://react.dev/

#Backend - Node.js + Express.js - node runs the backend server and express handles routing, middleware, and APIs\

Download: 
Node.js: https://nodejs.org/en
Express: https://expressjs.com/

#Database:
MongoDB (Via mongoDB atlas) - cloud hosted noSQL database, flexible schema and easy to set up for development

Download/Setup: 
MongoDB atlas (free): https://www.mongodb.com/products/platform
Mongoose (ODM): https://mongoosejs.com/

#Authentication:
JSON Web Tokens (JWT): Used for user authentication and protected routes - Tokens are signed using a secret stored in environment variables

#Docs: 
JWT: https://www.jwt.io/
Jsonwebtoken (NODE LIBRARY): https://github.com/auth0/node-jsonwebtoken

 #Tooling: 
npm - dependency management (comes w node.js)
github - version control and collaboration
nodemon - auto restarts backend during development 

 # Environment Variables: 
Sensitive values (database URI, jwt secret) are stored in .env files
.env files are never committed to GIT
Use .env.example as a template

 # NOTES TO CONTRIBUTORS:
- You do not need to install MomhoDB locally
- A free mongoDB atlas account is sufficient
- Frontend and Backend run together using: npm run dev


# Git Workflow 
- dev is the main development branch
- do not push directly to dev
- create a feature branch for all work 
- open a pull request when finished

# project structure 
frontend/ react application (UI)
backend/ node + express API
docs/ Documentation

# common commands
npm run install: all  #install frontend and backend deps 
npm run dev: #run frontend and backend together

# FAQ/ Common issues
**mongoDB connection error**
- check your .env file 
- ensure your atlas IP access allows your connection