/* eslint linebreak-style: ["error", "windows"]*/
import React from 'react';
import { Modal, View, TextInput, KeyboardAvoidingView } from 'react-native';
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
  buttonTwoDisplay,
  buttonThreeDisplay,
}) => {
  const styles = {
    renderModal: {
      flex: 1,
      paddingTop: 0,
      backgroundColor: 'rgba(52, 52, 52, 0.8)',
      justifyContent: 'center',
    },
    renderModalHeader: {
      fontSize,
      textAlign: 'center',
      marginBottom: 20,
    },
    renderSubTitle: {
      fontSize: 24,
      textAlign: 'center',
      marginBottom: 20,
      display: subTitleDisplay,
    },
    textInput: {
      height: 40,
      borderColor: 'gray',
      borderWidth: 1,
      padding: 5,
      display: inputDisplay,
    },
  };
  const {
    renderModal,
    renderModalHeader,
    renderSubTitle,
    textInput,
  } = styles;
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
          </Card>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

CustomModal.propTypes = {
  headerTitle: PropTypes.string,
  buttonOneTitle: PropTypes.string,
  buttonTwoTitle: PropTypes.string,
  inputDisplay: PropTypes.string,
  buttonTwoDisplay: PropTypes.string,
  fontSize: PropTypes.number,
  value: PropTypes.string,
  onChangeText: PropTypes.func,
  onPressButtonOne: PropTypes.func,
  onPressButtonTwo: PropTypes.func,
  visible: PropTypes.bool,
};

export default CustomModal;
