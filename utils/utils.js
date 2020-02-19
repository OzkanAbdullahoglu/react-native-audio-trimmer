/* eslint-disable linebreak-style */
import createBuffer from 'audio-buffer-from';
import util from 'audio-buffer-utils';
import * as FileSystem from 'expo-file-system';
import format from 'audio-format';
import { store } from '../store';
const { decode, encode } = require('base64-arraybuffer');
const toWav = require('audiobuffer-to-wav');

const pcm = require('pcm-util');
let getAudioBuffer;
export const trimReady = (base64Str) => {
  const state = store.getState();
  const dataArr = state.main.dataURI;
  const fileURI = dataArr[dataArr.length - 1].uri;
  const arrayBuffer = decode(base64Str);

  const audioBuffer = createBuffer(arrayBuffer, format.stringify(
    { type: 'int32', endianness: 'le', numberOfChannels: 2, sampleRate: 44100, bitDepth: 16 }
  ));

  const toAudioBuffer = pcm.toAudioBuffer(arrayBuffer, 
    {
      channels: 2,
      sampleRate: 44100,
    }
  );

  getAudioBuffer = audioBuffer;
  return audioBuffer.length;
};

export const trimmedSound = async (start, end) => {
  const state = store.getState();
  const dataArr = state.main.dataURI;
  const slicedBuffer = util.slice(getAudioBuffer, start, end);
  const slicedArrayBufferWav = toWav(slicedBuffer);
  const toArrayBuffer = pcm.toArrayBuffer(slicedBuffer,
    {
      channels: 2,
      sampleRate: 44100,
    }
  );
  const slicedBase64Str = encode(slicedArrayBufferWav);

  // we write sliced base64 str data back to the file
  const writeToTheFile = async (writeStr) => {
    try {
         await FileSystem.writeAsStringAsync(
        dataArr[dataArr.length - 1].uri,
        writeStr, {
          encoding: FileSystem.EncodingType.Base64,
        });
    } catch (error) {
      console.warn(error);
    }
  };
  return writeToTheFile(slicedBase64Str);
};
