import createFieldComponent from './createFieldComponent'

export createForm from './createFormComponent'
export createFormReducer from './createFormReducer'
export getValidationErrors from './getValidationErrors'
export createValidator from './createValidator'
export getSubmitPayload from './getSubmitPayload'
export ref from './ref'

export { createFieldComponent }
export const Input = createFieldComponent('input')
export const Select = createFieldComponent('select')
export const TextArea = createFieldComponent('textarea')

export * from './validators'
export * from './getSubmitPayload'
