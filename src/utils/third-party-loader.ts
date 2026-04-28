import config from '@/config'

const load = () => {
  appendScript(config.zwibblerUrl)
  configureRecaptcha()
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

function configureRecaptcha() {
  const script = document.createElement('script')
  // How this code snippet works:
  // This logic overwrites the default behavior of `grecaptcha.ready()` to
  // ensure that it can be safely called at any time. When `grecaptcha.ready()`
  // is called before reCAPTCHA is loaded, the callback function that is passed
  // by `grecaptcha.ready()` is enqueued for execution after reCAPTCHA is
  // loaded.
  script.textContent = `
    if(typeof grecaptcha === 'undefined') {
      grecaptcha = {
        ready: function(cb) {
          // window.__grecaptcha_cfg is a global variable that stores reCAPTCHA's
          // configuration. By default, any functions listed in its 'fns' property
          // are automatically executed when reCAPTCHA loads.
          const c = '___grecaptcha_cfg';
          window[c] = window[c] || {};
          (window[c]['fns'] = window[c]['fns'] || []).push(cb);
        }
      };
    }
  `
  document.head.appendChild(script)
  appendScript(
    `https://www.google.com/recaptcha/api.js?render=${config.googleRecaptchaKey}`
  )
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
