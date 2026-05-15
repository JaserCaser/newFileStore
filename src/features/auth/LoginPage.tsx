import {
  ArrowLeftRight,
  ArrowRight,
  Cloud,
  FileText,
  Folder,
  Image,
  Lock,
  Music,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react'
import {
  type CSSProperties,
  type ReactNode,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { PasswordField } from './PasswordField'
import { RegisterForm } from './RegisterForm'
import { useAuth } from './useAuth'
import './LoginPage.legacy.css'
import './LoginPage.controls.css'
import './LoginPage.modern.css'
import './LoginPage.motion.css'

type LoginVariant = 'legacy' | 'modern'
type AuthMode = 'login' | 'register'
const TITLE_STYLE_COUNT = 4

export function LoginPage({
  mode = 'product',
  onAuthenticated,
}: {
  readonly mode?: 'product' | 'admin'
  readonly onAuthenticated?: () => void
}) {
  const [variant, setVariant] = useState<LoginVariant>('modern')
  const [videoReady, setVideoReady] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const { login, register } = useAuth()
  const [loginError, setLoginError] = useState<string | null>(null)
  const [registerError, setRegisterError] = useState<string | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)
  const [registerLoading, setRegisterLoading] = useState(false)

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

      setLoginLoading(true)
      void login({ account, password, remember }, { requireAdminAccess: mode === 'admin' })
        .then((result) => {
          if (result.success) {
            onAuthenticated?.()
          } else {
            setLoginError(result.message ?? '登录失败')
          }
        })
        .finally(() => setLoginLoading(false))
    },
    [login, mode, onAuthenticated],
  )

  const handleRegisterSubmit = useCallback(
    (event: SyntheticEvent<HTMLFormElement>) => {
      event.preventDefault()
      setRegisterError(null)

      const formData = new FormData(event.currentTarget)
      const username = getTextField(formData, 'username')
      const account = getTextField(formData, 'account')
      const password = getTextField(formData, 'password')
      const email = getTextField(formData, 'email') || undefined
      const humanVerified = getTextField(formData, 'humanVerified') === 'true'

      if (!username || !account || !password) {
        setRegisterError('请填写用户名、账号和密码')
        return
      }

      if (!humanVerified) {
        setRegisterError('请先完成图形验证')
        return
      }

      setRegisterLoading(true)
      void register({ username, account, password, ...(email ? { email } : {}) })
        .then((result) => {
          if (result.success) {
            onAuthenticated?.()
          } else {
            setRegisterError(result.message ?? '注册失败')
          }
        })
        .finally(() => setRegisterLoading(false))
    },
    [register, onAuthenticated],
  )

  const isModern = variant === 'modern'

  useEffect(() => {
    if (!isModern) {
      return
    }

    const video = videoRef.current
    if (!video) {
      return
    }

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      setVideoReady(true)
      return
    }

    const handleReady = () => setVideoReady(true)
    video.addEventListener('canplay', handleReady, { once: true })

    return () => {
      video.removeEventListener('canplay', handleReady)
    }
  }, [isModern])

  return (
    <main className={isModern ? 'login-page login-page-modern' : 'login-page'}>
      {isModern ? (
        <video
          ref={videoRef}
          className={videoReady ? 'login-bg-video is-ready' : 'login-bg-video'}
          aria-hidden="true"
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          tabIndex={-1}
        >
          <source src="/videos/login-storage-bg.webm" type="video/webm" />
          <source src="/videos/login-storage-bg.mp4" type="video/mp4" />
        </video>
      ) : null}

      <button
        className="variant-switch"
        title={isModern ? '切换旧登录页面' : '切换新登录页面'}
        type="button"
        onClick={() => {
          if (isModern) setVideoReady(false)
          setVariant(isModern ? 'legacy' : 'modern')
        }}
      >
        <ArrowLeftRight aria-hidden="true" size={16} />
        <span>{isModern ? '切换旧登录页面' : '切换新登录页面'}</span>
      </button>

      {isModern ? (
        <ModernLogin
          mode={mode}
          onLoginSubmit={handleLoginSubmit}
          onRegisterSubmit={handleRegisterSubmit}
          loginError={loginError}
          registerError={registerError}
          loginLoading={loginLoading}
          registerLoading={registerLoading}
        />
      ) : (
        <LegacyLogin
          mode={mode}
          onLoginSubmit={handleLoginSubmit}
          onRegisterSubmit={handleRegisterSubmit}
          loginError={loginError}
          registerError={registerError}
          loginLoading={loginLoading}
          registerLoading={registerLoading}
        />
      )}
    </main>
  )
}

