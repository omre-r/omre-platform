const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');

const s3Client = new S3Client({ region: 'us-east-1' });
const BUCKET_NAME = 'omre-product-images';
const CLOUDFRONT_DOMAIN = 'https://d5u12uf28k3zi.cloudfront.net';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const PRESIGNED_URL_EXPIRATION = 1800; // 30 minutes

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event));
  
  try {
    // Parse input
    const body = JSON.parse(event.body || '{}');
    const { filename, contentType, fileSize } = body;
    
    // Validation
    if (!filename || !contentType) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing filename or contentType' })
      };
    }
    
    if (!ALLOWED_TYPES.includes(contentType.toLowerCase())) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: 'Invalid file type. Allowed: jpg, jpeg, png, webp' 
        })
      };
    }
    
    if (fileSize && fileSize > MAX_FILE_SIZE) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          error: `File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB` 
        })
      };
    }
    
    // Generate unique S3 key
    const timestamp = Date.now();
    const randomId = crypto.randomUUID().split('-')[0]; // First 8 chars
    const sanitizedFilename = filename.replace(/[^a-z0-9.]/gi, '-').toLowerCase();
    const s3Key = `products/${timestamp}-${randomId}-${sanitizedFilename}`;
    
    console.log('Generated S3 key:', s3Key);
    
    // Create presigned URL with temporary tagging
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      ContentType: contentType,
      Tagging: 'status=temporary' // Auto-tag as temporary
    });
    
    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: PRESIGNED_URL_EXPIRATION
    });
    
    // Construct CloudFront public URL
    const publicUrl = `${CLOUDFRONT_DOMAIN}/${s3Key}`;
    
    console.log('Generated URLs - Upload:', uploadUrl.substring(0, 100), '... Public:', publicUrl);
    
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        uploadUrl,
        publicUrl,
        expiresIn: PRESIGNED_URL_EXPIRATION
      })
    };
    
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};
