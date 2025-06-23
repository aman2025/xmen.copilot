// Simple test script to verify file parser functionality (raw content processing)
// Run with: node test/fileParserTest.js

import { readFileSync } from 'fs'
import { parseFileContent, isSupportedFileFormat, getSupportedFormatsText } from '../utils/fileParser.js'

async function testFileParser() {
  console.log('🧪 Testing File Parser Utility')
  console.log('================================')
  
  // Test supported formats
  console.log('\n📋 Supported formats:', getSupportedFormatsText())
  
  const testFiles = [
    { path: 'test/sample-data.json', format: 'JSON' },
    { path: 'test/sample-data.yml', format: 'YAML' },
    { path: 'test/config-data.xml', format: 'XML' }
  ]
  
  for (const testFile of testFiles) {
    console.log(`\n🔍 Testing ${testFile.format} file: ${testFile.path}`)
    
    try {
      // Check if format is supported
      const isSupported = isSupportedFileFormat(testFile.path)
      console.log(`   ✅ Format supported: ${isSupported}`)
      
      if (!isSupported) {
        console.log(`   ❌ Skipping unsupported format`)
        continue
      }
      
      // Read file content
      const content = readFileSync(testFile.path, 'utf8')
      console.log(`   📄 File size: ${content.length} characters`)
      
      // Process content (now returns raw content for AI)
      const processedContent = await parseFileContent(content, testFile.path)
      console.log(`   ✅ Processing successful`)
      console.log(`   📊 Content type:`, typeof processedContent)
      console.log(`   📏 Content length:`, processedContent.length)

      // Show a sample of the raw content
      console.log(`   📝 Sample content:`, processedContent.substring(0, 200) + '...')
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`)
    }
  }
  
  // Test unsupported format
  console.log(`\n🚫 Testing unsupported format: test.txt`)
  const isUnsupportedSupported = isSupportedFileFormat('test.txt')
  console.log(`   ❌ Format supported: ${isUnsupportedSupported}`)
  
  console.log('\n✅ File parser tests completed!')
}

// Run tests
testFileParser().catch(console.error)
