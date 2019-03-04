/* eslint-disable max-len */
import { get, set, unset, assign, merge, remove } from 'lodash'
import invariant from 'invariant'
import { bindActionCreators } from 'redux'
import { createAction } from 'redux-actions'
import { createSelector } from 'reselect'
import { autobind } from 'core-decorators'
import { CREATE, REMOVE } from './actionTypes'
import createUpdateAction from './createUpdateAction'
import createSubmitAction from './createSubmitAction'
import { isObject, isFunction, isPromise, immutableAssign, fillObject } from './helpers/utils'
import nextTick from './helpers/nextTick'

export default class Form {
  constructor(
    formStore,
    props,
    path,
    rules,
    initiator,
    preUpdateAction,
    preSubmitAction,
    updatePayloadFilter,
    submitPayloadFilter,
    dispatchToUpdate,
    dispatchToSubmit,
    options
  ) {
    this.formStore = formStore
    this.props = props
    this.path = path
    this.rules = rules
    this.initiator = initiator
    this.updatePayloadFilter = updatePayloadFilter
    this.submitPayloadFilter = submitPayloadFilter
    this.dispatchToUpdate = dispatchToUpdate
    this.dispatchToSubmit = dispatchToSubmit
    this.createAction = createAction(CREATE, null, () => ({ path }))
    this.removeAction = createAction(REMOVE, null, () => ({ path }))
    this.updateAction = createUpdateAction(null, () => ({ path }), preUpdateAction)
    this.submitAction = createSubmitAction(::this.getFormData, null, () => ({ path }), preSubmitAction)
    this.options = assign(this._getDefaultOptions(), options)
    this.connected = 0
    this.refs = {}
    this.fields = {}
    this._eventHandlers = {}
    this._updatePendingPromise = null
    this._pendingUpdates = []
    this._update = this.dispatchToUpdate
      ? this.dispatchToUpdate(this.formStore.store.dispatch)
      : bindActionCreators(this.updateAction, this.formStore.store.dispatch)
    this._submit = this.dispatchToSubmit
      ? this.dispatchToSubmit(this.formStore.store.dispatch)
      : bindActionCreators(this.submitAction, this.formStore.store.dispatch)
  }

  _getDefaultOptions() {
    return {
      autoDestroy: true
    }
  }

  register(field) {
    const path = field.path
    /* eslint-disable no-undef */
    if (process.env.NODE_ENV !== 'production') {
      /* eslint-enable no-undef */
      invariant(
        this.getFieldValue(path) !== undefined,
        `Form "${this.path}" doesn't have this "${path}" path, please check your initiator on CreateForm`
      )
    }

    if (this.fields[path]) {
      /* eslint-disable no-undef */
      if (process.env.NODE_ENV !== 'production') {
        /* eslint-enable no-undef */
        if (field.type !== 'radio' && field.type !== 'checkbox') {
          // eslint-disable-next-line no-console
          console.warn(
            `Form "${this.path}" has multiple field components for the same path "${path}",
            it is recommended to bind only one field (except radio and checkbox) for one path, please check your form render function`
          )
        }
      }

      if (Array.isArray(this.fields[path])) {
        this.fields[path].push(field)
      } else {
        this.fields[path] = [this.fields[path], field]
      }
    } else {
      this.fields[path] = field
    }

    return field
  }

  unregister(field) {
    const path = field.path
    if (Array.isArray(this.fields[path])) {
      remove(this.fields[path], val => val === field)
      if (!this.fields[path].length) delete this.fields[path]
    } else {
      delete this.fields[path]
    }
  }

  init() {
    const data = this.initiator(this.formStore.store.getState(), this.props)
    const refs = (this.refs = {})
    const findRefs = (data, path) => {
      for (let key in data) {
        if (data[key] instanceof Form) {
          const propPath = path ? `${path}.${key}` : key
          const ref = data[key]
          data[key] = `@[${ref.path}]`
          refs[propPath] = ref
        } else if (isObject(data[key]) && !Array.isArray(data[key])) {
          findRefs(data[key], path ? `${path}.${key}` : key)
        }
      }
    }
    findRefs(data)
    this.initSelector()
    return data
  }

  initSelector() {
    const refInputs = []
    const propPaths = []
    for (let [propPath, ref] of Object.entries(this.refs)) {
      refInputs.push(() => ref.getFormData())
      propPaths.push(propPath)
    }
    if (refInputs.length) {
      const inputs = refInputs.concat(() => this.getFormData())
      this.selector = createSelector(...inputs, (...args) => {
        let form = args.pop()
        for (let i = 0; i < args.length; i++) {
          const ref = args[i]
          const path = propPaths[i]
          form = immutableAssign(form, {
            data: set({}, path, ref.data),
            validation: set({}, path, ref.validation)
          })
        }
        return form
      })
    } else {
      this.selector = () => this.getFormData()
    }
  }

  @autobind
  reset() {
    const data = this.init()
    const formUpdate = { data, validation: { __replace__: true } }

    data.__replace__ = true

    this.trigger('reset')
    Object.values(this.refs).forEach(ref => ref.reset())
    this.update(formUpdate)
  }

  create() {
    const data = this.init()
    const validation = fillObject(data, { disabled: true })
    Object.keys(this.refs).forEach(propPath => set(validation, propPath, `@[${this.refs[propPath].path}]`))
    this.formStore.store.dispatch(this.createAction({ data, validation }))
  }

  destroy() {
    this.destroyed = true
    this.formStore.store.dispatch(this.removeAction())
  }

