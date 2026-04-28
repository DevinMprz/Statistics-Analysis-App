import React from "react";
import { render, fireEvent, screen, act } from "@testing-library/react-native";
import ScatterControls from "../controls/ScatterControls";

// Replace InfoModal with a lightweight mock that exposes its visibility/title.
jest.mock("../modals/InfoModal", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return function MockInfoModal({ visible, title, message, onClose }) {
    if (!visible) return null;
    return (
      <View testID="info-modal">
        <Text testID="info-modal-title">{title}</Text>
        <Text testID="info-modal-message">{message}</Text>
        <Text testID="info-modal-close" onPress={onClose}>
          close
        </Text>
      </View>
    );
  };
});

const baseProps = {
  isMobile: false,
  showCross: false,
  onShowCrossChange: jest.fn(),
  hideData: false,
  onHideDataChange: jest.fn(),
  activeGrid: null,
  onActiveGridChange: jest.fn(),
  twoGroupsCount: null,
  onTwoGroupsChange: jest.fn(),
  fourGroupsCount: null,
  onFourGroupsChange: jest.fn(),
};

const renderControls = (overrides = {}) =>
  render(<ScatterControls {...baseProps} {...overrides} />);

// Helper: open a dropdown by its header text. Bypasses the .measure() call so
// we can deterministically expand the FlatList in jsdom.
const openDropdown = (headerText) => {
  const header = screen.getByText(headerText);
  // The wrapping <View ref={buttonRef}> is the parent of the touchable.
  // Mock measure so toggleDropdown's callback runs synchronously.
  const wrapperView = header.parent?.parent;
  if (wrapperView && typeof wrapperView.props === "object") {
    // Patch the underlying ref's measure if accessible via instance
    // Fallback: monkey-patch View.prototype.measure for this test.
  }
  // Simplest reliable approach: stub View.prototype.measure for the press
  const RN = require("react-native");
  const originalMeasure = RN.View.prototype && RN.View.prototype.measure;
  RN.View.prototype.measure = function (cb) {
    cb(0, 0, 200, 40, 0, 0);
  };
  act(() => {
    fireEvent.press(header);
  });
  if (originalMeasure) RN.View.prototype.measure = originalMeasure;
};

describe("ScatterControls", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Switches", () => {
    test("renders both switch labels", () => {
      renderControls();
      expect(screen.getByText("Show Cross")).toBeTruthy();
      expect(screen.getByText("Hide Data")).toBeTruthy();
    });

    test("toggling 'Show Cross' fires onShowCrossChange with true", () => {
      const onShowCrossChange = jest.fn();
      renderControls({ onShowCrossChange });
      const switches = screen.UNSAFE_getAllByType(
        require("react-native").Switch,
      );
      fireEvent(switches[0], "valueChange", true);
      expect(onShowCrossChange).toHaveBeenCalledWith(true);
    });

    test("toggling 'Hide Data' fires onHideDataChange with true", () => {
      const onHideDataChange = jest.fn();
      renderControls({ onHideDataChange });
      const switches = screen.UNSAFE_getAllByType(
        require("react-native").Switch,
      );
      fireEvent(switches[1], "valueChange", true);
      expect(onHideDataChange).toHaveBeenCalledWith(true);
    });

    test("switches reflect controlled values", () => {
      renderControls({ showCross: true, hideData: true });
      const switches = screen.UNSAFE_getAllByType(
        require("react-native").Switch,
      );
      expect(switches[0].props.value).toBe(true);
      expect(switches[1].props.value).toBe(true);
    });
  });

  describe("Dropdown headers", () => {
    test("shows 'Off' when no value is selected", () => {
      renderControls();
      expect(screen.getByText(/Two Groups: Off/)).toBeTruthy();
      expect(screen.getByText(/Four Groups: Off/)).toBeTruthy();
      expect(screen.getByText(/Grids: Off/)).toBeTruthy();
    });

    test("shows the selected option label", () => {
      renderControls({
        twoGroupsCount: 4,
        fourGroupsCount: 6,
        activeGrid: 5,
      });
      expect(screen.getByText(/Two Groups: 4/)).toBeTruthy();
      expect(screen.getByText(/Four Groups: 6/)).toBeTruthy();
      expect(screen.getByText(/Grids: 5×5/)).toBeTruthy();
    });
  });

  describe("Info icons → InfoModal", () => {
    test("pressing Two Groups info opens modal with correct content", () => {
      renderControls();
      // Three "i" info icons exist; press the first one (Two Groups).
      const infoLabels = screen.getAllByText("i");
      expect(infoLabels.length).toBe(3);
      fireEvent.press(infoLabels[0]);

      expect(screen.getByTestId("info-modal")).toBeTruthy();
      expect(screen.getByTestId("info-modal-title").children).toContain(
        "Two Groups",
      );
      expect(screen.getByTestId("info-modal-message").children).toContain(
        "Divides plot into groups + shows median, low, and high values.",
      );
    });

    test("pressing Grids info opens the Grids description", () => {
      renderControls();
      const infoLabels = screen.getAllByText("i");
      fireEvent.press(infoLabels[2]);
      expect(screen.getByTestId("info-modal-title").children).toContain(
        "Grids",
      );
    });

    test("modal can be dismissed via onClose", () => {
      renderControls();
      fireEvent.press(screen.getAllByText("i")[0]);
      expect(screen.getByTestId("info-modal")).toBeTruthy();
      fireEvent.press(screen.getByTestId("info-modal-close"));
      expect(screen.queryByTestId("info-modal")).toBeNull();
    });
  });

  describe("Dropdown selection", () => {
    test("selecting a value from Two Groups invokes onTwoGroupsChange", () => {
      const onTwoGroupsChange = jest.fn();
      renderControls({ onTwoGroupsChange });

      openDropdown(/Two Groups: Off/);

      // The FlatList renders option items with their label as text.
      // Pick the "5" option (value=5).
      fireEvent.press(screen.getByText("5"));
      expect(onTwoGroupsChange).toHaveBeenCalledWith(5);
    });

    test("selecting a Grids value invokes onActiveGridChange with the grid size", () => {
      const onActiveGridChange = jest.fn();
      renderControls({ onActiveGridChange });

      openDropdown(/Grids: Off/);
      fireEvent.press(screen.getByText("4×4"));
      expect(onActiveGridChange).toHaveBeenCalledWith(4);
    });

    test("selecting 'Off' clears the selection (null)", () => {
      const onFourGroupsChange = jest.fn();
      renderControls({ fourGroupsCount: 5, onFourGroupsChange });

      openDropdown(/Four Groups: 5/);
      fireEvent.press(screen.getByText("Off"));
      expect(onFourGroupsChange).toHaveBeenCalledWith(null);
    });
  });

  describe("Responsive layout", () => {
    test("renders without crashing in mobile layout", () => {
      renderControls({ isMobile: true });
      expect(screen.getByText("Show Cross")).toBeTruthy();
      expect(screen.getByText(/Two Groups: Off/)).toBeTruthy();
    });
  });
});
