import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  activeWorkspaceId: null,
}

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setActiveWorkspaceId: (state, action) => {
      state.activeWorkspaceId = action.payload
    },
  },
})

export const { setActiveWorkspaceId } = appSlice.actions
export default appSlice.reducer
