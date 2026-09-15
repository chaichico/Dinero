import { randomBytes, scrypt as nodeScrypt } from 'node:crypto'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout } from 'node:process'

if (!stdin.isTTY) throw new Error('Run this command in an interactive terminal')
const readline = createInterface({ input: stdin, output: stdout })
const username = (await readline.question('Super Admin username: ')).trim().toLowerCase()
readline.close()
if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)) throw new Error('Username must be 3–32 lowercase letters, numbers, dots, dashes, or underscores')

async function hidden(prompt) {
  stdout.write(prompt)
  stdin.setRawMode(true)
  stdin.resume()
  let value = ''
  return await new Promise((resolve, reject) => {
    const onData = (chunk) => {
      const input = chunk.toString('utf8')
      if (input === '\u0003') { stdin.setRawMode(false); reject(new Error('Cancelled')); return }
      if (input === '\r' || input === '\n') { stdin.off('data', onData); stdin.setRawMode(false); stdout.write('\n'); resolve(value); return }
      if (input === '\u007f' || input === '\b') { if (value) { value = value.slice(0, -1); stdout.write('\b \b') }; return }
      value += input; stdout.write('*'.repeat([...input].length))
    }
    stdin.on('data', onData)
  })
}

const password = await hidden('Password (12+ characters): ')
const confirmation = await hidden('Confirm password: ')
stdin.pause()
if (password.length < 12) throw new Error('Password must contain at least 12 characters')
if (password !== confirmation) throw new Error('Passwords do not match')
const salt = randomBytes(16)
const key = await new Promise((resolve, reject) => nodeScrypt(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, value) => error ? reject(error) : resolve(value)))
stdout.write('\nAdd these values to .env or your secret manager:\n\n')
stdout.write(`SUPER_ADMIN_USERNAME=${username}\n`)
stdout.write(`SUPER_ADMIN_PASSWORD_HASH=scrypt$16384$8$1$${salt.toString('base64url')}$${key.toString('base64url')}\n`)
stdout.write('\nThe plaintext password was not written to disk.\n')

