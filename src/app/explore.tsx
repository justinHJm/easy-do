import { Redirect } from 'expo-router';

// Keep old links working without showing the Expo example screen.
export default function ExploreScreen() {
  return <Redirect href="/" />;
}
