import { createSlice } from '@reduxjs/toolkit';

const userSlice = createSlice({
  name: 'user',
  initialState: { did: null, type: null },
  reducers: {
    setUser: (state, action) => {
      state.did = action.payload.did;
      state.type = action.payload.type;
    },
    clearUser: (state) => {
      state.did = null;
      state.type = null;
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;