import { isPromise } from './helpers/utils'
import createAsyncAction from './helpers/createAsyncAction'
import createSubmitActionTypes from './createSubmitActionTypes'

export default (selector, payloadCreator, metaCreator, preSubmitAction) =>
  createAsyncAction(null, selector, payloadCreator, metaCreator,
    preSubmitAction ? (payload, submitAction) => dispatch => {
      const action = dispatch(preSubmitAction(payload))
      if (isPromise(action)) {
        return action.then(({ error } = {}) => dispatch(
          Object.assign(submitAction(), { error })
        ))
      } else {
        return dispatch(
          Object.assign(submitAction(), { error: (action || {}).error })
        )
      }
    } : null,
    createSubmitActionTypes
  )