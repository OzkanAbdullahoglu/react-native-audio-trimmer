/* eslint-disable linebreak-style */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Canvas from 'react-native-canvas';
import { PixelRatio,
  StyleSheet,
} from 'react-native';
import getPeaks from './Peaks';

const normalize = require('array-normalize');
const dpr = PixelRatio.get() || 1;

class Waver extends React.Component {
  /** @type {CanvasRenderingContext2D} */

    state = {
      peaks: null,
    };

    UNSAFE_componentWillMount() {
      this.setPeaks(this.props.audioBuffer.getChannelData(0));
    }

    /*
  componentDidMount() {
    /*const canvas = this.refs.canvas;
    const ctx = canvas.getContext('2d');
    this.ctx = ctx;
    this.repaint();
  }*/
  /*
    componentWillReceiveProps(nextProps) {
      if (this.props.audioBuffer !== nextProps.audioBuffer) {
        this.setPeaks(nextProps.audioBuffer);
      }
    }*/

    componentDidUpdate(prevProps) {
      if (prevProps.audioBuffer !== this.props.audioBuffer) {
        this.setPeaks(this.props.audioBuffer.getChannelData(0));
      }
    }

  setPeaks = (channelData) => {
    const peaks = getPeaks(this.props.width, channelData);
    this.setState({
      peaks,
    });
  }

handle = async (canvas) => {
  /* console.log('CAnvassssss', canvas)*/
  let ctx;
  if (canvas !== null) {
    ctx = await canvas.getContext('2d');
    this.repaint(ctx, canvas);
  }
}
  repaint = (ctx, canvas) => {
    canvas.width = this.props.width;
    canvas.height = this.props.height;
    const peaks = this.state.peaks;
    const count = peaks.length;
    const height = this.props.height;
    const centerY = this.props.height / 2;
    /* console.log(peaks);*/
    ctx.lineWidth = 2;
    /* ctx.clearRect(0, 0, canvas.width, canvas.height);*/
    const scaleY = (amplitude, ctxHeight) => {
      const range = 2;
      const offset = 1;
      return (ctxHeight) - (((amplitude + offset) * ctxHeight) / range);
    };

    for (let x = 0; x < count; x+=1) {
      ctx.beginPath();
      const [min, max] = peaks[x];
      /*  console.log(scaleY(max, canvas.height));*/
      ctx.strokeStyle = this.props.color1;
      ctx.moveTo(x + 0.5, scaleY(max, canvas.height) + 0, 5);
      ctx.lineTo(x, centerY);
      ctx.closePath();
      ctx.stroke();
    }

    // Loop backwards, drawing the lower half of the waveform
    for (let x = count - 1; x >= 0; x--) {
      const [min, max] = peaks[x];
      ctx.beginPath();
      ctx.strokeStyle = this.props.color2;
      ctx.moveTo(x, centerY);
      ctx.lineTo(x + 0.5, scaleY(min, canvas.height) - 0, 5);
      ctx.closePath();
      ctx.stroke();
    }

    /*
    for (let i = 0; i < count; i++) {
      const [min, max] = peaks[i];
      const x = i - 0.5;

      ctx.beginPath();
      ctx.strokeStyle = this.props.color1;
      ctx.moveTo(x, ((min + 1) * height) + 0.5);
      ctx.lineTo(x, centerY);
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = this.props.color2;
      ctx.moveTo(x, centerY);
      ctx.lineTo(x, ((max + 1) * height) + 0.5);
      ctx.stroke();
    }
  }*/
  }
  render() {
    return (
      <Canvas
        ref={this.handle}
        className={classnames('waveCanvas', this.props.className)}
        style={styles.canvas}
      />
    );
  }

  static defaultProps = {
    color1: '#2196f3',
    color2: '#ff5722',
  }

  static propTypes = {
    className: PropTypes.string,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    color1: PropTypes.string,
    color2: PropTypes.string,
  }
}

export default Waver;

const styles = StyleSheet.create({
  canvas: {
    marginTop: 15,
    position: 'absolute',
    zIndex: 5,
  },
});
