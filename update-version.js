#!/usr/bin/env node

// Simple script to update version.txt with current git commit hash
// Run this script after each commit to keep version.txt current

import { execSync } from 'child_process';
import fs from 'fs';

try {
  // Get current commit hash
  const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  
  // Update version.txt
  fs.writeFileSync('version.txt', commitHash);
  
  console.log(`✅ Version updated to: ${commitHash}`);
} catch (error) {
  console.error('❌ Error updating version:', error.message);
  process.exit(1);
}
