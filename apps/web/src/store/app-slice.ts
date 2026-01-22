import { createSlice, PayloadAction } from '@reduxjs/toolkit'

const initialState = {
  activeWorkspaceId: null as string | null,
}

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setActiveWorkspaceId: (state, action: PayloadAction<string | null>) => {
      state.activeWorkspaceId = action.payload
    },
  },
})

export const { setActiveWorkspaceId } = appSlice.actions
export default appSlice.reducer