function LegacyLogin({
  mode: authSurface,
  onLoginSubmit,
  onRegisterSubmit,
  loginError,
  registerError,
  loginLoading,
  registerLoading,
}: {
  readonly mode: 'product' | 'admin'
  readonly onLoginSubmit: (event: SyntheticEvent<HTMLFormElement>) => void
  readonly onRegisterSubmit: (event: SyntheticEvent<HTMLFormElement>) => void
  readonly loginError: string | null
  readonly registerError: string | null
  readonly loginLoading: boolean
  readonly registerLoading: boolean
}) {
  const [formMode, setFormMode] = useState<AuthMode>('login')
  const isRegister = formMode === 'register'

  return (
    <>
      <nav className="login-nav" aria-label="主导航">
        <a className="wordmark" href="/" aria-label="个人 FileStore 首页">
          <Cloud aria-hidden="true" size={19} />
          <span>个人 FileStore</span>
        </a>
        <span className="nav-pill">
          {authSurface === 'admin' ? '后台运维端' : '个人存储空间'}
        </span>
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
            onShowLogin={() => setFormMode('login')}
            registerError={registerError}
            loading={registerLoading}
          />
        ) : (
          <LoginForm
            title="登录个人空间"
            helper={authSurface === 'admin' ? '使用已授权账号进入后台运维端。' : '进入你的 FileStore。'}
            onSubmit={onLoginSubmit}
            onShowRegister={authSurface === 'admin' ? undefined : () => setFormMode('register')}
            loginError={loginError}
            loading={loginLoading}
          />
        )}
      </section>

      <StatusStrip />
    </>
  )
}

function ModernLogin({
  mode,
  onLoginSubmit,
  onRegisterSubmit,
  loginError,
  registerError,
  loginLoading,
  registerLoading,
}: {
  readonly mode: 'product' | 'admin'
  readonly onLoginSubmit: (event: SyntheticEvent<HTMLFormElement>) => void
  readonly onRegisterSubmit: (event: SyntheticEvent<HTMLFormElement>) => void
  readonly loginError: string | null
  readonly registerError: string | null
  readonly loginLoading: boolean
  readonly registerLoading: boolean
}) {
  const [formMode, setFormMode] = useState<AuthMode>('login')

  return (
    <section className="modern-shell" aria-labelledby="modern-login-title">
      <div className="modern-intro">
        <StorageOrbitHero />
        <ModernTitle authMode={formMode} mode={mode} />
      </div>

      <AuthFlipCard
        formMode={formMode}
        onLoginSubmit={onLoginSubmit}
        onFormModeChange={setFormMode}
        mode={mode}
        onRegisterSubmit={onRegisterSubmit}
        loginError={loginError}
        registerError={registerError}
        loginLoading={loginLoading}
        registerLoading={registerLoading}
      />
    </section>
  )
}

function ModernTitle({
  authMode,
  mode,
}: {
  readonly authMode: AuthMode
  readonly mode: 'product' | 'admin'
}) {
  const titlePair =
    mode === 'admin'
      ? (['后台运维', 'Admin console'] as const)
      : authMode === 'register'
        ? (['你好呀', 'halo~'] as const)
        : (['欢迎回来', 'Welcome back'] as const)
  const [titleIndex, setTitleIndex] = useState(0)
  const [titleStyleIndex, setTitleStyleIndex] = useState(() => getRandomTitleStyle())
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    setVisible(false)
    const resetTimer = window.setTimeout(() => {
      setTitleIndex(0)
      setTitleStyleIndex((current) => getNextTitleStyle(current))
      setVisible(true)
    }, 160)

    return () => {
      window.clearTimeout(resetTimer)
    }
  }, [authMode, mode])

  useEffect(() => {
    let swapTimer: number | undefined
    const interval = window.setInterval(() => {
      setVisible(false)
      swapTimer = window.setTimeout(() => {
        setTitleIndex((current) => (current + 1) % titlePair.length)
        setTitleStyleIndex((current) => getNextTitleStyle(current))
        setVisible(true)
      }, 260)
    }, 3000)

    return () => {
      window.clearInterval(interval)
      if (swapTimer !== undefined) {
        window.clearTimeout(swapTimer)
      }
    }
  }, [titlePair.length, titlePair[0], titlePair[1]])

  return (
    <h1
      className={`modern-title title-style-${titleStyleIndex}${visible ? '' : ' is-fading'}`}
      id="modern-login-title"
    >
      {titlePair[titleIndex]}
    </h1>
  )
}

