import {
  ArrowLeft,
  Download,
  ImagePlus,
  Loader2,
  Send,
  Settings2,
  Sparkles,
  User as UserIcon,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { User } from '../auth/types'
import './AiImagePage.css'

type AiImagePageProps = {
  readonly onBack: () => void
  readonly user?: User | null | undefined
}

const MAX_REFERENCE_SIZE = 8 * 1024 * 1024
const AI_IMAGE_ENDPOINT = '/api/ai-image/generations'
const API_KEY_STORAGE_KEY = 'filestore.aiImageApiKey'
const REQUEST_TIMEOUT_MS = 120000
const GENERATION_STEPS = ['连接生图模型', '理解画面描述', '组织构图与光影', '渲染高清 PNG'] as const

const STYLE_OPTIONS = [
  { value: 'cinematic', label: '电影感' },
  { value: 'editorial', label: '杂志' },
  { value: 'product', label: '产品图' },
  { value: 'ink', label: '水墨' },
] as const

type StyleOption = (typeof STYLE_OPTIONS)[number]['value']

const SIZE_OPTIONS = [
  { value: '1024x1024', label: '1K 方图', cost: '0.05' },
  { value: '1536x1024', label: '2K 横图', cost: '0.10' },
  { value: '1024x1536', label: '2K 竖图', cost: '0.10' },
  { value: '2048x2048', label: '2K 方图', cost: '0.10' },
  { value: '3840x2160', label: '4K 横图', cost: '0.20' },
  { value: '2160x3840', label: '4K 竖图', cost: '0.20' },
] as const

type SizeOption = (typeof SIZE_OPTIONS)[number]['value']

type ImageGenerationResponse = {
  readonly data?: readonly {
    readonly b64_json?: string
  }[]
  readonly error?: {
    readonly message?: string
  }
}

type ChatMessage = {
  readonly id: string
  readonly role: 'user' | 'assistant'
  readonly prompt?: string
  readonly referenceImage?: string | null
  readonly style?: StyleOption
  readonly size?: SizeOption
  readonly generatedImage?: string
  readonly error?: string
  readonly isGenerating?: boolean
}

function getInitialApiKey(): string {
  try {
    return window.localStorage.getItem(API_KEY_STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

function persistApiKey(value: string) {
  try {
    if (value.trim()) window.localStorage.setItem(API_KEY_STORAGE_KEY, value.trim())
    else window.localStorage.removeItem(API_KEY_STORAGE_KEY)
  } catch {
    // localStorage can be unavailable in restricted browser contexts.
  }
}

function buildApiPrompt(prompt: string, style: StyleOption, referenceName: string): string {
  const styleLabel = STYLE_OPTIONS.find((item) => item.value === style)?.label ?? 'cinematic'
  const safeName = referenceName.replace(/["'\\]/g, '').slice(0, 80)
  const referenceHint = safeName
    ? `Reference image filename: ${safeName} (text-only API, use the written prompt as source of truth).`
    : ''

  return [
    'Create a high-quality image. If the user prompt is not English, interpret it faithfully.',
    `Style direction: ${styleLabel}.`,
    referenceHint,
    `User prompt: ${prompt.trim()}`,
  ]
    .filter(Boolean)
    .join('\n')
}

async function generateAiImage({
  apiKey,
  prompt,
  referenceName,
  signal,
  size,
  style,
}: {
  readonly apiKey: string
  readonly prompt: string
  readonly referenceName: string
  readonly signal: AbortSignal
  readonly size: SizeOption
  readonly style: StyleOption
}): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (apiKey.trim()) {
    headers.Authorization = `Bearer ${apiKey.trim()}`
  }

  const response = await fetch(AI_IMAGE_ENDPOINT, {
    method: 'POST',
    headers,
    signal,
    body: JSON.stringify({
      model: 'gpt-image-2',
      prompt: buildApiPrompt(prompt, style, referenceName),
      size,
      quality: 'low',
      n: 1,
      output_format: 'png',
    }),
  })

  let payload: ImageGenerationResponse | undefined
  try {
    payload = (await response.json()) as ImageGenerationResponse
  } catch {
    payload = undefined
  }

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? `图片生成失败：HTTP ${String(response.status)}`)
  }

  const b64Json = payload?.data?.[0]?.b64_json
  if (!b64Json) {
    throw new Error('图片生成接口没有返回 data[0].b64_json')
  }

  return `data:image/png;base64,${b64Json}`
}

function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('无法读取图片'))
    }
    reader.onerror = () => reject(new Error('无法读取图片'))
    reader.readAsDataURL(file)
  })
}

