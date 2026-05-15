import {
  ArrowLeft,
  Download,
  ImagePlus,
  Loader2,
  RotateCcw,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
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
  const referenceHint = referenceName
    ? `The user uploaded a local reference image named "${referenceName}", but this API endpoint accepts text only. Use the written prompt as the source of truth.`
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
  const [apiKey, setApiKey] = useState(getInitialApiKey)
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState<StyleOption>('cinematic')
  const [size, setSize] = useState<SizeOption>('1024x1024')
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [referenceName, setReferenceName] = useState('')
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationStep, setGenerationStep] = useState(0)

  const canGenerate = Boolean(prompt.trim())
  const activeStyleLabel = useMemo(
    () => STYLE_OPTIONS.find((item) => item.value === style)?.label ?? '电影感',
    [style],
  )
  const activeSizeLabel = useMemo(
    () => SIZE_OPTIONS.find((item) => item.value === size)?.label ?? '1K 方图',
    [size],
  )

  useEffect(() => {
    if (!isGenerating) return undefined

    const interval = window.setInterval(() => {
      setGenerationStep((current) => (current + 1) % GENERATION_STEPS.length)
    }, 1800)

    return () => window.clearInterval(interval)
  }, [isGenerating])

  async function handleReferenceChange(fileList: FileList | null) {
    const file = fileList?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件')
      return
    }

    if (file.size > MAX_REFERENCE_SIZE) {
      setError('参考图片不能超过 8MB')
      return
    }

    try {
      const dataUrl = await readImageAsDataUrl(file)
      setReferenceImage(dataUrl)
      setReferenceName(file.name)
      setError('')
    } catch {
      setError('图片读取失败，请重新选择')
    }
  }

  function clearReference() {
    setReferenceImage(null)
    setReferenceName('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleGenerate() {
    if (!canGenerate || isGenerating) return

    setError('')
    setIsGenerating(true)
    setGenerationStep(0)
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    try {
      const imageUrl = await generateAiImage({
        apiKey,
        prompt,
        referenceName,
        signal: controller.signal,
        size,
        style,
      })
      setGeneratedImage(imageUrl)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setError('生成时间过长，请稍后重试或降低图片尺寸')
      } else {
        setError(err instanceof Error ? err.message : '图片生成失败，请稍后重试')
      }
    } finally {
      window.clearTimeout(timeoutId)
      setIsGenerating(false)
    }
  }

  return (
    <main className="ai-image-page">
      <header className="ai-image-topbar">
        <button className="ai-icon-button" type="button" onClick={onBack} aria-label="返回文件">
          <ArrowLeft size={20} />
        </button>
        <div>
          <span className="ai-kicker">FileStore Lab</span>
          <h1>AI 生图</h1>
        </div>
        <div className="ai-user-pill">{user?.username ?? user?.account ?? '个人空间'}</div>
      </header>

      <section className="ai-image-workspace">
        <section className={`ai-preview-panel ${isGenerating ? 'is-generating' : ''}`} aria-label="生成结果">
          <div className="ai-preview-heading">
            <div>
              <span>{activeStyleLabel} · {activeSizeLabel}</span>
              <h2>{isGenerating ? GENERATION_STEPS[generationStep] : '生成结果'}</h2>
            </div>
            <div className="ai-preview-actions">
              <button
                className="ai-icon-button"
                type="button"
                onClick={() => void handleGenerate()}
                disabled={!canGenerate || isGenerating}
                aria-label="重新生成"
              >
                <RotateCcw size={18} />
              </button>
              <a
                className={`ai-icon-button ${generatedImage ? '' : 'disabled'}`}
                href={generatedImage ?? undefined}
                download="filestore-ai-image.png"
                aria-label="下载图片"
              >
                <Download size={18} />
              </a>
            </div>
          </div>

          <div className="ai-canvas">
            {generatedImage ? (
              <img src={generatedImage} alt="AI 生成结果" />
            ) : (
              <div className="ai-empty-result">
                <ImagePlus size={38} />
                <span>{isGenerating ? '正在准备画面' : '等待生成'}</span>
              </div>
            )}
            {isGenerating && (
              <div className="ai-generation-overlay" role="status" aria-live="polite">
                <span className="ai-orbit-loader" />
                <strong>{GENERATION_STEPS[generationStep]}</strong>
                <small>请稍等，图片会在完成后自动显示</small>
                <span className="ai-loading-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            )}
          </div>
        </section>

        <form
          className="ai-composer-panel"
          onSubmit={(event) => {
            event.preventDefault()
            void handleGenerate()
          }}
        >
          <div className="ai-composer-main">
            <label className="ai-prompt-field">
              <span>描述内容</span>
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="例如：雨后的玻璃温室，桌上有一只蓝色陶瓷杯，清晨自然光，安静高级"
                rows={4}
              />
            </label>

            <div className="ai-composer-side">
              <button
                className={`ai-upload-zone ${referenceImage ? 'has-image' : ''}`}
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                {referenceImage ? (
                  <img src={referenceImage} alt="" />
                ) : (
                  <>
                    <UploadCloud size={21} />
                    <strong>参考图</strong>
                  </>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(event) => void handleReferenceChange(event.target.files)}
              />
              {referenceImage && (
                <div className="ai-reference-row">
                  <span>{referenceName}</span>
                  <button type="button" onClick={clearReference} aria-label="移除基础图片">
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="ai-composer-controls">
            <label className="ai-key-field">
              <span>API Key</span>
              <input
                className="ai-text-input"
                type="password"
                value={apiKey}
                placeholder="可留空，默认使用本地代理密钥"
                autoComplete="off"
                onChange={(event) => {
                  setApiKey(event.target.value)
                  persistApiKey(event.target.value)
                }}
              />
            </label>

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

          {referenceImage && <small className="ai-field-note">当前接口仅接收文字描述，参考图暂不上传到模型</small>}
          {error && <div className="ai-form-error">{error}</div>}

          <button className="ai-generate-button" type="submit" disabled={!canGenerate || isGenerating}>
            {isGenerating ? <Loader2 className="ai-spin" size={18} /> : <Sparkles size={18} />}
            {isGenerating ? GENERATION_STEPS[generationStep] : '生成图片'}
          </button>
        </form>
      </section>
    </main>
  )
}
