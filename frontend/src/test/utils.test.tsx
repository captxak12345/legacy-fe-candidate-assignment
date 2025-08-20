import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'

describe('Frontend Utils', () => {
  it('basic rendering works', () => {
    const div = document.createElement('div')
    div.textContent = 'Hello World'
    expect(div.textContent).toBe('Hello World')
  })

  it('React rendering environment is set up', () => {
    const TestComponent = () => <div>Test Component</div>
    const { container } = render(<TestComponent />)
    expect(container.querySelector('div')).toHaveTextContent('Test Component')
  })

  it('basic DOM manipulation works', () => {
    const button = document.createElement('button')
    button.textContent = 'Click me'
    button.onclick = () => {
      button.textContent = 'Clicked!'
    }
    
    expect(button.textContent).toBe('Click me')
    button.click()
    expect(button.textContent).toBe('Clicked!')
  })

  it('can create and test simple React component', () => {
    const SimpleButton = ({ onClick, children }: any) => (
      <button onClick={onClick}>{children}</button>
    )
    
    const { container } = render(
      <SimpleButton onClick={() => {}}>Test Button</SimpleButton>
    )
    
    const button = container.querySelector('button')
    expect(button).toHaveTextContent('Test Button')
  })
})
