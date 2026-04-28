declare interface Window {
  grecaptcha: any
  gtag: any
  MathJax?: {
    typesetClear?: (elements?: (string | HTMLElement)[]) => void
    typesetPromise?: (
      elements?: (string | HTMLElement | null)[]
    ) => Promise<void>
  }
  newrelic: any
}
