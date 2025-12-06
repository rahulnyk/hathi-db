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

# Function to get database type from environment
get_database_type() {
    if [ -f ".env.local" ]; then
        # Source the environment file to get database type
        set -a
        source .env.local 2>/dev/null || true
        set +a
        
        # Default to sqlite if not specified
        echo "${USE_DB:-sqlite}"
    else
        echo "sqlite"
    fi
}

# Function to check if migrations need to be run
needs_migration() {
    local db_type=$(get_database_type)
    
    # Ensure .next directory exists for tracking files
    if [ ! -d ".next" ]; then
        print_status "Creating tracking directory for migration detection"
        mkdir -p ".next" || {
            print_warning "Could not create .next directory, assuming migrations needed"
            return 0
        }
    fi
    
    local migration_timestamp_file=".next/migration-timestamp-${db_type}"
    local migration_files_hash_file=".next/migration-files-hash-${db_type}"
    
    # Check if migration timestamp file exists
    if [ ! -f "$migration_timestamp_file" ]; then
        print_status "No migration tracking file found - migrations needed"
        return 0  # Needs migration
    fi
    
    # Get migration directory based on database type
    local migration_dir
    if [ "$db_type" = "sqlite" ]; then
        migration_dir="db/sqlite/migrate"
    else
        migration_dir="db/postgres/migrate"
    fi
    
    # Check if migration directory exists
    if [ ! -d "$migration_dir" ]; then
        return 1  # No migrations to run
    fi
    
    # Calculate hash of all migration files
    local current_hash=""
    if [ -d "$migration_dir" ]; then
        current_hash=$(find "$migration_dir" -name "*.sql" -type f -exec cat {} \; | shasum -a 256 | cut -d' ' -f1)
    fi
    
    # Get stored hash
    local stored_hash=""
    if [ -f "$migration_files_hash_file" ]; then
        stored_hash=$(cat "$migration_files_hash_file")
    fi
    
    # Compare hashes
    if [ "$current_hash" != "$stored_hash" ]; then
        print_status "Detected changes in migration files"
        return 0  # Needs migration
    fi

    # Check if any migration files are newer than the timestamp
    if find "$migration_dir" -name "*.sql" -newer "$migration_timestamp_file" 2>/dev/null | grep -q .; then
        print_status "Detected newer migration files"
        return 0  # Needs migration
    fi
    
    # Check if database file exists (for SQLite)
    if [ "$db_type" = "sqlite" ]; then
        # Ensure data directory exists
        if [ ! -d "data" ]; then
            print_status "Creating data directory for SQLite"
            mkdir -p "data" || {
                print_warning "Could not create data directory"
                return 0  # Needs migration to handle this
            }
        fi
        
        if [ ! -f "data/hathi.db" ]; then
            print_status "SQLite database file not found"
            return 0  # Needs migration
        fi
    fi
    
    return 1  # No migration needed
}

# Function to record migration information
record_migration_info() {
    local db_type=$(get_database_type)
    
    # Ensure .next directory exists, create if needed
    if [ ! -d ".next" ]; then
        print_status "Creating tracking directory for migration records"
        mkdir -p ".next" || {
            print_warning "Could not create .next directory for tracking"
            return 1
        }
    fi
    
    local migration_timestamp_file=".next/migration-timestamp-${db_type}"
    local migration_files_hash_file=".next/migration-files-hash-${db_type}"
    
    # Create timestamp file
    touch "$migration_timestamp_file" || {
        print_warning "Could not create migration timestamp file"
        return 1
    }
    
    # Calculate and store hash of migration files
    local migration_dir
    if [ "$db_type" = "sqlite" ]; then
        migration_dir="db/sqlite/migrate"
    else
        migration_dir="db/postgres/migrate"
    fi
    
    if [ -d "$migration_dir" ]; then
        local current_hash=$(find "$migration_dir" -name "*.sql" -type f -exec cat {} \; 2>/dev/null | shasum -a 256 2>/dev/null | cut -d' ' -f1 2>/dev/null)
        if [ -n "$current_hash" ]; then
            echo "$current_hash" > "$migration_files_hash_file" || {
                print_warning "Could not save migration files hash"
            }
        fi
    fi
}

# Function to setup database
setup_database() {
    local db_type=$(get_database_type)
    
    print_status "Setting up $db_type database..."
    
    # Run database migration based on type
    print_status "Running database migration..."
    if [ "$db_type" = "sqlite" ]; then
        yarn db:sqlite:migrate
        
        # Test database connection
        print_status "Testing database connection..."
        yarn db:sqlite:test
    else
        yarn db:migrate
        
        # Test database connection
        print_status "Testing database connection..."
        yarn db:test
    fi
    
    # Record migration information for future checks
    record_migration_info
    
    print_success "Database migration completed"
    
    # Show database overview after migration
    show_database_info
}

