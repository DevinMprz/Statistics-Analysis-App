import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

/**
 * Collapsible "About The Charts" panel. Renders only the header until
 * expanded, so it doesn't pay any layout cost while closed.
 */
const LegendPanel = React.memo(function LegendPanel() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen((o) => !o)}
        style={styles.toggle}
      >
        <Text style={styles.toggleText}>
          {open ? '▼' : '►'} About The Charts
        </Text>
      </TouchableOpacity>
      {open && (
        <View style={styles.content}>
          <Text style={styles.title}>Scenario Analysis</Text>
          <Text style={styles.text}>
            <Text style={styles.bold}>What is this? </Text>
            These charts display data for different scenarios. By default,
            data points from <Text style={styles.bold}>before</Text> an event
            are shown in <Text style={[styles.bold, { color: 'blue' }]}>BLUE</Text>
            {' '}and points from <Text style={styles.bold}>after</Text> in{' '}
            <Text style={[styles.bold, { color: 'orange' }]}>ORANGE</Text>.
            Toggle <Text style={styles.bold}>Split Colors</Text> to view the
            datasets on separate panels.
          </Text>
          <Text style={styles.text}>
            <Text style={styles.bold}>Why is it useful? </Text>
            Comparing the two distributions helps surface the effect of the
            event — look for shifts in centre and spread.
          </Text>
          <Text style={styles.text}>
            <Text style={styles.bold}>What can you do?</Text>
            {'\n'}- Switch scenarios with the dropdown above the chart.
            {'\n'}- Toggle <Text style={styles.bold}>Show Data</Text> to hide
            or reveal the dots.
            {'\n'}- Pick a <Text style={styles.bold}>Groups</Text> mode to
            overlay statistical guide lines (median, quartiles, fixed
            interval, fixed group size).
            {'\n'}- Choose <Text style={styles.bold}>Create your own groups</Text>
            {' '}then tap the chart to drop draggable threshold lines. Counts
            between lines update live.
            {'\n'}- Enable the <Text style={styles.bold}>Value tool</Text> to
            drag a measurement marker across the axis.
            {'\n'}- Press <Text style={styles.bold}>Clear All Lines</Text> to
            reset.
          </Text>
        </View>
      )}
    </>
  );
});

const styles = StyleSheet.create({
  toggle: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginVertical: 10,
    alignItems: 'center',
    width: '95%',
    alignSelf: 'center',
  },
  toggleText: { fontSize: 16, fontWeight: 'bold', color: 'navy' },
  content: {
    width: '95%',
    alignSelf: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: 'navy',
    textAlign: 'center',
  },
  text: { fontSize: 14, lineHeight: 20, marginBottom: 8, color: '#333' },
  bold: { fontWeight: 'bold' },
});

export default LegendPanel;
