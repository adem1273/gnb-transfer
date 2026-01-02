#!/bin/bash

###############################################################################
# Generate Self-Signed SSL Certificates for Staging
###############################################################################
# 
# This script generates self-signed SSL certificates for the staging environment.
# These certificates should NOT be used in production.
# For production, use Let's Encrypt or a commercial CA.
#
# Usage:
#   ./scripts/generate-ssl-certs.sh
#
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SSL_DIR="${PROJECT_ROOT}/ssl-certs"

echo -e "${YELLOW}Generating self-signed SSL certificates for staging...${NC}"

# Create SSL directory if it doesn't exist
mkdir -p "$SSL_DIR"

# Generate private key
openssl genrsa -out "$SSL_DIR/key.pem" 2048

# Generate certificate signing request
openssl req -new -key "$SSL_DIR/key.pem" -out "$SSL_DIR/csr.pem" \
  -subj "/C=TR/ST=Istanbul/L=Istanbul/O=GNB Transfer/OU=Staging/CN=localhost"

# Generate self-signed certificate (valid for 365 days)
openssl x509 -req -days 365 -in "$SSL_DIR/csr.pem" \
  -signkey "$SSL_DIR/key.pem" -out "$SSL_DIR/cert.pem"

# Clean up CSR
rm "$SSL_DIR/csr.pem"

# Set appropriate permissions
chmod 600 "$SSL_DIR/key.pem"
chmod 644 "$SSL_DIR/cert.pem"

echo -e "${GREEN}✓ SSL certificates generated successfully${NC}"
echo "Certificate: $SSL_DIR/cert.pem"
echo "Private Key: $SSL_DIR/key.pem"
echo ""
echo -e "${YELLOW}WARNING: These are self-signed certificates for staging only!${NC}"
echo "Do NOT use in production. Use Let's Encrypt or a commercial CA instead."
