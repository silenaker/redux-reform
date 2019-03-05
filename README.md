# `createForm`

function createForm(options: object) : Component

| argument            | type                                                                                          | required                | default | description                                                                                                                                                                                                          |
| ------------------- | --------------------------------------------------------------------------------------------- | ----------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name                | string                                                                                        | yes (if no path option) | none    | The name of created form which could be referred by `ref`, e.g. `ref('SimpleForm')`.                                                                                                                                 |
| path                | string                                                                                        | yes (if no name option) | none    | The path of created form on `FormStore` in redux state, you can only spefify name option, because path could be automatically generated from name option.                                                            |
| initiator           | function (state: object, props: object): object                                               | yes                     | none    | Initiate the form data. Please note that the field path you referred in your form component must be in form data otherwise an error will throwed.                                                                    |
| rules               | object &#124; function (getState: function): object                                           | no                      | none    | Rules object structure is same as the form data initiated by initiator option which contains fields' validators.                                                                                                     |
| preUpdateAction     | function (payload: Payload): action                                                           | no                      | none    | The action returned by this actionCreator will be dispatched beforce update.                                                                                                                                         |
| submitAction        | function (payload: any &#124; FormData): action                                               | no                      | none    | The action will be dispatched by Form#submit method. if submitPayloadFilter option exists, the payload will be the result returned by submitPayloadFilter otherwise it's the form data return by Form#getFormData(). |
| updatePayloadFilter | function (payload: Payload, form: FormData, state: object, props: object): object             | no                      | none    | This function will filter the update payload and the result will be delivered to preUpdateAction and updateAction before update.                                                                                     |
| submitPayloadFilter | function (form: FormData, state: object, props: object): any                                  | no                      | none    | This function will filter the submit payload (the form data) and its result will be delivered to submitAction. you can return `false` or `undefined` to terminate this submission.                                   |
| dispatchToUpdate    | function (dispatch: function): function (payload: Payload): action                            | no                      | none    | This function is the low level api for customize the Form#update method.                                                                                                                                             |
| dispatchToSubmit    | function (dispatch: function): function (payload: any &#124; FormData, props: object): action | no                      | none    | This function is the low level api for customize the Form#submit method.                                                                                                                                             |
| autoDestroy         | boolean                                                                                       | no                      | true    | If automatically destroy the form state in redux when the form component destructed otherwise the intial form data will be restored from redux instead of calling initiator when the form component construct again. |

# `createFormReducer`

function createFormReducer(path: string): function

ruckus-form relies on redux to store its form data, validation and other state, so you need to combine the forms reducer to yours when create redux store.
e.g. `const rootReducer = combineReducers({ forms: createFormReducer('forms'), ... })`  
**note:** the path parameter must be same as your combined hook. e.g. "forms" above

# Form Wrapper Component

| property        | type                         | required | default | description                                                                                                |
| --------------- | ---------------------------- | -------- | ------- | ---------------------------------------------------------------------------------------------------------- |
| formInstance    | function (form: object): any | no       | none    | Used to obtain the inner form object to control updating or submitting behavior outside the form component |
| initialValidate | boolean                      | no       | true    | Indicate whether validate all the fields currently in this form component after form constructs            |

# Field Wrapper Component

| property        | type                                                                     | required | default                                | description                                                                                                                                                                                                                                                             |
| --------------- | ------------------------------------------------------------------------ | -------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id              | string                                                                   | yes      | none                                   | id will be set on wrapped control component                                                                                                                                                                                                                             |
| path            | string                                                                   | yes      | none                                   | the field path on form data you initiate by createForm initiator option                                                                                                                                                                                                 |
| className       | string                                                                   | no       | none                                   | ruckus-form will added "rks-field", "rks-field-${type}" if has type property, "invalid" if this field become invalid after being validated and the class name spefified by this property to wrapped control component                                                   |
| type            | string                                                                   | no       | none                                   | the type of wrapped control component, e.g. for input element, you need type property to indicate different input box. for other no-type controls, this property is optional                                                                                            |
| value           | any                                                                      | no       | none                                   | you can set value property explicitly to change the field to be controlled by yourself, the value will be synchronized back to form store(embedded in redux state)                                                                                                      |
| defaultValue    | any                                                                      | no       | none                                   | you can set defaultValue property to synchronize default value from component side back to form store when this field is being constructed.                                                                                                                             |
| valueType       | enum { string, number, bool, arrayOfstring, arrayOfnumber, arrayOfbool } | no       | none                                   | convert the string value from underlying controls to proper type when synchronize it to form store.                                                                                                                                                                     |
| onChange        | function (value: any): any                                               | no       | none                                   | when the value of wrapped control component has being changed, this property will be called on this changed value                                                                                                                                                       |
| validators      | array                                                                    | no       | none                                   | validators specified by this property will override the one contained by rules.                                                                                                                                                                                         |
| disabled        | boolean                                                                  | no       | none                                   | indicate this field is disabled and disabled state will be synchronized back to form store. when true, util functions `getValidationErrors` and `getSubmitPayload` will ignore this field.                                                                              |
| fixed           | boolean                                                                  | no       | none                                   | indicate this field value is fixed and fixed state will be synchronized back to form store. when true, only `getValidationErrors` will ignore this field.                                                                                                               |
| checked         | boolean                                                                  | no       | none                                   | same as value property but only for radio and checkbox input                                                                                                                                                                                                            |
| debounce        | number                                                                   | no       | none &#124; 200 only for text controls | waiting timeout when value changes synchronize back to form store                                                                                                                                                                                                       |
| autoCorrect     | boolean                                                                  | no       | none                                   | only for select control for case that automatically select the first option value and synchronize selected value back to form store when field value stored in form store is not in option list in form component. useful in cases that you have a dynamic option list. |
| initialValidate | boolean                                                                  | no       | none                                   | indicate if should validate the field value when this field constructed                                                                                                                                                                                                 |
| trim            | boolean                                                                  | no       | none                                   | indicate if trim field value when validate and submit                                                                                                                                                                                                                   |

**note:** other properties defined by your custom field component requirement.

# Form Component

| property | type     | required | default | description          |
| -------- | -------- | -------- | ------- | -------------------- |
| update   | function | no       | none    | Form#update function |
| submit   | function | no       | none    | Form#submit function |

**note** other properties defined by your Form component requirement.

# Field Component

## inner field components

- Input
- Select
- TextArea

## custom field components

### createFieldComponent

createFieldComponent(type: string | Component): Component

### custom Field Component

| property     | type                        | required | default | description                                  |
| ------------ | --------------------------- | -------- | ------- | -------------------------------------------- |
| value        | any                         | no       | none    | controlled value                             |
| defaultValue | any                         | no       | none    | default value for non-controlled scenario    |
| onChange     | function (value: any): void | no       | none    | trigger onChange function when value changed |

# Form

## update(payload: Payload | path: string, pathPayload?: PathPayload): action

## submit(): action

## validate(): validation

# Field

rarely use. No document here currently

# Utils

## `getValidationErrors`

function getValidationErrors(validation: validation): AggregatedValidation

this function will aggregate the form validation errors for non-disabled fields

## `getSubmitPayload`

automatically generate submit payload regard for validation disabled and fixed state, this function relies conventions that if you don't want to send a field to backend, you should destruct(destroy) its component instead of hiding that by css. please note all field component instances stayed in your form component currently will be catch and returned by this function because their disabled state are false

# Validators

## inner validators

- `required`
- `pattern`
- `excludePattern`
- `max`
- `maxInt`
- `min`
- `minInt`
- `limit`
- `limitInt`
- `maxLength`
- `minLength`
- `equal`
- `unequal`

## custom validators

### `createValidators`

# Appendix

## non-basis types

- **action** flux standard action created by redux-actions
- **validation** form validation which has same structure with form data, it contains all the FieldValidations

## custom types used by this document

    FormData {
      data: object,
      validation: validation
    }


    FieldValidation {
      valid: boolean,
      error: string | null,
      disabled: boolean, // disabled property on field component or constructing/destroying the field component can control this state, or you can use Form#update method to update this state directly, or modify the update payload in updatePayloadFilter
      fixed: boolean // fixed property on field component maps to this state, or you can use Form#update method to update this state directly, or modify the update payload in updatePayloadFilter
    }

    AggregatedValidation {
      valid: boolean,
      errors: Array<string>
    }

    Payload {
      data?: object,
      validation?: validation
    }

    PathPayload {
      value?: any,
      validation?: FieldValidation,
      force?: boolean // force updating the form (will trigger form component render function) even if the update value is same as current value store in form, default is false
    }
