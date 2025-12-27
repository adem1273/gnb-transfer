# Image Upload API Documentation

## Overview

Secure admin-only image upload system using Cloudinary. This endpoint allows administrators to upload images that are stored in Cloudinary and returns the public URL.

## Endpoint

```
POST /api/v1/upload/image
```

## Authentication

**Required:** Admin role

Include JWT token in Authorization header:
```
Authorization: Bearer <admin-jwt-token>
```

## Request

**Content-Type:** `multipart/form-data`

**Form Field:**
- `image` (file) - The image file to upload

**Allowed File Types:**
- `image/jpeg`
- `image/png`
- `image/webp`

**File Size Limit:**
- Maximum: 2MB

## Response

### Success (201 Created)

```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/gnb-transfer/xyz.jpg"
  }
}
```

### Error Responses

#### 400 Bad Request - No File Provided
```json
{
  "success": false,
  "message": "No image file provided"
}
```

#### 400 Bad Request - Invalid File Type
```json
{
  "success": false,
  "message": "Invalid file type. Only JPEG, PNG, and WebP images are allowed. Received: image/gif"
}
```

#### 400 Bad Request - File Too Large
```json
{
  "success": false,
  "message": "File size exceeds 2MB limit"
}
```

#### 401 Unauthorized - Missing Authentication
```json
{
  "success": false,
  "message": "Authentication required"
}
```

#### 403 Forbidden - Non-Admin User
```json
{
  "success": false,
  "message": "Admin access required"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to upload image"
}
```

## Configuration

Add the following environment variables to your `.env` file:

```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Get these credentials from: https://cloudinary.com/console

## Example Usage

### cURL

```bash
curl -X POST http://localhost:5000/api/v1/upload/image \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -F "image=@/path/to/image.jpg"
```

### JavaScript (Axios)

```javascript
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const form = new FormData();
form.append('image', fs.createReadStream('./image.jpg'));

const response = await axios.post('http://localhost:5000/api/v1/upload/image', form, {
  headers: {
    ...form.getHeaders(),
    'Authorization': 'Bearer YOUR_ADMIN_JWT_TOKEN'
  }
});

console.log('Uploaded URL:', response.data.data.url);
```

### JavaScript (Fetch - Browser)

```javascript
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

const formData = new FormData();
formData.append('image', file);

const response = await fetch('http://localhost:5000/api/v1/upload/image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`
  },
  body: formData
});

const data = await response.json();
console.log('Uploaded URL:', data.data.url);
```

### Postman

1. Create a new POST request
2. URL: `http://localhost:5000/api/v1/upload/image`
3. Headers:
   - `Authorization`: `Bearer YOUR_ADMIN_JWT_TOKEN`
4. Body:
   - Select `form-data`
   - Key: `image` (select "File" type)
   - Value: Select your image file

## Security Features

1. **Admin-Only Access**: Only users with admin role can upload images
2. **File Type Validation**: Only JPEG, PNG, and WebP images are allowed
3. **File Size Limit**: Maximum 2MB per image
4. **Cloudinary Storage**: Images are stored securely in Cloudinary
5. **Organized Folders**: All images are stored in the `gnb-transfer` folder
6. **Audit Logging**: All upload actions are logged for security auditing

## Storage Organization

Images are stored in Cloudinary with the following structure:

```
gnb-transfer/
  ├── [random-id-1].jpg
  ├── [random-id-2].png
  └── [random-id-3].webp
```

Cloudinary automatically generates unique IDs for each uploaded image to prevent conflicts.

## Best Practices

1. **Validate on Frontend**: Check file type and size before upload to improve UX
2. **Show Progress**: Use upload progress events for better user experience
3. **Handle Errors**: Properly display error messages to users
4. **Optimize Images**: Consider resizing large images before upload
5. **Store URLs**: Save the returned URL in your database for future reference

## Troubleshooting

### "Cloudinary configuration is incomplete"

Make sure all three Cloudinary environment variables are set:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

### "Failed to upload image"

Check:
1. Cloudinary credentials are correct
2. Network connectivity to Cloudinary
3. Server logs for detailed error messages

### "File size exceeds 2MB limit"

Resize or compress your image before uploading. Use tools like:
- ImageMagick
- Sharp (Node.js)
- Online compressors (TinyPNG, etc.)

## Testing

Use the provided test script:

```bash
cd backend
node scripts/test-upload.mjs /path/to/image.jpg YOUR_ADMIN_JWT_TOKEN
```

## Related Files

- **Middleware**: `backend/middlewares/upload.mjs`
- **Routes**: `backend/routes/uploadRoutes.mjs`
- **Test Script**: `backend/scripts/test-upload.mjs`
- **Tests**: `backend/tests/upload.test.mjs`
