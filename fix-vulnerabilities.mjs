/**
 * Vulnerability Fix Script for GNB Transfer
 * 
 * This script analyzes and fixes npm vulnerabilities in the project
 * Run with: node fix-vulnerabilities.mjs
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

const execAsync = promisify(exec);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

async function runAudit(directory = '.') {
  section(`Auditing: ${directory}`);
  
  try {
    const { stdout } = await execAsync(`cd ${directory} && npm audit --json`, {
      maxBuffer: 10 * 1024 * 1024
    });
    const audit = JSON.parse(stdout);
    
    log(`Total vulnerabilities: ${audit.metadata.vulnerabilities.total}`, 'yellow');
    log(`  Critical: ${audit.metadata.vulnerabilities.critical}`, audit.metadata.vulnerabilities.critical > 0 ? 'red' : 'green');
    log(`  High: ${audit.metadata.vulnerabilities.high}`, audit.metadata.vulnerabilities.high > 0 ? 'red' : 'green');
    log(`  Moderate: ${audit.metadata.vulnerabilities.moderate}`, audit.metadata.vulnerabilities.moderate > 0 ? 'yellow' : 'green');
    log(`  Low: ${audit.metadata.vulnerabilities.low}`, 'green');
    
    return audit;
  } catch (error) {
    // npm audit returns non-zero exit code when vulnerabilities found
    if (error.stdout) {
      const audit = JSON.parse(error.stdout);
      
      log(`Total vulnerabilities: ${audit.metadata.vulnerabilities.total}`, 'yellow');
      log(`  Critical: ${audit.metadata.vulnerabilities.critical}`, audit.metadata.vulnerabilities.critical > 0 ? 'red' : 'green');
      log(`  High: ${audit.metadata.vulnerabilities.high}`, audit.metadata.vulnerabilities.high > 0 ? 'red' : 'green');
      log(`  Moderate: ${audit.metadata.vulnerabilities.moderate}`, audit.metadata.vulnerabilities.moderate > 0 ? 'yellow' : 'green');
      log(`  Low: ${audit.metadata.vulnerabilities.low}`, 'green');
      
      return audit;
    }
    throw error;
  }
}

async function analyzeVulnerabilities(audit) {
  section('Vulnerability Analysis');
  
  const highSeverityIssues = [];
  const vulnerabilities = audit.vulnerabilities || {};
  
  for (const [name, details] of Object.entries(vulnerabilities)) {
    if (details.severity === 'high' || details.severity === 'critical') {
      highSeverityIssues.push({
        name,
        severity: details.severity,
        via: details.via,
        effects: details.effects,
        fixAvailable: details.fixAvailable,
      });
    }
  }
  
  log(`Found ${highSeverityIssues.length} high/critical severity issues`, 
    highSeverityIssues.length > 0 ? 'red' : 'green');
  
  return highSeverityIssues;
}

async function attemptAutoFix(directory = '.') {
  section(`Attempting Auto-Fix: ${directory}`);
  
  try {
    log('Running npm audit fix...', 'blue');
    const { stdout, stderr } = await execAsync(`cd ${directory} && npm audit fix`, {
      maxBuffer: 10 * 1024 * 1024
    });
    log(stdout, 'green');
    if (stderr) {
      log(stderr, 'yellow');
    }
    return true;
  } catch (error) {
    log('Auto-fix completed with warnings', 'yellow');
    if (error.stdout) log(error.stdout, 'yellow');
    return false;
  }
}

async function attemptForceFix(directory = '.') {
  section(`Attempting Force Fix: ${directory}`);
  
  log('⚠️  Warning: Force fix may introduce breaking changes', 'yellow');
  log('Running npm audit fix --force...', 'blue');
  
  try {
    const { stdout, stderr } = await execAsync(`cd ${directory} && npm audit fix --force`, {
      maxBuffer: 10 * 1024 * 1024
    });
    log(stdout, 'green');
    if (stderr) {
      log(stderr, 'yellow');
    }
    return true;
  } catch (error) {
    log('Force fix completed with warnings', 'yellow');
    if (error.stdout) log(error.stdout, 'yellow');
    return false;
  }
}

async function generateReport(beforeAudit, afterAudit, highSeverityIssues) {
  section('Vulnerability Fix Report');
  
  const report = {
    timestamp: new Date().toISOString(),
    before: {
      total: beforeAudit.metadata.vulnerabilities.total,
      critical: beforeAudit.metadata.vulnerabilities.critical,
      high: beforeAudit.metadata.vulnerabilities.high,
      moderate: beforeAudit.metadata.vulnerabilities.moderate,
      low: beforeAudit.metadata.vulnerabilities.low,
    },
    after: {
      total: afterAudit.metadata.vulnerabilities.total,
      critical: afterAudit.metadata.vulnerabilities.critical,
      high: afterAudit.metadata.vulnerabilities.high,
      moderate: afterAudit.metadata.vulnerabilities.moderate,
      low: afterAudit.metadata.vulnerabilities.low,
    },
    fixed: {
      total: beforeAudit.metadata.vulnerabilities.total - afterAudit.metadata.vulnerabilities.total,
      critical: beforeAudit.metadata.vulnerabilities.critical - afterAudit.metadata.vulnerabilities.critical,
      high: beforeAudit.metadata.vulnerabilities.high - afterAudit.metadata.vulnerabilities.high,
      moderate: beforeAudit.metadata.vulnerabilities.moderate - afterAudit.metadata.vulnerabilities.moderate,
    },
    remainingHighSeverity: highSeverityIssues,
  };
  
  // Display report
  log('Vulnerabilities Before:', 'cyan');
  log(`  Total: ${report.before.total}`, 'yellow');
  log(`  Critical: ${report.before.critical}`, report.before.critical > 0 ? 'red' : 'green');
  log(`  High: ${report.before.high}`, report.before.high > 0 ? 'red' : 'green');
  log(`  Moderate: ${report.before.moderate}`, report.before.moderate > 0 ? 'yellow' : 'green');
  
  log('\nVulnerabilities After:', 'cyan');
  log(`  Total: ${report.after.total}`, 'yellow');
  log(`  Critical: ${report.after.critical}`, report.after.critical > 0 ? 'red' : 'green');
  log(`  High: ${report.after.high}`, report.after.high > 0 ? 'red' : 'green');
  log(`  Moderate: ${report.after.moderate}`, report.after.moderate > 0 ? 'yellow' : 'green');
  
  log('\nFixed:', 'green');
  log(`  Total: ${report.fixed.total}`, report.fixed.total > 0 ? 'green' : 'yellow');
  log(`  Critical: ${report.fixed.critical}`, report.fixed.critical > 0 ? 'green' : 'yellow');
  log(`  High: ${report.fixed.high}`, report.fixed.high > 0 ? 'green' : 'yellow');
  log(`  Moderate: ${report.fixed.moderate}`, report.fixed.moderate > 0 ? 'green' : 'yellow');
  
  // Save report to file
  const reportPath = './vulnerability-fix-report.json';
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  log(`\nReport saved to: ${reportPath}`, 'blue');
  
  return report;
}

async function checkRemainingIssues(audit) {
  const highSeverityRemaining = [];
  const vulnerabilities = audit.vulnerabilities || {};
  
  for (const [name, details] of Object.entries(vulnerabilities)) {
    if (details.severity === 'high' || details.severity === 'critical') {
      highSeverityRemaining.push({
        package: name,
        severity: details.severity,
        fixAvailable: details.fixAvailable ? 'Yes' : 'No',
      });
    }
  }
  
  if (highSeverityRemaining.length > 0) {
    log('\n⚠️  Remaining High/Critical Vulnerabilities:', 'yellow');
    highSeverityRemaining.forEach((issue, idx) => {
      log(`  ${idx + 1}. ${issue.package} (${issue.severity}) - Fix available: ${issue.fixAvailable}`, 
        issue.severity === 'critical' ? 'red' : 'yellow');
    });
    
    log('\n📋 Manual Actions Required:', 'cyan');
    log('  1. Review package.json for deprecated dependencies', 'yellow');
    log('  2. Consider alternative packages where auto-fix is not available', 'yellow');
    log('  3. Check if vulnerabilities are in devDependencies (lower priority)', 'yellow');
    log('  4. Create issues for packages that cannot be easily updated', 'yellow');
  }
  
  return highSeverityRemaining;
}

async function main() {
  log(`
╔═══════════════════════════════════════════════════════════╗
║   GNB Transfer - Vulnerability Fix Script                ║
║   Analyzing and fixing npm security vulnerabilities      ║
╚═══════════════════════════════════════════════════════════╝
`, 'blue');

  try {
    // Check root directory
    log('Checking root directory...', 'cyan');
    const beforeAudit = await runAudit('.');
    const highSeverityIssues = await analyzeVulnerabilities(beforeAudit);
    
    if (beforeAudit.metadata.vulnerabilities.total > 0) {
      // Attempt auto-fix
      await attemptAutoFix('.');
      
      // Check if issues remain
      const afterAutoFix = await runAudit('.');
      
      if (afterAutoFix.metadata.vulnerabilities.high > 0 || 
          afterAutoFix.metadata.vulnerabilities.critical > 0) {
        log('\nHigh severity issues remain. Attempting force fix...', 'yellow');
        log('⚠️  This may introduce breaking changes. Review carefully.', 'red');
        
        // Note: We won't actually run force fix without user consent
        // await attemptForceFix('.');
        log('Skipping force fix to avoid breaking changes.', 'yellow');
        log('Please review the remaining issues manually.', 'yellow');
      }
      
      // Final audit
      const afterAudit = await runAudit('.');
      
      // Generate report
      await generateReport(beforeAudit, afterAudit, highSeverityIssues);
      
      // Check what's remaining
      const remaining = await checkRemainingIssues(afterAudit);
      
      if (remaining.length === 0 && afterAudit.metadata.vulnerabilities.high === 0) {
        log('\n✓ SUCCESS: All high severity vulnerabilities fixed!', 'green');
        return 0;
      } else {
        log(`\n⚠️  WARNING: ${remaining.length} high/critical issues remain`, 'yellow');
        return 1;
      }
    } else {
      log('\n✓ No vulnerabilities found!', 'green');
      return 0;
    }
    
  } catch (error) {
    log(`\n✗ Error: ${error.message}`, 'red');
    console.error(error);
    return 1;
  }
}

// Run the script
main().then(process.exit);
