import crypto from 'crypto'

/**
 * 配置加密工具类
 * 用于加密敏感的数据库配置信息
 */
export class ConfigEncryption {
  private static readonly ALGORITHM = 'aes-256-gcm'
  private static readonly KEY_LENGTH = 32 // 256 bits
  private static readonly IV_LENGTH = 16  // 128 bits
  private static readonly TAG_LENGTH = 16 // 128 bits

  /**
   * 从环境变量获取加密密钥
   */
  private static getEncryptionKey(): Buffer {
    const keyEnv = process.env.CONFIG_ENCRYPTION_KEY
    if (!keyEnv) {
      throw new Error('CONFIG_ENCRYPTION_KEY environment variable is required')
    }
    
    // 使用环境变量中的密钥派生出固定长度的密钥
    return crypto.scryptSync(keyEnv, 'loomi-salt', this.KEY_LENGTH)
  }

  /**
   * 加密配置字符串
   */
  static encrypt(text: string): string {
    try {
      const key = this.getEncryptionKey()
      const iv = crypto.randomBytes(this.IV_LENGTH)
      
      const cipher = crypto.createCipherGCM(this.ALGORITHM, key, iv)
      
      let encrypted = cipher.update(text, 'utf8', 'hex')
      encrypted += cipher.final('hex')
      
      const authTag = cipher.getAuthTag()
      
      // 格式: iv:authTag:encryptedData
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
    } catch (error) {
      throw new Error(`Config encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 解密配置字符串
   */
  static decrypt(encryptedText: string): string {
    try {
      const key = this.getEncryptionKey()
      const parts = encryptedText.split(':')
      
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted config format')
      }
      
      const [ivHex, authTagHex, encrypted] = parts
      const iv = Buffer.from(ivHex, 'hex')
      const authTag = Buffer.from(authTagHex, 'hex')
      
      const decipher = crypto.createDecipherGCM(this.ALGORITHM, key, iv)
      decipher.setAuthTag(authTag)
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      
      return decrypted
    } catch (error) {
      throw new Error(`Config decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 生成新的加密密钥（用于初始化）
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex')
  }
}

/**
 * 安全的配置管理器
 */
export class SecureConfig {
  /**
   * 获取加密的数据库配置
   */
  static getDatabaseConfig(configName: string) {
    const encryptedConfig = process.env[`${configName}_ENCRYPTED`]
    
    if (!encryptedConfig) {
      throw new Error(`Encrypted config ${configName}_ENCRYPTED not found in environment variables`)
    }
    
    try {
      const decryptedConfig = ConfigEncryption.decrypt(encryptedConfig)
      return JSON.parse(decryptedConfig)
    } catch (error) {
      throw new Error(`Failed to decrypt database config: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * 验证配置的完整性
   */
  static validateConfig(config: any, requiredFields: string[]): boolean {
    for (const field of requiredFields) {
      if (!config[field]) {
        throw new Error(`Required config field missing: ${field}`)
      }
    }
    return true
  }
}