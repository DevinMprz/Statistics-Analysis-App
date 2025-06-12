import { useState, useRef, useEffect } from "react";

import { StyleSheet } from "react-native";

import CustomDataInput from "./customDataInput";

const CustomDataForm = ({ formHandler, testID }) => {
     
    const mainRef = useRef(null)
    const addButtonRef = useRef(null)
    const removeButtonRef = useRef(null)
    const [dataInputs, setDataInputs] = useState([
        { id: 1, value: 0, label: "-" },
    ]);


    useEffect(() => {
        if(dataInputs.length < 20){
            addButtonRef.current.style.display = 'block'
            removeButtonRef.current.style.display = 'block'
        }
    },[dataInputs])

    const handleDataAdding = () => {
        const nextId = dataInputs.length + 1;
        setDataInputs((prev) => [...prev, { id: nextId, value: 0, label: "-" }]);
        
        if(dataInputs.length > 18){ 
            addButtonRef.current.style.display = 'none';
            return
        }
    };

    
    const handleDataRemoving = () => {
        if(dataInputs.length <= 1){ 
            removeButtonRef.current.style.display = 'none';
            return
        }
       setDataInputs((prev) => prev.slice(0, -1));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        dataInputs.forEach((el, index) => {
            localStorage.setItem(index, JSON.stringify(el));
        })

        setTimeout(() => {
            formHandler(false);
        }, 500);
    }

    const updateInputs = (index, key, newValue) => {
        setDataInputs((prev = []) =>
            prev.map((item, i) =>
            i === index ? { ...item, [key]: newValue } : item
            )
        );
    };

    const handleClose = () => {
        setTimeout(() => {
            formHandler(false);
        }, 50);
    }

    return (
        <main 
        ref={mainRef}
        style={styles.containerStyles}>
            <h1
            style={{fontSize: "1.4rem"}}
            >Enter your data</h1>

            <form 
            onSubmit={handleSubmit}
            style={styles.formStyles}>
                {dataInputs.map((input, index) => (
                <CustomDataInput
                    key={input.id}
                    number={input.id}
                    value={input.value}
                    label={input.label}
                    onChangeValue={(val) => updateInputs(index, "value", val)}
                    onChangeLabel={(label) => updateInputs(index, "label", label)}
                />
                ))}

                <button
                onClick={handleDataAdding}
                style={styles.addButtonStyles}
                type="button"
                ref={addButtonRef}
                >+</button>

                <button
                onClick={handleDataRemoving}
                style={styles.addButtonStyles}
                ref={removeButtonRef    }
                type="button"
                >-</button>

                <div 
                style={styles.buttonContainerStyles}>
                    <button 
                    type="submit"
                    style={styles.submitButtonStyles}
                    >Submit</button>

                    <button 
                    type="button"
                    onClick={handleClose}
                    style={styles.closeButtonStyles}
                    >Close</button>
                </div>
            </form>
        </main>
    )
}

const styles = StyleSheet.create({
    containerStyles: {
        position: "fixed",
        width: "100%",
        minHeight: "100vh",
        overflowY: 'scroll',
        height: '100%',
        backgroundColor: "#fff",
        display: "flex",
        gap: "1rem",
        flexDirection: "column",
        alignItems: "center",
        paddingInline: "2rem",
        zIndex: 9999
    },

    formStyles: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: ".5rem",
        justifyContent: "center",
        flexDirection: "column",
    },

    addButtonStyles: {
        alignSelf: "flex-start",
        marginInline: "1rem",
        paddingBlock: ".35rem",
        paddingInline: ".85rem",
        borderRadius: ".5rem",
        fontSize: "1.5rem",
        border: "1px solid #ccc",
        backgroundColor: "#f0f0f0"
    },

    submitButtonStyles: {
        paddingInline: "1.5rem",
        paddingBlock: ".75rem",
        color: "#fff",
        borderRadius: "1rem",
        backgroundColor: '#80c1ff',
        fontWeight: "600",
    },

    buttonContainerStyles: {
        display: "flex",
        alignItems: "center",
        gap: "1.5rem"
    },

    closeButtonStyles: {
        paddingInline: "1.5rem",
        paddingBlock: ".75rem",
        color: "#fff",
        borderRadius: "1rem",
        backgroundColor: "#e74c3c",
        fontWeight: "600",
    }
})

export default CustomDataForm;