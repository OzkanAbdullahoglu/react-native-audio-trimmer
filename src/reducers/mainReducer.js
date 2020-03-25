/* eslint-disable linebreak-style */
import { includes } from 'ramda';

export const types = {
  RECORDED_DATA_URI: 'RECORDED_DATA_URI',
  MODIFY_FILE_URI: 'MODIFY_FILE_URI',
  SELECTED_ITEMS: 'SELECTED_ITEMS',
  SELECT_ALL: 'SELECT_ALL',
  ALL_IS_SELECTED: 'ALL_IS_SELECTED',
  MODAL_VISIBLE: 'MODAL_VISIBLE',
  TRIM_MODAL_VISIBLE: 'TRIM_MODAL_VISIBLE',
  TRIM_CONFIRMATION_MODAL_VISIBLE: 'TRIM_CONFIRMATION_MODAL_VISIBLE',
  TRIM_ACTIVE: 'TRIM_ACTIVE',
  SOUND_STATUS: 'SOUND_STATUS',
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
      isTrimmed: false,
      isAppended: false,
    },
  ],
  soundStatus: {
    isPlaybackAllowed: false,
    muted: false,
    soundPosition: null,
    soundDuration: null,
    shouldPlay: false,
    isPlaying: false,
    volume: 1.0,
    rate: 0.5,
  },
  itemSelected: [],
  allIsSelected: false,

  isVisible: {
    recordSaveFile: false,
    reRecordOptions: false,
  },
  isTrimModalVisible: false,
  isTrimConfirmationModalVisible: false,
  isTrimActive: false,
};

export default (state: State = INITIAL_STATE, action: Action) => {
  switch (action.type) {
    case types.RECORDED_DATA_URI:
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
            isTrimmed: action.isTrimmed,
            isAppended: action.isAppended,
          },
        ],
      };

    case types.SOUND_STATUS:
      return {
        ...state,
        soundStatus: {
          isPlaybackAllowed: action.isPlaybackAllowed,
          muted: action.muted,
          soundPosition: action.soundPosition,
          soundDuration: action.soundDuration,
          shouldPlay: action.shouldPlay,
          isPlaying: action.isPlaying,
          volume: action.volume,
          rate: action.rate,
        },
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
    case types.MODAL_VISIBLE:
      return {
        ...state,
        isVisible: {
          recordSaveFile: action.recordSaveFile,
          reRecordOptions: action.reRecordOptions,
        },
      };
    case types.TRIM_MODAL_VISIBLE:
      return {
        ...state,
        isTrimModalVisible: action.isTrimModalVisible,
      };
    case types.TRIM_CONFIRMATION_MODAL_VISIBLE:
      return {
        ...state,
        isTrimConfirmationModalVisible: action.isTrimConfirmationModalVisible,
      };
    case types.TRIM_ACTIVE:
      return {
        ...state,
        isTrimActive: action.isTrimActive,
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
    isTrimmed,
    isAppended,
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
    id: id || idFromUri,
    isTrimmed,
    isAppended,
  });
};

const setToggleModalVisibleSaveFile = () => (dispatch, getStore) => {
  const fileStore = getStore().main;
  const getBool = getModalVisiblity(fileStore);

  dispatch({
    type: types.MODAL_VISIBLE,
    recordSaveFile: !getBool.recordSaveFile,
    reRecordOptions: getBool.reRecordOptions,
  });
};
const setToggleModalVisibleReRecord = () => (dispatch, getStore) => {
  const fileStore = getStore().main;
  const getBool = getModalVisiblity(fileStore);

  dispatch({
    type: types.MODAL_VISIBLE,
    recordSaveFile: getBool.recordSaveFile,
    reRecordOptions: !getBool.reRecordOptions,
  });
};

const setToggleTrim = () => (dispatch, getStore) => {
  const fileStore = getStore().main;
  const getBool = getTrimState(fileStore);
  dispatch({
    type: types.TRIM_ACTIVE,
    isTrimActive: !getBool,
  });
};

