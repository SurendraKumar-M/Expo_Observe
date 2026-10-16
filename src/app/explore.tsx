import { useObserve } from "expo-observe";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Button, StyleSheet, Text, View } from "react-native";

export default function Explore() {
  const router = useRouter();
  const { markInteractive } = useObserve();
  useEffect(() => {
    markInteractive();
  }, [markInteractive]);
  return (
    <View style={styles.container}>
      <Button title="Go Back" onPress={() => router.back()} />
      <Text>Explore</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#a82222',
  },

})