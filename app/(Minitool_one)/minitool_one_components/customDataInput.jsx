import { StyleSheet } from "react-native";

const CustomDataInput = ({ number, value, label, onChangeValue, onChangeLabel }) => {
  return (
    <div style={styles.inputContainerStyles}>
      <p style={{ fontSize: "1.1rem" }}>{number}.</p>

      <input
        style={styles.inputStyles}
        type="number"
        max={200}
        min={0}
        placeholder="Amount of batteries"
        onChange={(e) => onChangeValue(Number(e.target.value))}
      />

      <select value={label} onChange={(e) => onChangeLabel(e.target.value)}>
        <option value="-">-</option>
        <option value="Always Ready">Always Ready</option>
        <option value="Tough Cell">Tough Cell</option>
      </select>
    </div>
  );
};

const styles = StyleSheet.create({
    inputContainerStyles: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: ".5rem"
    },

    inputStyles: {
        width: "50%",
        outline: "none",
        border: "1px solid #ccc",
        borderRadius: ".25rem",
        padding: ".25rem"
    }
})

export default CustomDataInput;