import { AppRegistry } from 'react-native';
import App from './App';  // 실제 앱 컴포넌트가 있는 파일 경로 (보통 App.js)
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
