const REDACT_PATTERNS = [
  // Matches: key=value or key: value or key: Bearer value (authorization header)
  /\b(password|token|secret|api_key|authorization)\s*[=:]\s*(?:Bearer\s+)?\S+/gi,
]

export function secretRedact(input: string): string {
  let out = input
  for (const pattern of REDACT_PATTERNS) {
    out = out.replace(pattern, (match) => {
      const eqIdx = match.search(/[=:]/)
      return match.slice(0, eqIdx + 1) + ' [REDACTED]'
    })
  }
  return out
}
