#!/usr/bin/env node

/**
 * 配置加密工具
 * 用于加密敏感的数据库配置信息
 * 
 * 使用方法:
 * node scripts/encrypt-config.js
 */

const crypto = require('crypto')
const readline = require('readline')

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16

function generateKey() {
  return crypto.randomBytes(32).toString('hex')
}

function encrypt(text, keyHex) {
  const key = Buffer.from(keyHex, 'hex')
  const iv = crypto.randomBytes(IV_LENGTH)
  
  const cipher = crypto.createCipherGCM(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

function decrypt(encryptedText, keyHex) {
  const key = Buffer.from(keyHex, 'hex')
  const parts = encryptedText.split(':')
  
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format')
  }
  
  const [ivHex, authTagHex, encrypted] = parts
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  
  const decipher = crypto.createDecipherGCM(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve))
}

async function main() {
  console.log('🔐 Loomi-Lab 配置加密工具')
  console.log('=' .repeat(50))
  
  const action = await question('选择操作 (1: 生成密钥, 2: 加密配置, 3: 解密配置): ')
  
  switch (action) {
    case '1':
      const newKey = generateKey()
      console.log('\n✅ 新生成的加密密钥:')
      console.log(newKey)
      console.log('\n⚠️  请将此密钥安全保存到 CONFIG_ENCRYPTION_KEY 环境变量中')
      break
      
    case '2':
      const encryptKey = await question('请输入加密密钥: ')
      console.log('\n请输入数据库配置 (JSON格式):')
      
      // 提供示例配置
      console.log('示例配置:')
      console.log('{"host":"your-host","port":5432,"database":"your-db","user":"your-user","password":"your-password"}')
      
      const configJson = await question('\n配置JSON: ')
      
      try {
        // 验证JSON格式
        JSON.parse(configJson)
        
        const encrypted = encrypt(configJson, encryptKey)
        console.log('\n✅ 加密后的配置:')
        console.log(encrypted)
        console.log('\n💡 请将此加密配置设置到相应的环境变量中 (如: PAYMENT_DB_ENCRYPTED)')
      } catch (error) {
        console.error('❌ 加密失败:', error.message)
      }
      break
      
    case '3':
      const decryptKey = await question('请输入解密密钥: ')
      const encryptedConfig = await question('请输入加密的配置: ')
      
      try {
        const decrypted = decrypt(encryptedConfig, decryptKey)
        console.log('\n✅ 解密后的配置:')
        console.log(JSON.stringify(JSON.parse(decrypted), null, 2))
      } catch (error) {
        console.error('❌ 解密失败:', error.message)
      }
      break
      
    default:
      console.log('❌ 无效的选择')
  }
  
  rl.close()
}

// 处理支付数据库配置的便捷函数
async function encryptPaymentConfig() {
  console.log('🏦 加密支付数据库配置')
  
  const key = await question('加密密钥: ')
  const host = await question('数据库主机: ')
  const port = await question('端口: ')
  const database = await question('数据库名: ')
  const user = await question('用户名: ')
  const password = await question('密码: ')
  const maxConnections = await question('最大连接数 (默认20): ') || '20'
  
  const config = {
    host,
    port: parseInt(port),
    database,
    user,
    password,
    max: parseInt(maxConnections),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  }
  
  try {
    const encrypted = encrypt(JSON.stringify(config), key)
    console.log('\n✅ 支付数据库加密配置:')
    console.log(`PAYMENT_DB_ENCRYPTED=${encrypted}`)
  } catch (error) {
    console.error('❌ 加密失败:', error.message)
  }
}

// 如果直接运行脚本
if (require.main === module) {
  const args = process.argv.slice(2)
  
  if (args.includes('--payment')) {
    encryptPaymentConfig().then(() => process.exit(0))
  } else {
    main().then(() => process.exit(0))
  }
}

module.exports = { encrypt, decrypt, generateKey }