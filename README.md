# Welcome to the web platform of OMRE Fragrances!

OMRE Fragrances is a company that sells colognes, perfumes, and similar products. This repository is used to run its website.

## How do I set it up?

### Prerequisites

1. Install [Git](https://www.atlassian.com/git/tutorials/install-git).

2. Install [Node and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).

3. Reach out to a former developer for the required ".env" file that contains all credentials needed for the various APIs being used. Note that the existing ".env.example" file shows what this file looks like, but all values are empty.

4. [OPTIONAL] Install [PostGreSQL](https://www.postgresql.org/download/) to run local DB queries and something like [DBeaver](https://dbeaver.io/download/) to view te database. All database credentials are within the .env.

### Instructions

1. Open a terminal and navigate to the directory you'd like to work in.
2. Enter the following commands:

   git clone https://github.com/omre-r/omre-platform.git \
   cd omre-platform \
   npm run install:all

3. Place the .env file in the backend directory.

4. Run the project and visit "http://localhost:5173".

## Additional Notes

The main dependencies are AWS services. It may be difficult to troubleshoot at times without access to various services, so you may at times need to ask your team member with administrator privileges on AWS to grant you the appropriate IAM permissions to access a specific service.

For Example:

"Hey [Blank], I would like unrestricted AWS S3 access. Would you please assign me the 'AmazonS3FullAccess' policy?"

## Dependencies

- AWS S3
  - Images
- AWS Cognito
  - Used for all authentication/authorization
- AWS Lambda
  - For some useful triggers, such as creating a user on the website immediately after creating a user in the Cognito pool
- AWS SES
  - Emails
- AWS Amplify
  - To help configure Cognito on frontend
- AWS CloudFront
  - Image CDN
- AWS RDS
  - Database
