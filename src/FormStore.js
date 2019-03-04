import get from 'lodash.get'

export default class FormStore {
  constructor(store) {
    this.store = store
    this.forms = {}
  }

  getFormData(path) {
    return get(this.store.getState(), `${FormStore.PATH}.${path}`)
  }

  getForm(path) {
    return this.forms[path]
  }

  register(path, form) {
    this.forms[path] = form
  }

  unregister(path) {
    delete this.forms[path]
  }

  isRegistered(path) {
    return !!this.forms[path]
  }
}
