#!/bin/bash
# Gereksiz Dosyaları Temizleme Betiği / Cleanup Unnecessary Files Script
# Usage: ./cleanup-unnecessary-files.sh [--dry-run]

set -e

# Renkli çıktı / Colored output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DRY_RUN=false
if [[ "$1" == "--dry-run" ]]; then
    DRY_RUN=true
    echo -e "${YELLOW}DRY RUN MODE: Hiçbir dosya silinmeyecek / No files will be deleted${NC}"
    echo ""
fi

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  GNB Transfer - Gereksiz Dosya Temizleme / Cleanup Tool${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Backup kontrolü / Check backup
if [ "$DRY_RUN" = false ]; then
    echo -e "${YELLOW}⚠️  Bu betik dosya silecek! / This script will delete files!${NC}"
    echo -e "${YELLOW}⚠️  Devam etmeden önce yedek aldınız mı? / Have you made a backup?${NC}"
    echo ""
    read -p "Devam etmek istiyor musunuz? (yes/no): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo -e "${RED}✗ İptal edildi / Cancelled${NC}"
        exit 1
    fi
fi

# Sayaçlar / Counters
DELETED_COUNT=0
MOVED_COUNT=0
CREATED_COUNT=0
SKIPPED_COUNT=0

# Yardımcı fonksiyonlar / Helper functions
safe_rm() {
    local file=$1
    if [ -f "$file" ] || [ -d "$file" ]; then
        if [ "$DRY_RUN" = true ]; then
            echo -e "${YELLOW}[DRY RUN]${NC} Would delete: $file"
        else
            rm -rf "$file"
            echo -e "${GREEN}✓${NC} Deleted: $file"
        fi
        ((DELETED_COUNT++))
    else
        echo -e "${BLUE}○${NC} Not found (skipping): $file"
        ((SKIPPED_COUNT++))
    fi
}

safe_mv() {
    local src=$1
    local dest=$2
    if [ -f "$src" ] || [ -d "$src" ]; then
        if [ "$DRY_RUN" = true ]; then
            echo -e "${YELLOW}[DRY RUN]${NC} Would move: $src → $dest"
        else
            mv "$src" "$dest"
            echo -e "${GREEN}✓${NC} Moved: $src → $dest"
        fi
        ((MOVED_COUNT++))
    else
        echo -e "${BLUE}○${NC} Not found (skipping): $src"
        ((SKIPPED_COUNT++))
    fi
}

safe_mkdir() {
    local dir=$1
    if [ ! -d "$dir" ]; then
        if [ "$DRY_RUN" = true ]; then
            echo -e "${YELLOW}[DRY RUN]${NC} Would create: $dir"
        else
            mkdir -p "$dir"
            echo -e "${GREEN}✓${NC} Created: $dir"
        fi
        ((CREATED_COUNT++))
    fi
}

echo -e "${BLUE}Faz 1: Geliştirme Yapı Taşlarını Silme / Phase 1: Delete Development Artifacts${NC}"
echo "────────────────────────────────────────────────────────────"

# Development notes and summaries
safe_rm "PHASE1.md"
safe_rm "PHASE1_CLEANUP_COMPLETION.md"
safe_rm "PHASE1_COMPLETION_SUMMARY.md"
safe_rm "PHASE2_COMPLETION_SUMMARY.md"
safe_rm "PHASE2_OPTIMIZATION_SUMMARY.md"
safe_rm "PHASE4_IMPLEMENTATION_SUMMARY.md"
safe_rm "PART6_IMPLEMENTATION_SUMMARY.md"
safe_rm "IMPLEMENTATION_COMPLETE.md"
safe_rm "IMPLEMENTATION_COMPLETE_SUMMARY.md"
safe_rm "IMPLEMENTATION_SUMMARY.md"
safe_rm "AI_IMPLEMENTATION_SUMMARY.md"
safe_rm "ADMIN_PANEL_COMPLETE.md"

# PR and reports
safe_rm "PR_DESCRIPTION.md"
safe_rm "PR_CREATION_SUMMARY.md"
safe_rm "README_PR_CREATION.md"
safe_rm "ACTION_REQUIRED.md"
safe_rm "DURUM_RAPORU.md"
safe_rm "QA-VALIDATION-REPORT.md"
safe_rm "REPOSITORY_HEALTH_REPORT.md"

# Temporary scripts and reports
safe_rm "create-pr.sh"
safe_rm "fix-vulnerabilities.mjs"
safe_rm "vulnerability-fix-report.json"

# Wrong directory
safe_rm "github"

echo ""
echo -e "${BLUE}Faz 2: Betikleri Taşıma / Phase 2: Move Scripts${NC}"
echo "────────────────────────────────────────────────────────────"

safe_mkdir "scripts"
safe_mv "qa-validation.mjs" "scripts/qa-validation.mjs"
safe_mv "validate-i18n.mjs" "scripts/validate-i18n.mjs"
safe_mv "validate-performance.mjs" "scripts/validate-performance.mjs"
safe_mv "setup-hooks.sh" "scripts/setup-hooks.sh"

echo ""
echo -e "${BLUE}Faz 3: Dokümantasyonu Düzenleme / Phase 3: Organize Documentation${NC}"
echo "────────────────────────────────────────────────────────────"

safe_mkdir "docs"

# Move individual docs
safe_mv "ADMIN_FEATURES.md" "docs/ADMIN_FEATURES.md"
safe_mv "ANALYTICS_GUIDE.md" "docs/ANALYTICS_GUIDE.md"
safe_mv "ARCHITECTURE_DIAGRAM.md" "docs/ARCHITECTURE_DIAGRAM.md"
safe_mv "ENVIRONMENT_VARIABLES.md" "docs/ENVIRONMENT_VARIABLES.md"
safe_mv "PERFORMANCE_OPTIMIZATION.md" "docs/PERFORMANCE_OPTIMIZATION.md"
safe_mv "RUNBOOK.md" "docs/RUNBOOK.md"

# Consolidate deployment docs
if [ "$DRY_RUN" = false ] && [ -f "DEPLOYMENT.md" ]; then
    echo -e "${GREEN}✓${NC} Consolidating deployment docs to docs/DEPLOYMENT.md"
    cat DEPLOYMENT.md > docs/DEPLOYMENT.md 2>/dev/null || true
    echo -e "\n\n## Additional Deployment Information\n" >> docs/DEPLOYMENT.md 2>/dev/null || true
    if [ -f "PRODUCTION_DEPLOYMENT_GUIDE.md" ]; then
        cat PRODUCTION_DEPLOYMENT_GUIDE.md >> docs/DEPLOYMENT.md 2>/dev/null || true
    fi
    ((CREATED_COUNT++))
elif [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}[DRY RUN]${NC} Would consolidate deployment docs"
fi

safe_rm "DEPLOYMENT.md"
safe_rm "DEPLOYMENT_GUIDE.md"
safe_rm "DEPLOYMENT_ADMIN_FEATURES.md"
safe_rm "DEPLOYMENT_AUTOMATION_README.md"
safe_rm "PRODUCTION_DEPLOYMENT_GUIDE.md"
safe_rm "QUICK_START_DEPLOYMENT.md"
safe_rm "SETUP_AND_DEPLOYMENT.md"

# Consolidate AI docs
if [ "$DRY_RUN" = false ] && [ -f "AI_FEATURES_GUIDE.md" ]; then
    echo -e "${GREEN}✓${NC} Consolidating AI docs to docs/AI_FEATURES.md"
    cat AI_FEATURES_GUIDE.md > docs/AI_FEATURES.md 2>/dev/null || true
    echo -e "\n\n## API Documentation\n" >> docs/AI_FEATURES.md 2>/dev/null || true
    if [ -f "AI_FEATURES_API_DOCS.md" ]; then
        cat AI_FEATURES_API_DOCS.md >> docs/AI_FEATURES.md 2>/dev/null || true
    fi
    echo -e "\n\n## Chat Assistant\n" >> docs/AI_FEATURES.md 2>/dev/null || true
    if [ -f "AI_CHAT_ASSISTANT_GUIDE.md" ]; then
        cat AI_CHAT_ASSISTANT_GUIDE.md >> docs/AI_FEATURES.md 2>/dev/null || true
    fi
    ((CREATED_COUNT++))
elif [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}[DRY RUN]${NC} Would consolidate AI docs"
fi

safe_rm "AI_FEATURES_GUIDE.md"
safe_rm "AI_FEATURES_API_DOCS.md"
safe_rm "AI_CHAT_ASSISTANT_GUIDE.md"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Özet / Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}✓ Silindi / Deleted:${NC} $DELETED_COUNT dosya/dizin / files/dirs"
echo -e "${GREEN}✓ Taşındı / Moved:${NC} $MOVED_COUNT dosya / files"
echo -e "${GREEN}✓ Oluşturuldu / Created:${NC} $CREATED_COUNT klasör/dosya / dirs/files"
echo -e "${BLUE}○ Atlandı / Skipped:${NC} $SKIPPED_COUNT dosya (bulunamadı) / files (not found)"
echo ""

if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}Bu bir DRY RUN'dı. Gerçek silme için betiği tekrar çalıştırın:${NC}"
    echo -e "${YELLOW}This was a DRY RUN. Run the script again without --dry-run to actually delete:${NC}"
    echo ""
    echo "  ./cleanup-unnecessary-files.sh"
    echo ""
else
    echo -e "${GREEN}✓ Temizleme tamamlandı! / Cleanup completed!${NC}"
    echo ""
    echo -e "${YELLOW}Sonraki adımlar / Next steps:${NC}"
    echo "1. Değişiklikleri kontrol edin / Review the changes"
    echo "2. Admin dizinini manuel inceleyin / Manually review admin directory"
    echo "3. README.md'yi güncelleyin / Update README.md"
    echo "4. Build ve test yapın / Build and test"
    echo "5. Commit edin / Commit changes:"
    echo ""
    echo "   git add ."
    echo "   git commit -m 'chore: remove unnecessary files and reorganize documentation'"
    echo ""
fi

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
