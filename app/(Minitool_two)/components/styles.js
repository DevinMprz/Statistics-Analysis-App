import { StyleSheet } from 'react-native';

export const dotPlotStyles = StyleSheet.create({
  wrapper: { alignItems: 'center', paddingVertical: 16, width: '100%' },
  chartsContainer: { flexDirection: 'column', width: '100%', alignItems: 'center' },
  panel: { alignItems: 'center', width: '100%', marginBottom: 15 },
  panelTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
  controlsBox: {
    width: '95%',
    alignItems: 'center',
    marginTop: 20,
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
    width: '100%',
    paddingHorizontal: 5,
  },
  controlLabel: { fontSize: 14, marginRight: 8 },
  numericInput: {
    borderWidth: 1,
    borderColor: 'gray',
    paddingHorizontal: 8,
    paddingVertical: 5,
    width: 70,
    marginLeft: 10,
  },
});

export const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30,
    backgroundColor: 'white',
    marginRight: 10,
  },
  inputAndroid: {
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    color: 'black',
    paddingRight: 30,
    backgroundColor: 'white',
    marginRight: 10,
  },
});
