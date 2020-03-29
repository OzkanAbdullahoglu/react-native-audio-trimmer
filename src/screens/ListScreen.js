import React from 'react';
import { FlatList,
  StyleSheet,
  View,
  TouchableHighlight,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import { SearchBar, Button } from 'react-native-elements';
import { NavigationEvents } from 'react-navigation';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import PropTypes from 'prop-types';
import escapeRegExp from 'escape-string-regexp';
import RenderItem from '../components/RenderItem';
import CustomModal from '../components/CustomModal';
import { mainActions, getDataURI, getAllIsSelectedBoolean, getSelectedItems } from '../reducers';

class ListScreen extends React.Component {
  static navigationOptions = {
    title: 'Files',
  };

  state = {
    searchQuery: '',
    isDeleteModal: false,
    isAlertModal: false,
  }

  shouldComponentUpdate(nextProps, nextState) {
    const {
      searchQuery,
      isDeleteModal,
      isAlertModal,
    } = this.state;
    const {
      navigation,
      isAllSelected,
      isData,
      selectedListItem,
    } = this.props;
    return (
      isData.length !== nextProps.isData.length ||
      isAllSelected !== nextProps.isAllSelected ||
      navigation !== nextProps.navigation ||
      selectedListItem !== nextProps.selectedListItem ||
      isDeleteModal !== nextState.isDeleteModal ||
      isAlertModal !== nextState.isAlertModal ||
      searchQuery !== nextState.searchQuery
    );
  }

  onDidBlur = () => {
    if (this.props.isAllSelected) {
      this.unSelectAllCombo();
    }
  }

  filterHandler = (text) => {
    this.setState({ searchQuery: text });
    this.filterUpToSearch();
  };

  filterUpToSearch = () => {
    const { isData } = this.props;
    const { searchQuery } = this.state;
    let filteredData;
    if (searchQuery) {
      const match = new RegExp(escapeRegExp(searchQuery), 'i');
      filteredData = isData.filter((filterOut) =>
        match.test(filterOut.name)
      );
    } else {
      filteredData = isData;
    }
    return filteredData;
  };

  keyExtractor = (item) => item.uri.split('')
    .slice(item.uri.indexOf('recording') + 10, item.uri.length - 4)
    .join('');


  unSelectAllCombo = () => {
    const { setUnSelectAll, setAllIsSelectedBoolean } = this.props;
    setUnSelectAll();
    setAllIsSelectedBoolean();
  };

  selectAllCombo = () => {
    const { setSelectAll, setAllIsSelectedBoolean } = this.props;
    setSelectAll();
    setAllIsSelectedBoolean();
  };

  callModal = () => {
    const { selectedListItem } = this.props;
    return (selectedListItem.length > 0
      ? this.setState({ isDeleteModal: true })
      : this.setState({ isAlertModal: true })
    );
  };
  removeData = () => {
    const { setRemovalData, setUnSelectAll } = this.props;
    setRemovalData();
    setUnSelectAll();
    this.setState({ isDeleteModal: false });
  };

  cancelModal = () => {
    if (this.state.isAlertModal) {
      this.setState({ isAlertModal: false });
    } else {
      this.setState({ isDeleteModal: false });
    }
  }

  renderItem = ({ item, index }) => (
    <RenderItem
      item={item}
      index={index}
      navigation={this.props.navigation}
    />
  );

  renderSeparator = () => <View style={styles.renderSeparator} />;
  renderFooter = () => {
    const {
      isAllSelected,
    } = this.props;

    return (
      <View style={styles.renderFooter}>
        <TouchableHighlight>
          {isAllSelected ? (
            <Button
              raised
              MaterialCommunityIcons={{ name: 'comment-outline' }}
              buttonStyle={styles.buttonBlue}
              titleStyle={styles.buttonTitleStyle}
              onPress={this.unSelectAllCombo}
              fontFamily="brown-regular"
              title="Unselect All"
            />
          ) : (
            <Button
              raised
              MaterialCommunityIcons={{ name: 'comment-outline' }}
              buttonStyle={styles.buttonBlue}
              titleStyle={styles.buttonTitleStyle}
              onPress={this.selectAllCombo}
              fontFamily="brown-regular"
              title="Select All"
            />
          )}
        </TouchableHighlight>
        <TouchableHighlight>
          <Button
            raised
            MaterialCommunityIcons={{ name: 'comment-outline' }}
            buttonStyle={styles.buttonRed}
            titleStyle={styles.buttonTitleStyle}
            onPress={this.callModal}
            fontFamily="brown-regular"
            title="Delete"
          />
        </TouchableHighlight>
      </View>
    );
  };

  render() {
    const {
      isData,
    } = this.props;

    return isData.length > 0 ? (
      <View style={styles.container}>
        <NavigationEvents
          onDidBlur={this.onDidBlur}
          onDidFocus={this.onDidBlur}
        />
        <View style={styles.listWrapper}>
          <FlatList
            ListHeaderComponent={
              <SearchBar
                placeholder="Type Here..."
                lightTheme
                round
                onChangeText={this.filterHandler}
                value={this.state.searchQuery}
                containerStyle={styles.searchBarContainer}
                inputContainerStyle={styles.inputContainer}
                inputStyle={styles.input}
              />
            }
            ItemSeparatorComponent={this.renderSeparator}
            data={this.filterUpToSearch()}
            renderItem={this.renderItem}
            keyExtractor={this.keyExtractor}
          />
          <CustomModal
            visible={this.state.isDeleteModal}
            headerTitle="Selected file will be removed!"
            fontSize={24}
            inputDisplay="none"
            subTitleDisplay="none"
            buttonThreeDisplay="none"
            onPressButtonOne={this.removeData}
            onPressButtonTwo={this.cancelModal}
            buttonOneTitle="Confirm"
            buttonTwoTitle="Cancel"
          />
          <CustomModal
            visible={this.state.isAlertModal}
            headerTitle="Please choose a file to remove!"
            inputDisplay="none"
            subTitleDisplay="none"
            buttonThreeDisplay="none"
            fontSize={24}
            onPressButtonOne={this.cancelModal}
            buttonOneTitle="Close"
            buttonTwoDisplay="none"
          />
        </View>
        <View style={styles.listFooter} >
          {this.renderFooter()}
        </View>
      </View>
    ) : null;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  listWrapper: {
    flex: 0.89,
  },
  searchBarContainer: {
    backgroundColor: '#e47a89',
  },
  inputContainer: {
    backgroundColor: '#fff',
  },
  input: {
    fontFamily: 'brown-regular',
  },
  renderSeparator: {
    height: 1,
    paddingVertical: 0,
    width: '100%',
    backgroundColor: '#CED0CE',
  },
  renderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#CED0CE',
    fontSize: 24,
  },
  listFooter: {
    flex: 0.11,
    justifyContent: 'space-between',
    borderColor: '#CED0CE',
    fontSize: 24,
  },
  buttonBlue: {
    backgroundColor: '#e47a89',
    borderRadius: 10,
    marginLeft: 0,
    marginRight: 0,
    marginBottom: 0,
  },
  buttonTitleStyle: {
    fontFamily: 'brown-regular',
    paddingTop: 0,
  },
  buttonRed: {
    backgroundColor: '#cb3837',
    borderRadius: 10,
    marginLeft: 0,
    marginRight: 0,
    marginBottom: 0,
  },
});

const mapStateToProps = (store) => ({
  isData: getDataURI(store),
  isAllSelected: getAllIsSelectedBoolean(store),
  selectedListItem: getSelectedItems(store),
});

const withRedux = connect(
  mapStateToProps,
  { ...mainActions }
);

ListScreen.propTypes = {
  setAllIsSelectedBoolean: PropTypes.func,
  setUnSelectAll: PropTypes.func,
  setSelectAll: PropTypes.func,
  setRemovalData: PropTypes.func,
  navigation: PropTypes.object,
  isAllSelected: PropTypes.bool,
  isData: PropTypes.array,
  selectedListItem: PropTypes.array,
};
export default compose(withRedux)(ListScreen);
