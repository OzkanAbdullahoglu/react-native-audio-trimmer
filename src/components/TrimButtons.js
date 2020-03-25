/* eslint-disable linebreak-style */
import React from 'react';
import {
  View,
} from 'react-native';
import { Icon } from 'react-native-elements';
import PropTypes from 'prop-types';
import { CommonStyles } from '../components/CommonStyles';

const TrimButtons = ({
  isTrimActive,
  isPlaybackAllowed,
  toggleTrimModal,
  isLoading,
  setToggleTrim,
}) => (
  <View style={CommonStyles.playbackContainer}>
    {
      isTrimActive ? (
        <View style={CommonStyles.trimConfirmButton}>
          <Icon
            raised
            name="check-square"
            type="font-awesome"
            color="#e76477"
            disabled={!isPlaybackAllowed || isLoading}
            onPress={toggleTrimModal}
          />
        </View>
      ) : (
        <View style={CommonStyles.trimButton}>
          <Icon
            raised
            name="cut"
            type="font-awesome"
            color="#e76477"
            disabled={!isPlaybackAllowed || isLoading}
            onPress={setToggleTrim}
          />
        </View>
      )
    }
  </View>
);

TrimButtons.propTypes = {
  isTrimActive: PropTypes.bool,
  setToggleTrim: PropTypes.func,
  isPlaybackAllowed: PropTypes.bool,
  toggleTrimModal: PropTypes.func,
  isLoading: PropTypes.bool,
};

export default TrimButtons;
