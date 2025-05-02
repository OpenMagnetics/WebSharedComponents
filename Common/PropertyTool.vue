<script setup>
import DimensionReadOnly from '/WebSharedComponents/DataInput/DimensionReadOnly.vue'
import ElementFromList from '/WebSharedComponents/DataInput/ElementFromList.vue'
import PairOfDimensions from '/WebSharedComponents/DataInput/PairOfDimensions.vue'
import LineVisualizer from '/WebSharedComponents/Common/LineVisualizer.vue'
import Dimension from '/WebSharedComponents/DataInput/Dimension.vue'
import { deepCopy, combinedStyle, combinedClass, removeTrailingZeroes } from '/WebSharedComponents/assets/js/utils.js'
</script>

<script>

export default {
    props: {
        dataTestLabel: {
            type: String,
            default: '',
        },
        title: {
            type: String,
            default: 'Property',
        },
        properties: {
            type: Array,
            required: true,
        },
        indexesToUse: {
            type: Array,
            default: null,
        },
        propertiesConfiguration: {
            type: Object,
            required: true,
        },
        smoothLine: {
            type: Boolean,
            default: false,
        },
        chartStyle:{
            type: String,
            default: 'height: 50vh'
        },
        addElementButtonColor: {
            type: [String, Object],
            default: "text-secondary",
        },
        removeElementButtonColor: {
            type: [String, Object],
            default: "text-danger",
        },
        labelWidthProportionClass: {
            type: String,
            default: "col-4",
        },
        selectStyleClass: {
            type: String,
            default: "col-8",
        },
        valueFontSize: {
            type: [String, Object],
            default: {"font-size": '0.9rem'}
        },
        labelFontSize: {
            type: [String, Object],
            default: {"font-size": '0.9rem'}
        },
        scalarFontSize: {
            type: [String, Object],
            default: {"font-size": '1.2rem'}
        },
        labelBgColor: {
            type: [String, Object],
            default: "bg-dark",
        },
        valueBgColor: {
            type: [String, Object],
            default: "bg-light",
        },
        textColor: {
            type: [String, Object],
            default: "text-white",
        },
        visualizerBgColor: {
            type: [String, Object],
            default: "#1a1a1a",
        },
        visualizerLineColor: {
            type: [String, Object],
            default: "#d4d4d4",
        },
        visualizerTextColor: {
            type: [String, Object],
            default: "#d4d4d4",
        },
    },
    data() {
        const errorMessage = "";
        const loading = false;
        const showEditor = false;
        const showConfiguration = false;
        const forceUpdate = 0;
        const availableModes = {
            'log': 'Log',
            'linear': 'Linear',
        }
        const data = [];

        const xAxisOptions = {
            label: this.propertiesConfiguration.xAxisLabel,
            colorLabel: '#d4d4d4',
            type: this.propertiesConfiguration.xAxisMode == "linear"? "value" : this.propertiesConfiguration.xAxisMode,
            unit: this.propertiesConfiguration.xAxisUnit,
            numberDecimals: this.propertiesConfiguration.xAxisNumberDecimals,
        }


        return {
            errorMessage,
            loading,
            showEditor,
            showConfiguration,
            forceUpdate,
            availableModes,
            xAxisOptions,
            data,
        }
    },
    computed: {
    },
    watch: {
        'properties': {
            handler(newValue, oldValue) {
                this.extractData();
                this.forceUpdate += 1;
            },
          deep: true
        },
        'indexesToUse': {
            handler(newValue, oldValue) {
                this.extractData();
                this.forceUpdate += 1;
            },
          deep: true
        },
    },
    created() {
        this.extractData();
    },
    mounted() {
        this.forceUpdate += 1;
    },
    methods: {
        extractData() {

            this.data = [];
            this.properties.forEach((property, propertyIndex) => {
                const datum = {};
                datum.type = this.propertiesConfiguration.yAxisMode == "linear"? "value" : this.propertiesConfiguration.yAxisMode;
                datum.smooth = this.smoothLine;
                datum.numberDecimals = this.propertiesConfiguration.yAxisNumberDecimals;

                datum.data = {
                    x: [],
                    y: [],
                };
                property.forEach((elem, index) => {
                    if (this.indexesToUse.includes(index)) {
                        datum.data.x.push(elem[this.propertiesConfiguration.xAxisLabel])
                        datum.data.y.push(elem[this.propertiesConfiguration.yAxisLabel])

                        if ("log" in this.availableModes && elem[this.propertiesConfiguration.xAxisLabel] < 0) {
                            delete this.availableModes.log;
                        }
                    }
                })

                datum.unit = this.propertiesConfiguration.yAxisUnit;

                datum.xMaximum = removeTrailingZeroes(Math.max(...datum.data.x), 2);
                datum.xMinimum = removeTrailingZeroes(Math.min(...datum.data.x), 2);
                datum.yMaximum = removeTrailingZeroes(Math.max(...datum.data.y), 2);
                datum.yMinimum = removeTrailingZeroes(Math.min(...datum.data.y), 2);

                this.data.push(datum);
            })
        },
        axisModeChanged() {
            this.xAxisOptions.type = this.propertiesConfiguration.xAxisMode == "linear"? "value" : this.propertiesConfiguration.xAxisMode;
            this.properties.forEach((property, propertyIndex) => {
                this.data[propertyIndex].type = this.propertiesConfiguration.yAxisMode == "linear"? "value" : this.propertiesConfiguration.yAxisMode;
            })
            this.forceUpdate += 1;
        },
        onAddPointBelow(index) {
            const newElement = deepCopy(this.properties[0][index])
            this.properties[0].splice(index + 1, 0, newElement)
            this.$emit("onAddPoint");
            this.extractData();

        },
        onRemovePoint(index) {
            this.properties[0].splice(index, 1);
            this.$emit("onRemovePoint");
            this.extractData();
        },
        addFirstValue() {
            const aux = {};
            aux[this.propertiesConfiguration.xAxisLabel] = 0;
            aux[this.propertiesConfiguration.yAxisLabel] = 0;
            this.properties[0].push(aux);
            this.$emit("onAddPoint");
            this.showEditor = true;
            this.extractData();
        },
        onEdit() {
            this.showEditor = !this.showEditor;
            
            if (!this.showEditor) {
                setTimeout(() => {this.forceUpdate += 1;}, 10);
            }
        }
    }
}
</script>

