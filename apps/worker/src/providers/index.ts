import { config } from '../config.js'
import { createMockProvider } from './mock.js'
import type { MockProvider } from './mock.js'

export type { MockProvider as AiProvider }

export function createProvider(): MockProvider {
  if (config.aiProvider === 'mock') {
    return createMockProvider()
  }
  throw new Error(`Unknown AI provider: ${config.aiProvider}. Supported values: mock`)
}
