/* eslint-disable max-len */
import get from 'lodash.get'
import set from 'lodash.set'
import unset from 'lodash.unset'
import { bindActionCreators } from 'redux'
import { createAction } from 'redux-actions'
import { createSelector } from 'reselect'
import { autobind } from 'core-decorators'
import { CREATE, REMOVE } from './actionTypes'
import createUpdateAction from './createUpdateAction'
import createSubmitAction from './createSubmitAction'
import { isObject, isFunction, fillObject, immutableAssign } from './helpers/utils'

export default class Form {
  constructor(
    formStore,
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
    this.submitAction = createSubmitAction(
      ::this.getFormData, null, () => ({ path }), preSubmitAction
    )
    this.options = Object.assign(this._getDefaultOptions(), options)
    this.connected = 0
    this.refs = {}
    this.fields = {}
  }

  _getDefaultOptions() {
    return {
      autoDestroy: true
    }
  }

  register(path, field) {
    return this.fields[path] = field
  }

  unregister(path) {
    const field = this.fields[path]
    delete this.fields[path]
    return field
  }

  init() {
    const data = this.initiator(this.formStore.store.getState())
    const refs = this.refs = {}
    const traverse = (target, path) => {
      for (let key in target) {
        if (target.hasOwnProperty(key)) {
          if (target[key] instanceof Form) {
            const propPath = path ? `${path}.${key}` : key
            const ref = target[key]
            target[key] = `@[${ref.path}]`
            refs[propPath] = ref
          } else if (isObject(target[key])) {
            traverse(target[key], path ? `${path}.${key}` : key)
          }
        } 
      }
    }
    traverse(data)
    const validation = fillObject(data, { valid: true, error: null })
    Object.keys(refs).forEach(propPath =>
      set(validation, propPath, `@[${refs[propPath].path}]`)
    )
    this.initSelector()
    return { data, validation }
  }

  initSelector() {
    const refInputs = [], propPaths = []
    for (let [ propPath, ref ] of Object.entries(this.refs)) {
      refInputs.push(() => ref.getFormData())
      propPaths.push(propPath)
    }
    if (refInputs.length) {
      const inputs = refInputs.concat(() => this.getFormData())
      this.selector = createSelector(...inputs, (...args) => {
        let form = args.pop()
        for (let i = 0; i < args.length; i++) {
          const ref = args[i], path = propPaths[i]
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

  reset() {
    const data = this.init()
    data.__replace__ = true
    this.update(data)
    Object.values(this.refs).forEach(ref => ref.reset())
  }

  create() {
    this.formStore.store.dispatch(this.createAction(this.init()))
  }

  destroy() {
    this.formStore.store.dispatch(this.removeAction())
  }

  @autobind
  update(path, { value, validation } = {}) {
    const { dispatch, getState } = this.formStore.store

    if (!this._update){
      if (this.dispatchToUpdate) {
        this._update = this.dispatchToUpdate(dispatch)
      } else {
        this._update = bindActionCreators(this.updateAction, dispatch)
      }
    }

    let formUpdates

    if (arguments.length < 2) {
      formUpdates = path
    }
    if (value !== undefined) {
      formUpdates = {
        data: set({}, path, value)
      }
    }
    if (validation) {
      formUpdates = formUpdates || {} 
      formUpdates.validation = set({}, path, validation)
    }

    if (!formUpdates) return

    Object.keys(this.refs).forEach(propPath => {
      let refUpdates
      if (formUpdates.data) {
        const refDataUpdates = get(formUpdates.data, propPath)
        if (isObject(refDataUpdates)) {
          refUpdates = { data: refDataUpdates }
          unset(formUpdates.data, propPath)
        }
      }
      if (formUpdates.validation) {
        refUpdates = refUpdates || {}
        const refValidationUpdates = get(formUpdates.validation, propPath)
        if (isObject(refValidationUpdates)) {
          refUpdates.validation = refValidationUpdates
          unset(formUpdates.validation, propPath)
        }
      }
      if (refUpdates) {
        this.refs[propPath].update(refUpdates)
      }
    })

    if (formUpdates.data) {
      formUpdates = this.updatePayloadFilter(formUpdates, this.getFormData(), getState())
    }

    this._update(formUpdates)
  }

  @autobind
  submit() {
    const { dispatch, getState } = this.formStore.store
    if (!this._submit) {
      if (this.dispatchToSubmit) {
        this._submit = this.dispatchToSubmit(dispatch)
      } else {
        this._submit = bindActionCreators(this.submitAction, dispatch)
      } 
    }

    const refUpdates = { data: {}, validation: {} }
    Object.keys(this.refs).forEach(propPath => {
      const refForm = this.refs[propPath].getFormData()
      set(refUpdates.data, propPath, refForm.data)
      set(refUpdates.validation, propPath, refForm.validation)
    })

    const form = immutableAssign(this.getFormData(), refUpdates)

    this._submit(this.submitPayloadFilter(form, getState()))
  }

  validate() {
    const validation = {} 
    Object.keys(this.fields).forEach(fieldPath => {
      const result = this.fields[fieldPath].validate()
      if (result) {
        const { valid, error } = result
        set(validation, fieldPath, { valid, error })
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
}