export function AiImagePage({ onBack, user }: AiImagePageProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const chatScrollRef = useRef<HTMLDivElement | null>(null)
  const settingsRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      prompt: '你好！我是 FileStore AI 生图助手。请在下方输入你想要生成的画面描述，我将为你创作高质量的图片。',
    },
  ])

  const [apiKey, setApiKey] = useState(getInitialApiKey)
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState<StyleOption>('cinematic')
  const [size, setSize] = useState<SizeOption>('1024x1024')
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [referenceName, setReferenceName] = useState('')
  const [attachmentError, setAttachmentError] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [generationStep, setGenerationStep] = useState(0)

  const isGenerating = messages.some((m) => m.isGenerating)
  const canGenerate = Boolean(prompt.trim()) && !isGenerating

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [messages, generationStep])

  useEffect(() => {
    if (!isGenerating) return undefined
    const interval = window.setInterval(() => {
      setGenerationStep((current) => (current + 1) % GENERATION_STEPS.length)
    }, 1800)
    return () => window.clearInterval(interval)
  }, [isGenerating])

  useEffect(() => {
    if (!showSettings) return
    const handleMouse = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false)
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowSettings(false)
    }
    document.addEventListener('mousedown', handleMouse)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleMouse)
      document.removeEventListener('keydown', handleKey)
    }
  }, [showSettings])

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [prompt])

  async function handleReferenceChange(fileList: FileList | null) {
    const file = fileList?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setAttachmentError('请选择图片文件')
      return
    }

    if (file.size > MAX_REFERENCE_SIZE) {
      setAttachmentError('参考图片不能超过 8MB')
      return
    }

    try {
      const dataUrl = await readImageAsDataUrl(file)
      setReferenceImage(dataUrl)
      setReferenceName(file.name)
      setAttachmentError('')
    } catch {
      setAttachmentError('图片读取失败，请重新选择')
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function clearReference() {
    setReferenceImage(null)
    setReferenceName('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleGenerate(e?: React.SyntheticEvent) {
    e?.preventDefault()
    if (!canGenerate) return

    const currentPrompt = prompt
    const currentStyle = style
    const currentSize = size
    const currentRefImg = referenceImage
    const currentRefName = referenceName

    const userMsgId = crypto.randomUUID()
    const assistantMsgId = crypto.randomUUID()

    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: 'user',
        prompt: currentPrompt,
        referenceImage: currentRefImg,
        style: currentStyle,
        size: currentSize,
      },
      {
        id: assistantMsgId,
        role: 'assistant',
        isGenerating: true,
      },
    ])

    setPrompt('')
    clearReference()
    setGenerationStep(0)
    setShowSettings(false)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const imageUrl = await generateAiImage({
        apiKey,
        prompt: currentPrompt,
        referenceName: currentRefName,
        signal: controller.signal,
        size: currentSize,
        style: currentStyle,
      })

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId ? { ...msg, isGenerating: false, generatedImage: imageUrl } : msg,
        ),
      )
    } catch (err) {
      let errorMsg = err instanceof Error ? err.message : '图片生成失败，请稍后重试'
      if (err instanceof DOMException && err.name === 'AbortError') {
        errorMsg = '生成时间过长，请稍后重试或降低图片尺寸'
      }
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId ? { ...msg, isGenerating: false, error: errorMsg } : msg,
        ),
      )
    } finally {
      window.clearTimeout(timeoutId)
    }
  }

  function renderMessage(msg: ChatMessage) {
    if (msg.role === 'user') {
      const styleLabel = STYLE_OPTIONS.find((s) => s.value === msg.style)?.label
      const sizeLabel = SIZE_OPTIONS.find((s) => s.value === msg.size)?.label

      return (
        <div key={msg.id} className="ai-chat-message user">
          <div className="ai-message-content">
            <div className="ai-message-bubble">
              {msg.referenceImage && (
                <div className="ai-message-reference">
                  <img src={msg.referenceImage} alt="参考图" />
                </div>
              )}
              <p>{msg.prompt}</p>
              <div className="ai-message-tags">
                <span className="ai-tag">{styleLabel}</span>
                <span className="ai-tag">{sizeLabel}</span>
              </div>
            </div>
          </div>
          <div className="ai-avatar user-avatar">
            <UserIcon size={18} />
          </div>
        </div>
      )
    }

    return (
      <div key={msg.id} className="ai-chat-message assistant">
        <div className="ai-avatar assistant-avatar">
          <Sparkles size={18} />
        </div>
        <div className="ai-message-content">
          {msg.isGenerating ? (
            <div className="ai-generation-status">
              <Loader2 className="ai-spin" size={18} />
              <span>{GENERATION_STEPS[generationStep]}...</span>
            </div>
          ) : msg.error ? (
            <div className="ai-message-error">{msg.error}</div>
          ) : msg.generatedImage ? (
            <div className="ai-generated-image-container">
              <img src={msg.generatedImage} alt="生成结果" className="ai-generated-image" />
              <div className="ai-image-actions">
                <a
                  className="ai-icon-button"
                  href={msg.generatedImage}
                  download="filestore-ai-image.png"
                  title="下载图片"
                >
                  <Download size={16} />
                </a>
              </div>
            </div>
          ) : (
            <div className="ai-message-text">
              <p>{msg.prompt}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <main className="ai-image-page">
      <header className="ai-chat-topbar">
        <button className="ai-icon-button" type="button" onClick={onBack} aria-label="返回文件">
          <ArrowLeft size={20} />
        </button>
        <div className="ai-topbar-title">
          <span className="ai-kicker">FileStore Lab</span>
          <h1>AI 绘画</h1>
        </div>
        <div className="ai-user-pill">{user?.username ?? user?.account ?? '个人空间'}</div>
      </header>

      <section className="ai-chat-history" ref={chatScrollRef}>
        <div className="ai-chat-history-inner">{messages.map(renderMessage)}</div>
      </section>

      <section className="ai-chat-input-area">
        <div className="ai-chat-input-container">
          {showSettings && (
            <div className="ai-settings-popover" ref={settingsRef}>
              <div className="ai-control-group">
                <span>API Key</span>
                <input
                  className="ai-text-input"
                  type="password"
                  value={apiKey}
                  placeholder="可留空，默认使用本地代理密钥"
                  autoComplete="off"
                  onChange={(event) => setApiKey(event.target.value)}
                  onBlur={(event) => persistApiKey(event.target.value)}
                />
              </div>

              <div className="ai-control-group">
                <span>风格</span>
                <div className="ai-style-grid" role="radiogroup" aria-label="生图风格">
                  {STYLE_OPTIONS.map((item) => (
                    <button
                      key={item.value}
                      className={style === item.value ? 'active' : ''}
                      type="button"
                      role="radio"
                      aria-checked={style === item.value}
                      onClick={() => setStyle(item.value)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ai-control-group">
                <span>尺寸</span>
                <div className="ai-size-grid" role="radiogroup" aria-label="图片尺寸">
                  {SIZE_OPTIONS.map((item) => (
                    <button
                      key={item.value}
                      className={size === item.value ? 'active' : ''}
                      type="button"
                      role="radio"
                      aria-checked={size === item.value}
                      onClick={() => setSize(item.value)}
                      title={`${item.label} ${item.value}，约 ${item.cost}`}
                    >
                      <span>{item.label}</span>
                      <small>{item.value}</small>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {referenceImage && (
            <div className="ai-chat-attachment">
              <img src={referenceImage} alt="参考图" />
              <button type="button" onClick={clearReference} aria-label="移除参考图">
                <X size={14} />
              </button>
            </div>
          )}

          {attachmentError && (
            <p className="ai-attachment-error">{attachmentError}</p>
          )}

          <form className="ai-chat-form" onSubmit={handleGenerate}>
            <button
              className="ai-action-btn"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="上传参考图"
              aria-label="上传参考图"
            >
              <ImagePlus size={20} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(event) => void handleReferenceChange(event.target.files)}
            />

            <textarea
              ref={textareaRef}
              aria-label="输入画面描述"
              className="ai-chat-textarea"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void handleGenerate()
                }
              }}
              placeholder="输入画面描述... (Shift + Enter 换行)"
              rows={1}
            />

            <button
              className={`ai-action-btn ${showSettings ? 'active' : ''}`}
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              title="生图设置"
              aria-label="生图设置"
            >
              <Settings2 size={20} />
            </button>

            <button
              className="ai-send-btn"
              type="submit"
              disabled={!canGenerate}
              title="发送"
              aria-label="发送"
            >
              {isGenerating ? <Loader2 className="ai-spin" size={18} /> : <Send size={18} />}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
