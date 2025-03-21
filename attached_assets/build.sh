#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting build process for bartertap.az...${NC}"

# Step 1: Install dependencies
echo -e "${GREEN}Step 1/5: Installing dependencies...${NC}"
npm install --production
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to install dependencies!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Dependencies installed successfully.${NC}"

# Step 2: Build the project
echo -e "${GREEN}Step 2/5: Building the project...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to build the project!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Project built successfully.${NC}"

# Step 3: Create build directory
echo -e "${GREEN}Step 3/5: Preparing files for deployment...${NC}"
mkdir -p deployment
cp -r dist deployment/
cp -r public deployment/
cp .htaccess deployment/
cp .env.production deployment/.env
cp Procfile deployment/
cp adapters deployment/ -r
cp -r uploads deployment/ 2>/dev/null || true
echo -e "${GREEN}✓ Files prepared for deployment.${NC}"

# Step 4: Compress files for upload
echo -e "${GREEN}Step 4/5: Compressing files...${NC}"
cd deployment
zip -r ../bartertap_deploy.zip .
cd ..
echo -e "${GREEN}✓ Files compressed successfully.${NC}"

# Step 5: Provide instructions
echo -e "${GREEN}Step 5/5: Deployment package created!${NC}"
echo -e "${YELLOW}======================= NEXT STEPS =======================${NC}"
echo -e "1. Upload the ${GREEN}bartertap_deploy.zip${NC} file to your Hostinger server"
echo -e "2. Connect via FTP:"
echo -e "   - Host: ${GREEN}ftp://46.202.156.134${NC} or ${GREEN}ftp://bartertap.az${NC}"
echo -e "   - Username: ${GREEN}u726371272.bartertap.az${NC}"
echo -e "   - Upload Path: ${GREEN}public_html${NC}"
echo -e "3. Extract the ZIP file on the server"
echo -e "4. Update your MySQL password in the .env file"
echo -e "5. Set up any necessary cron jobs"
echo -e "${YELLOW}=========================================================${NC}"
echo -e "${GREEN}Build process completed successfully!${NC}"