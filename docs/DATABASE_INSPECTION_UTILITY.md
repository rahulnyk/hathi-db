# Database Inspection Utility

I've created a comprehensive database inspection utility that allows you to easily examine your PostgreSQL database structure and components.

## 📁 **New File Created**

-   **`db/inspect.ts`** - Database inspection utility with multiple commands

## 🛠️ **Available Commands**

### Package.json Scripts

```bash
yarn db:tables      # List all tables in the database
yarn db:schema      # Show schema for all tables
yarn db:functions   # List all custom functions
yarn db:indexes     # List all indexes
yarn db:overview    # Show complete database overview
```

### Direct Command Usage

```bash
# List tables
tsx db/inspect.ts tables

# Show schema for specific table
tsx db/inspect.ts schema notes

# Show schema for all tables
tsx db/inspect.ts schema

# List functions
tsx db/inspect.ts functions

# List indexes for specific table
tsx db/inspect.ts indexes notes

# List all indexes
tsx db/inspect.ts indexes

# Complete overview
tsx db/inspect.ts overview
```

## 🔍 **Command Details**

### 1. **Tables Command** (`yarn db:tables`)

Shows a clean table listing with:

-   Table names
-   Owner information
-   Index presence indicator
-   Rules presence indicator
-   Triggers presence indicator

**Example Output:**

```
┌─────────────────┬─────────────┬─────────┬─────────┬──────────┐
│ Table Name      │ Owner       │ Indexes │ Rules   │ Triggers │
├─────────────────┼─────────────┼─────────┼─────────┼──────────┤
│ notes           │ postgres    │ ✓       │ ✗       │ ✓        │
└─────────────────┴─────────────┴─────────┴─────────┴──────────┘
```

### 2. **Schema Command** (`yarn db:schema`)

Displays detailed table structure:

-   Column names and types
-   Nullable/Not Null status
-   Default values
-   Ordinal positions

**Features:**

-   View all tables: `yarn db:schema`
-   View specific table: `tsx db/inspect.ts schema notes`

### 3. **Functions Command** (`yarn db:functions`)

Lists all database functions with:

-   Function name
-   Function type (function, procedure, aggregate, etc.)
-   Programming language
-   Arguments/parameters
-   Return types

**Includes:**

-   ✅ Your custom application functions
-   ✅ pgvector functions (vector operations)
-   ✅ Trigger functions

### 4. **Indexes Command** (`yarn db:indexes`)

Shows comprehensive index information:

-   Index names and types
-   Index methods (BTREE, GIN, IVFFLAT)
-   Index sizes
-   Primary key indicators
-   Unique constraint indicators
-   Full index definitions for complex indexes

**Features:**

-   View all indexes: `yarn db:indexes`
-   View table-specific indexes: `tsx db/inspect.ts indexes notes`

### 5. **Overview Command** (`yarn db:overview`)

Complete database overview combining all commands:

-   Tables summary
-   Full schema details
-   All functions
-   All indexes

## ✨ **Key Features**

### **Smart Formatting**

-   Clean, readable table layouts
-   Color-coded indicators (✓/✗)
-   Proper alignment and padding
-   Size information for indexes

### **Detailed Information**

-   **Tables**: Owner, constraints, relationships
-   **Schema**: Data types, nullability, defaults
-   **Functions**: Arguments, return types, language
-   **Indexes**: Methods, sizes, definitions

### **Targeted Queries**

-   View specific tables or all tables
-   Filter by table name for schema/indexes
-   Application-specific function highlighting

### **Error Handling**

-   Connection testing before operations
-   Clear error messages
-   Graceful failure handling

## 🎯 **Use Cases**

### **Development**

```bash
# Quick table check
yarn db:tables

# Verify schema after migration
yarn db:schema

# Check if indexes are created
yarn db:indexes
```

### **Debugging**

```bash
# Check specific table structure
tsx db/inspect.ts schema notes

# Verify function exists
yarn db:functions | grep "search_notes_by_similarity"

# Check index performance
tsx db/inspect.ts indexes notes
```

### **Documentation**

```bash
# Generate complete database documentation
yarn db:overview > database_structure.txt
```

### **Performance Analysis**

```bash
# Check index sizes and types
yarn db:indexes

# Verify vector indexes are created properly
tsx db/inspect.ts indexes notes
```

## 🔗 **Integration**

The inspection utility:

-   ✅ Uses the same connection configuration as migration tools
-   ✅ Tests connection before running commands
-   ✅ Works with the existing Docker PostgreSQL setup
-   ✅ Provides consistent formatting and error handling

## 📊 **Sample Output Highlights**

**Key Application Functions Found:**

-   `get_user_context_stats()` - Context statistics
-   `get_user_context_stats_paginated()` - Paginated context stats
-   `search_user_contexts()` - Context search
-   `search_notes_by_similarity()` - Semantic search
-   `update_updated_at_column()` - Timestamp trigger

**Indexes Working Correctly:**

-   12 indexes total on `notes` table
-   Vector similarity indexes (IVFFlat) - 1.6MB each
-   GIN indexes for arrays - 16KB each
-   Standard B-tree indexes - 8KB each

This inspection utility provides everything you need to monitor, debug, and document your PostgreSQL database structure! 🚀
