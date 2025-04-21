import fs from 'fs';
import path from 'path';

console.log("Checking papi");
/* Path to the .papi directory */
const papiDir: string = path.resolve(process.cwd(), '.papi');
/* Path to the package.json file */
const packageJsonPath: string = path.resolve(process.cwd(), 'package.json');

console.log("Checking package.json:", packageJsonPath);
interface PackageJson {
  dependencies?: Record<string, string>;
  [key: string]: any;
}

/* Check if the .papi directory exists */
if (!fs.existsSync(papiDir)) {
  
  console.log("papi directory does not exist:", papiDir);
  try {
    /* Read the contents of the package.json file */
    const packageJson: PackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    /* Remove the dependency @polkadot-api/descriptors if it exists */
    if (packageJson.dependencies && packageJson.dependencies['@polkadot-api/descriptors']) {
      delete packageJson.dependencies['@polkadot-api/descriptors'];
      
      /* Write back to the package.json file */
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      
    } else {
      
    }
  } catch (error) {
    console.error('❌ Error processing package.json file:', error);
    process.exit(1);
  }
} else {
  console.log("papi directory exists:", papiDir);
}

/* Continue the installation process */
 


