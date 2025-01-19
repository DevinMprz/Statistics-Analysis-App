import React, { PureComponent } from 'react'
import { Svg, G, Line, Rect } from 'react-native-svg'
import { View, Text, StyleSheet } from 'react-native'
import * as d3 from 'd3'

const GRAPH_MARGIN = 20
const GRAPH_BAR_WIDTH = 20
const colors = {
  axis: '#E4E4E4',
  bars: '#68cdf9'
}

export default class MinitoolTwoLayout extends PureComponent {
	render() {
		const data = [
			{ label: 'A', value: 10 },
			{ label: 'B', value: 20 },
			{ label: 'C', value: 30 },
			{ label: 'D', value: 40 },
			{ label: 'E', value: 50 },
			{ label: 'F', value: 60 },
			{ label: 'G', value: 70 },
			{ label: 'H', value: 80 },
			{ label: 'I', value: 90 },
			{ label: 'J', value: 100 },
			{ label: 'K', value: 110 },
			{ label: 'L', value: 120 },
			{ label: 'M', value: 130 },
			{ label: 'N', value: 140 },
			{ label: 'O', value: 150 },
			{ label: 'P', value: 160 },
			{ label: 'Q', value: 170 },
			{ label: 'R', value: 180 },
			{ label: 'S', value: 190 },
			{ label: 'T', value: 200 },
			{ label: 'U', value: 210 },
			{ label: 'V', value: 220 },
			{ label: 'W', value: 230 },
			{ label: 'X', value: 240 },
			{ label: 'Y', value: 250 },
			{ label: 'Z', value: 260 },
		].sort(() => Math.random() - 0.5)
		// Dimensions
		const SVGHeight = 500
		const SVGWidth = 900
		const graphHeight = SVGHeight - 2 * GRAPH_MARGIN
		const graphWidth = SVGWidth - 2 * GRAPH_MARGIN
	
		// X scale point
		const xDomain = data.map(item => item.label)
		const xRange = [0, graphWidth]
		const x = d3.scalePoint()
		  .domain(xDomain)
		  .range(xRange)
		  .padding(1)
	
		// Y scale linear
		const yDomain = [0, d3.max(data, d => d.value)]
		const yRange = [0, graphHeight]
		const y = d3.scaleLinear()
		  .domain(yDomain)
		  .range(yRange)
	
		return (
		  	<View style={styles.container}>
				<View style={styles.header}>
				<Text style={styles.headerText}>Minitool Two Layout</Text>
				</View>
				<View style={styles.chart}>
					<Svg width={SVGWidth} height={SVGHeight}>
						<G y={graphHeight}>
			
							{data.map(item => (
								<Rect
								key={item.label}
								x={x(item.label) - (GRAPH_BAR_WIDTH / 2)}
								y={y(item.value) * -1}
								rx={2.5}
								width={GRAPH_BAR_WIDTH}
								height={y(item.value)}
								fill={colors.bars}
								/>
							))}
					
							{/* bottom axis */}
							<Line
								x1="0"
								y1="2"
								x2={graphWidth}
								y2="2"
								stroke={colors.axis}
								strokeWidth="2"
							/>
						</G>
					</Svg>
				</View>
			</View>
		)
	  }
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	headerText: {
		fontSize: 40,
		color: '#fff',
		fontWeight: 'bold',
	},
	header: {
		padding: 20,
		backgroundColor: '#68cdf9',
		alignItems: 'center',
	},
	chart: {
		flex: 1,
		width: '100%',
		height: '100%',
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center',

	  }
});