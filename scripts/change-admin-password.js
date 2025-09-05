#!/usr/bin/env node

/**
 * 管理员密码修改工具
 * 用于安全地修改管理员登录密码
 * 
 * 使用方法:
 * node scripts/change-admin-password.js
 */

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve))
}

function generateStrongPassword() {
  return crypto.randomBytes(16).toString('hex')
}

function validatePassword(password) {
  if (password.length < 12) {
    return '密码长度至少12位'
  }
  if (!/[a-z]/.test(password) && !/[A-Z]/.test(password)) {
    return '密码应包含字母'
  }
  if (!/\d/.test(password)) {
    return '密码应包含数字'
  }
  return null
}

function updateEnvFile(newPassword, username = 'loomiadmin') {
  const envPath = path.join(process.cwd(), '.env')
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env 文件不存在')
    return false
  }
  
  try {
    let envContent = fs.readFileSync(envPath, 'utf8')
    
    // 更新管理员密码
    if (envContent.includes('ADMIN_PASSWORD=')) {
      envContent = envContent.replace(/ADMIN_PASSWORD=.*/g, `ADMIN_PASSWORD=${newPassword}`)
    } else {
      envContent += `\nADMIN_PASSWORD=${newPassword}\n`
    }
    
    // 更新管理员用户名（如果需要）
    if (envContent.includes('ADMIN_EMAIL=')) {
      envContent = envContent.replace(/ADMIN_EMAIL=.*/g, `ADMIN_EMAIL=${username}`)
    } else {
      envContent += `ADMIN_EMAIL=${username}\n`
    }
    
    // 创建备份
    fs.writeFileSync(`${envPath}.backup.${Date.now()}`, fs.readFileSync(envPath))
    
    // 写入新配置
    fs.writeFileSync(envPath, envContent)
    
    return true
  } catch (error) {
    console.error('❌ 更新配置文件失败:', error.message)
    return false
  }
}

async function main() {
  console.log('🔐 Loomi-Lab 管理员密码修改工具')
  console.log('=' .repeat(50))
  
  try {
    const action = await question('选择操作 (1: 生成随机密码, 2: 自定义密码): ')
    
    let newPassword = ''
    let username = 'loomiadmin'
    
    // 询问用户名
    const inputUsername = await question(`管理员用户名 (默认: ${username}): `)
    if (inputUsername.trim()) {
      username = inputUsername.trim()
    }
    
    if (action === '1') {
      // 生成随机密码
      newPassword = generateStrongPassword()
      console.log('\n✨ 生成的随机密码:')
      console.log(`   ${newPassword}`)
      console.log('')
      
      const confirm = await question('确认使用此密码? (y/N): ')
      if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
        console.log('❌ 操作已取消')
        rl.close()
        return
      }
      
    } else if (action === '2') {
      // 自定义密码
      console.log('\n密码要求:')
      console.log('- 长度至少12位')
      console.log('- 包含字母和数字')
      console.log('- 建议包含特殊字符')
      
      while (true) {
        newPassword = await question('\n请输入新密码: ')
        
        const validation = validatePassword(newPassword)
        if (validation) {
          console.log(`❌ ${validation}`)
          continue
        }
        
        const confirmPassword = await question('请再次输入新密码: ')
        if (newPassword !== confirmPassword) {
          console.log('❌ 两次输入的密码不一致')
          continue
        }
        
        break
      }
      
    } else {
      console.log('❌ 无效的选择')
      rl.close()
      return
    }
    
    console.log('\n📝 配置摘要:')
    console.log(`   用户名: ${username}`)
    console.log(`   密码: ${newPassword.replace(/./g, '*')}`)
    console.log('')
    
    const finalConfirm = await question('确认更新配置? (y/N): ')
    if (finalConfirm.toLowerCase() !== 'y' && finalConfirm.toLowerCase() !== 'yes') {
      console.log('❌ 操作已取消')
      rl.close()
      return
    }
    
    // 更新配置文件
    if (updateEnvFile(newPassword, username)) {
      console.log('\n✅ 配置更新成功!')
      console.log('')
      console.log('📋 登录信息:')
      console.log(`   用户名: ${username}`)
      console.log(`   密码: ${newPassword}`)
      console.log('')
      console.log('🔄 重要提醒:')
      console.log('1. 请重启应用以使新配置生效')
      console.log('2. 所有现有的登录会话将自动失效')
      console.log('3. 请妥善保存新的登录凭据')
      console.log('')
      console.log('🚀 重启命令:')
      console.log('   npm run dev (开发环境)')
      console.log('   pm2 restart loomi-lab (生产环境)')
      
    } else {
      console.log('❌ 配置更新失败')
    }
    
  } catch (error) {
    console.error('❌ 操作失败:', error.message)
  } finally {
    rl.close()
  }
}

// 快速生成密码的便捷函数
async function quickGenerate() {
  const password = generateStrongPassword()
  console.log('🔑 快速生成的强密码:')
  console.log(`   ${password}`)
  console.log('')
  console.log('💡 使用此密码:')
  console.log('1. 手动更新 .env 文件中的 ADMIN_PASSWORD')
  console.log('2. 或者运行 node scripts/change-admin-password.js 使用完整工具')
}

// 检查命令行参数
const args = process.argv.slice(2)

if (args.includes('--generate') || args.includes('-g')) {
  quickGenerate().then(() => process.exit(0))
} else if (args.includes('--help') || args.includes('-h')) {
  console.log('Loomi-Lab 管理员密码工具')
  console.log('')
  console.log('使用方法:')
  console.log('  node scripts/change-admin-password.js          交互式密码修改')
  console.log('  node scripts/change-admin-password.js -g       快速生成密码')
  console.log('  node scripts/change-admin-password.js --help   显示帮助')
  process.exit(0)
} else {
  // 直接运行脚本
  if (require.main === module) {
    main()
  }
}

module.exports = { generateStrongPassword, validatePassword, updateEnvFile }