/* eslint-disable linebreak-style */
import React from 'react';
import {
  StyleSheet,
  View,
  TouchableHighlight,
  Text,
} from 'react-native';
import { ListItem } from 'react-native-elements';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import PlayerContainer from '../components/PlayerContainer';
import { mainActions, getDataURI, checkSelectedListItems } from '../reducers';

class RenderItem extends React.Component {
    state = {
      playerContainer: false,
    }

    shouldComponentUpdate(nextProps, nextState) {
      const {
        playerContainer,
      } = this.state;
      const { 
        item,
        index,
        navigation,
        isCheckedListItem,
        setSelectedItem,
      } = this.props;
      return (
        item !== nextProps.item ||
        index !== nextProps.index ||
        navigation !== nextProps.navigation ||
        isCheckedListItem !== nextProps.isCheckedListItem ||
        playerContainer !== nextState.playerContainer ||
        setSelectedItem !== nextProps.setSelectedItem
      );
    }

    togglePlayerContainer = () => this.setState({ playerContainer: !this.state.playerContainer });
    counter = (index) => <Text style={{ color: 'blue', fontWeight: 'bold', fontSize: 16 }}>{index + 1})</Text>
    render() {
      const {
        item,
        navigation,
        isCheckedListItem,
        setSelectedItem,
      } = this.props;
      return (
        <View>
          <TouchableHighlight>
            <ListItem
              title={item.name}
              initialNumToRender={8}
              rightIcon={{
                name: 'play-circle',
                color: '#e47a89',
                type: 'font-awesome',
                size: 32,
                onPress: () => {
                  navigation.navigate('File', {
                    totalDurationProp: item.totalDuration,
                    title: item.name,
                    data: item,
                  });
                },
              }}
              /* subtitle={item.type}*/
              leftIcon={{
                name: `checkbox-blank-circle${isCheckedListItem(item.id)}`,
                type: 'material-community',
                color: '#e47a89',
                size: 32,
                iconStyle: styles.iconStyle,
                onPress: () => setSelectedItem(item.id),
              }}
              onPress={this.togglePlayerContainer}
            />
          </TouchableHighlight>
          {this.state.playerContainer ? (
            <PlayerContainer fileUri={item.uri} />
          ) : null
          }
        </View>
      );
    }
}

const mapStateToProps = (store) => ({
  isData: getDataURI(store),
  isCheckedListItem: checkSelectedListItems(store),
});

const withRedux = connect(
  mapStateToProps,
  { ...mainActions }
);

export default compose(withRedux)(RenderItem);

const styles = StyleSheet.create({
  container: {
    paddingBottom: 60,
    backgroundColor: '#f0efef',
  },
  renderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 40,
    borderColor: '#CED0CE',
    fontSize: 24,
  },
  renderSeparator: {
    height: 1,
    paddingVertical: 0,
    width: '100%',
    backgroundColor: '#CED0CE',
  },
  buttonBlue: {
    borderRadius: 0,
    marginLeft: 0,
    marginRight: 0,
    marginBottom: 0,
  },
  buttonRed: {
    backgroundColor: 'red',
    borderRadius: 0,
    marginLeft: 0,
    marginRight: 0,
    marginBottom: 0,
  },
  iconStyle: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingRight: 20,
    paddingLeft: 20,
    marginVertical: -13,
    marginLeft: -13,
  },
});