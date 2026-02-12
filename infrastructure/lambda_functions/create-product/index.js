const { S3Client, DeleteObjectTaggingCommand } = require('@aws-sdk/client-s3');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const s3Client = new S3Client({ region: 'us-east-1' });
const BUCKET_NAME = 'omre-product-images';
const CLOUDFRONT_DOMAIN = 'https://d5u12uf28k3zi.cloudfront.net';

// Database connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: { rejectUnauthorized: false }
});

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event));
  
  let client;
  
  try {
    // Parse input
    const body = JSON.parse(event.body || '{}');
    const { name, price, description, images } = body;
    
    // Validation
    if (!name || name.trim() === '') {
      return createResponse(400, { error: 'Product name is required' });
    }
    
    if (!price || price <= 0) {
      return createResponse(400, { error: 'Valid price is required' });
    }
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return createResponse(400, { error: 'At least one image is required' });
    }
    
    if (images.length > 5) {
      return createResponse(400, { error: 'Maximum 5 images allowed' });
    }
    
    // Validate exactly one main image
    const mainImageCount = images.filter(img => img.is_main === true).length;
    if (mainImageCount !== 1) {
      return createResponse(400, { 
        error: 'Exactly one image must be marked as main' 
      });
    }
    
    // Validate all URLs are from CloudFront
    const invalidUrls = images.filter(img => 
      !img.url || !img.url.startsWith(CLOUDFRONT_DOMAIN)
    );
    if (invalidUrls.length > 0) {
      return createResponse(400, { 
        error: 'All image URLs must be valid CloudFront URLs' 
      });
    }
    
    console.log('Validation passed. Creating product...');
    
    // Get database client
    client = await pool.connect();
    
    // Start transaction
    await client.query('BEGIN');
    
    // Generate product ID
    const productId = uuidv4();
    
    // Insert product
    await client.query(
      `INSERT INTO products (id, name, price, description, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [productId, name, price, description || null]
    );
    
    console.log('Product inserted:', productId);
    
    // Insert images
    for (const img of images) {
      const imageId = uuidv4();
      await client.query(
        `INSERT INTO product_images 
         (id, product_id, image_url, is_main, display_order, created_at) 
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          imageId,
          productId,
          img.url,
          img.is_main || false,
          img.display_order || 0
        ]
      );
      console.log('Image inserted:', imageId);
    }
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('Transaction committed successfully');
    
    // Remove temporary tags from S3 (outside transaction)
    const tagRemovalResults = await Promise.all(
      images.map(async (img) => {
        try {
          const s3Key = img.url.replace(`${CLOUDFRONT_DOMAIN}/`, '');
          await s3Client.send(new DeleteObjectTaggingCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key
          }));
          console.log('Tag removed from:', s3Key);
          return { url: img.url, success: true };
        } catch (error) {
          console.error('Failed to remove tag from:', img.url, error);
          // Don't fail the request - just log
          return { url: img.url, success: false, error: error.message };
        }
      })
    );
    
    const failedTagRemovals = tagRemovalResults.filter(r => !r.success);
    if (failedTagRemovals.length > 0) {
      console.warn('Some tags failed to remove:', failedTagRemovals);
    }
    
    return createResponse(200, {
      success: true,
      productId,
      message: 'Product created successfully',
      tagRemovalStatus: {
        total: images.length,
        succeeded: tagRemovalResults.filter(r => r.success).length,
        failed: failedTagRemovals.length
      }
    });
    
  } catch (error) {
    console.error('Error creating product:', error);
    
    // Rollback transaction if it was started
    if (client) {
      try {
        await client.query('ROLLBACK');
        console.log('Transaction rolled back');
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
    }
    
    return createResponse(500, {
      error: 'Failed to create product',
      message: error.message
    });
    
  } finally {
    // Release client back to pool
    if (client) {
      client.release();
    }
  }
};

function createResponse(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify(body)
  };
}
