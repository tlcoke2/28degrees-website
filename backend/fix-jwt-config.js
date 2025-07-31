import { promises as fs } from 'fs';
import path from 'path';

export async function fixJwtConfig() {
  const envPath = path.join(process.cwd(), '.env');
  
  try {
    // Read the current .env file
    let envContent = await fs.readFile(envPath, 'utf-8');
    
    // Update JWT_EXPIRES_IN to use a number of seconds (90 days in seconds)
    envContent = envContent.replace(
      /JWT_EXPIRES_IN=.*/,
      'JWT_EXPIRES_IN=7776000' // 90 days in seconds
    );
    
    // Ensure JWT_COOKIE_EXPIRES_IN is also a number
    envContent = envContent.replace(
      /JWT_COOKIE_EXPIRES_IN=.*/,
      'JWT_COOKIE_EXPIRES_IN=90' // 90 days
    );
    
    // Write the updated content back to .env
    await fs.writeFile(envPath, envContent, 'utf-8');
    console.log('✅ Updated JWT configuration in .env');
    
    // Also update the auth controller to use the correct expiresIn format
    const authControllerPath = path.join(process.cwd(), 'src', 'controllers', 'auth.controller.js');
    let authController = await fs.readFile(authControllerPath, 'utf-8');
    
    // Update the signToken function to use the correct expiresIn format
    authController = authController.replace(
      /const signToken = id => {
  return jwt.sign\(\{ id \}, process\.env\.JWT_SECRET, \{
    expiresIn: process\.env\.JWT_EXPIRES_IN
  \}\);
};/s,
      'const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN, 10)
  });
};'
    );
    
    await fs.writeFile(authControllerPath, authController, 'utf-8');
    console.log('✅ Updated auth controller to use correct expiresIn format');
    
  } catch (error) {
    console.error('❌ Error updating JWT configuration:', error.message);
    process.exit(1);
  }
}

fixJwtConfig();
