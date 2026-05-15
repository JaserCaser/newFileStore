import {
  ArrowLeftRight,
  ArrowRight,
  CheckCircle2,
  Cloud,
  Eye,
  EyeOff,
  Puzzle,
  ShieldCheck,
} from 'lucide-react'
import { type SyntheticEvent, useCallback, useState } from 'react'
import { useAuth } from './useAuth'

type LoginVariant = 'legacy' | 'modern'
type AuthMode = 'login' | 'register'

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

export function LoginPage() {
  const [variant, setVariant] = useState<LoginVariant>('modern')
  const { login, register } = useAuth()
  const [loginError, setLoginError] = useState<string | null>(null)
  const [registerError, setRegisterError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLoginSubmit = useCallback(
    (event: SyntheticEvent<HTMLFormElement>) => {
      event.preventDefault()
      setLoginError(null)

      const formData = new FormData(event.currentTarget)
      const account = getTextField(formData, 'account')
      const password = getTextField(formData, 'password')
      const remember = formData.get('remember') === 'on'

      if (!account || !password) {
        setLoginError('请输入账号和密码')
        return
      }

      setLoading(true)
      void login({ account, password, remember })
        .then((result) => {
          if (!result.success) {
            setLoginError(result.message ?? '登录失败')
          }
        })
        .finally(() => setLoading(false))
    },
    [login],
  )

  const handleRegisterSubmit = useCallback(
    (event: SyntheticEvent<HTMLFormElement>) => {
      event.preventDefault()
      setRegisterError(null)

      const formData = new FormData(event.currentTarget)
      const username = getTextField(formData, 'username')
      const account = getTextField(formData, 'account')
      const password = getTextField(formData, 'password')
      const humanVerified = getTextField(formData, 'humanVerified') === 'true'

      if (!username || !account || !password) {
        setRegisterError('请填写用户名、账号和密码')
        return
      }

      if (!humanVerified) {
        setRegisterError('请先完成拖拽验证')
        return
      }

      setLoading(true)
      void register({ username, account, password })
        .then((result) => {
          if (!result.success) {
            setRegisterError(result.message ?? '注册失败')
          }
        })
        .finally(() => setLoading(false))
    },
    [register],
  )

  const isModern = variant === 'modern'

  return (
    <main className={isModern ? 'login-page login-page-modern' : 'login-page'}>
      <button
        className="variant-switch"
        title={isModern ? '切换旧登录页面' : '切换新登录页面'}
        type="button"
        onClick={() => setVariant(isModern ? 'legacy' : 'modern')}
      >
        <ArrowLeftRight aria-hidden="true" size={16} />
        <span>{isModern ? '切换旧登录页面' : '切换新登录页面'}</span>
      </button>

      {isModern ? (
        <ModernLogin
          onLoginSubmit={handleLoginSubmit}
          onRegisterSubmit={handleRegisterSubmit}
          loginError={loginError}
          registerError={registerError}
          loading={loading}
        />
      ) : (
        <LegacyLogin
          onLoginSubmit={handleLoginSubmit}
          onRegisterSubmit={handleRegisterSubmit}
          loginError={loginError}
          registerError={registerError}
          loading={loading}
        />
      )}
    </main>
  )
}

function LegacyLogin({
  onLoginSubmit,
  onRegisterSubmit,
  loginError,
  registerError,
  loading,
}: {
  readonly onLoginSubmit: (event: SyntheticEvent<HTMLFormElement>) => void
  readonly onRegisterSubmit: (event: SyntheticEvent<HTMLFormElement>) => void
  readonly loginError: string | null
  readonly registerError: string | null
  readonly loading: boolean
}) {
  const [mode, setMode] = useState<AuthMode>('login')
  const isRegister = mode === 'register'

  return (
    <>
      <nav className="login-nav" aria-label="主导航">
        <a className="wordmark" href="/" aria-label="个人 FileStore 首页">
          <Cloud aria-hidden="true" size={19} />
          <span>个人 FileStore</span>
        </a>
        <span className="nav-pill">个人存储空间</span>
      </nav>

      <section className="login-hero" aria-labelledby="login-title">
        <div className="hero-copy">
          <p className="kicker">Personal FileStore</p>
          <h1 id="login-title">清晰地存放你的每一份文件。</h1>
          <p className="hero-subtitle">
            一个面向个人使用的文件存储入口，用来管理文档、相册、归档和长期资料。
          </p>
        </div>

        {isRegister ? (
          <RegisterForm
            onSubmit={onRegisterSubmit}
            onShowLogin={() => setMode('login')}
            registerError={registerError}
          />
        ) : (
          <LoginForm
            title="登录个人空间"
            helper="进入你的 FileStore。"
            onSubmit={onLoginSubmit}
            onShowRegister={() => setMode('register')}
            loginError={loginError}
            loading={loading}
          />
        )}
      </section>

      <StatusStrip />
    </>
  )
}

function ModernLogin({
  onLoginSubmit,
  onRegisterSubmit,
  loginError,
  registerError,
  loading,
}: {
  readonly onLoginSubmit: (event: SyntheticEvent<HTMLFormElement>) => void
  readonly onRegisterSubmit: (event: SyntheticEvent<HTMLFormElement>) => void
  readonly loginError: string | null
  readonly registerError: string | null
  readonly loading: boolean
}) {
  return (
    <section className="modern-shell" aria-labelledby="modern-login-title">
      <div className="modern-intro">
        <svg
          className="modern-mark"
          viewBox="0 0 132 88"
          role="img"
          aria-label="FileStore 云端标识"
        >
          <defs>
            <linearGradient id="cloudFill" x1="28" x2="104" y1="12" y2="78">
              <stop offset="0" stopColor="#8fd5ff" />
              <stop offset="0.48" stopColor="#2f9fff" />
              <stop offset="1" stopColor="#006edc" />
            </linearGradient>
            <linearGradient id="cloudGloss" x1="38" x2="94" y1="10" y2="58">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.7" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            className="modern-cloud-shape"
            d="M102.6 76.2H35.4C18.1 76.2 6 65.4 6 51.2c0-12.8 10.5-23.1 24.8-24.1C36.6 14.2 49.6 6 65.2 6c20.3 0 36.9 13.8 39.1 31.8 12.6 2.2 21.7 9.8 21.7 20 0 11-9.9 18.4-23.4 18.4Z"
          />
          <path
            className="modern-cloud-gloss"
            d="M29 31.6C36.6 18.9 49.8 11.8 65 11.8c17.6 0 32.2 11.7 34.5 28.1 9.1 1.5 15.8 6 18.6 12.1-10.3-5.3-20.8-4.5-30.8-2.5-14 2.8-27.3 7-42.8 2.2-8.1-2.5-13.4-8-15.5-20.1Z"
          />
        </svg>
        <h1 id="modern-login-title">欢迎回来</h1>
      </div>

      <AuthFlipCard
        onLoginSubmit={onLoginSubmit}
        onRegisterSubmit={onRegisterSubmit}
        loginError={loginError}
        registerError={registerError}
        loading={loading}
      />
    </section>
  )
}

function AuthFlipCard({
  onLoginSubmit,
  onRegisterSubmit,
  loginError,
  registerError,
  loading,
}: {
  readonly onLoginSubmit: (event: SyntheticEvent<HTMLFormElement>) => void
  readonly onRegisterSubmit: (event: SyntheticEvent<HTMLFormElement>) => void
  readonly loginError: string | null
  readonly registerError: string | null
  readonly loading: boolean
}) {
  const [mode, setMode] = useState<AuthMode>('login')
  const isRegister = mode === 'register'

  return (
    <div className="auth-card-scene">
      <div className={isRegister ? 'auth-card-flipper is-register' : 'auth-card-flipper'}>
        <div className="auth-face auth-face-front" aria-hidden={isRegister} inert={isRegister}>
          <LoginForm
            compact
            title="欢迎回来"
            helper="登录后继续访问你的个人文件空间。"
            onSubmit={onLoginSubmit}
            onShowRegister={() => setMode('register')}
            loginError={loginError}
            loading={loading}
          />
        </div>

        <div className="auth-face auth-face-back" aria-hidden={!isRegister} inert={!isRegister}>
          <RegisterForm
            onSubmit={onRegisterSubmit}
            onShowLogin={() => setMode('login')}
            registerError={registerError}
          />
        </div>
      </div>
    </div>
  )
}

function LoginForm({
  helper,
  onShowRegister,
  onSubmit,
  title,
  compact = false,
  loginError,
  loading,
}: {
  readonly compact?: boolean
  readonly helper: string
  readonly loginError: string | null
  readonly loading: boolean
  readonly onShowRegister?: () => void
  readonly onSubmit: (event: SyntheticEvent<HTMLFormElement>) => void
  readonly title: string
}) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <form className="login-card" aria-label="个人空间登录表单" onSubmit={onSubmit}>
      {compact ? null : (
        <div className="card-heading">
          <div>
            <p>{title}</p>
            <span>{helper}</span>
          </div>
        </div>
      )}

      {loginError && (
        <div className="login-error" role="alert">
          {loginError}
        </div>
      )}

      <label className="field">
        <span>账号</span>
        <input
          autoComplete="username"
          name="account"
          placeholder="输入账号"
          type="text"
          disabled={loading}
        />
      </label>

      <PasswordField
        autoComplete="current-password"
        disabled={loading}
        label="密码"
        name="password"
        placeholder="输入密码"
        showPassword={showPassword}
        onToggleVisibility={() => setShowPassword((current) => !current)}
      />

      <div className="form-row">
        <label className="remember">
          <input name="remember" type="checkbox" disabled={loading} />
          <span>保持登录</span>
        </label>
        <a href="/forgot-password">忘记密码？</a>
      </div>

      <button className="submit-button" type="submit" disabled={loading}>
        {loading ? '登录中…' : '登录'}
        {!loading && <ArrowRight aria-hidden="true" size={18} />}
      </button>

      {onShowRegister ? (
        <div className="auth-switch-row">
          <span>还没有账号？</span>
          <button type="button" onClick={onShowRegister}>
            注册
          </button>
        </div>
      ) : null}
    </form>
  )
}

