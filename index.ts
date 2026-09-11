import { registerTodoWidgetHandler } from '@/widgets/todo-widget-handler';

registerTodoWidgetHandler();

// Expo Router 진입점을 유지하면서 Android 위젯 작업도 등록합니다.
import 'expo-router/entry';
