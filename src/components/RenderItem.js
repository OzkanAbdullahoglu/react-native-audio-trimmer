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
import PropTypes from 'prop-types';
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
      return item.uri ? (
        <View>
          <TouchableHighlight>
            <ListItem
              title={item.name}
              initialNumToRender={8}
              containerStyle={styles.listItem}
              titleStyle={styles.title}
              fontFamily="brown-regular"
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
                iconStyle: [styles.iconStyle, { marginRight: -10 }],
              }}
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
      ) : null;
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

RenderItem.propTypes = {
  item: PropTypes.object,
  navigation: PropTypes.object,
  isCheckedListItem: PropTypes.func,
  setSelectedItem: PropTypes.func,
  index: PropTypes.number,

};

export default compose(withRedux)(RenderItem);

const styles = StyleSheet.create({
  iconStyle: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingRight: 20,
    paddingLeft: 20,
    marginVertical: -13,
    marginLeft: -13,
  },
  listItem: {
    borderBottomWidth: 1,
  },
  title: {
    fontFamily: 'brown-regular',
  },
});
