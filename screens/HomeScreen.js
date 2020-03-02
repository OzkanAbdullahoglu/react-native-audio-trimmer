/* eslint-disable linebreak-style */
import React from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  View,
  Animated,
} from 'react-native';

import { connect } from 'react-redux';
import { compose } from 'recompose';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Font from 'expo-font';
import * as Permissions from 'expo-permissions';
import { Icon } from 'react-native-elements';
import Scrubber from '../components/Scrubber';
import CustomModal from '../components/CustomModal';
import { mainActions, getDataURI } from '../reducers';
import { trimReady } from '../utils/utils';
import Waver from '../components/Waver';

const scrubInterval = 500;
const { width: DEVICE_WIDTH, height: DEVICE_HEIGHT } = Dimensions.get('window');
const gray1 = '#2196f3';
const gray2 = '#ff5722';
const BACKGROUND_COLOR = '#faf7f7';
const DISABLED_OPACITY = 0.5;
let info;
let audioBuffer;
let totalDuration;

class HomeScreen extends React.Component {
  static navigationOptions = {
    title: 'Recording',
  };
  constructor(props) {
    super(props);
    this.recording = null;
    this.sound = null;
    this.isSeeking = false;
    this.shouldPlayAtEndOfSeek = false;
    this.animatedValue = new Animated.Value(0);
    this.state = {
      getRecordingPermission: false,
      textInput: '',
      isVisible: false,
      isWave: false,
      isLoading: false,
      isPlaybackAllowed: false,
      muted: false,
      soundPosition: null,
      soundDuration: null,
      recordingDuration: null,
      shouldPlay: false,
      isPlaying: false,
      isRecording: false,
      fontLoaded: false,
      volume: 1.0,
      timeStampOffset: 100,
      totalDuration: 0,
      scrubberPosition: 0,
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
   /*  this.props.setDefault();*/
    this.askForPermissions();
  }

  shouldComponentUpdate(nextProps, nextState) {
    const {
      getRecordingPermission,
      textInput,
      isVisible,
      isWave,
      isLoading,
      isPlaybackAllowed,
      muted,
      soundPosition,
      soundDuration,
      recordingDuration,
      shouldPlay,
      isPlaying,
      isRecording,
      fontLoaded,
      volume,
      timeStampOffset,
      scrubberPosition,
    } = this.state;

    return (
      getRecordingPermission !== nextState.getRecordingPermission ||
      textInput !== nextState.textInput ||
      isVisible !== nextState.isVisible ||
      isWave !== nextState.isWave ||
      isLoading !== nextState.isLoading ||
      isPlaybackAllowed !== nextState.isPlaybackAllowed ||
      muted !== nextState.muted ||
      soundPosition !== nextState.soundPosition ||
      shouldPlay !== nextState.shouldPlay ||
      recordingDuration !== nextState.recordingDuration ||
      soundDuration !== nextState.soundDuration ||
      isPlaying !== nextState.isPlaying ||
      isRecording !== nextState.isRecording ||
      fontLoaded !== nextState.fontLoaded ||
      timeStampOffset !== nextState.timeStampOffset ||
      volume !== nextState.volume ||
      isWave !== nextState.isWave ||
      scrubberPosition !== nextState.scrubberPosition
    );
  }

  async componentDidUpdate(prevState) {
    if (prevState.scrubberPosition !== this.state.scrubberPosition) {
      if (this.state.scrubberPosition > this.state.soundDuration) {
        clearInterval(this.scrubberInterval);
        this.setState({ isPlaying: false, scrubberPosition: 0 });
        await this.sound.setPositionAsync(0);
        await this.sound.stopAsync(0);
      }
    }
  }

  onRecordPressed = async () => {
    if (this.state.isRecording) {
      this.stopRecordingAndEnablePlayback();
    } else {
      this.toggleAnimate();
      this.stopPlaybackAndBeginRecording();
    }
  };


  onPlayPausePressed = () => {
    if (this.sound != null) {
      if (this.state.isPlaying) {
        this.sound.pauseAsync();
        this.pauseScrubber();
      } else {
        this.playScrubber();
        this.sound.playAsync();
      }
    }
  };

  onBackPressed = async () => {
    if (this.sound != null) {
      await this.sound.stopAsync();
      await this.onSeekSliderSlidingComplete(0);
      this.stopScrubber();
    }
  };

  onMutePressed = () => {
    if (this.sound != null) {
      this.sound.setIsMutedAsync(!this.state.muted);
    }
  };

  onScrubbingComplete = async (newValue) => {
    this.setState({ isPlaying: false, scrubberPosition: newValue });
    await this.onSeekSliderValueChange();
    await this.onSeekSliderSlidingComplete(this.state.scrubberPosition);
  }

  onSeekSliderValueChange = async (value) => {
    if (this.sound != null && !this.isSeeking) {
      this.isSeeking = true;
      this.shouldPlayAtEndOfSeek = this.state.shouldPlay;
      this.sound.pauseAsync();
    }
  };

  onSeekSliderSlidingComplete = async (value) => {
    if (this.sound != null) {
      this.isSeeking = false;
      if (this.shouldPlayAtEndOfSeek) {
        this.sound.playFromPositionAsync(value);
      } else {
        this.sound.setPositionAsync(value);
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

  playScrubber = () => {
    this.setState({ isPlaying: true });
    this.scrubberInterval = setInterval(() => {
      this.setState({ scrubberPosition: this.state.scrubberPosition + scrubInterval });
    }, scrubInterval);
  }

  pauseScrubber = () => {
    clearInterval(this.scrubberInterval);
    this.setState({ isPlaying: false, scrubberPosition: this.state.scrubberPosition });
  }

  stopScrubber = () => {
    clearInterval(this.scrubberInterval);
    this.setState({ isPlaying: false, scrubberPosition: 0 });
  }

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

  askForPermissions = async () => {
    const response = await Permissions.askAsync(Permissions.AUDIO_RECORDING);
    this.setState({
      getRecordingPermission: response.status === 'granted',
    });
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
      isWave: false,
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
   
      const objToday = new Date();
      const dayOfMonth = today + (objToday.getDate() < 10) ? `0${objToday.getDate()}` : objToday.getDate();
      const months = new Array('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December');
      const curMonth = months[objToday.getMonth()];
      const curYear = objToday.getFullYear();
      const curHour = objToday.getHours() > 12 ? objToday.getHours() - 12 : (objToday.getHours() < 10 ? `0${objToday.getHours()}` : objToday.getHours());
      const curMinute = objToday.getMinutes() < 10 ? `0${objToday.getMinutes()}` : objToday.getMinutes();
      const curSeconds = objToday.getSeconds() < 10 ? `0${objToday.getSeconds()}` : objToday.getSeconds();
      const curMeridiem = objToday.getHours() > 12 ? 'PM' : 'AM';
      const today = `${curHour}:${curMinute} ${curMeridiem} ${dayOfMonth}/${curMonth}/${curYear}`;
      info.modificationDate = today;
      const fileExtension = info.uri.slice(info.uri.lastIndexOf('.'));
      const defaultName = info.modificationDate.split(' ').join('_') + fileExtension;

      this.setState({ textInput: defaultName });
      audioBuffer = trimReady(info2);
      totalDuration = audioBuffer.length;
      info.totalDuration = totalDuration;
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
    this.sound = sound;
    this.callModal();
    this.setState({
      isLoading: false,
    });
  }

  handleonChangeTextInput = (textInput) => this.setState({ textInput });
  cancelModal = () => {
    this.setState({ isVisible: false });
  }
  saveRecording = () => {
    info.name = this.state.textInput;
    this.props.setDataURI(info);
    this.setState({ isVisible: false });
    this.setState({ textInput: '' });
  }
  callModal = () => {
    this.setState({ isVisible: true });
  }

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
        isWave: true,
      });
    } else {
      this.setState({
        soundDuration: null,
        soundPosition: null,
        isPlaybackAllowed: false,
        isWave: false,
      });
      if (status.error) {
        console.log(`FATAL PLAYER ERROR: ${status.error}`);
      }
    }
  };

