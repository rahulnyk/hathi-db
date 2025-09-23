#!/bin/bash

# Hathi DB Setup and Start Script
# This script handles both initial setup and subsequent app launches

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if Node.js version is sufficient
check_node_version() {
    if command_exists node; then
        local node_version=$(node -v | sed 's/v//')
        local major_version=$(echo $node_version | cut -d. -f1)
        if [ "$major_version" -ge 18 ]; then
            return 0
        fi
    fi
    return 1
}

# Function to install NVM and Node.js
install_nvm_and_node() {
    print_status "Installing NVM and Node.js..."
    
    # Install NVM if not already installed
    if [ ! -d "$HOME/.nvm" ]; then
        print_status "Installing NVM..."
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        
        # Source NVM
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    else
        print_status "NVM already installed, sourcing..."
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    fi
    
    # Install and use the latest LTS Node.js
    print_status "Installing Node.js LTS..."
    nvm install --lts
    nvm use --lts
    nvm alias default lts/*
    
    print_success "Node.js $(node -v) installed successfully"
}

# Function to install Yarn if not present
install_yarn() {
    if ! command_exists yarn; then
        print_status "Installing Yarn..."
        npm install -g yarn
        print_success "Yarn installed successfully"
    else
        print_status "Yarn already installed: $(yarn --version)"
    fi
}

# Function to setup environment file
setup_env_file() {
    if [ ! -f ".env.local" ]; then
        if [ -f ".env.example" ]; then
            print_status "Copying .env.example to .env.local..."
            cp .env.example .env.local
            print_success "Environment file created"
            print_warning "Please edit .env.local with your configuration before running the app"
        else
            print_error ".env.example file not found!"
            exit 1
        fi
    else
        print_status "Environment file .env.local already exists"
    fi
}

# Function to install dependencies
install_dependencies() {
    if [ ! -d "node_modules" ] || [ ! -f "yarn.lock" ]; then
        print_status "Installing dependencies with yarn..."
        yarn install
        print_success "Dependencies installed successfully"
    else
        print_status "Dependencies already installed, running yarn install to ensure they're up to date..."
        yarn install
    fi
}

# Function to setup database
setup_database() {
    print_status "Setting up SQLite database..."
    
    # Run database migration
    print_status "Running database migration..."
    yarn db:sqlite:migrate
    print_success "Database migration completed"
    
    # Test database connection
    print_status "Testing database connection..."
    yarn db:sqlite:test
    print_success "Database test completed"
}

# Function to setup and download HuggingFace embedding model
setup_embedding_model() {
    print_status "Setting up HuggingFace embedding model..."
    
    # Check if .env.local exists and contains embedding model configuration
    if [ -f ".env.local" ]; then
        # Source the environment file to get the model name
        set -a  # automatically export all variables
        source .env.local
        set +a  # stop automatically exporting
        
        # Check if we're using HuggingFace embeddings
        if [ "$EMBEDDING_PROVIDER" = "HUGGINGFACE" ] && [ -n "$HUGGINGFACE_EMBEDDING_MODEL" ]; then
            print_status "Downloading HuggingFace embedding model: $HUGGINGFACE_EMBEDDING_MODEL"
            print_status "This may take a few minutes depending on your internet connection..."
            
            # Create cache directory if it doesn't exist
            mkdir -p ./.cache/huggingface
            
            # Export environment variables for the Node.js script
            export HUGGINGFACE_EMBEDDING_MODEL
            
            # Run the download script with timeout
            if timeout 600 node scripts/download-model.js; then
                print_success "HuggingFace embedding model downloaded and cached successfully"
            else
                print_warning "Failed to download HuggingFace embedding model, but continuing setup..."
                print_warning "The model will be downloaded automatically when the app first starts"
                print_warning "This may cause a delay on first use"
            fi
        else
            print_status "Not using HuggingFace embeddings or model not configured, skipping model download"
        fi
    else
        print_warning "Environment file not found, skipping embedding model setup"
    fi
}

# Function to build the application
build_app() {
    print_status "Building the application..."
    yarn build
    print_success "Application built successfully"
}

# Function to check if initial setup is needed
needs_initial_setup() {
    # Check if any of the key setup indicators are missing
    if [ ! -f ".env.local" ] || [ ! -d "node_modules" ] || [ ! -f "yarn.lock" ]; then
        return 0  # Needs setup
    fi
    
    # Check if Node.js is available and correct version
    if ! check_node_version; then
        return 0  # Needs setup
    fi
    
    # Check if build directory exists
    if [ ! -d ".next" ]; then
        return 0  # Needs setup
    fi
    
    # Check if HuggingFace model cache exists (if using HuggingFace embeddings)
    if [ -f ".env.local" ]; then
        # Source the environment file to check embedding provider
        set -a
        source .env.local 2>/dev/null || true
        set +a
        
        if [ "$EMBEDDING_PROVIDER" = "HUGGINGFACE" ] && [ ! -d "./.cache/huggingface" ]; then
            return 0  # Needs setup - model not cached
        fi
    fi
    
    return 1  # No setup needed
}

# Function to start the application
start_app() {
    print_status "Starting the application..."
    print_success "Application will be available at http://localhost:3000"
    yarn start
}

# Main execution
main() {
    print_status "Hathi DB Setup and Start Script"
    print_status "==============================="
    
    # Change to script directory
    cd "$(dirname "$0")"
    
    if needs_initial_setup; then
        print_status "Initial setup required. Running full setup process..."
        
        # Step 1: Install NVM and Node.js
        if ! check_node_version; then
            install_nvm_and_node
        else
            print_status "Node.js $(node -v) already installed and meets requirements"
        fi
        
        # Ensure we can use yarn
        install_yarn
        
        # Step 2: Install dependencies
        install_dependencies
        
        # Step 3: Setup environment file
        setup_env_file
        
        # Step 4: Setup and download HuggingFace embedding model
        setup_embedding_model
        
        # Step 5: Setup database
        setup_database
        
        # Step 6: Build application
        build_app
        
        print_success "Initial setup completed successfully!"
        echo ""
        print_warning "Before starting the app, please review and update .env.local with your configuration"
        echo ""
        read -p "Press Enter to continue and start the application, or Ctrl+C to exit..."
        
    else
        print_status "Setup already completed. Starting application..."
    fi
    
    # Step 7: Start the application
    start_app
}

# Handle script interruption
trap 'echo ""; print_status "Application stopped by user. Goodbye!"; exit 0' INT

# Run main function
main "$@"
