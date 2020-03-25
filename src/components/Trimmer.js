/* eslint-disable linebreak-style */
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  PanResponder,
  Slider } from 'react-native';
import PropTypes from 'prop-types';
import * as Arrow from './Arrow';
import { CommonStyles } from '../components/CommonStyles';
import { getMMSSFromMillis } from '../utils/helper';

const { width: screenWidth } = Dimensions.get('window');
const TRACK_PADDING_OFFSET = 10;
const HANDLE_WIDTHS = 35;
const TRACK_BACKGROUND_COLOR = '#f2f8f5';
const TRACK_BORDER_COLOR = '#c8dad3';
const TINT_COLOR = '#93b5b3';

export default class Trimmer extends React.Component {
  constructor(props) {
    super(props);
    this.initiateAnimator();
    this.state = {
      trimming: false,
      trimmingLeftHandleValue: 0,
      trimmingRightHandleValue: 0,
      leftTimeStamp: '',
      rightTimeStamp: '',
    };
  }

  componentDidMount() {
    const {
      trimmerLeftHandlePosition,
      trimmerRightHandlePosition,
    } = this.props;
    this.getRecordingTimestamp(trimmerLeftHandlePosition, 'left');
    this.getRecordingTimestamp(trimmerRightHandlePosition, 'right');
  }

  shouldComponentUpdate(nextProps, nextState) {
    const {
      trimming,
      trimmingLeftHandleValue,
      trimmingRightHandleValue,
      leftTimeStamp,
      rightTimeStamp,
    } = this.state;

    const {
      trimmerRightHandlePosition,
      trimmerLeftHandlePosition,
      totalDuration,
      minimumTrimDuration,
      maxTrimDuration,
      sliderStyle,
      value,
      disabled,
      onValueChange,
      onSlidingComplete,
    } = this.props;

    return (
      leftTimeStamp !== nextState.leftTimeStamp ||
      rightTimeStamp !== nextState.rightTimeStamp ||
      trimming !== nextState.trimming ||
      trimmingLeftHandleValue !== nextState.trimmingLeftHandleValue ||
      trimmingRightHandleValue !== nextState.trimmingRightHandleValue ||
      trimmerRightHandlePosition !== nextProps.trimmerRightHandlePosition ||
      trimmerLeftHandlePosition !== nextProps.trimmerLeftHandlePosition ||
      totalDuration !== nextProps.totalDuration ||
      minimumTrimDuration !== nextProps.minimumTrimDuration ||
      sliderStyle !== nextProps.sliderStyle ||
      value !== nextProps.value ||
      disabled !== nextProps.disabled ||
      onValueChange !== nextProps.onValueChange ||
      onSlidingComplete !== nextProps.onSlidingComplete ||
      maxTrimDuration !== nextProps.maxTrimDuration
    );
  }

  getRecordingTimestamp(position, side) {
    const constant = this.props.totalDuration / this.props.soundDuration;
    const convertedTime = `${getMMSSFromMillis(position / constant)}`;
    if (side === 'left') {
      this.setState({ leftTimeStamp: convertedTime });
    } else {
      this.setState({ rightTimeStamp: convertedTime });
    }
  }
  clamp = ({ value, min, max }) => Math.min(Math.max(value, min), max);

  initiateAnimator = () => {
    this.leftHandlePanResponder = this.createLeftHandlePanResponder();
    this.rightHandlePanResponder = this.createRightHandlePanResponder();
  }

