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
                    const xDatum = this.data[params.seriesIndex].data.x[params.dataIndex];
                    const yDatum = this.data[params.seriesIndex].data.y[params.dataIndex];
                    const xAux = formatUnit(xDatum, "Hz");
                    const yAux = formatUnit(yDatum, this.data[params.seriesIndex].unit);

                    return `${removeTrailingZeroes(yAux.label, 2)} ${yAux.unit} @ ${removeTrailingZeroes(xAux.label, 2)} ${xAux.unit}`;
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

            // dataZoom: [
            //     {
            //         type: 'inside'
            //     },
            //     {
            //         type: 'slider',
            //         showDataShadow: false,
            //         handleIcon:
            //         'path://M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
            //         handleSize: '80%'
            //     },
            //     {
            //         type: 'inside',
            //         orient: 'vertical'
            //     },
            //     {
            //         type: 'slider',
            //         orient: 'vertical',
            //         showDataShadow: false,
            //         handleIcon:
            //         'path://M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
            //         handleSize: '80%'
            //     }
            // ],
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
    },
    created() {
    },
    computed: {
    },
    methods: {
        processData() {
            const data = [];
            this.data[0].data.x.forEach((_, index) => {
                const aux = [this.data[0].data.x[index], this.data[0].data.y[index]];
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

            this.data[0].data.y.forEach((elem) => {
                yMaximum = Math.max(yMaximum, elem);
                yMinimum = Math.min(yMinimum, elem);
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

            options.series[0].data = [];
            options.series[0].data = this.processData();
            console.warn(options)
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
