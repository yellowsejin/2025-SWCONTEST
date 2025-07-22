import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const HomeScreen = ({ setIsLoggedIn }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>홈 화면</Text>
      <Button title="로그아웃" onPress={() => setIsLoggedIn(false)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, marginBottom: 20 }
});

export default HomeScreen;
