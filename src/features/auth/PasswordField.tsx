import { Eye, EyeOff } from 'lucide-react'

type PasswordFieldProps = {
  readonly autoComplete: string
  readonly disabled?: boolean
  readonly label: string
  readonly name: string
  readonly onToggleVisibility: () => void
  readonly placeholder: string
  readonly showPassword: boolean
}

export function PasswordField({
  autoComplete,
  disabled = false,
  label,
  name,
  onToggleVisibility,
  placeholder,
  showPassword,
}: PasswordFieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="password-input-wrap">
        <input
          autoComplete={autoComplete}
          disabled={disabled}
          name={name}
          placeholder={placeholder}
          type={showPassword ? 'text' : 'password'}
        />
        <button
          aria-label={showPassword ? '隐藏密码' : '显示密码'}
          className="password-visibility-toggle"
          disabled={disabled}
          title={showPassword ? '隐藏密码' : '显示密码'}
          type="button"
          onClick={onToggleVisibility}
        >
          {showPassword ? (
            <EyeOff aria-hidden="true" size={18} />
          ) : (
            <Eye aria-hidden="true" size={18} />
          )}
        </button>
      </div>
    </label>
  )
}
