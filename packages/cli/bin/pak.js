#!/usr/bin/env node

// Import the main CLI entry point
import('../dist/index.mjs').then(({ program }) => {
  // The program is already configured and will handle the command line arguments
}).catch((error) => {
  console.error('Failed to start CLI:', error.message);
  process.exit(1);
});
