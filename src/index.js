import createFieldComponent from './createFieldComponent'

export createForm from './createFormComponent'
export createFormReducer from './createFormReducer'
export getValidationErrors from './getValidationErrors'
export createValidator from './createValidator'
export ref from './ref'

export const Input = createFieldComponent('input')
export const Select = createFieldComponent('select')

export * from './validators'