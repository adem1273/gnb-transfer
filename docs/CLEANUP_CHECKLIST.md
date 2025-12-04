# Temizleme Kontrol Listesi / Cleanup Checklist

Bu dosyayı temizleme yaparken kontrol listesi olarak kullanın.
Use this file as a checklist while performing the cleanup.

---

## ✅ Faz 1: Silinecek Dosyalar / Phase 1: Files to Delete

### Geliştirme Notları / Development Notes
- [ ] PHASE1.md
- [ ] PHASE1_CLEANUP_COMPLETION.md
- [ ] PHASE1_COMPLETION_SUMMARY.md
- [ ] PHASE2_COMPLETION_SUMMARY.md
- [ ] PHASE2_OPTIMIZATION_SUMMARY.md
- [ ] PHASE4_IMPLEMENTATION_SUMMARY.md
- [ ] PART6_IMPLEMENTATION_SUMMARY.md
- [ ] IMPLEMENTATION_COMPLETE.md
- [ ] IMPLEMENTATION_COMPLETE_SUMMARY.md
- [ ] IMPLEMENTATION_SUMMARY.md
- [ ] AI_IMPLEMENTATION_SUMMARY.md
- [ ] ADMIN_PANEL_COMPLETE.md

### PR ve Rapor Dosyaları / PR and Report Files
- [ ] PR_DESCRIPTION.md
- [ ] PR_CREATION_SUMMARY.md
- [ ] README_PR_CREATION.md
- [ ] ACTION_REQUIRED.md
- [ ] DURUM_RAPORU.md
- [ ] QA-VALIDATION-REPORT.md
- [ ] REPOSITORY_HEALTH_REPORT.md

### Geçici Betikler ve Raporlar / Temporary Scripts and Reports
- [ ] create-pr.sh
- [ ] fix-vulnerabilities.mjs
- [ ] vulnerability-fix-report.json

### Yanlış Dizin / Wrong Directory
- [ ] github/ (tüm içeriğiyle / with all contents)

---

## 📁 Faz 2: Taşınacak Dosyalar / Phase 2: Files to Move

### scripts/ klasörüne taşı / Move to scripts/
- [ ] qa-validation.mjs → scripts/qa-validation.mjs
- [ ] validate-i18n.mjs → scripts/validate-i18n.mjs
- [ ] validate-performance.mjs → scripts/validate-performance.mjs
- [ ] setup-hooks.sh → scripts/setup-hooks.sh

---

## 📚 Faz 3: Dokümantasyon Birleştirme / Phase 3: Documentation Consolidation

### Deployment Belgeleri → docs/DEPLOYMENT.md
Birleştirilecekler / To consolidate:
- [ ] DEPLOYMENT.md
- [ ] DEPLOYMENT_GUIDE.md
- [ ] DEPLOYMENT_ADMIN_FEATURES.md
- [ ] DEPLOYMENT_AUTOMATION_README.md
- [ ] PRODUCTION_DEPLOYMENT_GUIDE.md
- [ ] QUICK_START_DEPLOYMENT.md
- [ ] SETUP_AND_DEPLOYMENT.md

Aksiyon / Action:
- [ ] docs/DEPLOYMENT.md oluşturuldu / created
- [ ] Eski dosyalar silindi / old files deleted

### AI Belgeleri → docs/AI_FEATURES.md
Birleştirilecekler / To consolidate:
- [ ] AI_FEATURES_GUIDE.md
- [ ] AI_FEATURES_API_DOCS.md
- [ ] AI_CHAT_ASSISTANT_GUIDE.md

Aksiyon / Action:
- [ ] docs/AI_FEATURES.md oluşturuldu / created
- [ ] Eski dosyalar silindi / old files deleted

---

## 📂 Faz 4: docs/ Klasörüne Taşıma / Phase 4: Move to docs/

