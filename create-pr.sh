#!/bin/bash
# Helper script to create PR from fix/auto-fixes to master
# Usage: ./create-pr.sh

set -e

OWNER="adem1273"
REPO="gnb-transfer"
HEAD="fix/auto-fixes"
BASE="master"
TITLE="Phase 1: Backend ES-module refactor + Security middlewares + Models"

# Read the PR description from file
BODY=$(cat PR_DESCRIPTION.md)

echo "Creating Pull Request from $HEAD to $BASE..."
echo ""

# Method 1: Using GitHub CLI (recommended if authenticated)
if command -v gh &> /dev/null; then
    echo "Using GitHub CLI..."
    gh pr create \
        --base "$BASE" \
        --head "$HEAD" \
        --title "$TITLE" \
        --body-file PR_DESCRIPTION.md \
        --reviewer adem1273 \
        --label "phase1,security,backend" \
        --no-maintainer-edit
    echo "✅ PR created successfully using GitHub CLI"
    exit 0
fi

# Method 2: Using curl and GitHub API  
if [ -n "$GITHUB_TOKEN" ]; then
    echo "Using GitHub API with GITHUB_TOKEN..."
    
    # Create JSON payload for PR body (escape for JSON)
    BODY_JSON=$(jq -Rs . < PR_DESCRIPTION.md)
    
    response=$(curl -s -X POST \
        -H "Accept: application/vnd.github+json" \
        -H "Authorization: Bearer $GITHUB_TOKEN" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        https://api.github.com/repos/$OWNER/$REPO/pulls \
        -d "{
            \"title\": \"$TITLE\",
            \"body\": $BODY_JSON,
            \"head\": \"$HEAD\",
            \"base\": \"$BASE\",
            \"draft\": false
        }")
    
    # Extract PR number
    PR_NUMBER=$(echo "$response" | jq -r '.number // empty')
    
    if [ -n "$PR_NUMBER" ] && [ "$PR_NUMBER" != "null" ]; then
        echo "✅ PR #$PR_NUMBER created successfully!"
        echo ""
        
        # Add labels
        echo "Adding labels..."
        curl -s -X POST \
            -H "Accept: application/vnd.github+json" \
            -H "Authorization: Bearer $GITHUB_TOKEN" \
            -H "X-GitHub-Api-Version: 2022-11-28" \
            https://api.github.com/repos/$OWNER/$REPO/issues/$PR_NUMBER/labels \
            -d '{"labels":["phase1","security","backend"]}' > /dev/null
        echo "✅ Labels added"
        
        # Request reviewer
        echo "Requesting reviewer..."
        curl -s -X POST \
            -H "Accept: application/vnd.github+json" \
            -H "Authorization: Bearer $GITHUB_TOKEN" \
            -H "X-GitHub-Api-Version: 2022-11-28" \
            https://api.github.com/repos/$OWNER/$REPO/pulls/$PR_NUMBER/requested_reviewers \
            -d '{"reviewers":["adem1273"]}' > /dev/null
        echo "✅ Reviewer requested"
        
        echo ""
        echo "PR URL: https://github.com/$OWNER/$REPO/pull/$PR_NUMBER"
        exit 0
    else
        echo "❌ Failed to create PR"
        echo "Response: $response"
        exit 1
    fi
fi

# No method available
echo "❌ Error: Neither 'gh' CLI nor GITHUB_TOKEN is available"
echo ""
echo "Please either:"
echo "1. Install and authenticate GitHub CLI: https://cli.github.com/"
echo "   gh auth login"
echo ""
echo "2. Set GITHUB_TOKEN environment variable:"
echo "   export GITHUB_TOKEN=your_github_personal_access_token"
echo ""
echo "3. Or create the PR manually at:"
echo "   https://github.com/$OWNER/$REPO/compare/$BASE...$HEAD"
echo ""
echo "PR Details:"
echo "  Base: $BASE"
echo "  Head: $HEAD"
echo "  Title: $TITLE"
echo "  Labels: phase1, security, backend"
echo "  Reviewer: @adem1273"
echo ""
echo "See PR_DESCRIPTION.md for the full PR description."
exit 1
