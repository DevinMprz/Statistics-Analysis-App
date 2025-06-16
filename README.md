# Statistics Analysis App

## Contents

- [Features](#features)
- [Requirements](#requirements)
- [Build & Run](#build--run)
- [Usage](#usage)
- [Data Format](#data-format)
  - [Minitool 1: Life Span of Batteries](#minitool-1-life-span-of-batteries)
  - [Minitool 2: Speed trap scenario, Cholesterol Level](#minitool-2-speed-trap-scenario-cholesterol-level)
  - [Minitool 3: Bivariate Scatter & Partitioning](#minitool-3-bivariate-scatter--partitioning)
- [Sample Data](#sample-data)

## Features

- **Life Span of Batteries**: This minitool allows students to explore and compare the life span of two different battery brands—Always Ready and Tough Cell.
- **Speed trap scenario**: Analyse changes in behaviour of traffic after the police implemented a speed trap on that section of the highway.
- **Cholesterol Level**: Analyse the changes of cholesterol level of the pacients of medical experiment, that came through certain diet.
- **Bivariate Scatter & Partitioning**: Dynamic scatter plot with draggable quadrants, customizable grids, and equal-group slicing for two-variable relationships.

## Requirements

- **Node.js** v14 or higher
- **npm** v6 or higher

## Build & Run

The actual version of the app is available by the link below:

https://devinmprz.github.io/Statistics-Analysis-App/ 

## Usage

1. Open your browser to `http://localhost:8081`. (if 8081 is busy, expo will suggest you to use another port (usually 8082))
2. Select a Minitool from the navigation menu.
3. Use the on-screen controls or your input devices to interact with charts.

---

## Data Format

### Minitool 1: Life Span of Batteries

Objects that include value and label properties.
```
Example: [
  {value: 10, label: "Tough cell"},
  {value: 20, label: "Always Ready"},
  {value: 30, label: "Tough cell"},
  {value: 40, label: "Always Ready"},
  ...
  ]
```

### Minitool 2: Speed trap scenario, Cholesterol Level

Values of individual records in brackets, separated by comma

```
Example: [10,20,30...]
```

### Minitool 3: Bivariate Scatter & Partitioning

## ...

## Sample Data

The `data/` directory includes example files
