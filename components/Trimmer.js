/* eslint-disable linebreak-style */
import React from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  PanResponder,
  Animated,
  Slider } from 'react-native';
import * as Arrow from './Arrow';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CENTER_ON_LAYOUT = true;
const TRACK_PADDING_OFFSET = 10;
const HANDLE_WIDTHS = 30;
const TRACK_BACKGROUND_COLOR = '#f2f6f5';
const TRACK_BORDER_COLOR = '#c8dad3';
const TINT_COLOR = '#93b5b3';

export default class Trimmer extends React.Component {
  constructor(props) {
    super(props);
    this.initiateAnimator();
    this.state = { // this value means scrubbing is currently happening
      trimming: false, // this value means the handles are being moved                                        // the scale factor for the track
      trimmingLeftHandleValue: 0,
      trimmingRightHandleValue: 0,
      internalScrubbingPosition: 0,
    };
  }

  clamp = ({ value, min, max }) => Math.min(Math.max(value, min), max);

  initiateAnimator = () => {
    this.scaleTrackValue = new Animated.Value(0);
    this.lastDy = 0;
    /* this.trackPanResponder = this.createTrackPanResponder();*/
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
      this.handleRightHandlePressIn();
    },
    onPanResponderMove: (evt, gestureState) => {
      const {
        trimmerRightHandlePosition,
        totalDuration,
        minimumTrimDuration,
        maxTrimDuration,
      } = this.props;

      const calculatedTrimmerRightHandlePosition = (trimmerRightHandlePosition / totalDuration) * screenWidth;
      const newTrimmerRightHandlePosition = ((calculatedTrimmerRightHandlePosition + gestureState.dx) / screenWidth) * totalDuration;
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
      this.handleLeftHandlePressIn();
    },
    onPanResponderMove: (evt, gestureState) => {
      const {
        trimmerLeftHandlePosition,
        trimmerRightHandlePosition,
        totalDuration,
        minimumTrimDuration,
        maxTrimDuration,
      } = this.props;

      const calculatedTrimmerLeftHandlePosition = (trimmerLeftHandlePosition / totalDuration) * screenWidth;
      const newTrimmerLeftHandlePosition = ((calculatedTrimmerLeftHandlePosition + gestureState.dx) / screenWidth) * totalDuration;
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

  handleLeftHandlePressIn = () => {
    const { onLeftHandlePressIn } = this.props;
    onLeftHandlePressIn && onLeftHandlePressIn();
  }

  handleRightHandlePressIn = () => {
    const { onRightHandlePressIn } = this.props;
    onRightHandlePressIn && onRightHandlePressIn();
  }

  render() {
    const {
      maxTrimDuration,
      minimumTrimDuration,
      totalDuration,
      trimmerLeftHandlePosition,
      trimmerRightHandlePosition,
      trackBackgroundColor = TRACK_BACKGROUND_COLOR,
      trackBorderColor = TRACK_BORDER_COLOR,
      tintColor = TINT_COLOR,
      centerOnLayout = CENTER_ON_LAYOUT,
    } = this.props;

    // if(maxTrimDuration < trimmerRightHandlePosition - trimmerLeftHandlePosition) {
    //   console.error('maxTrimDuration is less than trimRightHandlePosition minus trimmerLeftHandlePosition', {
    //     minimumTrimDuration, trimmerRightHandlePosition, trimmerLeftHandlePosition
    //   })
    //   return null
    // }

    if (minimumTrimDuration > trimmerRightHandlePosition - trimmerLeftHandlePosition) {
      console.warn('minimumTrimDuration is less than trimRightHandlePosition minus trimmerLeftHandlePosition', {
        minimumTrimDuration, trimmerRightHandlePosition, trimmerLeftHandlePosition, diff :(trimmerRightHandlePosition - trimmerLeftHandlePosition)
      });
      return null;
    }

    const {
      trimming,
      trimmingLeftHandleValue,
      trimmingRightHandleValue,
    } = this.state;

    if (isNaN(screenWidth)) {
      console.warn('ERROR render() screenWidth !== number. screenWidth', screenWidth, ', trackScale', screenWidth, ', ', screenWidth);
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
    const actualTrimmerOffset = ((boundedLeftPosition / totalDuration) * screenWidth) + TRACK_PADDING_OFFSET + HANDLE_WIDTHS;
    const onLayoutHandler = centerOnLayout
      ? {
        onLayout: () => {
          const centerOffset = actualTrimmerOffset + (actualTrimmerWidth / 2) - (screenWidth / 2);
          this.scrollView.scrollTo({ x: centerOffset, y: 0, animated: false });
        },
      }
      : null;
    if (isNaN(actualTrimmerWidth)) {
      console.warn('ERROR render() actualTrimmerWidth !== number. boundedTrimTime', boundedTrimTime, ', totalDuration', totalDuration, ', screenWidth', screenWidth);
    }
    return (
      <View style={styles.root}>
        <View style={trackBackgroundStyles}>
          <Slider
            style={this.props.sliderStyle}
            value={this.props.value}
            onValueChange={this.props.onValueChange}
            onSlidingComplete={this.props.onSlidingComplete}
            disabled={this.props.disabled}
          />
        </View>
        <View
          {...this.leftHandlePanResponder.panHandlers} style={[
            styles.handle,
            styles.leftHandle,
            { backgroundColor: tintColor, left: actualTrimmerOffset - HANDLE_WIDTHS },
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
          <View style={[styles.selection, { backgroundColor: tintColor }]} />
        </View>
        <View
          {...this.rightHandlePanResponder.panHandlers} style={[
            styles.handle,
            styles.rightHandle,
            { backgroundColor: tintColor, left: actualTrimmerOffset + actualTrimmerWidth },
          ]}
        >
          <Arrow.Right />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    height: 50,
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
    backgroundColor: 'rgba(137,255,0,0.5);',
    borderWidth: 3,
    height: 50,
  },
  handle: {
    position: 'absolute',
    width: HANDLE_WIDTHS,
    height: 50,
    backgroundColor: TINT_COLOR,
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
  },
  hiddenMarker: {
    opacity: 0,
  },
});
