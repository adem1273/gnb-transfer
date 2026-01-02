# SSL Certificates for Staging

This directory contains SSL certificates for the staging environment.

## Self-Signed Certificates (Staging)

For staging, we use self-signed certificates. To generate them:

```bash
../scripts/generate-ssl-certs.sh
```

This will create:
- `cert.pem` - Self-signed certificate
- `key.pem` - Private key

**WARNING:** These certificates are for staging/development only. Your browser will show security warnings.

## Production Certificates

For production, use Let's Encrypt or a commercial Certificate Authority (CA).

### Using Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Generate certificates
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certificates will be stored in /etc/letsencrypt/live/yourdomain.com/
# Copy them to this directory:
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./key.pem
```

### Auto-renewal

Let's Encrypt certificates expire after 90 days. Set up auto-renewal:

```bash
# Test renewal
sudo certbot renew --dry-run

# Add to crontab for automatic renewal
sudo crontab -e
# Add: 0 0 * * 0 certbot renew --quiet && systemctl reload nginx
```

## File Permissions

Ensure proper permissions:
```bash
chmod 600 key.pem   # Private key should be readable only by owner
chmod 644 cert.pem  # Certificate can be world-readable
```

## Security Best Practices

1. **Never commit** `key.pem` to version control
2. **Rotate certificates** regularly (at least annually)
3. **Use strong cipher suites** in nginx configuration
4. **Enable HSTS** in production
5. **Monitor expiration** dates

## Troubleshooting

### Browser Certificate Warnings

For self-signed certificates, browsers will show warnings. You can:
1. Add an exception in your browser (staging only!)
2. Import the certificate into your browser's trusted certificates

### Certificate Chain Issues

If you get certificate chain errors:
1. Ensure you're using `fullchain.pem` not just `cert.pem`
2. Verify the certificate order: server cert, intermediate certs, root cert

### Testing Certificates

```bash
# Check certificate details
openssl x509 -in cert.pem -text -noout

# Test SSL connection
openssl s_client -connect localhost:443 -servername localhost

# Verify certificate and key match
openssl x509 -noout -modulus -in cert.pem | openssl md5
openssl rsa -noout -modulus -in key.pem | openssl md5
# The MD5 hashes should match
```
