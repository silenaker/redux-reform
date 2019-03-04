function isNative(constructor) {
  return /native code/.test(constructor.toString())
}

const callbacks = []
let pending = false
let timerFunc

function nextTickHandler() {
  pending = false
  const copies = callbacks.slice(0)
  callbacks.length = 0
  for (let i = 0; i < copies.length; i++) {
    copies[i]()
  }
}

if (typeof Promise !== 'undefined' && isNative(Promise)) {
  timerFunc = () =>
    Promise.resolve()
      .then(nextTickHandler)
      .catch(err => console.error(err)) // eslint-disable-line no-console
} else if (
  typeof MutationObserver !== 'undefined' &&
  (isNative(MutationObserver) ||
    MutationObserver.toString() === '[object MutationObserverConstructor]')
) {
  var counter = 1
  var observer = new MutationObserver(nextTickHandler)
  var textNode = document.createTextNode(String(counter))
  observer.observe(textNode, {
    characterData: true
  })
  timerFunc = () => {
    counter = (counter + 1) % 2
    textNode.data = String(counter)
  }
} else {
  timerFunc = () => setTimeout(nextTickHandler, 0)
}

export default (cb, ctx) => {
  let _resolve
  callbacks.push(() => {
    if (cb) cb.call(ctx)
    if (_resolve) _resolve(ctx)
  })

  if (!pending) {
    pending = true
    timerFunc()
  }

  if (!cb && typeof Promise !== 'undefined') {
    return new Promise(resolve => (_resolve = resolve))
  }
}
