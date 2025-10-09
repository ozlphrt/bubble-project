// Simple version endpoint for local development
// This file serves the current git commit hash

import { execSync } from 'child_process';

export default function handler(req, res) {
  try {
    // Get the current commit hash
    const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    res.status(200).send(commitHash);
  } catch (error) {
    console.error('Error getting git commit hash:', error);
    // Fallback to timestamp if git is not available
    const timestamp = Date.now().toString(36).substring(0, 7);
    res.status(200).send(timestamp);
  }
}
