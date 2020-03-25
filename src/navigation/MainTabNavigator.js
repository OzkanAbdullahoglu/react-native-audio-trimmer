import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator } from 'react-navigation-stack';
import { createBottomTabNavigator } from 'react-navigation-tabs';
import PropTypes from 'prop-types';

import TabBarIcon from '../components/TabBarIcon';
import RecordScreen from '../screens/RecordScreen';
import ListScreen from '../screens/ListScreen';
import EditScreen from '../screens/EditScreen';

const config = Platform.select({
  web: { headerMode: 'screen' },
  default: {},
});

const HomeStack = createStackNavigator(
  {
    Home: RecordScreen,
  },
  config,
);

const appTabBarIcon = ({ focused }) => (
  <TabBarIcon
    focused={focused}
    name={
      Platform.OS === 'ios'
        ? 'ios-recording'
        : 'md-recording'
    }
  />
);

appTabBarIcon.propTypes = {
  focused: PropTypes.bool,
};

HomeStack.navigationOptions = {
  tabBarLabel: 'Recording',
  tabBarIcon: appTabBarIcon,
};

HomeStack.path = '';

const LinksStack = createStackNavigator(
  {
    Links: ListScreen,
    File: EditScreen,
  },
  config,
);

const linkTabBarIcon = ({ focused }) => (
  <TabBarIcon
    focused={focused}
    name={
      Platform.OS === 'ios'
        ? 'ios-folder'
        : 'md-folder'
    }
  />
);

linkTabBarIcon.propTypes = {
  focused: PropTypes.bool,
};

LinksStack.navigationOptions = {
  tabBarLabel: 'Files',
  tabBarIcon: linkTabBarIcon,
};

LinksStack.path = '';

const tabNavigator = createBottomTabNavigator({
  HomeStack,
  LinksStack,
});

tabNavigator.path = '';

export default tabNavigator;
