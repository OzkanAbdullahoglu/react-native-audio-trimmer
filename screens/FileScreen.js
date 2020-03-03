/* eslint-disable linebreak-style */
import React from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  Slider,
  Text,
  Animated,
} from 'react-native';
import { Icon } from 'react-native-elements';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { NavigationEvents } from 'react-navigation';
import PropTypes from 'prop-types';
import { mainActions, getDataURI } from '../reducers';
import Trimmer from '../components/Trimmer';
import { trimReady, trimmedSound, concatSounds } from '../utils/utils';
import CustomModal from '../components/CustomModal';

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = Dimensions.get('window');
const BACKGROUND_COLOR = '#faf7f7';
const DISABLED_OPACITY = 0.5;

class FileScreen extends React.Component {
    static navigationOptions = ({ navigation }) => {
      if (navigation.state.params.title.length > 24) {
        return ({
          title: `${(navigation.state.params.title).slice(1, 20)}...${(navigation.state.params.title).slice(-3)}`,
        });
      }
      return ({
        title: navigation.state.params.title,
      });
    };
    constructor(props) {
      super(props);
      this.recording = null;
      this.isSeeking = false;
      this.sound = null;
      this.shouldPlayAtEndOfSeek = false;
      this.animatedValue = new Animated.Value(0);
      this.state = {
        isVisible: false,
        isTrimModalVisible: false,
        isTrimming: false,
        isTrimActive: true,
        isExecutionActive: false,
        isPlaybackAllowed: false,
        muted: false,
        soundPosition: null,
        soundDuration: null,
        shouldPlay: false,
        isPlaying: false,
        volume: 1.0,
        timeStampOffset: 100,
        trimmerLeftHandlePosition: 0,
        trimmerRightHandlePosition: 0,
        totalDuration: 0,
        maxTrimDuration: 0,
        minimumTrimDuration: 0,
        isLoading: true,
        recordingOption: '',
      };

      this.recordingSettings = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MIN,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };
    }

    async componentDidMount() {
      console.log(this.props.navigation.state.params.title.length)
      await this.setTotalDuration();
      this.toggleTrimActive();
      await this.setSound();
    }


    shouldComponentUpdate(nextProps, nextState) {
      const {
        isVisible,
        isTrimming,
        isTrimActive,
        isExecutionActive,
        isPlaybackAllowed,
        muted,
        soundPosition,
        soundDuration,
        shouldPlay,
        isPlaying,
        volume,
        timeStampOffset,
        trimmerLeftHandlePosition,
        trimmerRightHandlePosition,
        totalDuration,
        maxTrimDuration,
        minimumTrimDuration,
        isLoading,
        recordingOption,
      } = this.state;

      const {
        totalDurationProp,
        title,
        data,
      } = this.props.navigation.state.params;

      return (
        isTrimming !== nextState.isTrimming ||
      isTrimActive !== nextState.isTrimActive ||
      isVisible !== nextState.isVisible ||
      isExecutionActive !== nextState.isExecutionActive ||
      isLoading !== nextState.isLoading ||
      isPlaybackAllowed !== nextState.isPlaybackAllowed ||
      muted !== nextState.muted ||
      soundPosition !== nextState.soundPosition ||
      shouldPlay !== nextState.shouldPlay ||
      trimmerLeftHandlePosition !== nextState.trimmerLeftHandlePosition ||
      soundDuration !== nextState.soundDuration ||
      isPlaying !== nextState.isPlaying ||
      trimmerRightHandlePosition !== nextState.trimmerRightHandlePosition ||
      totalDuration !== nextState.totalDuration ||
      timeStampOffset !== nextState.timeStampOffset ||
      volume !== nextState.volume ||
      maxTrimDuration !== nextState.maxTrimDuration ||
      recordingOption !== nextState.recordingOption ||
      minimumTrimDuration !== nextState.minimumTrimDuration ||
      totalDurationProp !== nextProps.totalDurationProp ||
      title !== nextProps.navigation.state.params.title ||
      data !== nextProps.navigation.state.params.data ||
      this.props.isData !== nextProps.isData
      );
    }

    onHandleChange = ({ leftPosition, rightPosition }) => {
      this.setState({
        trimmerRightHandlePosition: rightPosition,
        trimmerLeftHandlePosition: leftPosition,
      });
    }

    onRecordPressed = async () => {
      if (this.state.isRecording) {
        this.stopRecordingAndEnablePlayback();
      } else {
        this.toggleRecordModal();
      }
    };

    onPlayPausePressed = async () => {
      if (this.sound != null) {
        if (this.state.isPlaying) {
          this.sound.pauseAsync();
        } else {
          this.sound.playAsync();
        }
      }
    };

    onStopPressed = () => {
      if (this.sound != null) {
        this.sound.stopAsync();
      }
    };

    onMutePressed = () => {
      if (this.sound != null) {
        this.sound.setIsMutedAsync(!this.state.muted);
      }
    };
    onSeekSliderValueChange = (value) => {
      if (this.sound != null && !this.isSeeking) {
        this.isSeeking = true;
        this.shouldPlayAtEndOfSeek = this.state.shouldPlay;
        this.sound.pauseAsync();
      }
    };

    onSeekSliderSlidingComplete = async (value) => {
      if (this.sound != null) {
        this.isSeeking = false;
        const seekPosition = value * this.state.soundDuration;
        if (this.shouldPlayAtEndOfSeek) {
          this.sound.playFromPositionAsync(seekPosition);
        } else {
          this.sound.setPositionAsync(seekPosition);
        }
      }
    };
    onSeekSliderSlidingCompleteTrimmer = async (value) => {
      if (this.sound != null) {
        this.isSeeking = false;
        const seekPosition = value * this.state.totalDuration;
        if (this.shouldPlayAtEndOfSeek) {
          this.sound.playFromPositionAsync(seekPosition);
        } else {
          this.sound.setPositionAsync(seekPosition);
        }
      }
    };

  setTotalDuration = async () => {
    const { totalDurationProp } = this.props.navigation.state.params;
    this.setState({ totalDuration: totalDurationProp });
  }
  getSeekSliderPosition() {
    if (
      this.sound != null &&
            this.state.soundPosition != null &&
            this.state.soundDuration != null
    ) {
      return this.state.soundPosition / this.state.soundDuration;
    }
    return 0;
  }
  getSeekSliderPositionTrimmer() {
    if (
      this.sound != null &&
            this.state.soundPosition != null &&
            this.state.soundDuration != null
    ) {
      const constant = this.state.totalDuration / this.state.soundDuration;
      return (this.state.soundPosition === this.state.soundDuration ? 1 :
        ((this.state.soundPosition * constant) / this.state.totalDuration)
      );
    }
    return 0;
  }

  getMMSSFromMillis(millis) {
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
  }

  getRecordingTimestamp() {
    if (this.state.recordingDuration != null) {
      return `${this.getMMSSFromMillis(this.state.recordingDuration)}`;
    }
    return `${this.getMMSSFromMillis(0)}`;
  }

  getPlaybackTimestamp() {
    if (
      this.sound != null &&
            this.state.soundPosition != null &&
            this.state.soundDuration != null
    ) {
      return `${this.getMMSSFromMillis(this.state.soundPosition)} / ${this.getMMSSFromMillis(
        this.state.soundDuration
      )}`;
    }
    return '';
  }

    setSound = async () => {
      this.sound = new Audio.Sound();
      try {
        await this.sound.loadAsync(
          { uri: this.props.navigation.state.params.data.uri },
        );
        this.sound.setOnPlaybackStatusUpdate(
          this.updateScreenForSoundStatus,
        );
        this.setState({
          isLoading: false,
        });
      } catch (error) {
        console.warn(error);
      }
    }

  toggleRecordModal = () => {
    this.setState({ isVisible: !this.state.isVisible });
  }

  overwrite = () => {
    this.setState({ recordingOption: 'overwrite' });
    this.stopPlaybackAndBeginRecording();
    this.toggleAnimate();
    this.toggleRecordModal();
  };

  append = () => {
    this.setState({ recordingOption: 'append' });
    this.stopPlaybackAndBeginRecording();
    this.toggleAnimate();
    this.toggleRecordModal();
  };

  toggleAnimate = () => {
    Animated.loop(
      Animated.timing(this.animatedValue, {
        toValue: 300,
        duration: 3000,
      }),
      { iterations: 1 }
    ).start(() => {
      if (this.state.isRecording) {
        this.toggleAnimate();
      }
    });
  }

  trimmerProps = () => {
    const {
      trimmerLeftHandlePosition,
      trimmerRightHandlePosition,
      minimumTrimDuration,
      maxTrimDuration,
      totalDuration,
    } = this.state;

    return {
      onHandleChange: this.onHandleChange,
      totalDuration,
      trimmerLeftHandlePosition,
      trimmerRightHandlePosition,
      minimumTrimDuration,
      maxTrimDuration,
      maximumZoomLevel: 200,
      zoomMultiplier: 20,
      initialZoomValue: 2,
      scaleInOnInit: true,
      tintColor: '#e76477',
      trackBackgroundColor: '#ffecec',
      trackBorderColor: '#ffecec',
    };
  }

   toggleTrim = async () => {
     const getTrimState = this.state.isTrimming;
     this.setState({ isTrimming: !getTrimState });
     this.toggleExecutionActive();
   }

  toggleTrimActive = async () => {
    const maxTrimDuration = Math.floor((this.state.totalDuration) / 2);
    const minimumTrimDuration = Math.floor((this.state.totalDuration) / 5);
    const trimmerRightHandlePosition = Math.floor((this.state.totalDuration) / 3);
    this.setState({ minimumTrimDuration });
    this.setState({ maxTrimDuration });
    this.setState({ trimmerRightHandlePosition });
    this.setState({ trimmerLeftHandlePosition: 0 });
  }

  toggleExecutionActive = () => {
    const getExecutionState = this.state.isExecutionActive;
    this.setState({ isExecutionActive: !getExecutionState });
  }

  toggleTrimModal = () => {
    this.setState({ isTrimModalVisible: !this.state.isTrimModalVisible });
    if (!this.state.isTrimModalVisible && this.state.isTrimming) {
      this.toggleTrim();
    }
  }

  trimExecution = async () => {
    const { trimmerLeftHandlePosition, trimmerRightHandlePosition, soundDuration } = this.state;
    const fileUri = this.props.navigation.state.params.data.uri;
    const fileData = await FileSystem.readAsStringAsync(fileUri,
      { encoding: FileSystem.EncodingType.Base64 });
    await trimmedSound(fileData, trimmerLeftHandlePosition, trimmerRightHandlePosition, fileUri);
    await this.sound.unloadAsync();
    this.sound.setOnPlaybackStatusUpdate(null);
    try {
      await this.setSound();
      this.toggleTrim();
      this.toggleTrimModal();
    } catch (error) {
      console.warn(error);
    }
  }

  updateScreenForSoundStatus = (status) => {
    if (status.isLoaded) {
      this.setState({
        soundDuration: status.durationMillis,
        soundPosition: status.positionMillis,
        shouldPlay: status.shouldPlay,
        isPlaying: status.isPlaying,
        muted: status.isMuted,
        volume: status.volume,
        isPlaybackAllowed: true,
      });
    } else {
      this.setState({
        soundDuration: null,
        soundPosition: null,
        isPlaybackAllowed: false,
      });
      if (status.error) {
        console.log(`FATAL PLAYER ERROR: ${status.error}`);
      }
    }
  };

  updateScreenForRecordingStatus = (status) => {
    if (status.canRecord) {
      this.setState({
        isRecording: status.isRecording,
        recordingDuration: status.durationMillis,
      });
    } else if (status.isDoneRecording) {
      this.setState({
        isRecording: false,
        recordingDuration: status.durationMillis,
      });
      if (!this.state.isLoading) {
        this.stopRecordingAndEnablePlayback();
      }
    }
  };
  async stopPlaybackAndBeginRecording() {
    this.setState({
      isLoading: true,
      isTrimming: false,
      isTrimActive: true,
      isExecutionActive: false,
    });
    if (this.sound !== null) {
      await this.sound.unloadAsync();
      this.sound.setOnPlaybackStatusUpdate(null);
      /* this.sound = null;*/
    }
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true,
      playsInSilentLockedModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    });

    if (this.recording !== null) {
      this.recording.setOnRecordingStatusUpdate(null);
      this.recording = null;
    }

    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(this.recordingSettings);
    recording.setOnRecordingStatusUpdate(this.updateScreenForRecordingStatus);
    this.recording = recording;
    await this.recording.startAsync();
    this.setState({
      isLoading: false,
    });
  }

  async stopRecordingAndEnablePlayback() {
    let info;
    let info2;
    let info3;
    const fileUri = this.props.navigation.state.params.data.uri;
    const fileId = this.props.navigation.state.params.data.id;
    this.setState({
      isLoading: true,
    });
    try {
      await this.recording.stopAndUnloadAsync();
      // get rocorded data info
      info = await FileSystem.getInfoAsync(this.recording.getURI());
      // reading data as base64 str
      info2 = await FileSystem.readAsStringAsync(info.uri, { encoding: FileSystem.EncodingType.Base64 });
      info3 = await FileSystem.readAsStringAsync(fileUri,
        { encoding: FileSystem.EncodingType.Base64 });
      /* info.readString = info2;*/
      if (this.state.recordingOption === 'overwrite') {
        const totalDuration = trimReady(info2).length;
        this.setState({ totalDuration });
        this.toggleTrimActive();
        this.props.setModifyFileData(fileId, info.uri);
        this.setState({ recordingOption: '' });
      } else {
        const totalDuration = trimReady(info3).length + trimReady(info2).length;
        this.setState({ totalDuration });
        this.toggleTrimActive();
        concatSounds(info3, info2, fileUri);
        this.props.setModifyFileData(fileId, fileUri);
        this.setState({ recordingOption: '' });
      }

    // set data to the store
    } catch (error) {
      console.warn('READING', error);
    }
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
      playsInSilentModeIOS: true,
      playsInSilentLockedModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    });
    await this.setSound();
  }

  unloadSound = async () => {
    if (this.sound !== null) {
      await this.sound.unloadAsync();
      this.sound.setOnPlaybackStatusUpdate(null);
      /* this.sound = null;*/
    }
    await this.sound.unloadAsync();
  }

  render() {
    const interpolateColor = this.animatedValue.interpolate({
      inputRange: [0, 300],
      outputRange: ['rgb(247,210,215)', 'rgb(228,3,33)'],
    });

    const animatedStyle = {
      backgroundColor: interpolateColor,
    };
    return (

      <View style={styles.container}>
        <NavigationEvents onDidBlur={this.unloadSound} />
        {this.state.isRecording ? (
          <Animated.View style={[styles.recCircle, animatedStyle]} />
        ) : null}
        <View
          style={[
            styles.oneThirdScreenContainer,
            {
              opacity: this.state.isLoading ? DISABLED_OPACITY : 1.0,
            },
          ]}
        >
          <View />
          {
            this.state.isVisible && (
              <CustomModal
                visible={this.state.isVisible}
                headerTitle="Recording to the file?"
                inputDisplay="none"
                subTitleDisplay="none"
                fontSize={24}
                buttonThreeColor="#2196f3"
                onPressButtonOne={this.append}
                onPressButtonTwo={this.overwrite}
                onPressButtonThree={this.toggleRecordModal}
                buttonOneTitle="Append"
                buttonTwoTitle="Owerwrite"
                buttonThreeTitle="Cancel"
              />
            )
          }
          {
            this.state.isTrimModalVisible && (
              <CustomModal
                visible={this.state.isTrimModalVisible}
                headerTitle="Selected part will be removed!"
                inputDisplay="none"
                subTitleDisplay="none"
                buttonThreeDisplay="none"
                fontSize={24}
                onPressButtonOne={this.trimExecution}
                onPressButtonTwo={this.toggleTrimModal}
                buttonOneTitle="Confirm"
                buttonTwoTitle="Cancel"
              />
            )
          }
          <View style={styles.recordingContainer}>
            <View />
            <View style={styles.recordingDataContainer}>
              <View />
              {this.state.isRecording ? (
                <View style={styles.recordingDataRowContainer}>
                  <Icon
                    raised
                    name="circle"
                    type="font-awesome"
                    color="#e76477"
                    size={48}
                    onPress={this.onRecordPressed}
                  />
                  <Text style={[styles.recordingTimestamp, { fontFamily: 'space-mono-regular' }]}>
                    {this.getRecordingTimestamp()}
                  </Text>
                </View>
              ) : (<Icon
                raised
                name="microphone"
                type="font-awesome"
                color="#e76477"
                size={48}
                disabled={this.state.isLoading}
                onPress={this.onRecordPressed}
              />)
              }
              <View />
            </View>
            <View />
          </View>
        </View>
        <View
          style={[
            styles.twoThirdScreenContainer,
            {
              opacity:
                !this.state.isPlaybackAllowed || this.state.isLoading ? DISABLED_OPACITY : 1.0,
            },
          ]}
        >
          <View style={styles.playbackContainer}>
            <View>
              <Text
                style={[
                  styles.playbackTimestamp,
                  { fontFamily: 'space-mono-regular', top: this.state.timeStampOffset },
                ]}
              >
                {this.getPlaybackTimestamp()}
              </Text>
            </View>
            {this.state.isTrimming ? (
              <View>
                <Trimmer
                  {...this.trimmerProps()}
                  sliderStyle={styles.playbackSlider}
                  value={this.getSeekSliderPositionTrimmer()}
                  maximumValue={this.state.totalDuration}
                  onValueChange={this.onSeekSliderValueChange}
                  onSlidingComplete={this.onSeekSliderSlidingCompleteTrimmer}
                  disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
                />
              </View>
            ) : (
              <Slider
                style={styles.playbackSlider}
                value={this.getSeekSliderPosition()}
                maximumValue={this.soundDuration}
                onValueChange={this.onSeekSliderValueChange}
                onSlidingComplete={this.onSeekSliderSlidingComplete}
                disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
              />
            )}
            {this.state.isTrimActive ? (
              <View style={styles.trimButton}>
                <Icon
                  raised
                  name="cut"
                  type="font-awesome"
                  color="#e76477"
                  disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
                  onPress={this.toggleTrim}
                />
              </View>
            ) : null}
            {this.state.isTrimActive && this.state.isExecutionActive ? (
              <View style={styles.trimButton}>
                <Icon
                  raised
                  name="check-square"
                  type="font-awesome"
                  color="#e76477"
                  disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
                  onPress={this.toggleTrimModal}
                />
              </View>
            ) : null}
          </View>
          <View style={[styles.buttonsContainerBase, styles.buttonsContainerTopRow]}>
            <View style={styles.volumeContainer}>
              {this.state.muted ? (
                <Icon
                  raised
                  name="volume-off"
                  type="font-awesome"
                  color="#e76477"
                  disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
                  onPress={this.onMutePressed}
                />
              ) : (
                <Icon
                  raised
                  name="volume-up"
                  type="font-awesome"
                  color="#e76477"
                  disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
                  onPress={this.onMutePressed}
                />
              )}
            </View>
            <View style={styles.playStopContainer}>
              {this.state.isPlaying ? (
                <Icon
                  raised
                  name="pause"
                  type="font-awesome"
                  color="#e76477"
                  disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
                  onPress={this.onPlayPausePressed}
                />
              ) : (
                <Icon
                  raised
                  name="play"
                  type="font-awesome"
                  color="#e76477"
                  disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
                  onPress={this.onPlayPausePressed}
                />
              )}
              <Icon
                raised
                name="stop"
                type="font-awesome"
                color="#e76477"
                disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
                onPress={this.onStopPressed}
              />
            </View>
            <View />
          </View>
          <View />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  emptyContainer: {
    alignSelf: 'stretch',
    backgroundColor: BACKGROUND_COLOR,
  },
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: BACKGROUND_COLOR,
    minHeight: DEVICE_HEIGHT,
    maxHeight: DEVICE_HEIGHT,
  },
  recCircle: {
    flex: 1,
    position: 'absolute',
    top: 15,
    right: 15,
    height: 30,
    width: 30,
    borderRadius: 50,
  },
  noPermissionsText: {
    textAlign: 'center',
  },
  oneThirdScreenContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
    minHeight: DEVICE_HEIGHT / 3,
    maxHeight: DEVICE_HEIGHT / 3,
  },
  twoThirdScreenContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
    minHeight: (2 * DEVICE_HEIGHT) / 3,
    maxHeight: (2 * DEVICE_HEIGHT) / 3,
  },
  recordingContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
    minHeight: 100,
    maxHeight: 100,
  },
  recordingDataContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 100,
    maxHeight: 100,
    minWidth: DEVICE_HEIGHT / 2,
    maxWidth: DEVICE_HEIGHT / 2,
    marginBottom: 100,
  },
  recordingDataRowContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playbackContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
    minHeight: 50,
    maxHeight: 50,
    marginLeft: 5,
    marginRight: 5,
    paddingBottom: 50,
    paddingTop: 0,
  },
  playbackSlider: {
    marginLeft: 25,
    marginRight: 25,
    alignSelf: 'stretch',
  },
  trimButton: {
    top: 75,
    left: 5,
    position: 'absolute',
  },
  recordingTimestamp: {
    fontSize: 20,
    height: 25,
    color: '#e76477',
  },
  playbackTimestamp: {
    position: 'absolute',
    textAlign: 'center',
    fontSize: 20,
    color: '#e76477',
  },
  buttonsContainerBase: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 50,
  },
  buttonsContainerTopRow: {
    maxHeight: 60,
    alignSelf: 'stretch',
    paddingRight: 20,
  },
  buttonsContainerBottomRow: {
    maxHeight: 20,
    alignSelf: 'stretch',
    paddingRight: 20,
    paddingLeft: 20,
    marginTop: 5,
    position: 'absolute',
    top: 160,
  },
  buttonsContainerBottomText: {
    paddingLeft: 20,
  },
  playStopContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 70,
    maxWidth: 70,
  },
});

const mapStateToProps = (store) => ({ isData: getDataURI(store) });

const withRedux = connect(
  mapStateToProps,
  { ...mainActions }
);

export default compose(withRedux)(FileScreen);
