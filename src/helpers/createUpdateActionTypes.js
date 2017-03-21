import { constantCase } from 'change-case'

export default name => ({ UPDATE: `UPDATE_${constantCase(name)}` })