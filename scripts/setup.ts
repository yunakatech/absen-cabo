import { db } from '../src/lib/db';

async function main() {
  console.log('🚀 Running Absen Cabo Database Setup Script...');
  try {
    const isGoogle = db.isGoogleSheetsActive();
    console.log(`Mode Database: ${isGoogle ? 'GOOGLE SHEETS API' : 'LOCAL JSON STORAGE'}`);

    const result = await db.setupGoogleSheets();
    console.log('✅ Setup Status:', result.message);
  } catch (err) {
    console.error('❌ Setup Error:', err);
  }
}

main();
