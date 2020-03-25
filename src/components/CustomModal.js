/* eslint linebreak-style: ["error", "windows"]*/
import React from 'react';
import {
  Modal,
  View,
  TextInput,
  KeyboardAvoidingView,
  ActivityIndicator } from 'react-native';
import { Card, Text } from 'react-native-elements';
import PropTypes from 'prop-types';

import CustomButton from './CustomButton';

const CustomModal = ({
  visible,
  value,
  headerTitle,
  subTitle,
  subTitleDisplay,
  onChangeText,
  onPressButtonOne,
  onPressButtonTwo,
  onPressButtonThree,
  buttonOneTitle,
  buttonTwoTitle,
  buttonThreeTitle,
  buttonThreeColor,
  fontSize,
  inputDisplay,
  isTrimming,
  buttonOneDisplay,
  buttonTwoDisplay,
  buttonThreeDisplay,
  borderColor,
  borderWidth,
}) => {
  const styles = {
    renderModal: {
      flex: 1,
      paddingTop: 0,
      backgroundColor: 'rgba(52, 52, 52, 0.8)',
      justifyContent: 'center',
      fontFamily: 'brown-regular',
    },
    renderModalHeader: {
      fontSize,
      textAlign: 'center',
      marginBottom: 20,
      fontFamily: 'brown-regular',
    },
    renderSubTitle: {
      fontSize: 24,
      textAlign: 'center',
      marginBottom: 20,
      display: subTitleDisplay,
    },
    textInput: {
      height: 40,
      borderColor: borderColor || 'gray',
      borderWidth: borderWidth || 1,
      padding: 5,
      display: inputDisplay,
      fontFamily: 'brown-regular',
    },
  };
  const {
    renderModal,
    renderModalHeader,
    renderSubTitle,
    textInput,
  } = styles;
  { console.log(value);


    return (
      <Modal transparent visible={visible} animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" enabled>
          <View style={renderModal}>
            <Card>
              <Text style={renderModalHeader}>{headerTitle}</Text>
              <Text style={renderSubTitle}>{subTitle}</Text>
              <TextInput
                style={textInput}
                onChangeText={onChangeText}
                value={value}
                placeholder="Type Here..."
              />
              <CustomButton
                onPressButton={onPressButtonOne}
                buttonTitle={buttonOneTitle}
                buttonDisplay={buttonOneDisplay}
                backgroundColor="#4caf50"
              />
              <CustomButton
                onPressButton={onPressButtonTwo}
                buttonTitle={buttonTwoTitle}
                buttonDisplay={buttonTwoDisplay}
                backgroundColor="red"
              />
              <CustomButton
                onPressButton={onPressButtonThree}
                buttonTitle={buttonThreeTitle}
                buttonDisplay={buttonThreeDisplay}
                backgroundColor={buttonThreeColor}
              />
              {isTrimming ? (
                <ActivityIndicator animating={isTrimming} size="large" color="#e76477" />
              ) : null}
            </Card>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }
};

CustomModal.propTypes = {
  headerTitle: PropTypes.string,
  borderColor: PropTypes.string,
  borderWidth: PropTypes.number,
  buttonOneTitle: PropTypes.string,
  buttonTwoTitle: PropTypes.string,
  buttonThreeTitle: PropTypes.string,
  buttonThreeColor: PropTypes.string,
  inputDisplay: PropTypes.string,
  fontSize: PropTypes.number,
  value: PropTypes.string,
  onChangeText: PropTypes.func,
  onPressButtonOne: PropTypes.func,
  onPressButtonTwo: PropTypes.func,
  onPressButtonThree: PropTypes.func,
  visible: PropTypes.bool,
  subTitle: PropTypes.string,
  subTitleDisplay: PropTypes.string,
  isTrimming: PropTypes.bool,
  buttonOneDisplay: PropTypes.string,
  buttonTwoDisplay: PropTypes.string,
  buttonThreeDisplay: PropTypes.string,
};

export default CustomModal;