const setToggleTrimModal = () => (dispatch, getStore) => {
  const fileStore = getStore().main;
  const getBool = getTrimModalState(fileStore);
  dispatch({
    type: types.TRIM_MODAL_VISIBLE,
    isTrimModalVisible: !getBool,
  });
};
const setToggleTrimConfirmationModal = () => (dispatch, getStore) => {
  const fileStore = getStore().main;
  const getBool = getTrimConfirmationModalState(fileStore);
  dispatch({
    type: types.TRIM_CONFIRMATION_MODAL_VISIBLE,
    isTrimConfirmationModalVisible: !getBool,
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
const setToggleIsTrimmed = (fileId) => (dispatch, getStore) => {
  const fileStore = getStore().main;
  const getData = getDataURI(fileStore);
  const getDataToModify = getData.filter((e) => e.id === fileId);
  const getDataToConcat = getData.filter((e) => e.id !== fileId);
  const getBool = getDataToModify[0].isTrimmed;
  getDataToModify[0].isTrimmed = !getBool;
  const modifiedData = getDataToModify.concat(getDataToConcat);
  dispatch({
    type: types.MODIFY_FILE_URI,
    dataURI: modifiedData,
  });
};
const setToggleIsAppended = (fileId) => (dispatch, getStore) => {
  const fileStore = getStore().main;
  const getData = getDataURI(fileStore);
  const getDataToModify = getData.filter((e) => e.id === fileId);
  const getDataToConcat = getData.filter((e) => e.id !== fileId);
  const getBool = getDataToModify[0].isAppended;
  getDataToModify[0].isAppended = !getBool;
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

const setSoundStatus = (status) => (dispatch) => {
  const {
    isMuted,
    durationMillis,
    positionMillis,
    shouldPlay,
    isPlaying,
    volume,
    rate,
  } = status;

  dispatch({
    type: types.SOUND_STATUS,
    isPlaybackAllowed: true,
    muted: isMuted,
    soundPosition: positionMillis,
    soundDuration: durationMillis,
    shouldPlay,
    isPlaying,
    volume,
    rate,
  });
};

const setDefaultSoundStatus = () => ({
  type: types.SOUND_STATUS,
  isPlaybackAllowed: false,
  soundPosition: null,
  soundDuration: null,
});


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
  setToggleIsTrimmed,
  setToggleIsAppended,
  setToggleModalVisibleSaveFile,
  setToggleModalVisibleReRecord,
  setToggleTrim,
  setToggleTrimModal,
  setToggleTrimConfirmationModal,
  setSoundStatus,
  setDefaultSoundStatus,

};

// SELECTORS
const getDataURI = (state) => state.dataURI;

const getSelectedItems = (state) => state.itemSelected;
const getModalVisiblity = (state) => state.isVisible;
const getAllIsSelectedBoolean = (state) => state.allIsSelected;
const getTrimState = (state) => state.isTrimActive;
const getTrimModalState = (state) => state.isTrimModalVisible;
const getTrimConfirmationModalState = (state) => state.isTrimConfirmationModalVisible;
const getSoundStatus = (state) => state.soundStatus;
const checkSelectedListItems = (state, checkedListItem) => {
  if (state.itemSelected.findIndex((item) => item === checkedListItem) > -1) {
    return '';
  }
  return '-outline';
};

const getIsTrimmedBool = (state, fileId) => {
  const getData = state.dataURI;
  const filterData = getData.filter((e) => e.id === fileId);
  const getBool = filterData[0].isTrimmed;
  return getBool;
};
const getIsAppendedStat = (state, fileId) => {
  const getData = state.dataURI;
  const filterData = getData.filter((e) => e.id === fileId);
  const getBool = filterData[0].isAppended;
  if(getBool === true) {
    return 'none';
  }
  return 'flex';
};

export const selectors = {
  getDataURI,
  checkSelectedListItems,
  getIsTrimmedBool,
  getIsAppendedStat,
  getAllIsSelectedBoolean,
  getSelectedItems,
  getModalVisiblity,
  getTrimState,
  getTrimModalState,
  getTrimConfirmationModalState,
  getSoundStatus,
};
