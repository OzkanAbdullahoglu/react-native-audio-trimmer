/* eslint-disable linebreak-style */

import React from 'react';
import {
  View,
  Text,
} from 'react-native';
import { Icon } from 'react-native-elements';
import PropTypes from 'prop-types';

import { CommonStyles } from '../components/CommonStyles';

const Recording = ({
  onRecordPressed,
  getRecordingTimestamp,
  isRecording,
  isLoading,
}) => (
  <View style={CommonStyles.recordingDataContainer}>
    <View />
    {
      isRecording ? (
        <View style={CommonStyles.recordingDataRowContainer}>
          <Icon
            raised
            name="circle"
            type="font-awesome"
            color="#e76477"
            size={48}
            onPress={onRecordPressed}
          />
          <Text
            style={[CommonStyles.recordingTimestamp,
              { fontFamily: 'brown-regular' }]}
          >
            {getRecordingTimestamp}
          </Text>
        </View>
      ) : (<Icon
        raised
        name="microphone"
        type="font-awesome"
        color="#e76477"
        size={48}
        disabled={isLoading}
        onPress={onRecordPressed}
      />)
    }
    <View />
  </View>
);

Recording.propTypes = {
  onRecordPressed: PropTypes.func,
  getRecordingTimestamp: PropTypes.string,
  isRecording: PropTypes.bool,
  isLoading: PropTypes.bool,
};

export default Recording;
