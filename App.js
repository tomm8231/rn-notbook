import { useState } from 'react';
import {NavigationContainer} from '@react-navigation/native'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import { Alert, StyleSheet, View, TextInput, Button, FlatList, Text, TouchableOpacity } from 'react-native';


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
  const index = route.params?.index

  const [addedTitle, setAddedTitle] = useState('')
  const [addedContent, setAddedContent] = useState('')
  const [noteList, setNoteList] = useState([])
  //useState er react-native for et hook, som kan hægte sig på noget - som man gøre brug af

  function addButtonPressed() {
    const newNote = {title: addedTitle, content: addedContent}
    setNoteList([...noteList, newNote])
    setAddedTitle('')
    setAddedContent('')
  }

  const handleNoteDelete = (index) => {
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
          onPress: () => {
            // Create a copy of the noteList and remove the note at the specified index
            const updatedNoteList = [...noteList];
            updatedNoteList.splice(index, 1);

            // Update the noteList state
            setNoteList(updatedNoteList);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.page1Container}>
      <View style={styles.listContainer}>
        <FlatList
          data={noteList.reverse()}
          renderItem={({ item, index }) => (
            <TouchableOpacity onPress={() => navigation.navigate('Page2', { note: item})}>
              <View style={styles.noteItem}>
                <Text style={styles.noteText}>{item.title}</Text>
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleNoteDelete(index)}>
                  <Text style={styles.deleteButtonText}>X</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item, index) => index.toString()}
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
  const { note } = route.params
  return (
    <View style={styles.page2Container}>
      <View style={styles.contentContainer}>
        <Text style={styles.noteTitle}>{note.title}</Text>
        <Text style={styles.noteText}>{note.content}</Text>
      </View>
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
