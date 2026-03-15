import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  Alert, ScrollView,
  StyleSheet, Text,
  TouchableOpacity,
  View
} from 'react-native';

const PENALTY_PER_DAY = 2; 
const BORROW_DURATION_DAYS = 7;

export default function App() {
  const [inventory, setInventory] = useState([
    { id: '1', title: 'Abbey Road', artist: 'The Beatles', copies: 5 },
    { id: '2', title: 'Thriller', artist: 'Michael Jackson', copies: 2 },
    { id: '3', title: 'Random Access Memories', artist: 'Daft Punk', copies: 1 },
  ]);
  const [borrowedList, setBorrowedList] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalBorrowedCount, setTotalBorrowedCount] = useState(0);

  useEffect(() => {
    const loadAppData = async () => {
      try {
        const savedInv = await AsyncStorage.getItem('@inventory');
        const savedBor = await AsyncStorage.getItem('@borrowed');
        const savedInc = await AsyncStorage.getItem('@income');
        const savedTotal = await AsyncStorage.getItem('@total_count');

        if (savedInv) setInventory(JSON.parse(savedInv));
        if (savedBor) setBorrowedList(JSON.parse(savedBor));
        if (savedInc) setTotalIncome(JSON.parse(savedInc));
        if (savedTotal) setTotalBorrowedCount(JSON.parse(savedTotal));
      } catch (e) {
        console.log("Error loading data");
      }
    };
    loadAppData();
  }, []);

  useEffect(() => {
    const saveAppData = async () => {
      try {
        await AsyncStorage.setItem('@inventory', JSON.stringify(inventory));
        await AsyncStorage.setItem('@borrowed', JSON.stringify(borrowedList));
        await AsyncStorage.setItem('@income', JSON.stringify(totalIncome));
        await AsyncStorage.setItem('@total_count', JSON.stringify(totalBorrowedCount));
      } catch (e) {
        console.log("Error saving data");
      }
    };
    saveAppData();
  }, [inventory, borrowedList, totalIncome, totalBorrowedCount]);

  const borrowCD = (cd) => {
    if (cd.copies <= 0) {
      Alert.alert("Notice", "CD not available.");
      return;
    }

    const today = new Date();
    const dueDate = new Date();
    dueDate.setDate(today.getDate() - 2);

    const newEntry = {
      borrowId: Math.random().toString(),
      cdId: cd.id,
      title: cd.title,
      borrower: "Juan Dela Cruz",
      borrowDate: today.toDateString(),
      dueDate: dueDate.toISOString(),
    };

    setInventory(inventory.map(item => 
      item.id === cd.id ? { ...item, copies: item.copies - 1 } : item
    ));
    setBorrowedList([...borrowedList, newEntry]);
    setTotalBorrowedCount(prev => prev + 1);
  };

  const returnCD = (entry) => {
    const today = new Date();
    const due = new Date(entry.dueDate);
    let penalty = 0;

    if (today > due) {
      const diffTime = Math.abs(today - due);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      penalty = diffDays * PENALTY_PER_DAY;
    }

    setInventory(inventory.map(item => 
      item.id === entry.cdId ? { ...item, copies: item.copies + 1 } : item
    ));
    setBorrowedList(borrowedList.filter(item => item.borrowId !== entry.borrowId));
    setTotalIncome(prev => prev + penalty);

    Alert.alert("Success", penalty > 0 ? `Returned with PHP ${penalty} penalty.` : "Returned on time!");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.mainTitle}>Entera CD Library Manager</Text>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Income</Text>
          <Text style={styles.statValue}>PHP {totalIncome}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>All-time Borrows</Text>
          <Text style={styles.statValue}>{totalBorrowedCount}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeader}>Available Inventory</Text>
        {inventory.map(item => (
          <View key={item.id} style={styles.cdRow}>
            <View>
              <Text style={styles.titleText}>{item.title}</Text>
              <Text style={styles.subText}>{item.artist} • {item.copies} available</Text>
            </View>
            <TouchableOpacity 
              style={[styles.btn, item.copies === 0 && {backgroundColor: '#bdc3c7'}]}
              onPress={() => borrowCD(item)}
              disabled={item.copies === 0}
            >
              <Text style={styles.btnText}>Borrow</Text>
            </TouchableOpacity>
          </View>
        ))}

        <Text style={[styles.sectionHeader, {marginTop: 30}]}>Borrowed CDs</Text>
        {borrowedList.length === 0 && <Text style={styles.emptyText}>No active records.</Text>}
        {borrowedList.map(entry => {
          const today = new Date();
          const due = new Date(entry.dueDate);
          let currentPenalty = 0;
          if (today > due) {
             const diffTime = Math.abs(today - due);
             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
             currentPenalty = diffDays * PENALTY_PER_DAY;
          }

          return (
            <View key={entry.borrowId} style={styles.borrowedRow}>
              <View style={{flex: 1}}>
                <Text style={styles.titleText}>{entry.title}</Text>
                <Text style={styles.subText}>Borrower: {entry.borrower}</Text>
                <Text style={styles.dateText}>Due: {new Date(entry.dueDate).toDateString()}</Text>
                {currentPenalty > 0 && <Text style={styles.penaltyText}>Penalty: PHP {currentPenalty}</Text>}
              </View>
              <TouchableOpacity style={styles.returnBtn} onPress={() => returnCD(entry)}>
                <Text style={styles.btnText}>Return</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 25, backgroundColor: '#f4f7f6', paddingTop: 60 },
  mainTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#2c3e50', textAlign: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  statItem: { backgroundColor: '#fff', padding: 15, borderRadius: 15, width: '48%', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  statLabel: { fontSize: 11, color: '#95a5a6', textTransform: 'uppercase', letterSpacing: 1 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#27ae60', marginTop: 5 },
  sectionHeader: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#34495e' },
  cdRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 18, borderRadius: 12, marginBottom: 12, elevation: 2 },
  borrowedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 18, borderRadius: 12, marginBottom: 12, borderLeftWidth: 6, borderLeftColor: '#e74c3c', elevation: 2 },
  titleText: { fontSize: 17, fontWeight: '700', color: '#2c3e50' },
  subText: { fontSize: 14, color: '#7f8c8d', marginTop: 2 },
  dateText: { fontSize: 12, color: '#d35400', marginTop: 5, fontWeight: '500' },
  penaltyText: { fontSize: 12, color: '#c0392b', fontWeight: 'bold', marginTop: 2 },
  emptyText: { textAlign: 'center', color: '#bdc3c7', marginTop: 20, fontStyle: 'italic' },
  btn: { backgroundColor: '#3498db', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  returnBtn: { backgroundColor: '#e67e22', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});