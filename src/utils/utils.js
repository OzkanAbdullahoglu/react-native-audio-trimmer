/* eslint-disable linebreak-style */
import createBuffer from 'audio-buffer-from';
import util from 'audio-buffer-utils';
import * as FileSystem from 'expo-file-system';
import format from 'audio-format';
import { today } from '../utils/helper';
import { store } from '../store';
import { actions } from '../reducers/mainReducer';
const { decode, encode } = require('base64-arraybuffer');
const toWav = require('audiobuffer-to-wav');

const writeToTheNewFile = async (writeStr, fileUri, duration, name) => {
  try {
    await FileSystem.writeAsStringAsync(
      fileUri,
      writeStr, {
        encoding: FileSystem.EncodingType.Base64,
      });
    await saveTrimmedFile(fileUri, duration, name);
  } catch (error) {
    console.warn(error);
  }
};

const writeToTheFile = async (writeStr, fileUri) => {
  try {
    await FileSystem.writeAsStringAsync(
      fileUri,
      writeStr, {
        encoding: FileSystem.EncodingType.Base64,
      });
  } catch (error) {
    console.warn(error);
  }
};

const saveTrimmedFile = async (fileUri, duration, name) => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    fileInfo.modificationDate = today;
    fileInfo.totalDuration = duration;
    fileInfo.name = name;
    fileInfo.id = uniqueID();
    fileInfo.isTrimmed = true;
    fileInfo.isAppended = true;
    store.dispatch(actions.setDataURI(fileInfo));
  } catch (error) {
    console.warn(error);
  }
};

export const trimReady = (base64Str) => {
  const decodeString = decode(base64Str);
  const audioBuffer = createBuffer(decodeString, format.stringify(
    { type: 'int32', endianness: 'le', numberOfChannels: 2, sampleRate: 44100, bitDepth: 16 }
  ));
  return audioBuffer;
};
export const trimmedSound = async (fileData, start, end, name) => {
  const decodeData = decode(fileData);
  const arrayBufferTrim = decodeData;
  const audioBufferTrim = createBuffer(arrayBufferTrim, 'int32 le mono 44100');
  const firstSegment = util.slice(audioBufferTrim, 0, start);
  const lastSegment = util.slice(audioBufferTrim, end, audioBufferTrim.length);
  const finalize = util.concat(firstSegment, lastSegment);
  const slicedBuffer = util.slice(audioBufferTrim, start, end);
  const slicedArrayBufferWav = toWav(slicedBuffer);
  const finalizeArrayBufferWav = toWav(finalize);
  const slicedBase64Str = encode(slicedArrayBufferWav);
  const finalizeStr = encode(finalizeArrayBufferWav);
  const duration = slicedBuffer.length;
  const newFileUri = `${FileSystem.documentDirectory}${name}.wav`;

  try {
    await writeToTheNewFile(slicedBase64Str, newFileUri, duration, name);
    return newFileUri;
  } catch (error) {
    console.warn(error);
  }
};

export const concatSounds = async (soundCurr, soundAppend, fileUri) => {
  const arrayBufferCurr = decode(soundCurr);
  const arrayBufferAppend = decode(soundAppend);
  const audioBufferCurr = createBuffer(arrayBufferCurr, format.stringify(
    { type: 'int32', endianness: 'le', numberOfChannels: 2, sampleRate: 44100, bitDepth: 16 }
  ));
  const audioBufferAppend = createBuffer(arrayBufferAppend, format.stringify(
    { type: 'int32', endianness: 'le', numberOfChannels: 2, sampleRate: 44100, bitDepth: 16 }
  ));
  const concatAudioBuffer = util.concat(audioBufferCurr, audioBufferAppend);
  const conAudioBuffToWav = toWav(concatAudioBuffer);
  const encodeConAudioBuffToWav = encode(conAudioBuffToWav);
  return writeToTheFile(encodeConAudioBuffToWav, fileUri);
};

const uniqueID = () => {
  const chr4 = () => Math.random().toString(16).slice(-4);
  return `${chr4() + chr4()
  }-${chr4()
  }-${chr4()
  }-${chr4()
  }-${chr4()}${chr4()}${chr4()}`;
};
