/* eslint-disable linebreak-style */
import React from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import { Icon, Slider } from 'react-native-elements';
import { Audio } from 'expo-av';
import { NavigationEvents } from 'react-navigation';
import PropTypes from 'prop-types';

class PlayerContainer extends React.Component {
  constructor(props) {
    super(props);

    this.sound = null;
    this.state = {
      isPLaying: false,
      isPlaybackAllowed: false,
      soundPosition: null,
      soundDuration: null,
      shouldPlay: false,
      volume: 1.0,
      isLoading: true
    };
  }

  async componentDidMount() {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS,
      playsInSilentModeIOS: true,
      playsInSilentLockedModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DUCK_OTHERS,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false
    });
    await this.setSound();
  }

  shouldComponentUpdate(nextProps, nextState) {
    const {
      isPLaying,
      isPlaybackAllowed,
      soundPosition,
      soundDuration,
      shouldPlay,
      volume,
      isLoading
    } = this.state;
    const { fileUri } = this.props;
    return (
      isLoading !== nextState.isLoading ||
      isPLaying !== nextState.isPLaying ||
      isPlaybackAllowed !== nextState.isPlaybackAllowed ||
      soundPosition !== nextState.soundPosition ||
      soundDuration !== nextState.soundDuration ||
      shouldPlay !== nextState.shouldPlay ||
      volume !== nextState.volume ||
      fileUri !== nextProps.fileUri
    );
  }

  componentDidUpdate(prevProps, prevState) {
    const { soundPosition, soundDuration } = this.state;

    if (soundPosition === soundDuration && this.sound !== null) {
      this.sound.stopAsync();
    }
  }

  async componentWillUnmount() {
    await this.unloadSound();
  }

  onPlayPausePressed = async () => {
    if (this.sound != null) {
      if (this.state.isPlaying) {
        this.sound.pauseAsync();
      } else {
        this.sound.playAsync();
      }
    }
  };

  onSeekSliderValueChange = () => {
    if (this.sound != null && !this.isSeeking) {
      this.isSeeking = true;
      this.shouldPlayAtEndOfSeek = this.state.shouldPlay;
      this.sound.pauseAsync();
    }
  };

  onSeekSliderSlidingComplete = async value => {
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

  setSound = async () => {
    if (this.sound !== null) {
      await this.sound.unloadAsync();
      this.sound.setOnPlaybackStatusUpdate(null);
      this.sound = null;
      /* this.sound = null;*/
    }
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: this.props.fileUri },
        this.updateScreenForSoundStatus,
        null,
        true
      );
      this.sound = sound;
      this.sound.setOnPlaybackStatusUpdate(this.updateScreenForSoundStatus);
      this.setState({
        isLoading: false
      });
    } catch (error) {
      console.warn(error);
    }
  };

  unloadSound = async () => {
    if (this.sound !== null) {
      await this.sound.unloadAsync();
      this.sound.setOnPlaybackStatusUpdate(null);
      this.setState({ isLoading: true });
      /* this.sound = null;*/
    }
    await this.sound.unloadAsync();
  };

  updateScreenForSoundStatus = status => {
    if (status.isLoaded) {
      this.setState({
        soundDuration: status.durationMillis,
        soundPosition: status.positionMillis,
        shouldPlay: status.shouldPlay,
        isPlaying: status.isPlaying,
        volume: 0.9,
        isPlaybackAllowed: true,
        isLooping: true
      });
    } else {
      this.setState({
        soundDuration: null,
        soundPosition: null,
        isPlaybackAllowed: false,
        isLooping: false
      });
      if (status.error) {
        console.log(`FATAL PLAYER ERROR: ${status.error}`);
      }
    }
  };

  render() {
    return (
      <View style={styles.container}>
        <NavigationEvents onDidBlur={this.unloadSound} />
        {this.state.isPlaying ? (
          <Icon
            raised
            name="pause"
            type="font-awesome"
            color="#e47a89"
            disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
            onPress={this.onPlayPausePressed}
          />
        ) : (
          <Icon
            raised
            name="play"
            type="font-awesome"
            color="#e47a89"
            disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
            onPress={this.onPlayPausePressed}
          />
        )}
        <Slider
          style={styles.playbackSlider}
          value={this.getSeekSliderPosition()}
          minimumValue={0}
          maximumValue={1}
          onValueChange={this.onSeekSliderValueChange}
          onSlidingComplete={this.onSeekSliderSlidingComplete}
          minimumTrackTintColor="#ecf7ff"
          maximumTrackTintColor="#2089dc"
          thumbTintColor="#e47a89"
          disabled={!this.state.isPlaybackAllowed || this.state.isLoading}
        />
      </View>
    );
  }
}

PlayerContainer.propTypes = {
  fileUri: PropTypes.string,
};

const styles = StyleSheet.create({
  container: {
    flex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
    minHeight: 'auto',
    maxHeight: 'auto',
    backgroundColor: '#fde4e8',
    paddingTop: 0,
  },
  playbackSlider: {
    flex: 8,
    marginHorizontal: 20,
  },
});

export default PlayerContainer;
