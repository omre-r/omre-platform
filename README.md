# Welcome to the web platform of OMRE Fragrances!

OMRE Fragrances is a company that sells colognes, perfumes, and similar products. This repository is used to run its website.

## How do I set it up?

### Prerequisites

1. Install [Git](https://www.atlassian.com/git/tutorials/install-git).

2. Install [Node and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).

3. Reach out to a current developer, or the owner of the repo, for the required ".env" file that contains all credentials needed for the various APIs being used. Note that the existing ".env.example" file shows what this file looks like, but all values are empty.

4. [OPTIONAL] Install [PostGreSQL](https://www.postgresql.org/download/) to run local DB queries and something like [DBeaver](https://dbeaver.io/download/) to view te database. All database credentials are within the .env.

5. [OPTIONAL] Install [Prettier](https://dev.to/receter/how-to-install-prettier-in-your-codebase-and-vscode-4c19) extension (if working in VisualStudio Code) to prevent the same lines from appearing in 2 separate commits due to differences in formatting.

### Instructions

1. Open a terminal and navigate to the directory you'd like to work in.
2. Clone the repository into the directory you are in using:
   - `git clone https://github.com/omre-r/omre-platform.git`
3. Navigate into the cloned directory using:
   - `cd omre-platform`
4. Install all required libraries using:
   - `npm run install:all`

5. Place the .env file (see prerequisite 3) in the backend directory.

6. Run the project using:
   - `npm run dev`

7. Visit "http://localhost:5173".

## Explanation of project directories

#### Minor folders

- .github: Contains Github related documentation
- .vscode: Some VScode settings for the project. It currently only sets up the "prettier" extension.
- infrastructure: Includes some information on the project setup in AWS.
- tests: The folder where all tests should be written.
- docs: Contains any documentation the team thought to include, such as setting up infrastructure or explaining common coding practices.

#### Main folders

- backend: All backend related items
  - config: Contains database files
    - db.js: All classes and functions that interact with the database directly.
  - server.js: All accessible endpoints and middleware.
  - controllers.js: All functions that are used in endpoints.
- frontend: All frontend related items
  - src: All the main frontend code
    - AdminComponents: Components used in the Admin Dashboard.
    - assets: All images and similar assets used.
    - components: Generic components used in the app.
    - context: All contexts used in the app (for useAuth or useToast)
    - pages: The main pages of the website.
    - styles: Any CSS files should go here.
  - requests.js: All requests that are made to the backend.

## Accessing the AWS console

The main dependencies are AWS services. It may be difficult to troubleshoot at times without access to various services, so you may at times need to ask your team member with administrator privileges on AWS to grant you the appropriate IAM permissions to access a specific service.

For Example:

"Hey [Blank], I would like unrestricted AWS S3 access. Would you please assign me the 'AmazonS3FullAccess' policy?"

## Dependencies

- AWS S3
  - Used for storing images
- AWS Cognito
  - Used for all authentication/authorization
- AWS Lambda
  - For some useful triggers, such as creating a user on the website immediately after creating a user in the Cognito pool
- AWS SES
  - For emails
- AWS Amplify
  - To help configure Cognito on the frontend
- AWS CloudFront
  - Used for the image CDN
- AWS RDS
  - Used to host the database

## Explanation of .env keys

#### Database related

- "DB_USERNAME"
  - The username of the account connected to the database.
- "DB_PASSWORD"
  - The password of the account connecting to the database.
- "DB_HOST"
  - Where to connect to the database (like a URL).
- "DB_PORT"
  - The port to connect to on the machine hosting the database.
- "DB_NAME"
  - The name of the database.

#### S3 related

- "CLOUDFRONT_DOMAIN"
  - This is the beginning of any image's URL used throughout the site. It is the CDN that serves images.
- "BUCKET_NAME"
  - This is the name of the "bucket" used for storing images on S3.
- "S3_SECRET_ACCESS_KEY"
  - This is the AWS secret access key.
- "S3_ACCESS_KEY_ID"
  - This is the AWS public access key.

#### Cognito Related

- "COGNITO_POOL_ID"
  - This is the ID of the "pool" of users used in AWS Cognito.
- "COGNITO_CLIENT_ID"
  - This is the ID of the "client" or app that uses the pool.

#### Miscellaneous

- "PORT"
  - The port you would like the backend to run on. Note that the frontend usually runs on port 5173.
- "USE_ACCESS_TOKENS"
  - By default this is set to "true", but set this to be false if you would like to debug something and access tokens are getting in the way.
- "SES_FROM_EMAIL"
  - This is the email that:
    1. All emails will be sent to from the "Contact Us" form.
    2. The "Sender" for all emails sent from the website (besides Cognito verification codes)

## Main Tech Stack and Versions

1. Frontend: React (19.2.0)
2. Backend: Express.js (5.2.1)
3. Database: PostgreSQL (16)
4. Image Storage: AWS S3
5. Image CDN: AWS CloudFront
6. Auth: AWS Cognito
7. Emails: AWS SES
8. Database hosting: AWS RDS

Additionally, AWS Lambda is used for some useful triggers such as creating a user on sign up.

# Additional Notes

- To run the backend separately:
  1. Navigate into backend directory with:

     `cd backend`

  2. Start the backend server.

     `npm start`

- To run the frontend:
  1. Navigate into frontend directory with:

     `cd frontend`

  2. Start the frontend server.

     `npm run dev`

- AWS S3 has a "lifecycle rule" that deletes any uploaded images after a period of time (currently set to 3 days). However, only images with a "status" tag (with the value set to "temporary" for semantics) will be removed.

- OMRE Fragrances Testing Account:
  - Email: OmreFragrancesTesting@gmail.com
  - Password: OmreTesting123!