- [ ] ADMIN_FEATURES.md → docs/ADMIN_FEATURES.md
- [ ] ANALYTICS_GUIDE.md → docs/ANALYTICS_GUIDE.md
- [ ] ARCHITECTURE_DIAGRAM.md → docs/ARCHITECTURE_DIAGRAM.md
- [ ] ENVIRONMENT_VARIABLES.md → docs/ENVIRONMENT_VARIABLES.md
- [ ] PERFORMANCE_OPTIMIZATION.md → docs/PERFORMANCE_OPTIMIZATION.md
- [ ] RUNBOOK.md → docs/RUNBOOK.md

---

## 📝 Faz 5: README Güncellemesi / Phase 5: README Update

- [ ] README.md'ye dokümantasyon linkleri eklendi / Documentation links added to README.md

Örnek / Example:
```markdown
## 📚 Documentation

- [Deployment Guide](docs/DEPLOYMENT.md)
- [AI Features](docs/AI_FEATURES.md)
- [Admin Features](docs/ADMIN_FEATURES.md)
- [Architecture](docs/ARCHITECTURE_DIAGRAM.md)
- [Environment Variables](docs/ENVIRONMENT_VARIABLES.md)
- [Performance Optimization](docs/PERFORMANCE_OPTIMIZATION.md)
- [Runbook](docs/RUNBOOK.md)
- [Analytics](docs/ANALYTICS_GUIDE.md)
```

---

## 🔍 Faz 6: Manuel İnceleme Gerekli / Phase 6: Manual Review Required

### Admin Dizini / Admin Directory
- [ ] `admin/admin.js` incelendi (boş, silinebilir mi?) / reviewed (empty, can delete?)
- [ ] Kök seviyedeki `admin/components/` ve `admin/pages/` incelendi / Root-level reviewed
- [ ] `admin/src/` altındaki dosyalar incelendi / Files under admin/src/ reviewed
- [ ] Hangisinin kullanıldığı belirlendi / Determined which is used
- [ ] Eski dosyalar silindi / Old files deleted

### Deployment Configs
- [ ] `railway.json` - Kullanılıyor mu? / In use?
- [ ] `render.yaml` - Kullanılıyor mu? / In use?
- [ ] `vercel.json` - Kullanılıyor mu? / In use?
- [ ] Kullanılmayan config dosyaları silindi / Unused configs deleted

### Git Hooks
- [ ] `.git-hooks/pre-commit` incelendi / reviewed
- [ ] Hala aktif mi kontrol edildi / Checked if still active
- [ ] Gerekli değilse silindi / Deleted if not needed

### Database
- [ ] `database/gnbProDB.sql` incelendi / reviewed
- [ ] Hassas veri içeriyor mu kontrol edildi / Checked for sensitive data
- [ ] Depoda kalması gerekli mi belirlendi / Determined if should stay in repo

---

## ✅ Faz 7: Son Kontroller / Phase 7: Final Checks

- [ ] Tüm değişiklikler commit edildi / All changes committed
- [ ] Build başarılı / Build successful
- [ ] Testler geçti / Tests passed
- [ ] README güncel / README updated
- [ ] .gitignore güncel / .gitignore updated (gerekirse / if needed)

---

## 📊 Özet / Summary

### Silinecek Toplam / Total to Delete
- Development artifacts: 19 dosya / files
- Wrong directory: 1 dizin / directory
- Scripts: 3 dosya / files
- Report files: 1 dosya / file
- **Toplam / Total: 24 items**

### Taşınacak / To Move
- Scripts: 4 dosya → scripts/
- Documentation: 6 dosya → docs/
- **Toplam / Total: 10 files**

### Birleştirilecek / To Consolidate
- Deployment docs: 7 → 1
- AI docs: 3 → 1
- **Toplam / Total: 10 → 2 files**

### Manuel İnceleme / Manual Review
- Admin directory: 1+ items
- Deployment configs: 3 items
- Git hooks: 1 item
- Database: 1 item
- **Toplam / Total: 6+ items**

---

**Not / Note:** Bu kontrol listesini doldurduktan sonra silebilirsiniz.  
**Note:** You can delete this checklist after completing it.
