/* eslint-disable linebreak-style */
/**
 * 找出数组某区域最大最小值
 * @param {Array<number>} array
 * @param {number} start
 * @param {number} end
 */
function getMinMaxInRange(array, start, end) {
  let min = 0;
  let min1 = 0;
  let max = 0;
  let max1 = 0;
  let current;
  const step = parseInt((end - start) / 15, 10);

  for (let i = start; i < end; i += step) {
    current = array[i];
    if (current < min) {
      min1 = min;
      min = current;
    } else if (current > max) {
      max1 = max;
      max = current;
    }
  }

  return [(min + min1) / 2, (max + max1) / 2];
}

/**
 * 峰值取样
 * @param {number} width
 * @param {Float32Array} data
 * @return {Array<[number, number]>}
 */
export default function getPeaks(width, data) {
  const dataLength = data.length;
  const size = dataLength / width;
  let current = 0;
  const peaks = new Array(width);
  for (let i = 0; i < width; i += 1) {
    const start = ~~current;
    current += size;
    const end = ~~current;
    peaks[i] = getMinMaxInRange(data, start, end);
  }

  return peaks;
}
