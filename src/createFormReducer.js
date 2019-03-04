/* eslint-disable max-len */
import get from 'lodash.get'
import set from 'lodash.set'
import assign from 'object.assign'
import { combineReducers } from 'redux'
import { combineActions, handleAction, handleActions } from 'redux-actions'
import createAsyncStateReducer from './helpers/createAsyncStateReducer'
import { immutableAssign, immutableDelete } from './helpers/utils'
import { CREATE, UPDATE, REMOVE, SUBMIT, SUBMIT_REQ, SUBMIT_TER } from './actionTypes'
import FormStore from './FormStore'

const createFormStateReducer = (UPDATE, SUBMIT, SUBMIT_REQ, SUBMIT_TER) => {
  const data = handleAction(
    UPDATE,
    {
      next(state, { payload: { data } }) {
        return immutableAssign(state, data)
      }
    },
    {}
  )

  const validation = handleAction(
    UPDATE,
    {
      next(state, { payload: { validation } }) {
        return immutableAssign(state, validation)
      }
    },
    {}
  )

  return combineReducers({ data, validation, ...createAsyncStateReducer(SUBMIT, SUBMIT_REQ, SUBMIT_TER) })
}

const formStateReducer = createFormStateReducer(UPDATE, SUBMIT, SUBMIT_REQ, SUBMIT_TER)

export default path => {
  FormStore.PATH = path
  return handleActions(
    {
      [CREATE]: (state, action) => {
        const { payload, meta } = action
        return immutableAssign(state, set({}, meta.path, assign(formStateReducer(undefined, action), payload)))
      },
      [REMOVE]: (state, { meta }) => immutableDelete(state, meta.path),
      [combineActions(UPDATE, SUBMIT, SUBMIT_REQ, SUBMIT_TER)]: (state, action) => {
        const { meta } = action
        const formState = get(state, meta.path)
        if (!formState) return state
        const nextFormState = formStateReducer(formState, action)
        return formState === nextFormState
          ? state
          : ((nextFormState.__replace__ = true), immutableAssign(state, set({}, meta.path, nextFormState)))
      }
    },
    {}
  )
}
