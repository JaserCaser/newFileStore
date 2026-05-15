import { ArrowRight, CheckCircle2, Puzzle } from 'lucide-react'
import { useState, type SyntheticEvent } from 'react'
import { PasswordField } from './PasswordField'

type HumanChallenge = {
  readonly answer: readonly string[]
  readonly options: readonly string[]
  readonly phrase: string
}

const HUMAN_CHALLENGE_PHRASES = [
  '云开雾散',
  '海纳百川',
  '厚德载物',
  '自强不息',
  '知行合一',
  '风和日丽',
  '水到渠成',
  '柳暗花明',
] as const

type RegisterFormProps = {
  readonly loading: boolean
  readonly onShowLogin: () => void
  readonly onSubmit: (event: SyntheticEvent<HTMLFormElement>) => void
  readonly registerError: string | null
}

export function RegisterForm({ loading, onShowLogin, onSubmit, registerError }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [humanChallenge] = useState(createHumanChallenge)
  const [humanVerificationStep, setHumanVerificationStep] = useState(0)
  const [humanVerificationStatus, setHumanVerificationStatus] = useState<
    'idle' | 'error' | 'success'
  >('idle')
  const isHumanVerified = humanVerificationStatus === 'success'

  const handleVerificationClick = (character: string) => {
    if (loading || isHumanVerified) {
      return
    }

    if (character !== humanChallenge.answer[humanVerificationStep]) {
      setHumanVerificationStep(0)
      setHumanVerificationStatus('error')
      return
    }

    const nextStep = humanVerificationStep + 1
    if (nextStep === humanChallenge.answer.length) {
      setHumanVerificationStep(nextStep)
      setHumanVerificationStatus('success')
      return
    }

    setHumanVerificationStep(nextStep)
    setHumanVerificationStatus('idle')
  }

  return (
    <form className="login-card register-card" aria-label="个人空间注册表单" onSubmit={onSubmit}>
      <div className="register-heading">
        <h2>创建账号</h2>
      </div>

      {registerError && (
        <div className="login-error" role="alert">
          {registerError}
        </div>
      )}

      <label className="field">
        <span>用户名</span>
        <input autoComplete="name" name="username" placeholder="设置用户名" type="text" disabled={loading} />
      </label>

      <label className="field">
        <span>账号</span>
        <input
          autoComplete="username"
          name="account"
          placeholder="设置登录账号"
          type="text"
          disabled={loading}
        />
      </label>

      <PasswordField
        autoComplete="new-password"
        label="密码"
        name="password"
        placeholder="设置密码"
        disabled={loading}
        showPassword={showPassword}
        onToggleVisibility={() => setShowPassword((current) => !current)}
      />

      <HumanVerification
        challenge={humanChallenge}
        currentStep={humanVerificationStep}
        onCharacterClick={handleVerificationClick}
        status={humanVerificationStatus}
        verified={isHumanVerified}
        disabled={loading}
      />

      <label className="field">
        <span>绑定邮箱（可选）</span>
        <input
          autoComplete="email"
          name="email"
          placeholder="可选，用于找回账号"
          type="email"
          disabled={loading}
        />
      </label>

      <input name="humanVerified" type="hidden" value={isHumanVerified ? 'true' : 'false'} />

      <button className="submit-button" type="submit" disabled={loading || !isHumanVerified}>
        {loading ? '注册中…' : '注册'}
        {!loading && <ArrowRight aria-hidden="true" size={18} />}
      </button>

      <div className="auth-switch-row">
        <span>已有账号？</span>
        <button type="button" onClick={onShowLogin} disabled={loading}>
          返回登录
        </button>
      </div>
    </form>
  )
}

function HumanVerification({
  challenge,
  currentStep,
  disabled,
  onCharacterClick,
  status,
  verified,
}: {
  readonly challenge: HumanChallenge
  readonly currentStep: number
  readonly onCharacterClick: (character: string) => void
  readonly status: 'idle' | 'error' | 'success'
  readonly verified: boolean
  readonly disabled: boolean
}) {
  const nextCharacter = challenge.answer[Math.min(currentStep, challenge.answer.length - 1)]
  const helperText =
    status === 'error'
      ? `顺序不正确，请从“${challenge.answer[0]}”重新开始`
      : verified
        ? '验证正确'
        : `请依次点击：${challenge.answer.join('、')}`

  return (
    <div className={verified ? 'human-check is-verified' : 'human-check'}>
      <div className="human-check-copy">
        <span>图形验证</span>
        <strong>{verified ? '验证正确，可以注册' : `下一步点击“${nextCharacter}”`}</strong>
      </div>
      <div className="human-pattern" aria-label="按顺序点击图案中的文字" role="group">
        <Puzzle className="human-pattern-icon" aria-hidden="true" size={76} />
        {challenge.options.map((character) => (
          <button
            aria-label={`点击字符${character}`}
            className="human-symbol"
            disabled={disabled || verified}
            key={character}
            type="button"
            onClick={() => onCharacterClick(character)}
          >
            {character}
          </button>
        ))}
        {verified ? (
          <div className="human-verified-badge" aria-hidden="true">
            <CheckCircle2 size={19} />
          </div>
        ) : null}
      </div>
      <p role="status">{helperText}</p>
    </div>
  )
}

function createHumanChallenge(): HumanChallenge {
  const phrase = HUMAN_CHALLENGE_PHRASES[Math.floor(Math.random() * HUMAN_CHALLENGE_PHRASES.length)]
  const answer = Array.from(phrase)

  return {
    answer,
    options: shuffle(answer),
    phrase,
  }
}

function shuffle<T>(items: readonly T[]): readonly T[] {
  const shuffled = [...items]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = shuffled[index]
    shuffled[index] = shuffled[swapIndex]
    shuffled[swapIndex] = current
  }

  return shuffled
}
