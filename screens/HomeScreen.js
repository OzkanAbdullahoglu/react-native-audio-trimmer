import React from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Font from 'expo-font';
import * as Permissions from 'expo-permissions';
import { Icon } from 'react-native-elements';
import { Slider } from 'react-native';
import Trimmer from '../components/Trimmer';
import { mainActions, getDataURI } from '../reducers';
import { trimReady, trimmedSound } from '../utils/utils';

const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = Dimensions.get('window');
const BACKGROUND_COLOR = '#ffecec';
const DISABLED_OPACITY = 0.5;
const RATE_SCALE = 3.0;
// trim initials
/*
const initialLeftHandlePosition = 0;
const initialRightHandlePosition = 36000;
let maxTrimDuration = 60000;
const minimumTrimDuration = 10000;
const initialTotalDuration = 80000;*/

class HomeScreen extends React.Component {
  constructor(props) {
    super(props);
    this.recording = null;
    this.sound = null;
    this.isSeeking = false;
    this.shouldPlayAtEndOfSeek = false;
    this.state = {
      getRecordingPermission: false,
      isLoading: false,
      isTrimming: false,
      isTrimActive: false,
      isExecutionActive: false,
      isPlaybackAllowed: false,
      muted: false,
      soundPosition: null,
      soundDuration: null,
      recordingDuration: null,
      shouldPlay: false,
      isPlaying: false,
      isRecording: false,
      fontLoaded: false,
      shouldCorrectPitch: true,
      volume: 1.0,
      rate: 1.0,
      timeStampOffset: 100,
      trimmerLeftHandlePosition: 0,
      trimmerRightHandlePosition: 0,
      totalDuration: 0,
      maxTrimDuration: 0,
      minimumTrimDuration: 0,
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

  componentDidMount() {
    (async () => {
      try {
        await Font.loadAsync({
          'space-mono-regular': require('../assets/fonts/SpaceMono-Regular.ttf'),
        });
        this.setState({ fontLoaded: true });
      } catch (error) {
        console.log(error.message);
      }
    })();
    // uncomment to reset the store
    /* this.props.setDefault();*/
    this.askForPermissions();
  }

  onHandleChange = ({ leftPosition, rightPosition }) => {
    this.setState({
      trimmerRightHandlePosition: rightPosition,
      trimmerLeftHandlePosition: leftPosition,
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
      tintColor: '#ff4444',
      trackBackgroundColor: '#ffecec',
      trackBorderColor: '#ffecec',
    };
  }

  askForPermissions = async () => {
    const response = await Permissions.askAsync(Permissions.AUDIO_RECORDING);
    this.setState({
      getRecordingPermission: response.status === 'granted',
    });
  };

  updateScreenForSoundStatus = (status) => {
    if (status.isLoaded) {
      this.setState({
        soundDuration: status.durationMillis,
        soundPosition: status.positionMillis,
        shouldPlay: status.shouldPlay,
        isPlaying: status.isPlaying,
        rate: status.rate,
        muted: status.isMuted,
        volume: status.volume,
        shouldCorrectPitch: status.shouldCorrectPitch,
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
      isTrimActive: false,
      isExecutionActive: false,
      timeStampOffset: 60,
    });
    if (this.sound !== null) {
      await this.sound.unloadAsync();
      this.sound.setOnPlaybackStatusUpdate(null);
      this.sound = null;
    }
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DUCK_OTHERS,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: true,
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

    this.setState({
      isLoading: true,
    });

    try {
      await this.recording.stopAndUnloadAsync();
      // get rocorded data info
      info = await FileSystem.getInfoAsync(this.recording.getURI());
      // reading data as base64 str
      info2 = await FileSystem.readAsStringAsync(info.uri, { encoding: FileSystem.EncodingType.Base64 });


      this.props.setDataURI(info);
      const totalDuration = Math.floor(trimReady(info2));

      this.setState({ totalDuration });
      this.setState({ maxTrimDuration: Math.floor((totalDuration * 2) / 3) });
      this.setState({ minimumTrimDuration: Math.floor(this.state.maxTrimDuration / 3) });

      this.setState({ trimmerRightHandlePosition: Math.floor(totalDuration / 2) });
      this.setState({ trimmerLeftHandlePosition: 0 });

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
      staysActiveInBackground: true,
    });

// right now I disabled play and pause button for debug purposes
// if you uncomment below block you have to disable above soundObcejt and its code block
    const { sound, status } = await this.recording.createNewLoadedSoundAsync(
      {
        isLooping: false,
        isMuted: this.state.muted,
        volume: this.state.volume,
        rate: this.state.rate,
        shouldCorrectPitch: this.state.shouldCorrectPitch,
      },
      this.updateScreenForSoundStatus,
    );
    this.toggleTrimActive();
     /* await this.sound.loadAsync();*/
    this.sound = sound;
    this.setState({
      isLoading: false,
    });
  }

  toggleTrim = async () => {
    const getTrimState = this.state.isTrimming;
    this.setState({ isTrimming: !getTrimState });
    this.setState({ timeStampOffset: 100 });
    this.toggleExecutionActive();
  }

  toggleTrimActive = async () => {
    const getActiveState = this.state.isTrimActive;

    this.setState({ isTrimActive: !getActiveState });
  }

  toggleExecutionActive = () => {
    const getExecutionState = this.state.isExecutionActive;
    this.setState({ isExecutionActive: !getExecutionState });
  }


  trimExecution = async () => {
    const { trimmerLeftHandlePosition, trimmerRightHandlePosition, soundDuration } = this.state;
    this.setState({ isLoading: true });
    await trimmedSound(trimmerLeftHandlePosition, trimmerRightHandlePosition, soundDuration);
    await this.sound.unloadAsync();
    const { isData } = this.props;

    try {
      await this.sound.loadAsync({ uri: isData[isData.length - 1].uri });
      this.setState({ isLoading: false });
      /* await soundObject.playAsync();*/
    } catch (error) {
      console.warn(error);
    }
  }

  onRecordPressed = async () => {
    if (this.state.isRecording) {
      this.stopRecordingAndEnablePlayback();
    } else {
      this.stopPlaybackAndBeginRecording();
    }
  };

  onPlayPausePressed = () => {
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

  onVolumeSliderValueChange = (value) => {
    if (this.sound != null) {
      this.sound.setVolumeAsync(value);
    }
  };

  trySetRate = async (rate, shouldCorrectPitch) => {
    if (this.sound != null) {
      try {
        await this.sound.setRateAsync(rate, shouldCorrectPitch);
      } catch (error) {
        console(error);
      }
    }
  };

  onRateSliderSlidingComplete = async (value) => {
    this.trySetRate(value * RATE_SCALE, this.state.shouldCorrectPitch);
  };

  onPitchCorrectionPressed = async (value) => {
    this.trySetRate(this.state.rate, !this.state.shouldCorrectPitch);
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

  getRecordingTimestamp() {
    if (this.state.recordingDuration != null) {
      return `${this.getMMSSFromMillis(this.state.recordingDuration)}`;
    }
    return `${this.getMMSSFromMillis(0)}`;
  }

  render() {
    if (!this.state.fontLoaded) {
      return (
        <View style={styles.emptyContainer} />
      );
    }

    if (!this.state.getRecordingPermission) {
      return (
        <View style={styles.container}>
          <View />
          <Text style={[styles.noPermissionsText, { fontFamily: 'space-mono-regular' }]}>
            You must enable audio recording permissions in order to use this app.
                </Text>
          <View />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <View
          style={[
            styles.oneThirdScreenContainer,
            {
              opacity: this.state.isLoading ? DISABLED_OPACITY : 1.0,
            },
          ]}
        >
          <View />
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
                    color="#f50"
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
                color="#f50"
                size={48}
                disabled={this.state.isLoading}
                onPress={this.onRecordPressed}
              />)
  }
              <View />
            </View>
            <View />
          </View>
          <View />
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
                  color="#f50"
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
                  color="#f50"
                  disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
                  onPress={this.trimExecution}
                />
              </View>
        ) : null}
            <View>
              <Text style={[styles.playbackTimestamp, { fontFamily: 'space-mono-regular', top: this.state.timeStampOffset }]}>
                {this.getPlaybackTimestamp()}
              </Text>
            </View>
          </View>
          <View style={[styles.buttonsContainerBase, styles.buttonsContainerTopRow]}>
            <View style={styles.volumeContainer}>
              {this.state.muted ? (
                <Icon
                  raised
                  name="volume-off"
                  type="font-awesome"
                  color="#f50"
                  disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
                  onPress={this.onMutePressed}
                />
                ) : (
                  <Icon
                    raised
                    name="volume-up"
                    type="font-awesome"
                    color="#f50"
                    disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
                    onPress={this.onMutePressed}
                  />
                )}
              <Slider
                style={styles.volumeSlider}
                value={1}
                onValueChange={this.onVolumeSliderValueChange}
                disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
              />
            </View>
            <View style={styles.playStopContainer}>
              {this.state.isPlaying ? (
                <Icon
                  raised
                  name="pause"
                  type="font-awesome"
                  color="#f50"
                  disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
                  onPress={this.onPlayPausePressed}
                />
                ) : (
                  <Icon
                    raised
                    name="play"
                    type="font-awesome"
                    color="#f50"
                    disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
                    onPress={this.onPlayPausePressed}
                  />
                  )}
              <Icon
                raised
                name="stop"
                type="font-awesome"
                color="#f50"
                disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
                onPress={this.onStopPressed}
              />
            </View>
            <View />
          </View>
          <View style={[styles.buttonsContainerBase, styles.buttonsContainerBottomRow]}>
            <View >
              <Text style={[styles.timestamp, { fontFamily: 'space-mono-regular' }]}>Rate: </Text>
              <Slider
                style={styles.rateSlider}
                value={this.state.rate / RATE_SCALE}
                onSlidingComplete={this.onRateSliderSlidingComplete}
                disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
              />
            </View>
            <View style={styles.buttonsContainerBottomText}>
              <TouchableHighlight
                underlayColor="#f50"
                style={styles.wrapper}
                onPress={this.onPitchCorrectionPressed}
                disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
              >
                <Text style={[{ fontFamily: 'space-mono-regular', textDecorationLine: 'underline' }]}>
                Pitch C: {this.state.shouldCorrectPitch ? 'OK' : 'NOK!'}
                </Text>
              </TouchableHighlight>
            </View>
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
    minWidth: 300,
    maxWidth: 300,
  },
  recordingDataRowContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    paddingLeft: 20,
    fontSize: 20,
    height: 25,
  },
  playbackTimestamp: {
    position: 'absolute',
    textAlign: 'right',
    alignSelf: 'stretch',
    fontSize: 20,
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
  volumeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: DEVICE_WIDTH / 2.0,
    maxWidth: DEVICE_WIDTH / 2.0,
  },
  volumeSlider: {
    width: (DEVICE_WIDTH / 2.0) - 50,
  },
  rateSlider: {
    width: DEVICE_WIDTH / 2.0,
  },
});

const mapStateToProps = (store) => ({ isData: getDataURI(store) });

const withRedux = connect(
  mapStateToProps,
  { ...mainActions }
);

export default compose(withRedux)(HomeScreen);
