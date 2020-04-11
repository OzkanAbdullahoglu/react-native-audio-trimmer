/* eslint-disable linebreak-style */
import React from 'react';
import { Dimensions, Text, View, Animated, Linking } from 'react-native';

import { connect } from 'react-redux';
import { compose } from 'recompose';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Permissions from 'expo-permissions';
import { NavigationEvents } from 'react-navigation';
import PropTypes from 'prop-types';
import Scrubber from '../components/Scrubber';
import CustomModal from '../components/CustomModal';
import { mainActions,
  getModalVisiblity,
  getSoundStatus,
  getDataURI,
} from '../reducers';
import { trimReady } from '../utils/utils';
import { getMMSSFromMillis, today } from '../utils/helper';
import Waver from '../components/Waver';
import { CommonStyles } from '../components/CommonStyles';
import Recording from '../components/Recording';
import PlayerButtons from '../components/PlayerButtons';
import CustomButton from '../components/CustomButton';

const scrubInterval = 500;
const { width: DEVICE_WIDTH } = Dimensions.get('window');
const gray1 = '#2196f3';
const gray2 = '#ff5722';
const DISABLED_OPACITY = 0.5;
const homeScreen = true;
let info;
let audioBuffer;
let totalDuration;

class RecordScreen extends React.Component {
  static navigationOptions = () => ({ title: 'Recording' });
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
      isWave: false,
      isLoading: false,
      recordingDuration: null,
      isRecording: false,
      fontLoaded: true,
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
        audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MEDIUM,
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
    // uncomment to reset the store
    /*  this.props.setDefault();*/
    this.askForPermissions();
    this.props.setPlayBackDefault();
  }

  shouldComponentUpdate(nextProps, nextState) {
    const {
      getRecordingPermission,
      textInput,
      isWave,
      isLoading,
      recordingDuration,
      isRecording,
      fontLoaded,
      timeStampOffset,
      scrubberPosition,
    } = this.state;

    const { isVisibleStatus, isData } = this.props;

    const {
      isPlaybackAllowed,
      muted,
      soundPosition,
      soundDuration,
      shouldPlay,
      isPlaying,
      volume,
    } = this.props.isSoundStatus;

    return (
      getRecordingPermission !== nextState.getRecordingPermission ||
      textInput !== nextState.textInput ||
      isVisibleStatus !== nextProps.isVisibleStatus ||
      isLoading !== nextState.isLoading ||
      recordingDuration !== nextState.recordingDuration ||
      isRecording !== nextState.isRecording ||
      fontLoaded !== nextState.fontLoaded ||
      timeStampOffset !== nextState.timeStampOffset ||
      isWave !== nextState.isWave ||
      isPlaybackAllowed !== nextProps.isSoundStatus.isPlaybackAllowed ||
      muted !== nextProps.isSoundStatus.muted ||
      soundPosition !== nextProps.isSoundStatus.soundPosition ||
      shouldPlay !== nextProps.isSoundStatus.shouldPlay ||
      soundDuration !== nextProps.isSoundStatus.soundDuration ||
      isPlaying !== nextProps.isSoundStatus.isPlaying ||
      volume !== nextProps.isSoundStatus.volume ||
      isData !== nextProps.isData ||
      scrubberPosition !== nextState.scrubberPosition
    );
  }

  async componentDidUpdate(prevProps, prevState) {
    if (prevState.scrubberPosition !== this.state.scrubberPosition
      || prevProps.isSoundStatus.soundDuration !== this.props.isSoundStatus.soundDuration) {
      if (
        this.state.scrubberPosition > this.props.isSoundStatus.soundDuration
      ) {
        clearInterval(this.scrubberInterval);
        this.props.isSoundStatus.isPlaying = false;
        this.setState({ scrubberPosition: 0 });
        if (this.sound !== null) {
          await this.sound.setPositionAsync(0);
          await this.sound.stopAsync(0);
        }
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
      if (this.props.isSoundStatus.isPlaying) {
        this.sound.pauseAsync();
        this.pauseScrubber();
      } else {
        if (this.state.isWave === false) {
          this.setState({ isWave: true });
        }
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
      this.sound.setIsMutedAsync(!this.props.isSoundStatus.muted);
    }
  };

  onScrubbingComplete = async (newValue) => {
    this.props.isSoundStatus.isPlaying = false;
    this.setState({ scrubberPosition: newValue });
    await this.onSeekSliderValueChange();
    await this.onSeekSliderSlidingComplete(this.state.scrubberPosition);
  };

  onSeekSliderValueChange = async () => {
    if (this.sound != null && !this.isSeeking) {
      this.isSeeking = true;
      this.shouldPlayAtEndOfSeek = this.props.isSoundStatus.shouldPlay;
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

  onDidBlur = async () => {
    if (this.sound !== null) {
      await this.sound.stopAsync();
      this.stopScrubber();
    }
    this.setState({ isWave: false });
  };

  setSound = async () => {
    const { isData } = this.props;
    if (isData.length !== 0) {
      this.sound = new Audio.Sound();
      try {
        const readCurrentURI = await FileSystem.readAsStringAsync(isData[0].uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        audioBuffer = trimReady(readCurrentURI);
        await this.sound.loadAsync({
          uri: isData[0].uri,
        });
        if (this.sound !== null) {
          this.sound.setOnPlaybackStatusUpdate(this.updateScreenForSoundStatus);
        }
        this.setState({
          isLoading: false,
        });
      } catch (error) {
        console.warn('RECORDSCREEN', error);
      }
    }
  };

  getSeekSliderPosition() {
    const { soundPosition, soundDuration } = this.props.isSoundStatus;
    if (this.sound != null && soundPosition != null && soundDuration != null) {
      return soundPosition / soundDuration;
    }
    return 0;
  }

  getRecordingTimestamp() {
    if (this.state.recordingDuration != null) {
      return `${getMMSSFromMillis(this.state.recordingDuration)}`;
    }
    return `${getMMSSFromMillis(0)}`;
  }

  getPlaybackTimestamp() {
    const { soundPosition, soundDuration } = this.props.isSoundStatus;
    if (this.sound != null && soundPosition != null && soundDuration != null) {
      return `${getMMSSFromMillis(soundPosition)} / ${getMMSSFromMillis(
        soundDuration
      )}`;
    }
    return '';
  }

  playScrubber = () => {
    this.props.isSoundStatus.isPlaying = true;
    this.scrubberInterval = setInterval(() => {
      this.setState({
        scrubberPosition: this.state.scrubberPosition + scrubInterval,
      });
    }, scrubInterval);
  };

  pauseScrubber = () => {
    clearInterval(this.scrubberInterval);
    this.props.isSoundStatus.isPlaying = false;
    this.setState({ scrubberPosition: this.state.scrubberPosition });
  };

  stopScrubber = () => {
    clearInterval(this.scrubberInterval);
    this.props.isSoundStatus.isPlaying = false;
    this.setState({ scrubberPosition: 0 });
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
  };

  askForPermissions = async () => {
    const response = await Permissions.askAsync(Permissions.AUDIO_RECORDING);
    this.setState({
      getRecordingPermission: response.status === 'granted',
    });
  };

  openSettings = async () => {
    Linking.openURL('app-settings:');
  }

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
      timeStampOffset: 60,
      isWave: false,
    });

    if (this.sound !== null) {
      await this.sound.unloadAsync();
      this.props.setDefaultSoundStatus();
      this.sound.setOnPlaybackStatusUpdate(null);
    }
    try {
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
      recording.setOnRecordingStatusUpdate(this.updateScreenForRecordingStatus);
      await recording.prepareToRecordAsync(this.recordingSettings);
      this.recording = recording;
      await this.recording.startAsync();
    } catch (error) {
      console.warn(error);
    }
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
      info2 = await FileSystem.readAsStringAsync(info.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      info.modificationDate = today;
      const fileExtension = info.uri.slice(info.uri.lastIndexOf('.'));
      const defaultName =
        info.modificationDate.split(' ').join('_') + fileExtension;
      this.setState({ textInput: defaultName });
      audioBuffer = trimReady(info2);
      totalDuration = audioBuffer.length;
      info.totalDuration = totalDuration;
      info.isTrimmed = false;
      info.isAppended = false;
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

    const { sound } = await this.recording.createNewLoadedSoundAsync(
      {
        isLooping: false,
        isMuted: this.props.isSoundStatus.muted,
        volume: this.props.isSoundStatus.volume,
      },
      this.updateScreenForSoundStatus
    );
    this.sound = sound;
    this.toggleModal();
    this.setState({
      isLoading: false,
    });
  }
  handleonChangeTextInput = (textInput) => this.setState({ textInput });
  toggleModal = () => this.props.setToggleModalVisibleSaveFile();
  saveRecording = () => {
    info.name = this.state.textInput;
    this.props.setDataURI(info);
    this.props.setToggleModalVisibleSaveFile();
    this.setState({ textInput: '' });
  };
  updateScreenForSoundStatus = (status) => {
    if (status.isLoaded) {
      this.props.setSoundStatus(status);
      this.setState({
        isWave: true,
      });
    } else {
      this.props.setDefaultSoundStatus();
      this.setState({
        isWave: false,
      });
      if (status.error) {
        console.warn(`FATAL PLAYER ERROR: ${status.error}`);
      }
    }
  };

  render() {
    const {
      scrubberPosition,
      fontLoaded,
      getRecordingPermission,
      isRecording,
      textInput,
      isLoading,
      isWave,
    } = this.state;

    const {
      isPlaybackAllowed,
      muted,
      soundDuration,
      isPlaying,
    } = this.props.isSoundStatus;

    const interpolateColor = this.animatedValue.interpolate({
      inputRange: [0, 300],
      outputRange: ['rgb(247,210,215)', 'rgb(228,3,33)'],
    });
    const animatedStyle = {
      backgroundColor: interpolateColor,
    };
    if (!fontLoaded) {
      return <View style={CommonStyles.emptyContainer} />;
    }
    if (!getRecordingPermission) {
      return (
        <View style={CommonStyles.container}>
          <View />
          <Text
            style={[
              CommonStyles.noPermissionsText,
              { fontFamily: 'brown-regular' },
            ]}
          >
            You must enable audio recording permissions in order to use this
            app.
          </Text>
          <CustomButton
            onPressButton={this.openSettings}
            buttonTitle="Activate"
            backgroundColor="#4caf50"
          />
          <View />
        </View>
      );
    }

    return (
      <View style={CommonStyles.container}>
        <NavigationEvents
          onDidBlur={this.onDidBlur}
          onDidFocus={this.setSound}
        />
        {isRecording ? (
          <Animated.View style={[CommonStyles.recCircle, animatedStyle]} />
        ) : null}
        <CustomModal
          visible={this.props.isVisibleStatus.recordSaveFile}
          value={textInput}
          headerTitle="File name for this recording"
          buttonThreeDisplay="none"
          subTitleDisplay="none"
          fontSize={24}
          onChangeText={this.handleonChangeTextInput}
          onPressButtonOne={this.saveRecording}
          onPressButtonTwo={this.toggleModal}
          buttonOneTitle="Save"
          buttonTwoTitle="Cancel"
        />
        <View
          style={[
            CommonStyles.oneThirdScreenContainer,
            {
              opacity: isLoading ? DISABLED_OPACITY : 1.0,
            },
          ]}
        >
          <View />
          <View style={[CommonStyles.recordingContainer, { marginTop: 100 }]}>
            <View />
            <Recording
              onRecordPressed={this.onRecordPressed}
              getRecordingTimestamp={this.getRecordingTimestamp()}
              isRecording={isRecording}
              isLoading={isLoading}
            />
            <View />
          </View>
          <View />
        </View>
        <View
          style={[
            CommonStyles.twoThirdScreenContainer,
            {
              opacity: !isPlaybackAllowed || isLoading ? DISABLED_OPACITY : 1.0,
            },
          ]}
          l
        >
          <View style={CommonStyles.playbackContainer}>
            <Text
              style={[
                CommonStyles.playbackTimestamp,
                { fontFamily: 'brown-regular', marginBottom: 20 },
              ]}
            >
              {this.getPlaybackTimestamp()}
            </Text>
            {isWave ? (
              <View style={CommonStyles.player}>
                <Scrubber
                  totalDuration={soundDuration}
                  scrubberColor="#e76477"
                  scrubberPosition={scrubberPosition}
                  onScrubbingComplete={this.onScrubbingComplete}
                />
                <View style={CommonStyles.clipper}>
                  <Waver
                    audioBuffer={audioBuffer}
                    width={DEVICE_WIDTH - 25}
                    height={100}
                    color1={gray1}
                    color2={gray2}
                    className={'waver'}
                  />
                </View>
              </View>
            ) : null}
          </View>
          <View
            style={[
              CommonStyles.buttonsContainerBase,
              CommonStyles.buttonsContainerTopRow,
              { justifyContent: 'center' },
            ]}
          >
            <PlayerButtons
              isPlaybackAllowed={isPlaybackAllowed}
              isLoading={isLoading}
              onPlayPausePressed={this.onPlayPausePressed}
              homeScreen={homeScreen}
              onStopPressed={this.onStopPressed}
              onMutePressed={this.onMutePressed}
              onBackPressed={this.onBackPressed}
              isPlaying={isPlaying}
              contentAlign={'center'}
              iconSize={36}
              marginBottom={55}
              muted={muted}
            />
            <View />
          </View>
          <View />
        </View>
      </View>
    );
  }
}

const mapStateToProps = (store) => ({
  isVisibleStatus: getModalVisiblity(store),
  isSoundStatus: getSoundStatus(store),
  isData: getDataURI(store),
});

const withRedux = connect(
  mapStateToProps,
  { ...mainActions }
);

RecordScreen.propTypes = {
  isVisibleStatus: PropTypes.object,
  isData: PropTypes.array,
  isSoundStatus: PropTypes.shape({
    isPlaybackAllowed: PropTypes.bool,
    muted: PropTypes.bool,
    soundPosition: PropTypes.number,
    soundDuration: PropTypes.number,
    shouldPlay: PropTypes.bool,
    isPlaying: PropTypes.bool,
    volume: PropTypes.number,
  }),
  setDefault: PropTypes.func,
  setPlayBackDefault: PropTypes.func,
  setDefaultSoundStatus: PropTypes.func,
  setToggleModalVisibleSaveFile: PropTypes.func,
  setDataURI: PropTypes.func,
  setSoundStatus: PropTypes.func,
};

export default compose(withRedux)(RecordScreen);
