/* eslint-disable linebreak-style */
import { includes } from 'ramda';

export const types = {
  RECORDED_DATA_URI: 'RECORDED_DATA_URI',
  MODIFY_FILE_URI: 'MODIFY_FILE_URI',
  SELECTED_ITEMS: 'SELECTED_ITEMS',
  SELECT_ALL: 'SELECT_ALL',
  ALL_IS_SELECTED: 'ALL_IS_SELECTED',
  DEFAULTS: 'DEFAULTS',
};

export const INITIAL_STATE: State = {
  dataURI: [
    {
      name: '',
      size: '',
      modificationTime: '',
      isDirectory: '',
      exists: false,
      uri: '',
      readString: '',
      totalDuration: '',
      id: '',
    },
  ],
  itemSelected: [],
  allIsSelected: false,
};

export default (state: State = INITIAL_STATE, action: Action) => {
  switch (action.type) {
    case types.RECORDED_DATA_URI:

      if (state.dataURI[0].name.length) {
        return {
          ...state,
          dataURI: [
            ...state.dataURI,
            {
              id: action.id,
              name: action.name,
              size: action.size,
              modificationTime: action.modificationTime,
              isDirectory: action.isDirectory,
              exists: action.exists,
              uri: action.uri,
              readString: action.readString,
              totalDuration: action.totalDuration,
            },
          ],
        };
      }
      return {
        ...state,
        dataURI: [
          {
            id: action.id,
            name: action.name,
            size: action.size,
            modificationTime: action.modificationTime,
            isDirectory: action.isDirectory,
            exists: action.exists,
            uri: action.uri,
            readString: action.readString,
            totalDuration: action.totalDuration,
          },
        ],
      };
    case types.MODIFY_FILE_URI:
      return {
        ...state,
        dataURI: action.dataURI,
      };
    case types.SELECTED_ITEMS:
      if (typeof action.itemSelected === 'object') {
        return {
          ...state,
          itemSelected: action.itemSelected,
        };
      }
      return {
        ...state,
        itemSelected: [...state.itemSelected, action.itemSelected],
      };
    case types.SELECT_ALL:
      return {
        ...state,
        itemSelected: action.itemSelected,
      };
    case types.ALL_IS_SELECTED:
      return {
        ...state,
        allIsSelected: action.allIsSelected,
      };
    case types.DEFAULTS:
      return INITIAL_STATE;
    default:
      return state;
  }
};

// ACTIONS
const setDataURI = (data) => (dispatch) => {
  const {
    size,
    modificationTime,
    modificationDate,
    isDirectory,
    exists,
    uri,
    readString,
    name,
    id,
    totalDuration,
  } = data;

  const fileExtension = uri.slice(uri.lastIndexOf('.'));
  const defaultName = modificationDate.split(' ').join('_') + fileExtension;
  const idFromUri = uri.split('')
    .slice(uri.indexOf('recording') + 10, uri.length - 4)
    .join('');


  dispatch({
    type: types.RECORDED_DATA_URI,
    size,
    modificationTime,
    modificationDate,
    isDirectory,
    exists,
    uri,
    readString,
    totalDuration,
    name: name || defaultName,
    id: idFromUri,
  });
};

const setModifyFileData = (fileId, fileUri) => (dispatch, getStore) => {
  const fileStore = getStore().main;
  const getData = getDataURI(fileStore);
  const getDataToModify = getData.filter((e) => e.id === fileId);
  const getDataToConcat = getData.filter((e) => e.id !== fileId);
  getDataToModify[0].uri = fileUri;
  const modifiedData = getDataToModify.concat(getDataToConcat);
  dispatch({
    type: types.MODIFY_FILE_URI,
    dataURI: modifiedData,
  });
};
const setRemovalData = (fileId, fileUri) => (dispatch, getStore) => {
  const fileStore = getStore().main;
  const getData = getDataURI(fileStore);
  const getSeletectedItemsArray = getSelectedItems(fileStore);
  const getRestOfData = getData.filter((e) => !getSeletectedItemsArray.includes(e.id));
  dispatch({
    type: types.MODIFY_FILE_URI,
    dataURI: getRestOfData,
  });
};

const setSelectedItem = (itemSelectedData) => (dispatch, getStore) => {
  const fileStore = getStore().main;
  const getSeletectedItemsArray = getSelectedItems(fileStore);
  if (!includes(itemSelectedData, getSeletectedItemsArray)) {
    dispatch({
      type: types.SELECTED_ITEMS,
      itemSelected: itemSelectedData,
    });
  }
  if (includes(itemSelectedData, getSeletectedItemsArray)) {
    const trimUnselectedItemsArray = getSeletectedItemsArray.filter(
      (item) => item !== itemSelectedData
    );
    dispatch({
      type: types.SELECTED_ITEMS,
      itemSelected: trimUnselectedItemsArray,
    });
  }
};

const setSelectAll = () => (dispatch, getStore) => {
  const fileStore = getStore().main;
  const getData = getDataURI(fileStore);
  dispatch({
    type: types.SELECT_ALL,
    itemSelected: getData.map((e) => e.id),
  });
};
const setUnSelectAll = () => (dispatch, getStore) => {
  dispatch({
    type: types.SELECT_ALL,
    itemSelected: [],
  });
};
const setAllIsSelectedBoolean = () => (dispatch, getStore) => {
  const fileStore = getStore().main;
  const checkAllIsSelectedBoolean = getAllIsSelectedBoolean(fileStore);
  dispatch({
    type: types.ALL_IS_SELECTED,
    allIsSelected: !checkAllIsSelectedBoolean,
  });
};

const setDefault = () => ({
  type: types.DEFAULTS,
});

export const actions = {
  setDataURI,
  setModifyFileData,
  setDefault,
  setSelectedItem,
  setSelectAll,
  setUnSelectAll,
  setAllIsSelectedBoolean,
  setRemovalData,

};

// SELECTORS
const getDataURI = (state) => state.dataURI;
const getSelectedItems = (state) => state.itemSelected;
const getAllIsSelectedBoolean = (state) => state.allIsSelected;
const checkSelectedListItems = (state, checkedListItem) => {
  if (state.itemSelected.findIndex((item) => item === checkedListItem) > -1) {
    return '';
  }
  return '-outline';
};

export const selectors = {
  getDataURI,
  checkSelectedListItems,
  getAllIsSelectedBoolean,
  getSelectedItems,
};
