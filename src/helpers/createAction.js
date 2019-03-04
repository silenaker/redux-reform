import { createAction } from 'redux-actions'
import defaultCreateUpdateActionTypes from './createUpdateActionTypes'
import assign from 'object.assign'

export default (
  name,
  payloadCreator,
  metaCreator,
  action,
  createUpdateActionTypes = defaultCreateUpdateActionTypes
) => payload => dispatch => {
  const { UPDATE } = createUpdateActionTypes(name)
  const defaultAction = createAction(UPDATE, payloadCreator, function() {
    const meta = { sync: true }
    if (metaCreator) assign(meta, metaCreator.apply(null, arguments))
    return meta
  })
  if (!action) action = defaultAction
  return dispatch(action(payload, defaultAction))
}
