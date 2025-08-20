import { describe, it, expect } from 'vitest'

describe('App Environment', () => {
  it('testing environment is properly configured', () => {
    expect(true).toBe(true)
  })

  it('can access document', () => {
    expect(document).toBeDefined()
    expect(document.body).toBeInTheDocument()
  })

  it('can create elements', () => {
    const div = document.createElement('div')
    div.innerHTML = '<p>Test content</p>'
    expect(div.querySelector('p')).toBeTruthy()
    expect(div.querySelector('p')?.textContent).toBe('Test content')
  })
})
