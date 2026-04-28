import config from '@/config'

const load = () => {
  appendScript(config.zwibblerUrl)
  configureMathJax()
  configureGTM()
}

export function loadThirdPartyScripts() {
  whenDocumentReady(() => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(load)
    } else {
      setTimeout(load, 10)
    }
  })
}

function whenDocumentReady(callback: () => void) {
  if (document.readyState === 'complete') {
    callback()
  } else {
    window.addEventListener('load', callback, { once: true })
  }
}

function appendScript(
  src: string,
  args: { integrity?: string; crossorigin?: string } = {}
) {
  const script = document.createElement('script')
  script.fetchPriority = 'low'
  script.src = src
  if (args.integrity) {
    script.integrity = args.integrity
  }
  if (args.crossorigin) {
    script.crossOrigin = args.crossorigin
  }
  script.defer = true
  document.head.appendChild(script)
}

function configureGTM() {
  const script = document.createElement('script')
  script.textContent = `
    window.dataLayer = window.dataLayer || []
    function gtag() {dataLayer.push(arguments)}
    gtag('js', new Date())
    gtag('config', 'G-2RLYC0VEES', {
      // We send the page view manually in router.
      send_page_view: false
    })
  `
  document.head.appendChild(script)
  appendScript('https://www.googletagmanager.com/gtag/js?id=G-2RLYC0VEES')
}

function configureMathJax() {
  const script = document.createElement('script')
  script.textContent = `
    window.MathJax = {
      output: {
        scale: 1.2,
      },
    }
  `
  document.head.appendChild(script)
  appendScript('https://cdn.jsdelivr.net/npm/mathjax@4.1.1/tex-chtml.js', {
    integrity:
      'sha384-8/IzH7C20FIP91bBUbmN23JwsmNckpAkZGjzGAxJzYajOczF8DfXQEwjsNpQXM7Q', //pragma: allowlist secret
    crossorigin: 'anonymous',
  })
}