function RegisterForm({
  onShowLogin,
  onSubmit,
  registerError,
}: {
  readonly onShowLogin: () => void
  readonly onSubmit: (event: SyntheticEvent<HTMLFormElement>) => void
  readonly registerError: string | null
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [humanChallenge] = useState(createHumanChallenge)
  const [humanVerificationStep, setHumanVerificationStep] = useState(0)
  const [humanVerificationStatus, setHumanVerificationStatus] = useState<
    'idle' | 'error' | 'success'
  >('idle')
  const isHumanVerified = humanVerificationStatus === 'success'

  const handleVerificationClick = (character: string) => {
    if (isHumanVerified) {
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
        <input autoComplete="name" name="username" placeholder="设置用户名" type="text" />
      </label>

      <label className="field">
        <span>账号</span>
        <input autoComplete="username" name="account" placeholder="设置登录账号" type="text" />
      </label>

      <PasswordField
        autoComplete="new-password"
        label="密码"
        name="password"
        placeholder="设置密码"
        showPassword={showPassword}
        onToggleVisibility={() => setShowPassword((current) => !current)}
      />

      <HumanVerification
        challenge={humanChallenge}
        currentStep={humanVerificationStep}
        onCharacterClick={handleVerificationClick}
        status={humanVerificationStatus}
        verified={isHumanVerified}
      />

      <label className="field">
        <span>绑定邮箱（可选）</span>
        <input autoComplete="email" name="email" placeholder="可选，用于找回账号" type="email" />
      </label>

      <input name="humanVerified" type="hidden" value={isHumanVerified ? 'true' : 'false'} />

      <button className="submit-button" type="submit" disabled={!isHumanVerified}>
        注册
        <ArrowRight aria-hidden="true" size={18} />
      </button>

      <div className="auth-switch-row">
        <span>已有账号？</span>
        <button type="button" onClick={onShowLogin}>
          返回登录
        </button>
      </div>
    </form>
  )
}

function HumanVerification({
  challenge,
  currentStep,
  onCharacterClick,
  status,
  verified,
}: {
  readonly challenge: HumanChallenge
  readonly currentStep: number
  readonly onCharacterClick: (character: string) => void
  readonly status: 'idle' | 'error' | 'success'
  readonly verified: boolean
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
            disabled={verified}
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

function PasswordField({
  autoComplete,
  disabled = false,
  label,
  name,
  onToggleVisibility,
  placeholder,
  showPassword,
}: {
  readonly autoComplete: string
  readonly disabled?: boolean
  readonly label: string
  readonly name: string
  readonly onToggleVisibility: () => void
  readonly placeholder: string
  readonly showPassword: boolean
}) {
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

function StatusStrip() {
  return (
    <aside className="signal-strip" aria-label="系统状态">
      <div>
        <ShieldCheck aria-hidden="true" size={18} />
        <span>安全会话</span>
      </div>
      <div>
        <span className="status-dot" aria-hidden="true" />
        <span>存储服务就绪</span>
      </div>
    </aside>
  )
}

function getTextField(formData: FormData, name: string): string {
  const value = formData.get(name)

  return typeof value === 'string' ? value : ''
}
