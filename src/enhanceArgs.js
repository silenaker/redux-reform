export default validator =>
  typeof validator() !== 'function'
    ? validator
    : (...args1) => (...args2) =>
        validator(
          ...args1.map(arg =>
            typeof arg === 'function' ? arg(...args2.slice(1)) : arg
          )
        )(...args2)
