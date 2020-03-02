/* eslint linebreak-style: ["error", "windows"]*/
import React from 'react';
import { Button } from 'react-native-elements';
import PropTypes from 'prop-types';

const CustomButton = ({ onPressButton, buttonTitle, buttonDisplay, backgroundColor }) => {
  const styles = {
    button: {
      borderRadius: 50,
      marginTop: 15,
      marginLeft: 0,
      marginRight: 0,
      marginBottom: 0,
      backgroundColor,
      display: buttonDisplay,
    },
  };

  return (
    <Button
      MaterialCommunityIcons={{ name: 'comment-outline' }}
      backgroundColor="#03A9F4"
      buttonStyle={styles.button}
      onPress={onPressButton}
      title={buttonTitle}
    />
  );
};

CustomButton.propTypes = {
  buttonTitle: PropTypes.string,
  buttonDisplay: PropTypes.string,
  onPressButton: PropTypes.func,
};

export default CustomButton;
