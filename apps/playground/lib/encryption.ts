import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(scrypt)

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const SALT_LENGTH = 16
const TAG_LENGTH = 16

function getEncryptionKey(): string {
  const key = process.env.NEXT_PUBLIC_SESSION_ENCRYPTION_KEY
  if (!key) {
    throw new Error('NEXT_PUBLIC_SESSION_ENCRYPTION_KEY environment variable is not set')
  }
  return key
}

async function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer
}

export async function encrypt(data: string): Promise<string> {
  try {
    const password = getEncryptionKey()
    const salt = randomBytes(SALT_LENGTH)
    const key = await deriveKey(password, salt)
    const iv = randomBytes(IV_LENGTH)
    
    const cipher = createCipheriv(ALGORITHM, key, iv)
    
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    const authTag = cipher.getAuthTag()
    
    return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function decrypt(encryptedData: string): Promise<string> {
  try {
    const password = getEncryptionKey()
    const parts = encryptedData.split(':')
    
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format')
    }
    
    const [saltHex, ivHex, authTagHex, encrypted] = parts
    const salt = Buffer.from(saltHex, 'hex')
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    
    const key = await deriveKey(password, salt)
    
    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

