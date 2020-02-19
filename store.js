/* eslint-disable linebreak-style */
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { persistStore, persistReducer } from 'redux-persist';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';
import rootReducer from './reducers';
import ExpoFileSystemStorage from "redux-persist-expo-filesystem";

export const middlewares = [thunk];
const persistConfig = {
  key: 'root',
  storage: ExpoFileSystemStorage,
  timeout: 0,
  stateReconciler: autoMergeLevel2,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = createStore(
  persistedReducer,
  applyMiddleware(...middlewares)
);

const persistor = persistStore(store);

export { store, persistor };
