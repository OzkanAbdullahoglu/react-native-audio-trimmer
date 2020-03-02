/* eslint-disable linebreak-style */
import createBuffer from 'audio-buffer-from';
import util from 'audio-buffer-utils';
import * as FileSystem from 'expo-file-system';
import format from 'audio-format';
const { decode, encode } = require('base64-arraybuffer');
const toWav = require('audiobuffer-to-wav');


let getAudioBuffer;
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
export const trimReady = (base64Str) => {
  const arrayBuffer = decode(base64Str);
  const audioBuffer = createBuffer(arrayBuffer, format.stringify(
    { type: 'int32', endianness: 'le', numberOfChannels: 2, sampleRate: 44100, bitDepth: 16 }
  ));
  getAudioBuffer = audioBuffer;
  return audioBuffer;
};

export const trimmedSound = async (fileData, start, end, fileUri) => {
  const arrayBufferTrim = decode(fileData);
  const audioBufferTrim = createBuffer(arrayBufferTrim, format.stringify(
    { type: 'int32', endianness: 'le', numberOfChannels: 2, sampleRate: 44100, bitDepth: 16 }
  ));
  const slicedBuffer = util.slice(audioBufferTrim, start, end);
  const slicedArrayBufferWav = toWav(slicedBuffer);
  /* const toArrayBuffer = pcm.toArrayBuffer(slicedBuffer,
    {
      channels: 2,
      sampleRate: 44100,
    }
  );*/
  const slicedBase64Str = encode(slicedArrayBufferWav);

  // we write sliced base64 str data back to the file

  return writeToTheFile(slicedBase64Str, fileUri);
};

export const concatSounds = (soundCurr, soundAppend, fileUri) => {
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
