import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children?: ReactNode
}

const baseStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  borderRadius: 6,
  border: 'none',
  cursor: 'pointer',
  fontWeight: 500,
  transition: 'background 0.15s, opacity 0.15s',
}

const variants: Record<ButtonVariant, React.CSSProperties> = {
  primary: { background: '#2d6cdf', color: '#fff' },
  secondary: { background: '#444', color: '#eee' },
  ghost: { background: 'transparent', color: '#aaa' },
  icon: { background: 'transparent', color: '#eee', padding: 6, borderRadius: '50%' },
}

const sizes: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '4px 10px', fontSize: 12 },
  md: { padding: '8px 16px', fontSize: 14 },
  lg: { padding: '12px 24px', fontSize: 16 },
}

export function Button({
  variant = 'primary',
  size = 'md',
  disabled,
  style,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      style={{
        ...baseStyle,
        ...variants[variant],
        ...sizes[size],
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  )
}
