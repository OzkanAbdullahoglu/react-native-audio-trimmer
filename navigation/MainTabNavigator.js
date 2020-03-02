import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator } from 'react-navigation-stack';
import { createBottomTabNavigator } from 'react-navigation-tabs';

import TabBarIcon from '../components/TabBarIcon';
import HomeScreen from '../screens/HomeScreen';
import LinksScreen from '../screens/LinksScreen';
import FileScreen from '../screens/FileScreen';

const config = Platform.select({
  web: { headerMode: 'screen' },
  default: {},
});

const HomeStack = createStackNavigator(
  {
    Home: HomeScreen,
  },
  config,
);

HomeStack.navigationOptions = {
  tabBarLabel: 'Recording',
  tabBarIcon: ({ focused }) => (
    <TabBarIcon
      focused={focused}
      name={
        Platform.OS === 'ios'
          ? 'ios-recording'
          : 'md-recording'
      }
    />
  ),
};

HomeStack.path = '';

const LinksStack = createStackNavigator(
  {
    Links: LinksScreen,
    File: FileScreen,
  },
  config,
  {
    navigationOptions: {
      gestureEnabled: false,
    },
  }
);

LinksStack.navigationOptions = {
  tabBarLabel: 'Files',

  tabBarIcon: ({ focused }) => (
    <TabBarIcon focused={focused} name={Platform.OS === 'ios' ? 'ios-folder' : 'md-folder'} />
  ),
};

LinksStack.path = '';


const tabNavigator = createBottomTabNavigator({
  HomeStack,
  LinksStack,
});

tabNavigator.path = '';

export default tabNavigator;
