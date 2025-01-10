<script setup>
import { Chart, registerables } from 'chart.js'
import { removeTrailingZeroes, roundWithDecimals, formatUnit } from '/WebSharedComponents/assets/js/utils.js'
</script>

<script>
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

var options = {};
var chart = null;

export default {
    props: {
        inputData:{
            type: Array,
            required: true
        },
        title:{
            type: String,
            default: 'LineChart',
        },
        xUnit:{
            type: String,
            default: '',
        },
        dataTestLabel: {
            type: String,
            default: '',
        },
    },
    data() {
        const datasets = [];
        this.inputData.forEach((datum) => {
            datasets.push(
                {
                    label: "loading",
                    yAxisID: datum.label,
                    data: {x: [1, 2], y: [1, 2]},
                    pointRadius: 1,
                    borderWidth: 5,
                    borderColor: theme[datum.colorLabel],
                    backgroundColor: theme[datum.colorLabel],
                }
            )
        })
        return {
            data: {
                datasets: datasets
            }
        }
    }, 
    watch: { 
        'inputData': {
            handler(newValue, oldValue) {
                console.warn("updateDatasets")
                // this.updateDatasets(newValue);
            },
            deep: true
        },

    },
    mounted() {
        const xUnit = this.xUnit;
        const scales = {
            x:{
                type: 'linear',
                ticks: {
                    beginAtZero: true,
                    color: theme['white'],
                    font: {
                        size: 12
                    },
                    callback: function(value, index, values) {
                        const aux = formatUnit(value, xUnit);
                        const label = removeTrailingZeroes(aux.label, 2);
                        return label + " " + aux.unit;
                    }
                },
                grid: {
                    color: theme['white'],
                    borderColor: theme['white'],
                    borderWidth: 2,
                    lineWidth: 0.4
                },
            }
        };

        this.inputData.forEach((datum) => {
            scales[datum.label] = {
                type: datum.type,
                position: datum.position,
                ticks: {
                    beginAtZero: true,
                    color: theme[datum.colorLabel],
                    font: {
                        size: 12
                    },
                    callback: function(value, index, values) {
                        value = removeTrailingZeroes(value);
                        return value + " " + datum.yUnit;
                    }
                },
                max: datum.yMaximum,
                min: datum.yMinimum,
                grid: {
                    color: theme[datum.colorLabel],
                    borderColor: theme[datum.colorLabel],
                    borderWidth: 2,
                    lineWidth: 0.4
                },
            }
        })

        options = {
            responsive: true,
            onHover: (event, chartElement) => {
                const target = event.native ? event.native.target : event.target;
                target.style.cursor = chartElement[0] ? 'pointer' : 'default';
            },
            plugins:{
                legend: {
                    labels: {
                        color: theme['white'], 
                        font: {
                            size: 12
                        },
                    }
                },
            },
            scales: scales
        }

        Chart.register(...registerables)
        this.createChart(this.title, options)

    },
    created() {
    },
    methods: {
        createChart(chartId, options) {
            const ctx = document.getElementById(chartId)
            console.log(this.data)
            if (ctx != null) {
                chart = new Chart(ctx, {
                    type: 'line',
                    data: this.data,
                    options: options,
                })

                chart.update();
            }
        },
        updateDatasets(newValue){

            console.log(chart.data.datasets);
            console.log(newValue);

            var xMaximum = Number.MIN_VALUE;
            var xMinimum = Number.MAX_VALUE;

            newValue.forEach((elem, index) => {
                chart.data.datasets[index].data = elem.data;
                chart.data.datasets[index].label = elem.label;
                xMaximum = Math.max(xMaximum, elem.xMaximum);
                xMinimum = Math.min(xMinimum, elem.xMinimum);
                chart.options.scales[elem.label].max = elem.yMaximum;
                chart.options.scales[elem.label].min = elem.yMinimum;
            })
            chart.options.scales.x.max = xMaximum;
            chart.options.scales.x.min = xMinimum;
            chart.update();
            console.log(chart.data);
            console.log(chart.options);

        // this.inputData.forEach((datum) => {
        //     datasets.push(
        //         {
        //             label: datum.label,
        //             yAxisID: datum.label,
        //             data: datum.data,
        //             pointRadius: 1,
        //             borderWidth: 5,
        //             borderColor: theme[datum.colorLabel],
        //             backgroundColor: theme[datum.colorLabel],
        //         }
        //     )
        // })
        },
    }
}
</script>
<style>
canvas {
    background-color : var(--bs-light);
}
</style>

<template>
    <div>
        <canvas :id="title"></canvas>
    </div>
</template>
