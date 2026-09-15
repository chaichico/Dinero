import { randomBytes, scrypt as nodeScrypt } from 'node:crypto'

const password = process.argv[2]
if (!password || password.length < 12) {
  console.error('Usage: npm run auth:hash -- "a-password-with-at-least-12-characters"')
  process.exit(1)
}
const salt = randomBytes(16)
const key = await new Promise((resolve, reject) => nodeScrypt(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, value) => error ? reject(error) : resolve(value)))
console.log(`scrypt$16384$8$1$${salt.toString('base64url')}$${key.toString('base64url')}`)