  render() {
    const {
      scrubberPosition,
      soundDuration,
    } = this.state;

    const interpolateColor = this.animatedValue.interpolate({
      inputRange: [0, 300],
      outputRange: ['rgb(247,210,215)', 'rgb(228,3,33)'],
    });

    const animatedStyle = {
      backgroundColor: interpolateColor,
    };

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
        {this.state.isRecording ? (
          <Animated.View style={[styles.recCircle, animatedStyle]} />
        ) : null }
        {
          this.state.isVisible && (
            <CustomModal
              visible={this.state.isVisible}
              value={this.state.textInput}
              headerTitle="File name for this recording"
              buttonThreeDisplay="none"
              subTitleDisplay="none"
              fontSize={36}
              onChangeText={this.handleonChangeTextInput}
              onPressButtonOne={this.saveRecording}
              onPressButtonTwo={this.cancelModal}
              buttonOneTitle="Save"
              buttonTwoTitle="Cancel"
            />
          )
        }
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
            <Text style={[styles.playbackTimestamp, { fontFamily: 'space-mono-regular' }]}>
              {this.getPlaybackTimestamp()}
            </Text>
            {this.state.isWave ? (
              <View style={styles.player}>
                <Scrubber
                  totalDuration={soundDuration}
                  scrubberColor="#e76477"
                  scrubberPosition={scrubberPosition}
                  onScrubbingComplete={this.onScrubbingComplete}
                />
                <View style={styles.clipper}>
                  <Waver
                    audioBuffer={audioBuffer}
                    width={DEVICE_WIDTH - 25}
                    height={DEVICE_HEIGHT - 580}
                    color1={gray1}
                    color2={gray2}
                    className={'waver'}
                  />
                </View>
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
            <View style={styles.backWardContainer}>
              <Icon
                raised
                name="backward"
                type="font-awesome"
                color="#e76477"
                disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
                onPress={this.onBackPressed}
              />
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
                  size={36}
                />
              ) : (
                <Icon
                  raised
                  name="play"
                  type="font-awesome"
                  color="#e76477"
                  disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
                  onPress={this.onPlayPausePressed}
                  size={36}
                />
              )}
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
  player: {
    position: 'absolute',
    height: 80,
    display: 'flex',
    shadowOpacity: 0.75,
    shadowRadius: 5,
    shadowColor: 'rgba(0, 0, 0, .1)',
    shadowOffset: { height: 0, width: 0 },
    marginTop: 30,
  },
  clipper: {
    flex: 1,
    position: 'absolute',
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
  recordingTimestamp: {
    fontSize: 20,
    height: 25,
    color: '#e76477',
  },
  playbackTimestamp: {
    position: 'absolute',
    top: 130,
    textAlign: 'center',
    fontSize: 20,
    color: '#e76477',
  },
  buttonsContainerBase: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  buttonsContainerTopRow: {
    maxHeight: 60,
    alignSelf: 'stretch',
    paddingRight: 20,
  },
  playStopContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
    maxWidth: 70,
  },
  backWardContainer: {
    position: 'absolute',
    left: 2,
    bottom: 2,
  },
  volumeContainer: {
    position: 'absolute',
    right: 2,
    bottom: 2,
  },
});

const mapStateToProps = (store) => ({ isData: getDataURI(store) });

const withRedux = connect(
  mapStateToProps,
  { ...mainActions }
);

export default compose(withRedux)(HomeScreen);
