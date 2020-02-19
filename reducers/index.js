/* eslint-disable linebreak-style */
import { combineReducers } from 'redux';
import mainReducer, {
  selectors as mainSelectors,
  actions as mainActions,
  types as mainTypes,
} from './mainReducer';

const rootReducer = combineReducers({
  main: mainReducer,
  version: () => ({
    number: '0.0.1',
  }),
});

// MAIN SELECTORS
export const getDataURI = (store) =>
  mainSelectors.getDataURI(store.main);

export { mainActions, mainTypes };

export default rootReducer;
