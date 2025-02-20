<script setup>
import { toCamelCase, formatUnit, removeTrailingZeroes, getMultiplier} from '../assets/js/utils.js'
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
        }
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
                        return `${removeTrailingZeroes(aux.label, 1)} ${aux.unit}`;
                    },
                }
            },
            yAxis: [],

            grid: {
                left:   60,
                right:  '5%',
            },

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
                        return `${removeTrailingZeroes(aux.label, 1)} ${aux.unit}`;
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

            options.xAxis.min = limits.xAxis.min;
            options.xAxis.max = limits.xAxis.max;
            options.xAxis.type = this.xAxisOptions.type;

            limits.yAxis.forEach((elem, index) => {
                if (elem.min < 1) {
                    if (this.data[index].type == "log") {
                        var numberZeroesInBase = Math.floor( Math.log10(elem.min) + 1) - 1;
                        elem.min = Math.pow(10, numberZeroesInBase);
                    }
                    else {
                        elem.min = 0;
                    }
                }
                options.yAxis[index].min = elem.min;
                options.yAxis[index].max = elem.max * 1.1;
            })

            options.series = []
            this.data.forEach((datum, index) => {
                options.yAxis[index].type = datum.type;

                options.series.push(
                    {
                        data: this.processData(index),
                        type: 'line',
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
    <v-chart class="chart" :option="options" autoresize :update-options="updateOpts" @click="onClick" :style="'height: 50vh'"/>
</template>
