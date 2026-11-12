import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

// Expo Go에는 AndroidWidget 네이티브 모듈이 없으므로 앱 화면만 시작합니다.
if (Platform.OS === 'android' && !isRunningInExpoGo()) {
  const { registerTodoWidgetHandler } = require('@/widgets/todo-widget-handler') as typeof import('@/widgets/todo-widget-handler');
  registerTodoWidgetHandler();
}

require('expo-router/entry');
