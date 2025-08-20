import { describe, it, expect } from 'vitest'

describe('Component Basics', () => {
  it('can create basic component structure', () => {
    const layout = document.createElement('main')
    layout.className = 'main-layout'
    layout.innerHTML = '<div>Content</div>'
    
    expect(layout.tagName).toBe('MAIN')
    expect(layout.className).toBe('main-layout')
    expect(layout.querySelector('div')).toBeTruthy()
  })

  it('can simulate component props', () => {
    interface ComponentProps {
      title: string
      children: string
    }
    
    const props: ComponentProps = {
      title: 'Test Title',
      children: 'Test Content'
    }
    
    expect(props.title).toBe('Test Title')
    expect(props.children).toBe('Test Content')
  })
})
