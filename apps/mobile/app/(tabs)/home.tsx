import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const restaurants = [
  {
    id: '1',
    name: 'Eazie Delft',
    image: 'https://via.placeholder.com/400x200', 
  },
  {
    id: '2',
    name: 'Hayai Sushi',
    image: 'https://via.placeholder.com/400x200', 
  },
  {
    id: '3',
    name: 'Burger Place',
    image: 'https://via.placeholder.com/400x200', 
  },
  {
    id: '4',
    name: 'Pizza Palace',
    image: 'https://via.placeholder.com/400x200', 
  },
];

export default function HomeScreen() {
  const renderRestaurantCard = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.restaurantCard}>
      <Image source={{ uri: item.image }} style={styles.restaurantImage} />
      <View style={styles.restaurantDetails}>
        <Text style={styles.restaurantName}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Let's Eat</Text>
      </View>
      <FlatList
        data={restaurants}
        renderItem={renderRestaurantCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.restaurantList}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  restaurantList: {
    padding: 16,
  },
  restaurantCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  restaurantImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  restaurantDetails: {
    padding: 16,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