<template>
    <div class="container-flex border pt-2 ps-3">
        <div class="row">
            <div 
                class="col-9"
            >
                {{title}}
            </div>
            <div 
                class="col-3 row"
            >
                <button
                    :style="showEditor? $styleStore.controlPanel.activeButton : $styleStore.controlPanel.button"
                    class="btn col-5 p-0"
                    @click="onEdit"
                >
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button
                    :style="showConfiguration? $styleStore.controlPanel.activeButton : $styleStore.controlPanel.button"
                    class="btn offset-1 col-5 p-0"
                    @click="showConfiguration = !showConfiguration && ! showEditor"
                >
                    <i class="fa-solid fa-gear"></i>
                </button>
            </div>
        </div>
        <div class="row">
            <div
                v-if="showEditor"
                class="col-12"
            >
                <div class="row"  v-for="row, index in properties[0]">
                    <PairOfDimensions
                        v-if="indexesToUse.includes(index)"
                        class="pt-1 pb-0 mb-0 col-10 border-bottom "
                        :style="$styleStore.designRequirements.inputBorderColor"
                        :names="[propertiesConfiguration.xAxisLabel, propertiesConfiguration.yAxisLabel]"
                        :replaceTitle="[propertiesConfiguration.xAxisReplaceLabel, propertiesConfiguration.yAxisReplaceLabel]"
                        :units="[propertiesConfiguration.xAxisUnit, propertiesConfiguration.yAxisUnit]"
                        :allowNegatives="[propertiesConfiguration.xAxisAllowNegative, propertiesConfiguration.yAxisAllowNegative]"
                        :allowZeros="[propertiesConfiguration.xAxisAllowNegative, propertiesConfiguration.yAxisAllowNegative]"
                        :mins="[propertiesConfiguration.xAxisMin, propertiesConfiguration.yAxisMin]"
                        :maxs="[propertiesConfiguration.xAxisMax, propertiesConfiguration.yAxisMax]"
                        :dataTestLabel="dataTestLabel + '-Property-' + index"
                        v-model="properties[0][index]"
                        :labelWidthProportionClass="'col-4'"
                        :valueWidthProportionClass="'col-8'"
                        :valueFontSize='valueFontSize'
                        :labelFontSize='valueFontSize'
                        :labelBgColor='labelBgColor'
                        :valueBgColor='valueBgColor'
                        :textColor='textColor'
                    />
                    <div
                        v-if="indexesToUse.includes(index)"
                        class="col-2 row"
                    >
                        <button
                            :data-cy="dataTestLabel + '-remove-point-button'"
                            type="button"
                            class="btn h-100 w-50 btn-circle col-6"
                            @click="onRemovePoint(index)">
                            <i
                                :style="combinedStyle([removeElementButtonColor])"
                                :class="combinedClass([removeElementButtonColor])"
                                class="fa-solid fa-1x fa-circle-minus"
                            />
                        </button>
                        <button
                            :data-cy="dataTestLabel + '-add-point-below-button'"
                            type="button"
                            class="btn btn-circle h-100 w-50 col-6"
                            @click=" onAddPointBelow(index)"
                            >
                            <i
                                :style="combinedStyle([addElementButtonColor])"
                                :class="combinedClass([addElementButtonColor])"
                                class="fa-solid fa-1x fa-circle-plus"
                            />
                        </button>
                    </div>
                </div>
            </div>
            <div 
                v-if="showConfiguration"
                class="col-3"
            >
                <ElementFromList
                    class="col-12 mb-1 text-start"
                    :dataTestLabel="dataTestLabel + '-GraphsSelector'"
                    :name="'xAxisMode'"
                    :titleSameRow="false"
                    :justifyContent="true"
                    :modelValue="propertiesConfiguration"
                    @update:modelValue="propertiesConfiguration = $event"
                    :options="availableModes"
                    :labelWidthProportionClass="'col-12'"
                    :selectStyleClass="'col-12'"
                    :valueFontSize="valueFontSize"
                    :labelFontSize="labelFontSize"
                    :labelBgColor="labelBgColor"
                    :valueBgColor="valueBgColor"
                    :textColor="textColor"
                    @update="axisModeChanged"
                />
                <ElementFromList
                    class="col-12 mb-1 text-start"
                    :dataTestLabel="dataTestLabel + '-GraphsSelector'"
                    :name="'yAxisMode'"
                    :titleSameRow="false"
                    :justifyContent="true"
                    :modelValue="propertiesConfiguration"
                    @update:modelValue="propertiesConfiguration = $event"
                    :options="availableModes"
                    :labelWidthProportionClass="'col-12'"
                    :selectStyleClass="'col-12'"
                    :valueFontSize="valueFontSize"
                    :labelFontSize="labelFontSize"
                    :labelBgColor="labelBgColor"
                    :valueBgColor="valueBgColor"
                    :textColor="textColor"
                    @update="axisModeChanged"
                />
            </div>
            <span 
                v-if="data.length == 0 || indexesToUse.length == 0"
                class="col-12 my-2"
            >
                <label
                    class="text-danger pt-1 mx-3 "
                    style="font-size: 1em"
                >            
                    {{'Property is missing'}}
                </label>
                <button class="btn btn-primary" @click="addFirstValue()">Add values</button>
            </span>
            <div 
                v-if="!showEditor && indexesToUse.length > 0"
                :class="showEditor || showConfiguration? 'col-9' : 'col-12'"
            >
                <LineVisualizer 
                    v-if="indexesToUse.length > 1"
                    v-show="!loading"
                    :data="data"
                    :points="[]"
                    :xAxisOptions="xAxisOptions"
                    :title="''"
                    :forceUpdate="forceUpdate"
                    :chartStyle="chartStyle"
                    :toolbox="false"
                    :bgColor="visualizerBgColor"
                    :lineColor="visualizerLineColor"
                    :textColor="visualizerTextColor"
                    :chartPaddings="{top: 10, left: 45, right: 10, bottom: 30}"
                />
                <DimensionReadOnly 
                    v-else
                    class="col-12 mt-2 px-0 mx-0"
                    :name="'Value'"
                    :replaceTitle="''"
                    :unit="propertiesConfiguration.yAxisUnit"
                    :dataTestLabel="dataTestLabel + '-ScalarValue'"
                    :numberDecimals="2"
                    :value="properties[0][indexesToUse[0]].value"
                    :useTitleCase="false"
                    :disableShortenLabels="true"
                    :labelWidthProportionClass="'col-1'"
                    :valueWidthProportionClass="'col-12'"
                    :valueFontSize="scalarFontSize"
                    :labelFontSize="scalarFontSize"
                    :labelBgColor="labelBgColor"
                    :valueBgColor="valueBgColor"
                    :textColor="textColor"
                />
            </div>
            
        </div>
    </div>
</template>