# Function to show database information
show_database_info() {
    local db_type=$(get_database_type)
    
    print_status "Database Overview ($db_type)"
    echo ""
    
    if [ "$db_type" = "sqlite" ]; then
        # Show SQLite database overview
        if command_exists yarn; then
            print_status "📋 Database Tables:"
            yarn --silent db:sqlite:tables 2>/dev/null || {
                print_warning "Could not display database tables"
            }
            echo ""
            
            print_status "📊 Database Overview:"
            yarn --silent db:sqlite:overview 2>/dev/null || {
                print_warning "Could not display database overview"
            }
        fi
    else
        # Show PostgreSQL database overview  
        if command_exists yarn; then
            print_status "📋 Database Tables:"
            yarn --silent db:tables 2>/dev/null || {
                print_warning "Could not display database tables"
            }
            echo ""
            
            print_status "📊 Database Overview:"
            yarn --silent db:overview 2>/dev/null || {
                print_warning "Could not display database overview"
            }
        fi
    fi
    
    echo ""
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
    
    # Record build information for future rebuild checks
    record_build_info
    
    print_success "Application built successfully"
}

# Function to check if rebuild is needed
needs_rebuild() {
    # Check if build directory exists
    if [ ! -d ".next" ]; then
        return 0  # Needs rebuild
    fi
    
    # Check if there's a build timestamp file
    local build_timestamp_file=".next/build-timestamp"
    
    # If no timestamp file exists, we need to rebuild
    if [ ! -f "$build_timestamp_file" ]; then
        return 0  # Needs rebuild
    fi
    
    local build_time=$(cat "$build_timestamp_file" 2>/dev/null || echo "0")
    
    # Check if any source files are newer than the build timestamp
    # Look for TypeScript, JavaScript, CSS, and config files
    # Use multiple find commands for different extensions since brace expansion doesn't work with -name
    
    # Check TypeScript/JavaScript files in directories
    if find . \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
        -path "./app/*" -not -path "./node_modules/*" -not -path "./.next/*" \
        -newer "$build_timestamp_file" 2>/dev/null | grep -q .; then
        return 0  # Needs rebuild
    fi
    
    if find . \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
        -path "./components/*" -not -path "./node_modules/*" -not -path "./.next/*" \
        -newer "$build_timestamp_file" 2>/dev/null | grep -q .; then
        return 0  # Needs rebuild
    fi
    
    if find . \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
        -path "./lib/*" -not -path "./node_modules/*" -not -path "./.next/*" \
        -newer "$build_timestamp_file" 2>/dev/null | grep -q .; then
        return 0  # Needs rebuild
    fi
    
    if find . \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
        -path "./hooks/*" -not -path "./node_modules/*" -not -path "./.next/*" \
        -newer "$build_timestamp_file" 2>/dev/null | grep -q .; then
        return 0  # Needs rebuild
    fi
    
    if find . \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
        -path "./store/*" -not -path "./node_modules/*" -not -path "./.next/*" \
        -newer "$build_timestamp_file" 2>/dev/null | grep -q .; then
        return 0  # Needs rebuild
    fi
    
    # Check CSS files
    if find . \( -name "*.css" -o -name "*.scss" -o -name "*.sass" \) \
        \( -path "./app/*" -o -path "./components/*" \) \
        -not -path "./node_modules/*" -not -path "./.next/*" \
        -newer "$build_timestamp_file" 2>/dev/null | grep -q .; then
        return 0  # Needs rebuild
    fi
    
    # Check root level files with specific patterns
    if find . -maxdepth 1 \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.json" \) \
        -newer "$build_timestamp_file" 2>/dev/null | grep -q .; then
        return 0  # Needs rebuild
    fi
    
    # Check config files with regex patterns
    if find . -maxdepth 1 -regex ".*tailwind\.config\..*" \
        -newer "$build_timestamp_file" 2>/dev/null | grep -q .; then
        return 0  # Needs rebuild
    fi
    
    if find . -maxdepth 1 -regex ".*next\.config\..*" \
        -newer "$build_timestamp_file" 2>/dev/null | grep -q .; then
        return 0  # Needs rebuild
    fi
    
    if find . -maxdepth 1 -regex ".*postcss\.config\..*" \
        -newer "$build_timestamp_file" 2>/dev/null | grep -q .; then
        return 0  # Needs rebuild
    fi
    
    # Check package files
    if find . -maxdepth 1 \( -name "package.json" -o -name "yarn.lock" \) \
        -newer "$build_timestamp_file" 2>/dev/null | grep -q .; then
        return 0  # Needs rebuild
    fi
    
    # If git is available, check for uncommitted changes or new commits
    if command_exists git && [ -d ".git" ]; then
        # Check if there are any uncommitted changes to source files
        if ! git diff --quiet HEAD -- app/ components/ lib/ hooks/ store/ ":(glob)*.ts" ":(glob)*.tsx" ":(glob)*.js" ":(glob)*.jsx" ":(glob)*.json" ":(glob)tailwind.config.*" ":(glob)next.config.*" ":(glob)postcss.config.*" package.json yarn.lock 2>/dev/null; then
            print_status "Detected uncommitted changes in source files"
            return 0  # Needs rebuild
        fi
        
        # Check if there are untracked source files
        if git ls-files --others --exclude-standard | grep -E '\.(ts|tsx|js|jsx|css|scss|sass|json)$|package\.json$|yarn\.lock$|config\.(ts|js|mjs)$' | grep -q .; then
            print_status "Detected untracked source files"
            return 0  # Needs rebuild
        fi
        
        # Check if HEAD has changed since last build (new pulls/commits)
        local current_head=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
        local build_head_file=".next/build-head"
        local last_build_head=$(cat "$build_head_file" 2>/dev/null || echo "unknown")
        
        if [ "$current_head" != "$last_build_head" ]; then
            print_status "Detected new commits since last build"
            return 0  # Needs rebuild
        fi
    fi
    
    return 1  # No rebuild needed
}

