import createAction from './helpers/createAction'
import createUpdateActionTypes from './createUpdateActionTypes'

export default (payloadCreator, metaCreator ,preUpdateAction) =>
  createAction(null, payloadCreator, metaCreator,
    preUpdateAction ? (payload, updateAction) => dispatch => {
      dispatch(preUpdateAction(payload))
      dispatch(updateAction(payload))
    } : null,
    createUpdateActionTypes
  )