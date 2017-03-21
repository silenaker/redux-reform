export default validator => typeof validator() !== 'function' ? validator :
  (...args) => (value, form) => {
    const _args = []
    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      if (typeof arg === 'function') {
        const value = arg(form)
        if (value === undefined) {
          return true
        } else {
          _args.push(value)
        }
      } else {
        _args.push(arg)
      }
    }
    return validator(..._args)(value, form)
  }