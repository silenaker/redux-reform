const ref = path =>
  ref._formStore &&
  (ref._formStore.getForm(path) || ref._formStore.getForm(`$$form(${path})`))

export default ref
