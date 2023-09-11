import { useState } from 'react';
import {NavigationContainer} from '@react-navigation/native'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import { Alert, StyleSheet, View, TextInput, Button, FlatList, Text, TouchableOpacity } from 'react-native'
import { app, database } from './firebase.js'
import { collection, addDoc, deleteDoc, updateDoc, doc, getDoc } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore'

export default function App() {
  const Stack = createNativeStackNavigator()
  return (
  <NavigationContainer>
    <Stack.Navigator initialRouteName='Noter'>
      <Stack.Screen name='Noter' component={Page1} />
      <Stack.Screen name='Page2' component={Page2} />
    </Stack.Navigator>
  </NavigationContainer>
  )
}

const Page1 = ({navigation, route}) => {
  const messageBack = route.params?.messageBack

  const [addedTitle, setAddedTitle] = useState('')
  const [addedContent, setAddedContent] = useState('')
  //useState er react-native for et hook, som kan hægte sig på noget - som man gøre brug af

  const [values, loading, error] = useCollection(collection(database, "notes"))
  const data = values?.docs.map((doc) => ({
    ...doc.data(),
    id: doc.id
   }))

  async function addButtonPressed() {
    try {
      await addDoc(collection(database, "notes"), {
        title: addedTitle,
        content: addedContent
      })
      setAddedTitle('')
      setAddedContent('')
    
    } catch(err) {
      console.log("Error in DB: " + err);
    }

  }

  function deleteNote(id) {
    Alert.alert(
      'Slet note?',
      '',
      [
        {
          text: 'TILBAGE',
          style: 'cancel',
        },
        {
          text: 'SLET',
          style: 'destructive',
          onPress: async () => {
            // Create a copy of the noteList and remove the note at the specified id
            await deleteDoc(doc(database, "notes", id))
          },
        },
      ]
    );
  };

  return (
    <View style={styles.page1Container}>
      <View style={styles.listContainer}>
        <FlatList
          data={data}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate('Page2', { note: item })}>
              <View style={styles.noteItem}>
                <Text style={styles.noteText}>{item.title}</Text>
                <TouchableOpacity style={styles.deleteButton} onPress={() => deleteNote(item.id)}>
                  <Text style={styles.deleteButtonText}>X</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.inputField}
          placeholder='Note Title'
          value={addedTitle}
          onChangeText={(txt) => setAddedTitle(txt)}
        />
      </View>

     <View style={styles.inputContainer}>
        <TextInput
          style={styles.inputField}
          placeholder='Note Content'
          value={addedContent}
          onChangeText={(txt) => setAddedContent(txt)}
          onBlur= {(e) => e.target.setNativeProps({numberOfLines: 1})}
          onFocus={(e) => e.target.setNativeProps({numberOfLines: 15})}
          multiline={true}

        />
      </View>

      <View style={styles.addBottunContainer}>
        <Button title='Add' onPress={addButtonPressed} />
      </View>
    </View>
  );
}

const Page2 = ({ route, navigation }) => {
  let note = route.params?.note
  const [editedTitle, setEditedTitle] = useState('')
  const [editedContent, setEditedContent] = useState('')
  const [editObj, setEditObj] = useState(null)

  function viewUpdateDialog(item) {
    setEditObj(item)
  }

  async function saveUpdate() {
    console.log(editedTitle);
    console.log(editedContent);

    await updateDoc(doc(database, "notes", editObj.id), {
      title: (editedTitle) ? editedTitle : editObj.title,
      content: (editedContent) ? editedContent: editObj.content
    })

    setEditedContent("")
    setEditedTitle("")
    setEditObj(null)
    navigation.goBack()

  }
  
  return (
        <View style={styles.page2Container}>

          { !editObj &&

            <View style={styles.contentContainer}>
              <Text style={styles.noteTitle}>{note.title}</Text>
              <Text style={styles.noteText}>{note.content}</Text>
              <Button title='Rediger' onPress={() => viewUpdateDialog(note)} />
            </View>
            }
            { editObj &&
            <View style={styles.contentContainer}>
              <TextInput 
                defaultValue={editObj.title} 
                onChangeText={(txt) => setEditedTitle(txt)}
                style={styles.noteTitle}
              />
              <TextInput 
                defaultValue={editObj.content} 
                onChangeText={(txt) => setEditedContent(txt)}
                style={styles.noteText}
                multiline={true}
              />
              <Button title='Gem' onPress={saveUpdate} />
            </View>
            }
        </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3EFEF', // Light beige background
    alignItems: 'stretch',
    justifyContent: 'flex-end',
  },
  page1Container: {
    flex: 1,
    backgroundColor: '#F3EFEF',
    alignItems: 'stretch',
    justifyContent: 'flex-end',
  },
  page2Container: {
    flex: 1,
    backgroundColor: '#F3EFEF', // Light beige background
    paddingTop: 20, // Add space to the top
    alignItems: 'center',
  },
  contentContainer: {
    width: '80%',
    padding: 20,
    borderColor: '#D0B89C', // Thin border color
    borderWidth: 1, // Thin border width
    borderRadius: 5, // Rounded corners
    backgroundColor: '#FFFFFF', // White background for content
  },
  addButtonContainer: {
    flex: 1, // This makes the button fill out the entire row
    padding: 10,
  },
  noteText: {
    fontSize: 18,
    lineHeight: 24,
    color: '#333', // Dark text color
  },
  listContainer: {
    flex: 1,
    paddingTop: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#D0B89C', // Warm brownish border color
  },
  inputField: {
    flex: 1,
    marginRight: 10,
    color: '#7E6158', // Rusty brown text color
    textAlignVertical: 'top', // Place text at the top
  },
  // noteItem: {
  //   padding: 10,
  //   borderBottomWidth: 1,
  //   borderColor: '#D0B89C',
  //   backgroundColor: '#F5E1C1', // Light orange background for notes
  // },
  noteTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',

  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#D0B89C',
    backgroundColor: '#F5E1C1', // Light orange background for notes
  },
  deleteButton: {
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    width: 30,
    alignSelf: 'stretch', // Make the button stretch to the top
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 10,
  },
});
