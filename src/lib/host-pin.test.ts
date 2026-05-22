import { describe, expect, it } from 'vitest'
import { hashHostPin, isValidHostPin } from './host-pin'

describe('host pin helpers', () => {
  it('validates six digit pins', () => {
    expect(isValidHostPin('123456')).toBe(true)
    expect(isValidHostPin('12345')).toBe(false)
    expect(isValidHostPin('abcdef')).toBe(false)
  })

  it('hashes room code and pin consistently', async () => {
    await expect(hashHostPin('VILLA', '123456')).resolves.toBe(await hashHostPin('VILLA', '123456'))
    await expect(hashHostPin('VILLA', '123456')).resolves.not.toBe(await hashHostPin('ROOM', '123456'))
  })
})
