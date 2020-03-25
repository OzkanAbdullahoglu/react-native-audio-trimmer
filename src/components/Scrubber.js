/* eslint-disable linebreak-style */
import React from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  PanResponder,
  Animated,
} from 'react-native';
import PropTypes from 'prop-types';

const { width: screenWidth } = Dimensions.get('window');
const TRACK_BACKGROUND_COLOR = '#f2f6f5';
const TRACK_BORDER_COLOR = '#c8dad3';
const SCRUBBER_COLOR = '#63707e';

export default class Scrubber extends React.Component {
  constructor(props) {
    super(props);

    this.initiateAnimator();
    this.state = {
      scrubbing: false,
      newScrubberValue: 0,
    };
  }

    clamp = ({ value, min, max }) => Math.min(Math.max(value, min), max);

    initiateAnimator = () => {
      this.scaleTrackValue = new Animated.Value(0);
      this.lastDy = 0;
      this.scrubHandlePanResponder = this.createScrubHandlePanResponder();
    }

    createScrubHandlePanResponder = () => PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
      onPanResponderGrant: (evt, gestureState) => {
        this.setState({
          scrubbing: true,
          newScrubberValue: this.props.scrubberPosition,
        });
        this.handleScrubberPressIn();
      },
      onPanResponderMove: (evt, gestureState) => {
        const {
          scrubberPosition,
          totalDuration,
        } = this.props;
        const trackWidth = (screenWidth);
        const calculatedScrubberPosition = (scrubberPosition / totalDuration) * trackWidth;
        const newScrubberPosition = ((calculatedScrubberPosition + gestureState.dx) / trackWidth) * totalDuration;
        const lowerBound = 0;
        const upperBound = totalDuration;
        const newBoundedScrubberPosition = this.clamp({
          value: newScrubberPosition,
          min: lowerBound,
          max: upperBound,
        });
        this.setState({ newScrubberValue: newScrubberPosition });
      },

      onPanResponderRelease: (evt, gestureState) => {
        this.handleScrubbingValueChange(this.state.newScrubberValue);
        this.setState({ scrubbing: false });
      },
      onPanResponderTerminationRequest: (evt, gestureState) => true,
      onShouldBlockNativeResponder: (evt, gestureState) => true,
    })

    handleScrubbingValueChange = (newScrubPosition) => {
      const { onScrubbingComplete } = this.props;
      onScrubbingComplete && onScrubbingComplete(newScrubPosition | 0);
    }

    handleScrubberPressIn = () => {
      const { onScrubberPressIn } = this.props;
      onScrubberPressIn && onScrubberPressIn();
    }

    render() {
      const {
        totalDuration,
        scrubberPosition,
        trackBackgroundColor = TRACK_BACKGROUND_COLOR,
        trackBorderColor = TRACK_BORDER_COLOR,
        scrubberColor = SCRUBBER_COLOR,
      } = this.props;
      const trackWidth = screenWidth - 25;
      const trackBackgroundStyles = [
        styles.trackBackground,
        {
          width: trackWidth, backgroundColor: trackBackgroundColor, borderColor: trackBorderColor,
        }];
      const scrubPosition = scrubberPosition;
      const boundedLeftPosition = 0;
      const boundedScrubPosition = this.clamp({ value: scrubPosition, min: boundedLeftPosition, max: totalDuration });
      const actualScrubPosition = ((boundedScrubPosition / totalDuration) * trackWidth);

      return (
        <View style={styles.root}>
          <View style={trackBackgroundStyles}>
          </View>
          {
            typeof scrubberPosition === 'number' && typeof actualScrubPosition === 'number'
              ? (
                <View
                  style={[
                    styles.scrubberContainer,
                    { left: actualScrubPosition || 0 },
                  ]}
                  hitSlop={{ top: 28, bottom: 28, right: 28, left: 28 }}
                  {...this.scrubHandlePanResponder.panHandlers}
                >
                  <View
                    style={[styles.scrubberHead, { backgroundColor: scrubberColor }]}
                  />
                  <View style={[styles.scrubberTail, { backgroundColor: scrubberColor }]} />
                </View>
              )
              : null
          }
        </View>
      );
    }
}

Scrubber.propTypes = {
  onScrubbingComplete: PropTypes.func,
  onScrubberPressIn: PropTypes.func,
  trackBackgroundColor: PropTypes.string,
  trackBorderColor: PropTypes.string,
  scrubberColor: PropTypes.string,
  totalDuration: PropTypes.number,
  scrubberPosition: PropTypes.number,
};


const styles = StyleSheet.create({
  root: {
    height: 140,
  },
  horizontalScrollView: {
    height: 140,
    overflow: 'hidden',
    position: 'relative',
  },
  trackBackground: {
    overflow: 'hidden',
    marginVertical: 20,
    backgroundColor: TRACK_BACKGROUND_COLOR,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: TRACK_BORDER_COLOR,
    height: 70,
  },
  scrubberContainer: {
    zIndex: 2,
    position: 'absolute',
    width: 14,
    height: '100%',
    // justifyContent: 'center',
    alignItems: 'center',
  },
  scrubberHead: {
    position: 'absolute',
    backgroundColor: SCRUBBER_COLOR,
    width: 20,
    height: 20,
    top: 0,
    borderRadius: 50,
  },
  scrubberTail: {
    backgroundColor: SCRUBBER_COLOR,
    height: 100,
    width: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
});
