/* eslint-disable linebreak-style */
import React from 'react';
import {
  View,
} from 'react-native';
import { Icon } from 'react-native-elements';
import PropTypes from 'prop-types';

import { CommonStyles } from '../components/CommonStyles';

const PlayerButtons = ({
  isPlaybackAllowed,
  isLoading,
  onPlayPausePressed,
  contentAlign,
  marginBottom,
  iconSize,
  homeScreen,
  onStopPressed,
  onMutePressed,
  onBackPressed,
  onSharePressed,
  isPlaying,
  muted,
  fileName,
}) => (
  <View
    style={[
      CommonStyles.buttonsContainerBase,
      CommonStyles.buttonsContainerTopRow,
      { justifyContent: contentAlign },
    ]}
  >
    {!homeScreen ? (
      <Icon
        raised
        name="share"
        color="#e76477"
        disabled={!isPlaybackAllowed || isLoading}
        onPress={() => onSharePressed(fileName)}
      />
    ) : null}
    <View style={CommonStyles.volumeContainer}>
      {muted ? (
        <Icon
          raised
          name="volume-off"
          type="font-awesome"
          color="#e76477"
          disabled={!isPlaybackAllowed || isLoading}
          onPress={onMutePressed}
        />
      ) : (
        <Icon
          raised
          name="volume-up"
          type="font-awesome"
          color="#e76477"
          disabled={!isPlaybackAllowed || isLoading}
          onPress={onMutePressed}
        />
      )}
    </View>
    {homeScreen ? (
      <View style={CommonStyles.backWardContainer}>
        <Icon
          raised
          name="backward"
          type="font-awesome"
          color="#e76477"
          disabled={!isPlaybackAllowed || isLoading}
          onPress={onBackPressed}
        />
      </View>
    ) : null}

    <View style={[CommonStyles.playStopContainer, { marginBottom }]}>
      {isPlaying ? (
        <Icon
          raised
          name="pause"
          type="font-awesome"
          size={iconSize}
          color="#e76477"
          disabled={!isPlaybackAllowed || isLoading}
          onPress={onPlayPausePressed}
        />
      ) : (
        <Icon
          raised
          name="play"
          type="font-awesome"
          size={iconSize}
          color="#e76477"
          disabled={!isPlaybackAllowed || isLoading}
          onPress={onPlayPausePressed}
        />
      )}
      {!homeScreen ? (
        <Icon
          raised
          name="stop"
          type="font-awesome"
          color="#e76477"
          disabled={!isPlaybackAllowed || isLoading}
          onPress={onStopPressed}
        />
      ) : null}
    </View>
    <View />
  </View>
);

PlayerButtons.propTypes = {
  isPlaybackAllowed: PropTypes.bool,
  muted: PropTypes.bool,
  isLoading: PropTypes.bool,
  isPlaying: PropTypes.bool,
  onPlayPausePressed: PropTypes.func,
  contentAlign: PropTypes.string,
  fileName: PropTypes.string,
  marginBottom: PropTypes.number,
  iconSize: PropTypes.number,
  homeScreen: PropTypes.bool,
  onStopPressed: PropTypes.func,
  onMutePressed: PropTypes.func,
  onBackPressed: PropTypes.func,
  onSharePressed: PropTypes.func,
};

export default PlayerButtons;