  @autobind
  _batchUpdate() {
    this._updatePendingPromise = null
    if (this._pendingUpdates.length) {
      const collectPaths = (obj, paths, prefix) => {
        for (let key in obj) {
          const path = prefix ? `${prefix}.${key}` : key
          if (isObject(obj[key]) && !Array.isArray(obj[key])) {
            collectPaths(obj[key], paths, path)
          } else {
            paths.push(path)
          }
        }
      }
      const updates = this._pendingUpdates.slice()
      this._pendingUpdates = []
      const formUpdate = merge({}, ...updates)

      if (formUpdate.data) {
        const paths = []
        collectPaths(formUpdate.data, paths)
        paths.forEach(path => {
          let field = this.getField(path)
          field = Array.isArray(field) ? field.slice() : field
          if (field) {
            nextTick(() => {
              field = Array.isArray(field) ? field[0] : field
              const validation = field.validate(get(formUpdate.data, path))
              validation && field.updateValidation(validation)
            })
          }
        })
      }

      this._update(formUpdate)
    }
  }

  _triggerBatchUpdate() {
    return new Promise(resolve =>
      nextTick(() => {
        this._batchUpdate()
        resolve()
      })
    )
  }

  @autobind
  update(path, { value, validation, force } = {}) {
    const { getState } = this.formStore.store
    let formUpdate
    const pushUpdate = formUpdate => {
      if (formUpdate === false || formUpdate === undefined) return

      if (formUpdate.data && force) {
        formUpdate.data.__force__ = true
      }

      if (formUpdate.validation && force) {
        formUpdate.validation.__force__ = true
      }

      this._pendingUpdates.push(formUpdate)
      if (!this._updatePendingPromise) {
        this._updatePendingPromise = this._triggerBatchUpdate()
      }
      return this._updatePendingPromise
    }

    if (arguments.length < 2) {
      formUpdate = path
    } else {
      if (value !== undefined) {
        formUpdate = { data: set({}, path, value) }
      }

      if (validation) {
        formUpdate = formUpdate || {}
        formUpdate.validation = set({}, path, validation)
      }
    }

    if (!formUpdate) return

    Object.keys(this.refs).forEach(propPath => {
      let refUpdates
      if (formUpdate.data) {
        const refDataUpdates = get(formUpdate.data, propPath)
        if (isObject(refDataUpdates)) {
          refUpdates = { data: refDataUpdates }
          unset(formUpdate.data, propPath)
        }
      }
      if (formUpdate.validation) {
        refUpdates = refUpdates || {}
        const refValidationUpdates = get(formUpdate.validation, propPath)
        if (isObject(refValidationUpdates)) {
          refUpdates.validation = refValidationUpdates
          unset(formUpdate.validation, propPath)
        }
      }
      if (refUpdates) {
        this.refs[propPath].update(refUpdates)
      }
    })

    if (formUpdate.data) {
      formUpdate = this.updatePayloadFilter(formUpdate, this.getFormData(), getState(), this.props)
      if (isPromise(formUpdate)) {
        return formUpdate.then(ret => pushUpdate(ret))
      }
    }

    return pushUpdate(formUpdate)
  }

  @autobind
  submit() {
    if (this._submitPendingPromise) return this._submitPendingPromise
    this.trigger('submit')
    this.validate()
    this._batchUpdate()
    const { getState } = this.formStore.store
    const refUpdates = { data: {}, validation: {} }
    const submitPayload = payload => {
      if (payload === false || payload === undefined) return
      this._submitPendingPromise = this._submit(payload, this.props).then(action => {
        this._submitPendingPromise = null
        return action
      })
      return this._submitPendingPromise
    }

    Object.keys(this.refs).forEach(propPath => {
      const refForm = this.refs[propPath].getFormData()
      set(refUpdates.data, propPath, refForm.data)
      set(refUpdates.validation, propPath, refForm.validation)
    })

    const form = immutableAssign(this.getFormData(), refUpdates)
    const payload = this.submitPayloadFilter(form, getState(), this.props)
    if (isPromise(payload)) {
      return payload.then(ret => submitPayload(ret))
    }
    return submitPayload(payload)
  }

  validate() {
    const validation = {}
    Object.keys(this.fields).forEach(fieldPath => {
      let field = this.fields[fieldPath]
      field = Array.isArray(field) ? field[0] : field
      if (field.isDisabled()) return
      const fieldValidation = field.validate()
      if (fieldValidation) {
        set(validation, fieldPath, fieldValidation)
      }
    })
    this.update({ validation })
    return validation
  }

  getFormData() {
    return this.formStore.getFormData(this.path)
  }

  getField(path) {
    return this.fields[path]
  }

  getFieldValidators(path) {
    if (isFunction(this.rules)) {
      this.rules = this.rules(this.formStore.store.getState)
    }
    return get(this.rules, path)
  }

  getFieldValue(path) {
    return get(this.getFormData().data, path)
  }

  getFieldValidation(path) {
    return get(this.getFormData().validation, path)
  }

  on(event, cb) {
    this._eventHandlers[event] = this._eventHandlers[event] || []
    this._eventHandlers[event].push(cb)
  }

  off(event, cb) {
    if (this._eventHandlers[event]) {
      const index = this._eventHandlers[event].indexOf(cb)
      if (~index) {
        this._eventHandlers[event].splice(index, 1)
      }
    }
  }

  trigger(event) {
    if (this._eventHandlers[event]) {
      const handlers = this._eventHandlers[event].slice()
      for (let i = 0; i < handlers.length; i++) {
        handlers[i]()
      }
    }
  }
}
