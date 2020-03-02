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
    number: '1.1.1',
  }),
});

// MAIN SELECTORS
export const getDataURI = (store) =>
  mainSelectors.getDataURI(store.main);
export const getAllIsSelectedBoolean = (store) =>
  mainSelectors.getAllIsSelectedBoolean(store.main);
export const getSelectedItems = (store) =>
  mainSelectors.getSelectedItems(store.main);
export const checkSelectedListItems = (store) => (checkedListItem: number) =>
  mainSelectors.checkSelectedListItems(store.main, checkedListItem);

export { mainActions, mainTypes };

export default rootReducer;
