import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@habit_tracker_data';

const INITIAL_HABITS = [
  { id: '1', name: '💧 Drink Water', description: 'Drink 8 glasses', completed: false },
  { id: '2', name: '🏃 Exercise', description: '30 minutes workout', completed: false },
  { id: '3', name: '📚 Read', description: 'Read for 20 minutes', completed: false },
  { id: '4', name: '🧘 Meditate', description: '10 minutes meditation', completed: false },
  { id: '5', name: '🥗 Eat Healthy', description: 'Include vegetables', completed: false },
  { id: '6', name: 'School Assignments', description: 'Complete class works or assignments', completed: false }
];

export default function App() {
  const [habits, setHabits] = useState(INITIAL_HABITS);
  const [currentDate, setCurrentDate] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [habitName, setHabitName] = useState('');
  const [habitDescription, setHabitDescription] = useState('');

  useEffect(() => {
    loadHabits();
    updateDate();
  }, []);

  useEffect(() => {
    saveHabits();
  }, [habits]);

  const updateDate = () => {
    const now = new Date();
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    setCurrentDate(now.toLocaleDateString('en-US', options));
  };

  const loadHabits = async () => {
    try {
      const savedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedData !== null) {
        const { habits: savedHabits, date: savedDate } = JSON.parse(savedData);
        const today = new Date().toDateString();

        if (savedDate === today) {
          setHabits(savedHabits);
        } else {
          const resetHabits = savedHabits.map(habit => ({
            ...habit,
            completed: false
          }));
          setHabits(resetHabits);
        }
      }
    } catch (error) {
      console.error('Error loading habits:', error);
    }
  };

  const saveHabits = async () => {
    try {
      const dataToSave = {
        habits,
        date: new Date().toDateString()
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Error saving habits:', error);
    }
  };

  const toggleHabit = (id) => {
    setHabits(prev =>
      prev.map(habit =>
        habit.id === id
          ? { ...habit, completed: !habit.completed }
          : habit
      )
    );
  };

  const openAddHabit = () => {
    setEditingHabit(null);
    setHabitName('');
    setHabitDescription('');
    setShowModal(true);
  };

  const openEditHabit = (habit) => {
    setEditingHabit(habit);
    setHabitName(habit.name);
    setHabitDescription(habit.description);
    setShowModal(true);
  };

  const saveHabit = () => {
    if (!habitName.trim()) {
      Alert.alert('Error', 'Please enter a habit name');
      return;
    }

    if (editingHabit) {
      setHabits(prev =>
        prev.map(h =>
          h.id === editingHabit.id
            ? { ...h, name: habitName, description: habitDescription }
            : h
        )
      );
    } else {
      const newHabit = {
        id: Date.now().toString(),
        name: habitName,
        description: habitDescription,
        completed: false,
      };
      setHabits(prev => [...prev, newHabit]);
    }

    setShowModal(false);
  };

  const deleteHabit = (id) => {
    Alert.alert(
      'Delete Habit',
      'Are you sure you want to delete this habit?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setHabits(prev => prev.filter(h => h.id !== id));
          }
        }
      ]
    );
  };

  const resetDefaults = () => {
    Alert.alert(
      'Reset to Defaults',
      'This will delete all your habits and restore default habits. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setHabits(INITIAL_HABITS);
          }
        }
      ]
    );
  };

  const completedCount = habits.filter(h => h.completed).length;
  const percentage = habits.length > 0
    ? Math.round((completedCount / habits.length) * 100)
    : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Habit Tracker</Text>
        <Text style={styles.headerDate}>{currentDate}</Text>
        <Text style={styles.headerProgress}>
          {completedCount} / {habits.length} completed ({percentage}%)
        </Text>

        <View style={styles.headerButtonContainer}>
          <TouchableOpacity style={styles.headerButton} onPress={openAddHabit}>
            <Text style={styles.headerButtonText}>+ Add Habit</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerButton} onPress={resetDefaults}>
            <Text style={styles.headerButtonText}>Reset Defaults</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.habitList}>
        {habits.map(habit => (
          <HabitItem
            key={habit.id}
            habit={habit}
            onToggle={() => toggleHabit(habit.id)}
            onEdit={() => openEditHabit(habit)}
            onDelete={() => deleteHabit(habit.id)}
          />
        ))}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingHabit ? 'Edit Habit' : 'Add Habit'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Habit Name"
              value={habitName}
              onChangeText={setHabitName}
            />

            <TextInput
              style={styles.input}
              placeholder="Description"
              value={habitDescription}
              onChangeText={setHabitDescription}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveHabit}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function HabitItem({ habit, onToggle, onEdit, onDelete }) {
  return (
    <View style={[
      styles.habitItem,
      habit.completed && styles.habitItemCompleted
    ]}>
      <View style={styles.habitInfo}>
        <Text style={[
          styles.habitName,
          habit.completed && styles.habitNameCompleted
        ]}>
          {habit.name}
        </Text>

        <Text style={styles.habitDescription}>
          {habit.description}
        </Text>

        <View style={styles.actionRow}>
          <TouchableOpacity onPress={onEdit}>
            <Text style={styles.editText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onDelete}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.toggleButton,
          habit.completed && styles.toggleButtonActive
        ]}
        onPress={onToggle}
      >
        <View style={[
          styles.toggleCircle,
          habit.completed && styles.toggleCircleActive
        ]} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  header: { 
    backgroundColor: '#061603', 
    padding: 30, 
    paddingTop: 60 
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: 'white', 
    marginBottom: 5 
  },
  headerDate: { 
    fontSize: 16, 
    color: 'rgba(255,255,255,0.9)', 
    marginBottom: 10 
  },
  headerProgress: { 
    fontSize: 14, 
    color: 'rgba(255,255,255,0.8)' 
  },

  headerButtonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },

  headerButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },

  headerButtonText: {
    color: 'white',
    fontWeight: '600',
  },

  habitList: { 
    flex: 1, 
    padding: 20 
  },

  habitItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  habitItemCompleted: { 
    backgroundColor: '#e8f5e9' 
  },
  habitInfo: { 
    flex: 1 
  },
  habitName: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#333' 
  },
  habitNameCompleted: { 
    textDecorationLine: 'line-through', 
    color: '#4caf50' 
  },
  habitDescription: { 
    fontSize: 14, 
    color: '#666', 
    marginTop: 5 
  },
  actionRow: { 
    flexDirection: 'row', 
    gap: 15, 
    marginTop: 10 
  },
  editText: { 
    color: '#2196f3', 
    fontWeight: '500' 
  },
  deleteText: { 
    color: '#f44336', 
    fontWeight: '500' 
  },

  toggleButton: {
    width: 60,
    height: 30,
    backgroundColor: '#ccc',
    borderRadius: 15,
    justifyContent: 'center',
    padding: 3,
  },

  toggleButtonActive: { 
    backgroundColor: '#4caf50' 
  },
  toggleCircle: { 
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    backgroundColor: 'white' 
  },
  toggleCircleActive: { 
    alignSelf: 'flex-end' 
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    backgroundColor: 'white',
    width: '90%',
    padding: 25,
    borderRadius: 20,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },

  modalButtons: { 
    flexDirection: 'row', 
    gap: 10 },

  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },

  cancelButton: { 
    backgroundColor: '#ccc' 
  },
  saveButton: { 
    backgroundColor: '#4caf50' 
  },
  buttonText: { color: 
    'white', 
    fontWeight: '600' 
  },
});
