/* eslint-disable linebreak-style */
import React from 'react';
import {
  View,
  Slider,
  Text,
  Animated,
} from 'react-native';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { NavigationEvents } from 'react-navigation';
import PropTypes from 'prop-types';
import {
  mainActions,
  getModalVisiblity,
  getTrimState,
  getTrimModalState,
  getTrimConfirmationModalState,
  getSoundStatus,
  getIsTrimmedBool,
  getIsAppendedStat,
} from '../reducers';
import Trimmer from '../components/Trimmer';
import { trimReady, trimmedSound, concatSounds } from '../utils/utils';
import { allLetterNumber } from '../utils/helper';
import CustomModal from '../components/CustomModal';
import { CommonStyles } from '../components/CommonStyles';
import Recording from '../components/Recording';
import TrimButtons from '../components/TrimButtons';
import PlayerButtons from '../components/PlayerButtons';

const DISABLED_OPACITY = 0.5;
const homeScreen = false;

class EditScreen extends React.Component {
    static navigationOptions = ({ navigation }) => {
      if (navigation.state.params.title.length > 24) {
        return ({
          title: `${(navigation.state.params.title).slice(1, 20)}...${(navigation.state.params.title).slice(-3)}`,
          gestureEnabled: false,
        });
      }
      return ({
        title: navigation.state.params.title,
        gestureEnabled: false,
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
        textInput: '',
        timeStampOffset: 160,
        trimmerLeftHandlePosition: 0,
        trimmerRightHandlePosition: 0,
        totalDuration: 0,
        maxTrimDuration: 0,
        minimumTrimDuration: 0,
        modalHeader: '',
        isLoading: true,
        isTrimming: false,
        isAppending: false,
        isRecording: false,
        illegalChar: false,
        recordingDuration: null,
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

    async componentDidMount() {
      await this.setTotalDuration();
      this.toggleTrimActive();
      await this.setSound();
    }

    shouldComponentUpdate(nextProps, nextState) {
      const {
        timeStampOffset,
        trimmerLeftHandlePosition,
        trimmerRightHandlePosition,
        totalDuration,
        maxTrimDuration,
        minimumTrimDuration,
        isLoading,
        recordingOption,
        textInput,
        isTrimming,
        isAppending,
      } = this.state;

      const {
        isTrimActive,
        isReRecordVisible,
        isTrimModalVisible,
        isTrimConfirmationModalVisible,
        isToggleTrimModal,
        isAppended,
        isTrimmed,
      } = this.props;

      const {
        isPlaybackAllowed,
        muted,
        soundPosition,
        soundDuration,
        shouldPlay,
        isPlaying,
        volume,
      } = this.props.isSoundStatus;

      const {
        totalDurationProp,
        title,
        data,
      } = this.props.navigation.state.params;

      return (
        isTrimActive !== nextProps.isTrimActive ||
      isReRecordVisible !== nextProps.isReRecordVisible ||
      isAppended !== nextProps.isAppended ||
      isAppending !== nextState.isAppending ||
      isTrimmed !== nextProps.isTrimmed ||
      isToggleTrimModal !== nextProps.isToggleTrimModal ||
      isTrimModalVisible !== nextProps.isTrimModalVisible ||
      isTrimConfirmationModalVisible !== nextProps.isTrimConfirmationModalVisible ||
      isLoading !== nextState.isLoading ||
      isTrimming !== nextState.isTrimming ||
      textInput !== nextState.textInput ||
      isPlaybackAllowed !== nextProps.isSoundStatus.isPlaybackAllowed ||
      muted !== nextProps.isSoundStatus.muted ||
      soundPosition !== nextProps.isSoundStatus.soundPosition ||
      shouldPlay !== nextProps.isSoundStatus.shouldPlay ||
      soundDuration !== nextProps.isSoundStatus.soundDuration ||
      isPlaying !== nextProps.isSoundStatus.isPlaying ||
      volume !== nextProps.isSoundStatus.volume ||
      trimmerLeftHandlePosition !== nextState.trimmerLeftHandlePosition ||
      trimmerRightHandlePosition !== nextState.trimmerRightHandlePosition ||
      totalDuration !== nextState.totalDuration ||
      timeStampOffset !== nextState.timeStampOffset ||
      maxTrimDuration !== nextState.maxTrimDuration ||
      recordingOption !== nextState.recordingOption ||
      minimumTrimDuration !== nextState.minimumTrimDuration ||
      totalDurationProp !== nextProps.totalDurationProp ||
      title !== nextProps.navigation.state.params.title ||
      data !== nextProps.navigation.state.params.data
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
        this.props.setToggleModalVisibleReRecord();
      }
    };

    onPlayPausePressed = async () => {
      if (this.sound != null) {
        if (this.props.isSoundStatus.isPlaying) {
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
        this.sound.setIsMutedAsync(!this.props.isSoundStatus.muted);
      }
    };
    onSeekSliderValueChange = () => {
      if (this.sound != null && !this.isSeeking) {
        this.isSeeking = true;
        this.shouldPlayAtEndOfSeek = this.props.isSoundStatus.shouldPlay;
        this.sound.pauseAsync();
      }
    };

    onSeekSliderSlidingComplete = (value) => {
      if (this.sound != null) {
        this.isSeeking = false;
        const seekPosition = value * this.props.isSoundStatus.soundDuration;
        if (this.shouldPlayAtEndOfSeek) {
          this.sound.playFromPositionAsync(seekPosition);
        } else {
          this.sound.setPositionAsync(seekPosition);
        }
      }
    };

  onDidBlur = () => {
    this.unloadSound();
    if (this.props.isTrimActive) {
      this.props.setToggleTrim();
    }
  }

  setTotalDuration = async () => {
    const { totalDurationProp } = this.props.navigation.state.params;
    this.setState({ totalDuration: totalDurationProp });
  }

  getSeekSliderPosition() {
    const {
      soundPosition,
      soundDuration,
    } = this.props.isSoundStatus;
    if (
      this.sound != null &&
            soundPosition != null &&
            soundDuration != null
    ) {
      return soundPosition / soundDuration;
    }
    return 0;
  }
  getSeekSliderPositionTrimmer() {
    const {
      soundPosition,
      soundDuration,
    } = this.props.isSoundStatus;
    if (
      this.sound != null &&
            soundPosition != null &&
            soundDuration != null
    ) {
      const constant = this.state.totalDuration / soundDuration;
      return (soundPosition === soundDuration ? 1 :
        ((soundPosition * constant) / this.state.totalDuration)
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
    const {
      soundPosition,
      soundDuration,
    } = this.props.isSoundStatus;
    if (
      this.sound != null &&
            soundPosition != null &&
            soundDuration != null
    ) {
      return `${this.getMMSSFromMillis(soundPosition)} / ${this.getMMSSFromMillis(
        soundDuration
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
          isAppending: false,
          modalHeader: '',
        });
      } catch (error) {
        console.warn(error);
      }
    }
    setSoundTrim = async (fileUri) => {
      this.sound = new Audio.Sound();
      this.props.navigation.state.params.data.uri = fileUri;
      try {
        await this.sound.loadAsync(
          { uri: fileUri },
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

     handleonChangeTextInput = (textInput) => {
       const illegals = allLetterNumber(textInput);
       if (allLetterNumber(textInput) === true) {
         this.setState({ textInput });
       } else if (illegals.length > 0) {
         const removedIllegal = this.handleInputError(illegals);
         this.setState({ textInput: removedIllegal });
       } else {
         this.setState({ textInput });
       }
     }


  handleInputError = (illegals) => {
    const currentInput = this.state.textInput;
    const removeIllegal = [...currentInput].filter((i) => illegals.indexOf(i) === -1).join('');
    this.setState({ illegalChar: true });
    setTimeout(() => this.setState({ illegalChar: false }), 1000);
    return removeIllegal;
  }

  /*
  reWrite = (type) => {
    let {
      isAppended,
      isTrimmed,
    } = this.props.navigation.state.params.data;
    if (type === 'overwrite') {
      this.setState({ recordingOption: 'overwrite' });
      isAppended = false;
      isTrimmed = false;
    } else {
      this.setState({ recordingOption: 'append' });
      isAppended = true;
      isTrimmed = true;
    }
    this.stopPlaybackAndBeginRecording();
    this.toggleAnimate();
    this.props.setToggleModalVisibleReRecord();
  }
  */
  overwrite = () => {
    this.setState({ recordingOption: 'overwrite' });
    this.props.navigation.state.params.data.isAppended = false;
    this.props.navigation.state.params.data.isTrimmed = false;
    this.stopPlaybackAndBeginRecording();
    this.toggleAnimate();
    this.props.setToggleModalVisibleReRecord();
  };

  append = () => {
    this.setState({ recordingOption: 'append' });
    this.props.navigation.state.params.data.isAppended = true;
    this.props.navigation.state.params.data.isTrimmed = true;
    this.stopPlaybackAndBeginRecording();
    this.toggleAnimate();
    this.props.setToggleModalVisibleReRecord();
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
      tintColor: '#e76477',
      trackBackgroundColor: 'rgba(238,255,218,0.5)',
      trackBorderColor: 'rgba(137,255,0,0.5)',
    };
  }

  toggleTrimActive = async () => {
    const maxTrimDuration = Math.floor(this.state.totalDuration);
    const minimumTrimDuration = Math.floor((this.state.totalDuration) / 4);
    const trimmerRightHandlePosition = Math.floor((this.state.totalDuration) / 2);
    const trimmerLeftHandlePosition = Math.floor((this.state.totalDuration) / 5);
    this.setState({ minimumTrimDuration });
    this.setState({ maxTrimDuration });
    this.setState({ trimmerRightHandlePosition });
    this.setState({ trimmerLeftHandlePosition });
  }

  toggleTrimModal = () => {
    this.props.setToggleTrimModal();
    if (!this.props.isTrimModalVisible && this.props.isTrimActive) {
      this.props.setToggleTrim();
    }
  }

  toggleTrimConfirmationModal = () => {
    this.props.setToggleTrimConfirmationModal();
  }
  trimExecution = async () => {
    this.toggleTrimModal();
    this.setState({ isLoading: true });
    this.setState({ isTrimming: true });
    const { trimmerLeftHandlePosition, trimmerRightHandlePosition } = this.state;
    const fileUri = this.props.navigation.state.params.data.uri;
    const fileData = await FileSystem.readAsStringAsync(fileUri,
      { encoding: FileSystem.EncodingType.Base64 });
    const newFilename = this.state.textInput;
    await trimmedSound(fileData, trimmerLeftHandlePosition, trimmerRightHandlePosition, newFilename);
    try {
      await this.sound.unloadAsync();
      this.sound.setOnPlaybackStatusUpdate(null);
      await this.setSound(fileUri);
      this.setState({ isLoading: false });
      this.setState({ isTrimming: false });
      this.props.setToggleTrimConfirmationModal();
    } catch (error) {
      console.warn(error);
    }
  }

  updateScreenForSoundStatus = (status) => {
    if (status.isLoaded) {
      this.props.setSoundStatus(status);
    } else {
      this.props.setDefaultSoundStatus();
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
    });
    if (this.sound !== null) {
      await this.sound.unloadAsync();
      this.sound.setOnPlaybackStatusUpdate(null);
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
    recording.setOnRecordingStatusUpdate(this.updateScreenForRecordingStatus);
    await recording.prepareToRecordAsync(this.recordingSettings);
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
      isAppending: true,
    });
    if (this.state.recordingOption === 'overwrite') {
      this.setState({
        modalHeader: 'Overwriting...',
      });
    } else {
      this.setState({
        modalHeader: 'Appending...',
      });
    }
    try {
      await this.recording.stopAndUnloadAsync();
      info = await FileSystem.getInfoAsync(this.recording.getURI());
      info2 = await FileSystem.readAsStringAsync(info.uri, { encoding: FileSystem.EncodingType.Base64 });
      info3 = await FileSystem.readAsStringAsync(fileUri,
        { encoding: FileSystem.EncodingType.Base64 });
      if (this.state.recordingOption === 'overwrite') {
        const totalDuration = trimReady(info2).length;
        this.setState({ totalDuration });
        this.props.setModifyFileData(fileId, info.uri);
        this.setState({
          recordingOption: '',
        });
      }
      if (this.state.recordingOption === 'append') {
        const totalDuration = trimReady(info3).length + trimReady(info2).length;
        this.setState({ totalDuration });
        await concatSounds(info3, info2, info.uri);
        this.props.setModifyFileData(fileId, info.uri);
        this.setState({
          recordingOption: '',
        });
      }
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
    const {
      isPlaybackAllowed,
      muted,
      isPlaying,
      soundDuration,
    } = this.props.isSoundStatus;

    const {
      isReRecordVisible,
      setToggleModalVisibleReRecord,
      isTrimConfirmationModalVisible,
      isTrimModalVisible,
      isTrimActive,
      setToggleTrim,
      isTrimmed,
      isAppended,
    } = this.props;

    const {
      illegalChar,
      isRecording,
      isTrimming,
      isAppending,
      modalHeader,
      textInput,
      timeStampOffset,
      isLoading,
      totalDuration,
    } = this.state;

    const { id } = this.props.navigation.state.params.data;
    const interpolateColor = this.animatedValue.interpolate({
      inputRange: [0, 300],
      outputRange: ['rgb(247,210,215)', 'rgb(228,3,33)'],
    });
    const animatedStyle = {
      backgroundColor: interpolateColor,
    };
    let textInputBorderColor = '';
    let textBorderWidth = '';
    illegalChar === true ? (
      textInputBorderColor = 'red',
      textBorderWidth = 3) : (
      textInputBorderColor = 'gray',
      textBorderWidth = 1);

    return (
      <View style={CommonStyles.container}>
        <NavigationEvents onDidBlur={this.onDidBlur} />
        {this.state.isRecording ? (
          <Animated.View style={[CommonStyles.recCircle, animatedStyle]} />
        ) : null}
        <View
          style={[
            CommonStyles.oneThirdScreenContainer,
            {
              opacity: this.state.isLoading ? DISABLED_OPACITY : 1.0,
            },
          ]}
        >
          <View />
          <CustomModal
            visible={isReRecordVisible.reRecordOptions}
            headerTitle="Recording to the file?"
            inputDisplay="none"
            subTitleDisplay="none"
            fontSize={24}
            buttonThreeColor="#2196f3"
            onPressButtonOne={this.append}
            onPressButtonTwo={this.overwrite}
            onPressButtonThree={setToggleModalVisibleReRecord}
            buttonOneTitle="Append"
            buttonTwoTitle="Owerwrite"
            buttonThreeTitle="Cancel"
            buttonOneDisplay={isAppended(id)}
          />
          <CustomModal
            visible={isTrimming}
            isTrimming={isTrimming}
            headerTitle="Trimming..."
            inputDisplay="none"
            subTitleDisplay="none"
            fontSize={24}
            buttonOneDisplay="none"
            buttonTwoDisplay="none"
            buttonThreeDisplay="none"
          />
          <CustomModal
            visible={isAppending}
            isTrimming={isAppending}
            headerTitle={modalHeader}
            inputDisplay="none"
            subTitleDisplay="none"
            fontSize={24}
            buttonOneDisplay="none"
            buttonTwoDisplay="none"
            buttonThreeDisplay="none"
          />
          <CustomModal
            visible={isTrimConfirmationModalVisible}
            headerTitle={`Trimmed file is saved as ${textInput}`}
            inputDisplay="none"
            subTitleDisplay="none"
            fontSize={24}
            onPressButtonOne={this.toggleTrimConfirmationModal}
            buttonOneTitle="Close"
            buttonTwoDisplay="none"
            buttonThreeDisplay="none"
          />
          <CustomModal
            visible={isTrimModalVisible}
            headerTitle="Trimmed File Name"
            value={textInput}
            subTitleDisplay="none"
            buttonThreeDisplay="none"
            fontSize={24}
            borderColor={textInputBorderColor}
            borderWidth={textBorderWidth}
            onChangeText={this.handleonChangeTextInput}
            onPressButtonOne={this.trimExecution}
            onPressButtonTwo={this.toggleTrimModal}
            buttonOneTitle="Confirm"
            buttonTwoTitle="Cancel"
          />
          <View style={CommonStyles.recordingContainer}>
            <View />
            <Recording
              onRecordPressed={this.onRecordPressed}
              getRecordingTimestamp={this.getRecordingTimestamp()}
              isRecording={isRecording}
              isLoading={isLoading}
            />
            <View />
          </View>
        </View>
        <View
          style={[
            CommonStyles.twoThirdScreenContainer,
            {
              opacity:
                !isPlaybackAllowed || isLoading ? DISABLED_OPACITY : 1.0,
            },
          ]}
        >
          <View style={CommonStyles.playbackContainer}>
            <View>
              <Text
                style={[
                  CommonStyles.playbackTimestamp,
                  { fontFamily: 'brown-regular', top: timeStampOffset },
                ]}
              >
                {this.getPlaybackTimestamp()}
              </Text>
            </View>
            {isTrimActive ? (
              <View>
                <Trimmer
                  {...this.trimmerProps()}
                  sliderStyle={CommonStyles.playbackSlider}
                  value={this.getSeekSliderPositionTrimmer()}
                  maximumValue={totalDuration}
                  soundDuration={soundDuration}
                  onValueChange={this.onSeekSliderValueChange}
                  onSlidingComplete={this.onSeekSliderSlidingComplete}
                  disabled={!isPlaybackAllowed || isLoading}
                />
              </View>
            ) : (
              <Slider
                style={CommonStyles.playbackSlider}
                value={this.getSeekSliderPosition()}
                onValueChange={this.onSeekSliderValueChange}
                onSlidingComplete={this.onSeekSliderSlidingComplete}
                disabled={!isPlaybackAllowed || isLoading}
              />
            )}
            {!isTrimmed(id) ? (
              <TrimButtons
                isTrimActive={isTrimActive}
                isPlaybackAllowed={isPlaybackAllowed}
                toggleTrimModal={this.toggleTrimModal}
                isLoading={isLoading}
                setToggleTrim={setToggleTrim}
              />
            ) : null}
          </View>
          <PlayerButtons
            isPlaybackAllowed={isPlaybackAllowed}
            isLoading={isLoading}
            onPlayPausePressed={this.onPlayPausePressed}
            onMutePressed={this.onMutePressed}
            homeScreen={homeScreen}
            onStopPressed={this.onStopPressed}
            onBackPressed={this.onBackPressed}
            isPlaying={isPlaying}
            muted={muted}
          />
          <View />
        </View>
      </View>
    );
  }
}

const mapStateToProps = (store) => ({
  isReRecordVisible: getModalVisiblity(store),
  isTrimActive: getTrimState(store),
  isTrimModalVisible: getTrimModalState(store),
  isTrimConfirmationModalVisible: getTrimConfirmationModalState(store),
  isSoundStatus: getSoundStatus(store),
  isTrimmed: getIsTrimmedBool(store),
  isAppended: getIsAppendedStat(store),
});

const withRedux = connect(
  mapStateToProps,
  { ...mainActions }
);

EditScreen.propTypes = {
  setToggleModalVisibleReRecord: PropTypes.func,
  setToggleTrimConfirmationModal: PropTypes.func,
  setToggleTrimModal: PropTypes.func,
  setSoundStatus: PropTypes.func,
  setDefaultSoundStatus: PropTypes.func,
  isTrimActive: PropTypes.bool,
  isReRecordVisible: PropTypes.object,
  isTrimModalVisible: PropTypes.bool,
  isTrimConfirmationModalVisible: PropTypes.bool,
  isToggleTrimModal: PropTypes.bool,
  isAppended: PropTypes.func,
  isTrimmed: PropTypes.func,
  setToggleTrim: PropTypes.func,
  isSoundStatus: PropTypes.shape({
    isPlaybackAllowed: PropTypes.bool,
    muted: PropTypes.bool,
    soundPosition: PropTypes.number,
    soundDuration: PropTypes.number,
    shouldPlay: PropTypes.bool,
    isPlaying: PropTypes.bool,
    volume: PropTypes.number,
  }),
  navigation: PropTypes.shape({
    state: PropTypes.shape({
      params: PropTypes.shape({
        totalDurationProp: PropTypes.number,
        title: PropTypes.string,
        data: PropTypes.object,
      }),
    }),
  }),
};

export default compose(withRedux)(EditScreen);
