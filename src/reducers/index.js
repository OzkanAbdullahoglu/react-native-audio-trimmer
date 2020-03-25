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
export const getModalVisiblity = (store) =>
  mainSelectors.getModalVisiblity(store.main);
export const getSelectedItems = (store) =>
  mainSelectors.getSelectedItems(store.main);
export const getTrimState = (store) =>
  mainSelectors.getTrimState(store.main);
export const getTrimModalState = (store) =>
  mainSelectors.getTrimModalState(store.main);
export const getTrimConfirmationModalState = (store) =>
  mainSelectors.getTrimConfirmationModalState(store.main);
export const getSoundStatus = (store) =>
  mainSelectors.getSoundStatus(store.main);
export const checkSelectedListItems = (store) => (checkedListItem: number) =>
  mainSelectors.checkSelectedListItems(store.main, checkedListItem);
export const getIsTrimmedBool = (store) => (fileId: string) =>
  mainSelectors.getIsTrimmedBool(store.main, fileId);
export const getIsAppendedStat = (store) => (fileId: string) =>
  mainSelectors.getIsAppendedStat(store.main, fileId);

export { mainActions, mainTypes };

export default rootReducer;
