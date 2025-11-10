#!/bin/bash

# Setup Git Hooks for GNB Transfer
# Run this script to install pre-commit hooks

echo "🔧 Setting up Git hooks..."

# Get the repository root directory
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)

if [ -z "$REPO_ROOT" ]; then
    echo "❌ Error: Not a git repository"
    exit 1
fi

# Path to our custom hooks
HOOKS_DIR="$REPO_ROOT/.git-hooks"
GIT_HOOKS_DIR="$REPO_ROOT/.git/hooks"

# Check if our hooks directory exists
if [ ! -d "$HOOKS_DIR" ]; then
    echo "❌ Error: Hooks directory not found at $HOOKS_DIR"
    exit 1
fi

# Create symlink or copy the pre-commit hook
if [ -f "$HOOKS_DIR/pre-commit" ]; then
    echo "📋 Installing pre-commit hook..."
    
    # Make sure the hook is executable
    chmod +x "$HOOKS_DIR/pre-commit"
    
    # Create symlink (or copy if symlink fails)
    if ln -sf "$HOOKS_DIR/pre-commit" "$GIT_HOOKS_DIR/pre-commit" 2>/dev/null; then
        echo "✅ Pre-commit hook installed (symlinked)"
    else
        cp "$HOOKS_DIR/pre-commit" "$GIT_HOOKS_DIR/pre-commit"
        chmod +x "$GIT_HOOKS_DIR/pre-commit"
        echo "✅ Pre-commit hook installed (copied)"
    fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Git hooks setup complete!"
echo ""
echo "The pre-commit hook will now:"
echo "  • Check for secrets and sensitive data"
echo "  • Prevent committing .env files"
echo "  • Run ESLint on JavaScript files"
echo "  • Check for console statements"
echo "  • Detect large files"
echo ""
echo "To bypass the hook: git commit --no-verify"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
