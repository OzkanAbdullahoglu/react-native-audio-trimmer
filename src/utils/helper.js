/* eslint-disable linebreak-style */
export const getMMSSFromMillis = (millis) => {
  const totalSeconds = millis / 1000;
  const seconds = Math.floor(totalSeconds % 60);
  const minutes = Math.floor(totalSeconds / 60);
  const padWithZero = (number) => {
    const string = number.toString();
    if (number < 10) {
      return `0${string}`;
    }
    return string;
  };
  return `${padWithZero(minutes)}:${padWithZero(seconds)}`;
};
const objToday = new Date();
const dayOfMonth = today + (objToday.getDate() < 10) ? `0${objToday.getDate()}` : objToday.getDate();
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const curMonth = months[objToday.getMonth()];
const curYear = objToday.getFullYear();
const curHour =
objToday.getHours() > 12 ?
  objToday.getHours() - 12 :
  (objToday.getHours() < 10 ? `0${objToday.getHours()}` : objToday.getHours());
const curMinute = objToday.getMinutes() < 10 ? `0${objToday.getMinutes()}` : objToday.getMinutes();
const curSeconds = objToday.getSeconds() < 10 ? `0${objToday.getSeconds()}` : objToday.getSeconds();
const curMeridiem = objToday.getHours() > 12 ? 'PM' : 'AM';

export const today = `${curHour}:${curMinute} ${curMeridiem} ${dayOfMonth}_${curMonth}_${curYear}`;

export const allLetterNumber = (inputtxt) => {
  const letterNumber = /^[0-9a-zA-Z_.:;-]+$/;
  const letterNumberForMatches = /[0-9a-zA-Z_.:;-]/g;
  const matchedCharsArr = inputtxt.match(letterNumberForMatches);
  let illegals = '';
  if (matchedCharsArr === null) {
    illegals = inputtxt;
  } else {
    illegals = inputtxt.split('').filter((i) =>
      matchedCharsArr.indexOf(i) === -1
    );
  }
  if (inputtxt.match(letterNumber)) {
    return true;
  }
  return illegals;
};

export const getObjKey = (object, val) => {
  for (let [key, value] of Object.entries(object)) {
    if (value === val) {
      return key;
    }
  }
};
