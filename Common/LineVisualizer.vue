<script setup>
import { toCamelCase, formatUnit, removeTrailingZeroes, getMultiplier, deepCopy, roundWithDecimals } from '../assets/js/utils.js'
import { use } from 'echarts/core'
import { LineChart, ScatterChart, EffectScatterChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  ToolboxComponent,
  GridComponent,
  DataZoomComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts';

use([
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  ToolboxComponent,
  GridComponent,
  DataZoomComponent,
  ScatterChart,
  LineChart,
  EffectScatterChart,
  CanvasRenderer
])

</script>

<script>
export default {
    props: {
        dataTestLabel: {
            type: String,
            default: '',
        },
        data: {
            type: Array,
        },
        points: {
            type: Array,
            default: () => []
        },
        xAxisOptions: {
            type: Object,
        },
        title: {
            type: String,
        },
        titleFontSize: {
            type: Number,
            default: 25,
        },
        axisLabelFontSize: {
            type: Number,
            default: 13,
        },
        legendLabels: {
            type: Array,
            default: null,
        },
        textColor: {
            type: String,
        },
        bgColor: {
            type: String,
        },
        lineColor: {
            type: String,
        },
        pointsColor: {
            type: String,
        },
        showPoints: {
            type: [Boolean, Array[Boolean]],
            default: true,
        },
        forceUpdate:{
            type: Number,
            default: 0
        },
        chartStyle:{
            type: String,
            default: 'height: 50vh'
        },
        chartPaddings:{
            type: Object,
            default: {top: 60, left: 60, right: '5%', bottom: 30}
        },
        linePaddings:{
            type: Object,
            default: {top: 1.1, left: 1, right: 1, bottom: 1.1}
        },
        toolbox:{
            type: Boolean,
            default: true
        },
        showGrid:{
            type: Boolean,
            default: true
        },
        showYAxisName:{
            type: Boolean,
            default: false
        },
        forceAxisMin:{
            type: Array,
            default: null
        },
        forceAxisMax:{
            type: Array,
            default: null
        },
        forceAxisUniquePerSide:{
            type: Boolean,
            default: false
        },
        forceAxisIndependentLimits:{
            type: Boolean,
            default: false
        },
    },
    emits: [
        'click',
    ],
    data() {
        const limits = this.processLimits()

        const options = {
            title: {
                left: 'center',
                text: this.title,
                textStyle: {
                    fontSize: this.titleFontSize,
                    color: this.textColor,
                },
                subtextStyle: {
                    fontSize: Math.round(this.titleFontSize * 0.68),
                    color: this.textColor,
                }
            },
            tooltip: {
                trigger: 'item',
                axisPointer: {
                    type: 'cross',
                    label: {
                        precision: 2
                    }
                },
                formatter: (params) => {

                    if (params.seriesIndex < this.data.length) {
                        const xDatum = this.data[params.seriesIndex].data.x[params.dataIndex];
                        const yDatum = this.data[params.seriesIndex].data.y[params.dataIndex];
                        const xAux = formatUnit(xDatum, this.xAxisOptions.unit);
                        const yAux = formatUnit(yDatum, this.data[params.seriesIndex].unit);
                        const xText = this.xAxisOptions.unit == null? removeTrailingZeroes(xDatum, 2) : `${removeTrailingZeroes(xAux.label, 2)} ${xAux.unit}`;
                        const yText = this.data[params.seriesIndex].unit == null? removeTrailingZeroes(yDatum, 2) : `${removeTrailingZeroes(yAux.label, 2)} ${yAux.unit}`;

                        return `${yText} @ ${xText}`;
                    }
                    else {
                        const newIndex = params.seriesIndex - this.data.length;
                        const xDatum = this.points[newIndex].data.x;
                        const yDatum = this.points[newIndex].data.y;
                        const xAux = formatUnit(xDatum, this.xAxisOptions.unit);
                        const yAux = formatUnit(yDatum, this.points[newIndex].unit);
                        const xText = this.xAxisOptions.unit == null? removeTrailingZeroes(xDatum, 2) : `${removeTrailingZeroes(xAux.label, 2)} ${xAux.unit}`;
                        const yText = this.data[params.seriesIndex].unit == null? removeTrailingZeroes(yDatum, 2) : `${removeTrailingZeroes(yAux.label, 2)} ${yAux.unit}`;

                        return `Requirement: ${yText} @ ${xText}`;
                    }
                },
            },
            toolbox: !this.toolbox? null : {
                    right: 20,
                    feature: {
                        dataZoom: {}
                    }
                },
            legend: {
                orient: 'horizontal',
                left: 'left',
                top: 'top',
                textStyle: {
                    color: this.textColor
                }
            },
            xAxis: {
                min: limits.xAxis.min,
                max: limits.xAxis.max,
                type: this.xAxisOptions.type,
                splitLine: {
                    show: this.showGrid,
                },
                axisLabel: {
                    fontSize: this.axisLabelFontSize,
                    color: this.textColor,

                    formatter: (value) => {
                        const aux = formatUnit(value, this.xAxisOptions.unit);
                        const text = this.xAxisOptions.unit == null? value : `${removeTrailingZeroes(aux.label, 1)} ${aux.unit}`;
                        return `${text}`;
                    },
                }
            },
            yAxis: [],

            grid: this.chartPaddings,

            animation: false,
            backgroundColor: this.bgColor,
            series: [
                {
                  data: [
                    [20, 120],
                    [50, 200],
                    [40, 50]
                  ],
                  type: 'line'
                }
            ]
        };

        const updateOpts = {
            notMerge: true,
        }

        return {
            options,
            updateOpts,
        }
    },
    watch: {
        'forceUpdate': {
            handler(newValue, oldValue) {
                this.processOptions(this.options);
            },
          deep: true
        },
        'data': {
            handler(newValue, oldValue) {
                this.processOptions(this.options);
            },
            deep: true
        },
    },
    mounted() {
        // Initialize series and yAxis from data prop
        if (this.data && this.data.length > 0) {
            this.processOptions(this.options);
        }
    },
    created() {
    },
    computed: {
    },
    methods: {
        processData(index) {
            const data = [];
            this.data[index].data.x.forEach((_, pointIndex) => {
                const aux = [this.data[index].data.x[pointIndex], this.data[index].data.y[pointIndex]];
                data.push(aux);
            });
            return data;
        },
        processLimits() {
            const limits = []

            let xMinimum = Number.MAX_VALUE;
            let xMaximum = Number.MIN_VALUE;

            // Calculate x limits across all data
            this.data.forEach((datum) => {
                datum.data.x.forEach((elem) => {
                    xMaximum = Math.max(xMaximum, elem);
                    xMinimum = Math.min(xMinimum, elem);
                })
            })
            
            this.points.forEach((elem) => {
                xMaximum = Math.max(xMaximum, elem.data.x);
                xMinimum = Math.min(xMinimum, elem.data.x);
            })

            // Calculate separate y limits for each data series (each yAxis)
            limits.yAxis = []
            this.data.forEach((datum, index) => {
                let yMinimum = Number.MAX_VALUE;
                let yMaximum = Number.MIN_VALUE;
                
                datum.data.y.forEach((elem) => {
                    yMaximum = Math.max(yMaximum, elem);
                    if (datum.type == "log" && elem > Number.MIN_VALUE) {
                        yMinimum = Math.min(yMinimum, elem);
                    } else if (datum.type != "log") {
                        yMinimum = Math.min(yMinimum, elem);
                    }
                })
                
                // Include points that belong to this axis
                this.points.forEach((point) => {
                    if (point.unit === datum.unit) {
                        yMaximum = Math.max(yMaximum, point.data.y);
                        yMinimum = Math.min(yMinimum, point.data.y);
                    }
                })
                
                limits.yAxis.push({
                    min: (this.forceAxisMin && this.forceAxisMin[index] !== null && this.forceAxisMin[index] !== undefined) ? this.forceAxisMin[index] : yMinimum,
                    max: (this.forceAxisMax && this.forceAxisMax[index] !== null && this.forceAxisMax[index] !== undefined) ? this.forceAxisMax[index] : yMaximum,
                });
            })

            limits.xAxis = {
                min: xMinimum,
                max: xMaximum,
            };

            return limits;
        },
        processOptions(options) {
            const limits = this.processLimits()

            options.series = []
            options.yAxis = []
            const firstIndexPerSide = {}
            this.data.forEach((datum, index) => {

                const side = datum.position || (index === 0 ? 'left' : 'right');
                if (firstIndexPerSide[side] === undefined) {
                    firstIndexPerSide[side] = index;
                }
                
                options.yAxis.push({
                    type: datum.type,
                    name: this.showYAxisName ? (datum.unit || '') : '',
                    nameLocation: 'middle',
                    nameGap: 25,
                    nameTextStyle: {
                        color: datum.colorLabel || this.lineColor,
                        fontSize: this.axisLabelFontSize,
                    },
                    position: side,
                    splitLine: {
                        show: index === 0 ? this.showGrid : false,
                    },
                    axisLabel: {
                        fontSize: this.axisLabelFontSize,
                        color: datum.colorLabel || this.lineColor,
                        margin: 5,
                        formatter: (value) => {
                            // Hide right axis labels only if same unit AND similar scale (unless forceAxisMin/Max which indicates dual display)
                            const hasForceAxis = (this.forceAxisMin && this.forceAxisMin.some(v => v !== null && v !== undefined)) || (this.forceAxisMax && this.forceAxisMax.some(v => v !== null && v !== undefined));
                            if (!hasForceAxis && this.data.length > 1 && this.data[0].unit == this.data[1].unit && index == 1) {
                                // Check if scales are similar (within 10x of each other)
                                const scale0 = Math.max(...this.data[0].data.y) - Math.min(...this.data[0].data.y);
                                const scale1 = Math.max(...this.data[1].data.y) - Math.min(...this.data[1].data.y);
                                const scaleRatio = scale0 > 0 && scale1 > 0 ? Math.max(scale0/scale1, scale1/scale0) : 1;
                                if (scaleRatio < 10) {
                                    return '';
                                }
                            }
                            const aux = formatUnit(value, datum.unit);
                            // Smart decimal limiting based on value magnitude
                            let decimals = 0;
                            const absLabel = Math.abs(aux.label);
                            if (absLabel === 0) {
                                decimals = 0;
                            } else if (absLabel < 0.01) {
                                decimals = 3;
                            } else if (absLabel < 0.1) {
                                decimals = 2;
                            } else if (absLabel < 10) {
                                decimals = 1;
                            } else {
                                decimals = 0;
                            }
                            const formattedLabel = Number(aux.label).toFixed(decimals);
                            const text = datum.unit == null ? formattedLabel : `${formattedLabel} ${aux.unit}`;
                            return text;
                        },
                    },
                })

                let showPoints;
                if (typeof(this.showPoints) == "boolean") {
                    showPoints = this.showPoints;
                }
                else {
                    showPoints = this.showPoints[index];
                }

                options.series.push(
                    {
                        data: this.processData(index),
                        type: 'line',
                        smooth: datum.smooth,
                        name: this.legendLabels && this.legendLabels[index] ? this.legendLabels[index] : datum.label,
                        color: datum.colorLabel,
                        showSymbol: showPoints,
                        yAxisIndex: this.forceAxisUniquePerSide ? firstIndexPerSide[side] : index,
                        lineStyle: {
                            type: datum.lineStyle ?? 'solid'  // 'solid', 'dashed', 'dotted'
                        }
                    }
                );

            })

            this.points.forEach((point) => {
                options.series.push(
                    {
                        symbolSize: 20,
                        data: [[point.data.x, point.data.y]],
                        type: 'scatter',
                        color: this.pointsColor,
                        showSymbol: true,
                    }
                );
            })

            options.xAxis.min = limits.xAxis.min * (limits.xAxis.min < 0? this.linePaddings.left : 1.0 / this.linePaddings.left);
            options.xAxis.max = limits.xAxis.max * this.linePaddings.right;
            options.xAxis.type = this.xAxisOptions.type;

            // Store individual axis limits
            const individualAxisLimits = [];
            var yAxisLimits = {
                min: Number.MAX_VALUE,
                max: Number.MIN_VALUE,
            };
            limits.yAxis.forEach((elem, index) => {
                let numberDecimals = 2;
                let numberDecimalsPointer = numberDecimals
                if (elem.min < 1) {
                    if (this.data[index].type == "log") {
                        numberDecimals = Math.abs(Math.floor(Math.log10(elem.min)));
                        numberDecimalsPointer += numberDecimals
                    }
                    else {
                        // elem.min = 0;
                    }
                }
                if (this.data[index].numberDecimals != null) {
                    numberDecimals = this.data[index].numberDecimals;
                }

                if (numberDecimalsPointer > options.tooltip.axisPointer.label.precision) {
                    options.tooltip.axisPointer.label.precision = numberDecimalsPointer;
                }

                let minimumValue = removeTrailingZeroes(roundWithDecimals(elem.min * (elem.min < 0? this.linePaddings.bottom : 1.0 / this.linePaddings.bottom), 1.0 / Math.pow(10, numberDecimals)), numberDecimals);
                let maximumValue = removeTrailingZeroes(roundWithDecimals(elem.max * this.linePaddings.top, 1.0 / Math.pow(10, numberDecimals)), numberDecimals);
                yAxisLimits.min = Math.min(yAxisLimits.min, minimumValue);
                yAxisLimits.max = Math.max(yAxisLimits.max, maximumValue);
                
                // Store individual limits
                individualAxisLimits.push({
                    min: minimumValue,
                    max: maximumValue
                });
            })

            // Apply limits to Y-axes
            options.yAxis.forEach((_, index) => {
                if (this.forceAxisIndependentLimits && individualAxisLimits[index]) {
                    // Use individual limits for each axis
                    options.yAxis[index].min = individualAxisLimits[index].min;
                    options.yAxis[index].max = individualAxisLimits[index].max;
                } else {
                    // Use shared limits (original behavior)
                    options.yAxis[index].min = yAxisLimits.min;
                    options.yAxis[index].max = yAxisLimits.max;
                }
            })

            if (this.forceAxisUniquePerSide) {
                const uniqueYAxis = []
                Object.entries(firstIndexPerSide).forEach(([_, axisIndex]) => {
                    uniqueYAxis.push(options.yAxis[axisIndex])
                })
                options.yAxis = uniqueYAxis
            }
        },
        onClick(event) {
            this.$emit('click', event);
        }
    },
}
</script>

<template>
    <v-chart v-if="options.yAxis.length > 0" class="chart" :option="options" autoresize :update-options="updateOpts" @click="onClick" :style="chartStyle"/>
</template>
