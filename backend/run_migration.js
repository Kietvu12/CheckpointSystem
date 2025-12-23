import mysql from 'mysql2/promise'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Database config (điều chỉnh theo config của bạn)
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Điều chỉnh password của bạn
  database: 'quanlydiem',
  multipleStatements: true
}

async function runMigration() {
  let connection
  
  try {
    // Connect to database
    console.log('Connecting to database...')
    connection = await mysql.createConnection(dbConfig)
    console.log('Connected successfully!')
    
    // Read migration file
    const migrationPath = path.join(__dirname, 'schema', 'migration_giao_dich_trang_thai.sql')
    console.log('Reading migration file:', migrationPath)
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Execute migration
    console.log('Executing migration...')
    const [results] = await connection.query(migrationSQL)
    
    console.log('Migration completed successfully!')
    console.log('Results:', results)
    
    // Verify
    const [rows] = await connection.query(`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(CASE WHEN trang_thai = 'chua_chot' THEN 1 ELSE 0 END) as chua_chot_count,
        SUM(CASE WHEN trang_thai = 'da_chot' THEN 1 ELSE 0 END) as da_chot_count
      FROM giao_dich
    `)
    
    console.log('\nVerification:')
    console.log('Total transactions:', rows[0].total_transactions)
    console.log('Chua chot:', rows[0].chua_chot_count)
    console.log('Da chot:', rows[0].da_chot_count)
    
  } catch (error) {
    console.error('Error running migration:', error.message)
    console.error('Stack:', error.stack)
  } finally {
    if (connection) {
      await connection.end()
      console.log('\nDatabase connection closed.')
    }
  }
}

runMigration()

