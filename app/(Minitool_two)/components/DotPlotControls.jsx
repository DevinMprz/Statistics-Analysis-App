import React from 'react';
import { View, Text, Switch, Button, TextInput } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';

import { GROUP_MODES, GROUP_MODE_OPTIONS } from '../lib/grouping';
import { dotPlotStyles as s, pickerSelectStyles } from './styles';

/**
 * Pure presentational controls for the DotPlot. All behaviour is delegated
 * to callbacks supplied by the parent (typically wired to useDotPlotTools).
 */
const DotPlotControls = React.memo(function DotPlotControls({
  state,
  actions,
  hasAnyLines,
}) {
  return (
    <View style={s.controlsBox}>
      <View style={s.controlRow}>
        <Text style={s.controlLabel}>Groups:</Text>
        <RNPickerSelect
          onValueChange={(v) => v && actions.setGroupMode(v)}
          items={GROUP_MODE_OPTIONS}
          style={pickerSelectStyles}
          value={state.groupMode}
          placeholder={{}}
        />
      </View>

      {state.groupMode === GROUP_MODES.FIXED_INTERVAL && (
        <View style={s.controlRow}>
          <Text style={s.controlLabel}>Interval width:</Text>
          <TextInput
            style={s.numericInput}
            keyboardType="decimal-pad"
            value={state.intervalWidthInput}
            onChangeText={actions.setIntervalWidth}
          />
        </View>
      )}

      {state.groupMode === GROUP_MODES.FIXED_GROUP_SIZE && (
        <View style={s.controlRow}>
          <Text style={s.controlLabel}>Elements per group:</Text>
          <TextInput
            style={s.numericInput}
            keyboardType="numeric"
            value={state.fixedGroupSizeInput}
            onChangeText={actions.setFixedGroupSize}
          />
        </View>
      )}

      <View style={s.controlRow}>
        <Text style={s.controlLabel}>Show Data: </Text>
        <Switch value={state.showData} onValueChange={actions.setShowData} />
      </View>

      <View style={s.controlRow}>
        <Text style={s.controlLabel}>Value tool: </Text>
        <Switch
          value={state.valueToolEnabled}
          onValueChange={(v) => actions.setValueToolEnabled(v)}
        />
      </View>

      <View style={s.controlRow}>
        <Text style={s.controlLabel}>Split Colors: </Text>
        <Switch
          value={state.splitCharts}
          onValueChange={actions.setSplitCharts}
        />
      </View>

      <View style={s.controlRow}>
        <Button
          title="Clear All Lines"
          onPress={actions.clearAll}
          disabled={!hasAnyLines}
        />
      </View>
    </View>
  );
});

export default DotPlotControls;
