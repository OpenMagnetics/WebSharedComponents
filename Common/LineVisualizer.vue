<script setup>
import { toCamelCase, formatUnit, removeTrailingZeroes, getMultiplier, deepCopy } from '../assets/js/utils.js'
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
            default: []
        },
        xAxisOptions: {
            type: Object,
        },
        title: {
            type: String,
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
            default: {top: 1.1, left: 1, right: 1, bottom: 1}
        },
        toolbox:{
            type: Boolean,
            default: true
        },
    },
    emits: [
        'click',
    ],
    data() {
        const limits = this.processLimits()

        var options = {
            title: {
                left: 'center',
                text: this.title,
                textStyle: {
                    fontSize: 25,
                    color: this.textColor,
                },
                subtextStyle: {
                    fontSize: 17,
                    color: this.textColor,
                }
            },
            tooltip: {
                trigger: 'item',
                axisPointer: {
                    type: 'cross'
                },
                formatter: (params) => {

                    if (params.seriesIndex < this.data.length) {
                        const xDatum = this.data[params.seriesIndex].data.x[params.dataIndex];
                        const yDatum = this.data[params.seriesIndex].data.y[params.dataIndex];
                        const xAux = formatUnit(xDatum, this.xAxisOptions.unit);
                        const yAux = formatUnit(yDatum, this.data[params.seriesIndex].unit);
                        const xText = this.xAxisOptions.unit == null? xDatum : `${removeTrailingZeroes(xAux.label, 2)} ${xAux.unit}`;
                        const yText = this.data[params.seriesIndex].unit == null? yDatum : `${removeTrailingZeroes(yAux.label, 2)} ${yAux.unit}`;

                        return `${yText} @ ${xText}`;
                    }
                    else {
                        const newIndex = params.seriesIndex - this.data.length;
                        const xDatum = this.points[newIndex].data.x;
                        const yDatum = this.points[newIndex].data.y;
                        const xAux = formatUnit(xDatum, this.xAxisOptions.unit);
                        const yAux = formatUnit(yDatum, this.points[newIndex].unit);
                        const xText = this.xAxisOptions.unit == null? xDatum : `${removeTrailingZeroes(xAux.label, 2)} ${xAux.unit}`;
                        const yText = this.data[params.seriesIndex].unit == null? yDatum : `${removeTrailingZeroes(yAux.label, 2)} ${yAux.unit}`;

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
                textStyle: {
                    color: this.textColor
                }
            },
            xAxis: {
                min: limits.xAxis.min,
                max: limits.xAxis.max,
                type: this.xAxisOptions.type,
                axisLabel: {
                    fontSize: 13,
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

        this.data.forEach((datum, index) => {
            options.yAxis.push({
                min: limits.yAxis.min,
                max: limits.yAxis.max,
                // name: datum.label,
                type: datum.type,
                axisLabel: {
                    fontSize: 13,
                    color: this.lineColor,

                    margin: 0,
                    formatter: (value) => {
                        if (this.data.length > 1 && this.data[0].unit == this.data[1].unit && index == 1) {
                            return '';
                        }
                        const aux = formatUnit(value, datum.unit);
                        const text = datum.unit == null? value : `${removeTrailingZeroes(aux.label, 1)} ${aux.unit}`;
                        return `${text}`;
                    },
                }
            })
        })

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
    },
    mounted() {
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

            var xMinimum = Number.MAX_VALUE;
            var xMaximum = Number.MIN_VALUE;
            var yMinimum = Number.MAX_VALUE;
            var yMaximum = Number.MIN_VALUE;
            limits.yAxis = []

            this.data.forEach((datum) => {
                var yLimit = 0;
                datum.data.x.forEach((elem) => {
                    xMaximum = Math.max(xMaximum, elem);
                    xMinimum = Math.min(xMinimum, elem);
                })

                datum.data.y.forEach((elem) => {
                    yMaximum = Math.max(yMaximum, elem);
                    yMinimum = Math.min(yMinimum, elem);
                })
                this.points.forEach((elem) => {
                    xMaximum = Math.max(xMaximum, elem.data.x);
                    xMinimum = Math.min(xMinimum, elem.data.x);
                })
                this.points.forEach((elem) => {
                    yMaximum = Math.max(yMaximum, elem.data.y);
                    yMinimum = Math.min(yMinimum, elem.data.y);
                })
            })


            this.data.forEach((datum) => {
                limits.yAxis.push({
                    min: yMinimum,
                    max: yMaximum,
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

            options.xAxis.min = limits.xAxis.min * (limits.xAxis.min < 0? this.linePaddings.left : 1.0 / this.linePaddings.left);
            options.xAxis.max = limits.xAxis.max * this.linePaddings.right;
            options.xAxis.type = this.xAxisOptions.type;

            limits.yAxis.forEach((elem, index) => {
                var numberDecimals = 5;
                if (elem.min < 1) {
                    if (this.data[index].type == "log") {
                        var numberZeroesInBase = Math.floor( Math.log10(elem.min) + 1) - 1;
                        elem.min = Math.pow(10, numberZeroesInBase);
                    }
                    else {
                        // elem.min = 0;
                    }
                }
                if (this.data[index].numberDecimals != null) {
                    numberDecimals = this.data[index].numberDecimals;
                }
                options.yAxis[index].min = removeTrailingZeroes(elem.min * (elem.min < 0? this.linePaddings.bottom : 1.0 / this.linePaddings.bottom), numberDecimals);
                options.yAxis[index].max = removeTrailingZeroes(elem.max * this.linePaddings.top, numberDecimals);
            })

            options.series = []
            this.data.forEach((datum, index) => {
                options.yAxis[index].type = datum.type;

                options.series.push(
                    {
                        data: this.processData(index),
                        type: 'line',
                        smooth: datum.smooth,
                        name: datum.label,
                        color: datum.colorLabel,
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
                    }
                );
            })
        },
        onClick(event) {
            this.$emit('click', event);
        }
    },
}
</script>

<template>
    <v-chart class="chart" :option="options" autoresize :update-options="updateOpts" @click="onClick" :style="chartStyle"/>
</template>
