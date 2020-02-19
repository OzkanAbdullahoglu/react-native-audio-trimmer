/* eslint-disable linebreak-style */
export const types = {
  RECORDED_DATA_URI: 'RECORDED_DATA_URI',
  DEFAULTS: 'DEFAULTS',
};

export const INITIAL_STATE: State = {
  dataURI: [
    {
      size: '',
      modificationTime: '',
      isDirectory: '',
      exists: false,
      uri: '',
      readString: '',
    },
  ],
};

export default (state: State = INITIAL_STATE, action: Action) => {
  switch (action.type) {
    case types.RECORDED_DATA_URI:
      return {
        ...state,
        dataURI: [
          ...state.dataURI,
          {
            size: action.size,
            modificationTime: action.modificationTime,
            isDirectory: action.isDirectory,
            exists: action.exists,
            uri: action.uri,
            readString: action.readString,
          },
        ],
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
    isDirectory,
    exists,
    uri,
    readString,
  } = data;

  dispatch({
    type: types.RECORDED_DATA_URI,
    size,
    modificationTime,
    isDirectory,
    exists,
    uri,
    readString,
  });
};


const setDefault = () => ({
  type: types.DEFAULTS,
});

export const actions = {
  setDataURI,
  setDefault,
};

// SELECTORS
const getDataURI = (state) => state.dataURI;

export const selectors = {
  getDataURI,
};