function getRandomTitleStyle(): number {
  return Math.floor(Math.random() * TITLE_STYLE_COUNT)
}

function getNextTitleStyle(current: number): number {
  if (TITLE_STYLE_COUNT <= 1) {
    return current
  }

  let next = getRandomTitleStyle()
  while (next === current) {
    next = getRandomTitleStyle()
  }

  return next
}

function StorageOrbitHero() {
  return (
    <div className="storage-orbit-hero" aria-hidden="true">
      <div className="orbit-halo orbit-halo-back" />
      <div className="storage-cloud-core">
        <span className="cloud-lobe cloud-lobe-left" />
        <span className="cloud-lobe cloud-lobe-top" />
        <span className="cloud-lobe cloud-lobe-right" />
        <span className="cloud-base" />
        <Cloud className="cloud-core-icon" size={50} />
      </div>
      <div className="orbit-ring orbit-ring-wide">
        <OrbitBubble tone="sky" label="IMG" style={{ '--orbit-angle': '8deg' } as CSSProperties}>
          <Image size={24} />
        </OrbitBubble>
        <OrbitBubble tone="mint" label="DOC" style={{ '--orbit-angle': '76deg' } as CSSProperties}>
          <FileText size={23} />
        </OrbitBubble>
        <OrbitBubble tone="sun" label="DIR" style={{ '--orbit-angle': '146deg' } as CSSProperties}>
          <Folder size={24} />
        </OrbitBubble>
        <OrbitBubble tone="blue" label="UP" style={{ '--orbit-angle': '212deg' } as CSSProperties}>
          <UploadCloud size={25} />
        </OrbitBubble>
        <OrbitBubble tone="rose" label="KEY" style={{ '--orbit-angle': '286deg' } as CSSProperties}>
          <Lock size={22} />
        </OrbitBubble>
      </div>
      <div className="orbit-ring orbit-ring-tight">
        <OrbitBubble tone="violet" label="AUD" style={{ '--orbit-angle': '326deg' } as CSSProperties}>
          <Music size={22} />
        </OrbitBubble>
      </div>
      <div className="orbit-halo orbit-halo-front" />
    </div>
  )
}

function OrbitBubble({
  children,
  label,
  style,
  tone,
}: {
  readonly children: ReactNode
  readonly label: string
  readonly style: CSSProperties
  readonly tone: 'blue' | 'mint' | 'rose' | 'sky' | 'sun' | 'violet'
}) {
  return (
    <span className={`orbit-bubble orbit-bubble-${tone}`} style={style}>
      {children}
      <small>{label}</small>
    </span>
  )
}

function AuthFlipCard({
  formMode,
  mode: authSurface,
  onFormModeChange,
  onLoginSubmit,
  onRegisterSubmit,
  loginError,
  registerError,
  loginLoading,
  registerLoading,
}: {
  readonly formMode: AuthMode
  readonly mode: 'product' | 'admin'
  readonly onFormModeChange: (mode: AuthMode) => void
  readonly onLoginSubmit: (event: SyntheticEvent<HTMLFormElement>) => void
  readonly onRegisterSubmit: (event: SyntheticEvent<HTMLFormElement>) => void
  readonly loginError: string | null
  readonly registerError: string | null
  readonly loginLoading: boolean
  readonly registerLoading: boolean
}) {
  const isRegister = formMode === 'register'

  return (
    <div className="auth-card-scene">
      <div className={isRegister ? 'auth-card-flipper is-register' : 'auth-card-flipper'}>
        <div className="auth-face auth-face-front" aria-hidden={isRegister} inert={isRegister}>
          <LoginForm
            compact
            title={authSurface === 'admin' ? '后台运维' : '欢迎回来'}
            helper={
              authSurface === 'admin'
                ? '仅超级管理员或已授权账号可登录。'
                : '登录后继续访问你的个人文件空间。'
            }
            onSubmit={onLoginSubmit}
            onShowRegister={
              authSurface === 'admin' ? undefined : () => onFormModeChange('register')
            }
            loginError={loginError}
            loading={loginLoading}
          />
        </div>

        <div className="auth-face auth-face-back" aria-hidden={!isRegister} inert={!isRegister}>
          <RegisterForm
            onSubmit={onRegisterSubmit}
            onShowLogin={() => onFormModeChange('login')}
            registerError={registerError}
            loading={registerLoading}
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
  readonly onShowRegister?: (() => void) | undefined
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
        <button className="forgot-password-link" type="button" disabled>
          忘记密码？
        </button>
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