  createRightHandlePanResponder = () => PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => true,
    onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => true,
    onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
    onPanResponderGrant: (evt, gestureState) => {
      this.setState({
        trimming: true,
        trimmingRightHandleValue: this.props.trimmerRightHandlePosition,
        trimmingLeftHandleValue: this.props.trimmerLeftHandlePosition,
      });
    },
    onPanResponderMove: (evt, gestureState) => {
      const {
        trimmerRightHandlePosition,
        totalDuration,
        minimumTrimDuration,
        maxTrimDuration,
      } = this.props;

      const calculatedTrimmerRightHandlePosition = (trimmerRightHandlePosition / totalDuration) * screenWidth;
      const newTrimmerRightHandlePosition =
       ((calculatedTrimmerRightHandlePosition + gestureState.dx) / screenWidth) * totalDuration;
      const lowerBound = minimumTrimDuration;
      const upperBound = totalDuration;
      const newBoundedTrimmerRightHandlePosition = this.clamp({
        value: newTrimmerRightHandlePosition,
        min: lowerBound,
        max: upperBound,
      });

      if (newBoundedTrimmerRightHandlePosition - this.state.trimmingLeftHandleValue >= maxTrimDuration) {
        this.setState({
          trimmingRightHandleValue: newBoundedTrimmerRightHandlePosition,
          trimmingLeftHandleValue: newBoundedTrimmerRightHandlePosition - maxTrimDuration,
        });
      } else if (newBoundedTrimmerRightHandlePosition - this.state.trimmingLeftHandleValue <= minimumTrimDuration) {
        this.setState({
          trimmingRightHandleValue: newBoundedTrimmerRightHandlePosition,
          trimmingLeftHandleValue: newBoundedTrimmerRightHandlePosition - minimumTrimDuration,
        });
      } else {
        this.setState({ trimmingRightHandleValue: newBoundedTrimmerRightHandlePosition });
      }
      this.getRecordingTimestamp(this.state.trimmingRightHandleValue, 'right');
      this.getRecordingTimestamp(this.state.trimmingLeftHandleValue, 'left');
    },
    onPanResponderRelease: (evt, gestureState) => {
      this.handleHandleSizeChange();
      this.setState({ trimming: false });
    },
    onPanResponderTerminationRequest: (evt, gestureState) => true,
    onShouldBlockNativeResponder: (evt, gestureState) => true,
  })

  createLeftHandlePanResponder = () => PanResponder.create({
    onStartShouldSetPanResponder: (evt, gestureState) => true,
    onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => true,
    onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
    onPanResponderGrant: (evt, gestureState) => {
      this.setState({
        trimming: true,
        trimmingRightHandleValue: this.props.trimmerRightHandlePosition,
        trimmingLeftHandleValue: this.props.trimmerLeftHandlePosition,
      });
    },
    onPanResponderMove: (evt, gestureState) => {
      const {
        trimmerLeftHandlePosition,
        totalDuration,
        minimumTrimDuration,
        maxTrimDuration,
      } = this.props;
      const calculatedTrimmerLeftHandlePosition = (trimmerLeftHandlePosition / totalDuration) * screenWidth;
      const newTrimmerLeftHandlePosition =
      ((calculatedTrimmerLeftHandlePosition + gestureState.dx) / screenWidth) * totalDuration;
      const lowerBound = 0;
      const upperBound = totalDuration - minimumTrimDuration;
      const newBoundedTrimmerLeftHandlePosition = this.clamp({
        value: newTrimmerLeftHandlePosition,
        min: lowerBound,
        max: upperBound,
      });
      if (this.state.trimmingRightHandleValue - newBoundedTrimmerLeftHandlePosition >= maxTrimDuration) {
        this.setState({
          trimmingRightHandleValue: newBoundedTrimmerLeftHandlePosition + maxTrimDuration,
          trimmingLeftHandleValue: newBoundedTrimmerLeftHandlePosition,
        });
      } else if (this.state.trimmingRightHandleValue - newBoundedTrimmerLeftHandlePosition <= minimumTrimDuration) {
        this.setState({
          trimmingRightHandleValue: newBoundedTrimmerLeftHandlePosition + minimumTrimDuration,
          trimmingLeftHandleValue: newBoundedTrimmerLeftHandlePosition,
        });
      } else {
        this.setState({ trimmingLeftHandleValue: newBoundedTrimmerLeftHandlePosition });
      }
      this.getRecordingTimestamp(this.state.trimmingRightHandleValue, 'right');
      this.getRecordingTimestamp(this.state.trimmingLeftHandleValue, 'left');
    },
    onPanResponderRelease: (evt, gestureState) => {
      this.handleHandleSizeChange();
      this.setState({ trimming: false });
    },
    onPanResponderTerminationRequest: (evt, gestureState) => true,
    onShouldBlockNativeResponder: (evt, gestureState) => true,
  })

  handleHandleSizeChange = () => {
    const { onHandleChange } = this.props;
    const { trimmingLeftHandleValue, trimmingRightHandleValue } = this.state;
    onHandleChange && onHandleChange({
      leftPosition: trimmingLeftHandleValue | 0,
      rightPosition: trimmingRightHandleValue | 0,
    });
  }
  render() {
    const {
      minimumTrimDuration,
      totalDuration,
      trimmerLeftHandlePosition,
      trimmerRightHandlePosition,
      trackBackgroundColor = TRACK_BACKGROUND_COLOR,
      trackBorderColor = TRACK_BORDER_COLOR,
      tintColor = TINT_COLOR,
    } = this.props;

    if (minimumTrimDuration > trimmerRightHandlePosition - trimmerLeftHandlePosition) {
      console.warn('minimumTrimDuration is less than trimRightHandlePosition minus trimmerLeftHandlePosition', {
        minimumTrimDuration,
        trimmerRightHandlePosition,
        trimmerLeftHandlePosition,
        diff: (trimmerRightHandlePosition - trimmerLeftHandlePosition),
      });
      return null;
    }

    const {
      trimming,
      trimmingLeftHandleValue,
      trimmingRightHandleValue,
    } = this.state;

    if (isNaN(screenWidth)) {
      console.warn('ERROR render() screenWidth !== number. screenWidth',
        screenWidth, ', trackScale', screenWidth, ', ', screenWidth);
    }
    const trackBackgroundStyles = [
      styles.trackBackground,
      {
        width: screenWidth, backgroundColor: trackBackgroundColor, borderColor: trackBorderColor,
      }];

    const leftPosition = trimming ? trimmingLeftHandleValue : trimmerLeftHandlePosition;
    const rightPosition = trimming ? trimmingRightHandleValue : trimmerRightHandlePosition;
    const boundedLeftPosition = Math.max(leftPosition, 0);
    const boundedTrimTime = Math.max(rightPosition - boundedLeftPosition, 0);
    const actualTrimmerWidth = (boundedTrimTime / totalDuration) * screenWidth;
    const actualTrimmerOffset =
    ((boundedLeftPosition / totalDuration) * screenWidth) + TRACK_PADDING_OFFSET + HANDLE_WIDTHS;
    if (isNaN(actualTrimmerWidth)) {
      console.warn('ERROR render() actualTrimmerWidth !== number. boundedTrimTime',
        boundedTrimTime, ', totalDuration', totalDuration, ', screenWidth', screenWidth);
    }
    const scaleableFont = actualTrimmerWidth < 100 ? 12 : actualTrimmerWidth < 150 ? 15 : 20;
    const scaleableBottom = actualTrimmerWidth < 100 ? 100 : actualTrimmerWidth < 150 ? 110 : 115;
   

    const {
      sliderStyle,
      value,
      disabled,
      onValueChange,
      onSlidingComplete,
    } = this.props;

    return (
      <View style={styles.root}>
        <View style={trackBackgroundStyles}>
          <Slider
            style={sliderStyle}
            value={value}
            onValueChange={onValueChange}
            onSlidingComplete={onSlidingComplete}
            disabled={disabled}
          />
        </View>
        <View
          {...this.leftHandlePanResponder.panHandlers} style={[
            styles.handle,
            styles.leftHandle,
            { backgroundColor: tintColor, left: actualTrimmerOffset },
          ]}
        >
          <Arrow.Left />
        </View>
        <View
          style={[
            styles.trimmer,
            { width: actualTrimmerWidth, left: actualTrimmerOffset },
            { borderColor: tintColor },
          ]}
        >
          <Text
            style={[CommonStyles.recordingTimestamp,
              { fontFamily: 'brown-regular',
                position: 'absolute',
                bottom: scaleableBottom,
                fontSize: scaleableFont,
              }]}
          >

            {this.state.leftTimeStamp}
          </Text>
          <View style={[styles.scrubberTail, { backgroundColor: tintColor, left: -3 }]} />
          <View style={[styles.selection, { backgroundColor: tintColor }]} />
          <Text
            style={[CommonStyles.recordingTimestamp,
              {
                fontFamily: 'brown-regular',
                position: 'absolute',
                bottom: scaleableBottom,
                right: -1,
                fontSize: scaleableFont,
              }]}
          >
            { this.state.rightTimeStamp}
          </Text>
          <View style={[styles.scrubberTail, { backgroundColor: tintColor, right: -3 }]} />
        </View>
        <View
          {...this.rightHandlePanResponder.panHandlers} style={[
            styles.handle,
            styles.rightHandle,
            { backgroundColor: tintColor, left: (actualTrimmerOffset + actualTrimmerWidth) - HANDLE_WIDTHS },
          ]}
        >
          <Arrow.Right />
        </View>
      </View>
    );
  }
}