# Function to record build information
record_build_info() {
    local build_timestamp_file=".next/build-timestamp"
    local build_head_file=".next/build-head"
    
    # Create timestamp file
    touch "$build_timestamp_file"
    
    # Record git HEAD if git is available
    if command_exists git && [ -d ".git" ]; then
        local current_head=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
        echo "$current_head" > "$build_head_file"
    fi
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
    local force_rebuild=false
    local force_migration=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force-rebuild|-f)
                force_rebuild=true
                shift
                ;;
            --force-migration|-m)
                force_migration=true
                shift
                ;;
            --force-all|-a)
                force_rebuild=true
                force_migration=true
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  -f, --force-rebuild    Force rebuild even if no changes detected"
                echo "  -m, --force-migration  Force migration even if no changes detected"
                echo "  -a, --force-all        Force both rebuild and migration"
                echo "  -h, --help            Show this help message"
                echo ""
                echo "This script automatically detects when a rebuild or migration is needed based on:"
                echo ""
                echo "Rebuild detection:"
                echo "  - Source file modifications"
                echo "  - Git commits/pulls (new HEAD)"
                echo "  - Uncommitted changes"
                echo "  - Untracked source files"
                echo ""
                echo "Migration detection:"
                echo "  - Changes in migration files"
                echo "  - New migration files"
                echo "  - Missing database files (SQLite)"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                print_error "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
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
        print_status "Setup already completed."
        
        # Ensure dependencies are up to date
        print_status "Checking dependencies..."
        install_dependencies
        
        # Check if migrations need to be run or forced
        if [ "$force_migration" = true ]; then
            print_status "Force migration requested. Running migrations..."
            local db_type=$(get_database_type)
            if [ "$db_type" = "sqlite" ]; then
                yarn db:sqlite:migrate
            else
                yarn db:migrate
            fi
            record_migration_info
            print_success "Database migration completed"
            show_database_info
        elif needs_migration; then
            print_status "Migration required due to database changes. Running migrations..."
            local db_type=$(get_database_type)
            if [ "$db_type" = "sqlite" ]; then
                yarn db:sqlite:migrate
            else
                yarn db:migrate
            fi
            record_migration_info
            print_success "Database migration completed"
            show_database_info
        else
            print_status "No migration needed."
            # Show database info even when no migration was needed
            show_database_info
        fi
        
        # Check if rebuild is needed or forced
        if [ "$force_rebuild" = true ]; then
            print_status "Force rebuild requested. Building application..."
            build_app
        elif needs_rebuild; then
            print_status "Rebuild required due to source code changes. Building application..."
            build_app
        else
            print_status "No rebuild needed. Starting application..."
        fi
    fi
    
    # Step 7: Start the application
    start_app
}

# Handle script interruption
trap 'echo ""; print_status "Application stopped by user. Goodbye!"; exit 0' INT

# Run main function
main "$@"
