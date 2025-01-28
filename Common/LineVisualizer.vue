<script setup>
import { toCamelCase, formatUnit, removeTrailingZeroes } from '../assets/js/utils.js'
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
        forceUpdate:{
            type: Number,
            default: 0
        }
    },
    emits: [
        'click',
    ],
    data() {
        const limits = this.processLimits()
        const style = getComputedStyle(document.body);

        const theme = {
          primary: style.getPropertyValue('--bs-primary'),
          secondary: style.getPropertyValue('--bs-secondary'),
          success: style.getPropertyValue('--bs-success'),
          info: style.getPropertyValue('--bs-info'),
          warning: style.getPropertyValue('--bs-warning'),
          danger: style.getPropertyValue('--bs-danger'),
          light: style.getPropertyValue('--bs-light'),
          dark: style.getPropertyValue('--bs-dark'),
          white: style.getPropertyValue('--bs-white'),
        };
        var options = {
            title: {
                left: 'center',
                text: this.title,
                textStyle: {
                    fontSize: 25,
                    color: theme['white'],
                },
                subtextStyle: {
                    fontSize: 17,
                    color: theme['white'],
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
                        const xAux = formatUnit(xDatum, "Hz");
                        const yAux = formatUnit(yDatum, this.data[params.seriesIndex].unit);

                        return `${removeTrailingZeroes(yAux.label, 2)} ${yAux.unit} @ ${removeTrailingZeroes(xAux.label, 2)} ${xAux.unit}`;
                    }
                    else {
                        const newIndex = params.seriesIndex - this.data.length;
                        const xDatum = this.points[newIndex].data.x;
                        const yDatum = this.points[newIndex].data.y;
                        const xAux = formatUnit(xDatum, "Hz");
                        const yAux = formatUnit(yDatum, this.points[newIndex].unit);

                        return `Requirement: ${removeTrailingZeroes(yAux.label, 2)} ${yAux.unit} @ ${removeTrailingZeroes(xAux.label, 2)} ${xAux.unit}`;
                    }
                },
            },
            toolbox: {
                right: 20,
                feature: {
                    dataZoom: {}
                }
            },
            xAxis: {
                min: limits.xAxis.min,
                max: limits.xAxis.max,
                // name: this.xAxisOptions.label,
                type: this.xAxisOptions.type,
                axisLabel: {
                    fontSize: 13,
                    color: theme['white'],

                    formatter: (value) => {
                        const aux = formatUnit(value, this.xAxisOptions.unit);
                        return `${removeTrailingZeroes(aux.label, 1)} ${aux.unit}`;
                    },
                }
            },
            yAxis: {
                min: limits.yAxis.min,
                max: limits.yAxis.max,
                // name: this.data[0].label,
                type: this.data[0].type,
                axisLabel: {
                    fontSize: 13,
                    color: theme['white'],

                    margin: 0,
                    formatter: (value) => {
                        const aux = formatUnit(value, this.data[0].unit);
                        return `${removeTrailingZeroes(aux.label, 1)} ${aux.unit}`;
                    },
                }
            },

            grid: {
                left:   60,
                right:  '5%',
            },

            animation: false,
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
            theme,
        }
    },
    watch: {
        forceUpdate(newValue, oldValue) {
            this.processOptions(this.options);
        },
    },
    mounted() {
        console.log(this.points)
        console.log(this.points)
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
            const limits = {}

            var xMinimum = Number.MAX_VALUE;
            var xMaximum = Number.MIN_VALUE;
            var yMinimum = Number.MAX_VALUE;
            var yMaximum = Number.MIN_VALUE;


            var yLimit = 0;
            this.data[0].data.x.forEach((elem) => {
                xMaximum = Math.max(xMaximum, elem);
                xMinimum = Math.min(xMinimum, elem);
            })
            this.points.forEach((elem) => {
                xMaximum = Math.max(xMaximum, elem.data.x);
                xMinimum = Math.min(xMinimum, elem.data.x);
            })

            this.data[0].data.y.forEach((elem) => {
                yMaximum = Math.max(yMaximum, elem);
                yMinimum = Math.min(yMinimum, elem);
            })
            this.points.forEach((elem) => {
                xMaximum = Math.max(xMaximum, elem.data.y);
                xMinimum = Math.min(xMinimum, elem.data.y);
            })

            limits.xAxis = {
                min: xMinimum,
                max: xMaximum,
            };
            limits.yAxis = {
                min: yMinimum,
                max: yMaximum,
            };
            return limits;
        },
        processOptions(options) {
            const limits = this.processLimits()

            options.xAxis.min = limits.xAxis.min;
            options.xAxis.max = limits.xAxis.max;
            options.yAxis.min = limits.yAxis.min;
            options.yAxis.max = limits.yAxis.max * 1.1;

            options.series = []
            this.data.forEach((datum, index) => {
                options.series.push(
                    {
                        data: this.processData(index),
                        type: 'line',
                        color: this.theme[datum.colorLabel],
                    }
                );

            })

            this.points.forEach((point) => {
                options.series.push(
                    {
                        symbolSize: 20,
                        data: [[point.data.x, point.data.y]],
                        type: 'scatter',
                        color: this.theme[point.colorLabel],
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
    <v-chart class="chart" :option="options" autoresize :update-options="updateOpts" @click="onClick" :style="'height: 50vh'"/>
</template>