Trimmer.propTypes = {
  onHandleChange: PropTypes.func,
  sliderStyle: PropTypes.object,
  value: PropTypes.number,
  onValueChange: PropTypes.func,
  onSlidingComplete: PropTypes.func,
  trackBackgroundColor: PropTypes.string,
  trackBorderColor: PropTypes.string,
  tintColor: PropTypes.string,
  trimmerRightHandlePosition: PropTypes.number,
  totalDuration: PropTypes.number,
  soundDuration: PropTypes.number,
  trimmerLeftHandlePosition: PropTypes.number,
  minimumTrimDuration: PropTypes.number,
  maxTrimDuration: PropTypes.number,
  disabled: PropTypes.bool,
};

const styles = StyleSheet.create({
  root: {
    height: 50,
  },
  scrubberTail: {
    backgroundColor: TINT_COLOR,
    height: 110,
    width: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    position: 'absolute',
    bottom: 0,
  },
  trackBackground: {
    overflow: 'hidden',
    marginVertical: 20,
    backgroundColor: TRACK_BACKGROUND_COLOR,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: TRACK_BORDER_COLOR,
    height: 50,
    marginHorizontal: HANDLE_WIDTHS + TRACK_PADDING_OFFSET,
  },
  trimmer: {
    position: 'absolute',
    left: TRACK_PADDING_OFFSET,
    top: 17,
    borderColor: TINT_COLOR,
    backgroundColor: 'rgba(255,236,236,0.5)',
    borderWidth: 3,
    height: 53,
    marginTop: 60,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  handle: {
    position: 'absolute',
    width: HANDLE_WIDTHS,
    height: 53,
    backgroundColor: TINT_COLOR,
    marginTop: 60,
    zIndex: 1,
    marginBottom: 40,
    top: 17,
  },
  leftHandle: {
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  rightHandle: {
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  selection: {
    opacity: 0.2,
    backgroundColor: TINT_COLOR,
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  hiddenMarker: {
    opacity: 0,
  },
});
