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
        enableEditing:{
            type: Boolean,
            default: true
        },
        showPoints: {
            type: [Boolean, Array[Boolean]],
            default: true,
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
        chartPaddings:{
            type: Object,
            default: {top: 30, left: 45, right: 10, bottom: 30}
        },
        styleSection: {
            type: String,
            default: "controlPanel",
        },
    },
    data() {
        const errorMessages = "";
        const localData = {
            propertyToEdit: 0
        };
        const propertyLabels = {};
        const selectedPropertyToEdit = 0;
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
            localData,
            propertyLabels,
            selectedPropertyToEdit,
            errorMessages,
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
        scalarValue() {
            if (this.properties.length == 0) {
                return 0;
            }
            else if (this.properties[this.selectedPropertyToEdit].length == 0) {
                return 0;
            }
            else {
                return this.properties[this.selectedPropertyToEdit][0][this.propertiesConfiguration.yAxisLabel];
            }
        },
        showGraph() {
            if (this.data.length == 0) {
                return false;
            }
            var result = false;
            this.data.forEach((elem) => {
                if (elem.data.x != null && elem.data.x.length > 1) {
                    result = true;
                }
            })
            return result;
        },
    },
    watch: {
        'properties': {
            handler(newValue, oldValue) {
                this.extractData();
                setTimeout(() => {this.checkData();}, 10);
                this.forceUpdate += 1;
            },
          deep: true
        },
    },
    created() {
        this.extractData();
    },
    mounted() {
        setTimeout(() => {this.forceUpdate += 1;}, 10);
    },
    methods: {
        checkData() {
            console.log("Checking data")
            this.errorMessages = [];
            this.data[this.selectedPropertyToEdit].data.x.forEach((elem, index) => {
                this.errorMessages.push("");
                if (index < this.data[this.selectedPropertyToEdit].data.x.length - 1) {
                    const nextElem = this.data[this.selectedPropertyToEdit].data.x[index + 1];
                    if (elem == nextElem) {
                        console.log("ea")
                        this.errorMessages[index + 1] = `Value repeated for ${this.propertiesConfiguration.xAxisLabel}: ${elem}`;
                    }

                }
            })
        },
        extractData() {
            this.data = [];
            this.properties.forEach((property, propertyIndex) => {
                const datum = {};
                datum.type = this.propertiesConfiguration.yAxisMode == "linear"? "value" : this.propertiesConfiguration.yAxisMode;
                datum.smooth = this.smoothLine;
                if (this.properties.length > 0) {
                    datum.colorLabel = this.propertiesConfiguration.yAxisLineColor[propertyIndex];
                    datum.label = this.propertiesConfiguration.yAxisReplaceLabel[propertyIndex];
                    this.propertyLabels[propertyIndex] = datum.label;
                }
                datum.numberDecimals = this.propertiesConfiguration.yAxisNumberDecimals;

                datum.data = {
                    x: [],
                    y: [],
                };
                property.forEach((elem, index) => {
                    datum.data.x.push(elem[this.propertiesConfiguration.xAxisLabel])
                    datum.data.y.push(elem[this.propertiesConfiguration.yAxisLabel])

                    if ("log" in this.availableModes && elem[this.propertiesConfiguration.xAxisLabel] < 0) {
                        delete this.availableModes.log;
                    }
                })

                datum.unit = this.propertiesConfiguration.yAxisUnit;
                if (this.propertiesConfiguration.yAxisLineColor != null) {
                    datum.colorLabel = this.propertiesConfiguration.yAxisLineColor[propertyIndex];
                }

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
            this.$emit("onAddPoint", this.selectedPropertyToEdit, index);
        },
        onRemovePoint(index) {
            if (this.data[this.selectedPropertyToEdit].data.x.length == 1) {
                this.showEditor = false;
            }
            this.$emit("onRemovePoint", this.selectedPropertyToEdit, index);
        },
        addFirstValue() {
            this.$emit("onAddPoint", this.selectedPropertyToEdit, 0);
            this.showEditor = true;
        },
        onEdit() {
            this.showEditor = !this.showEditor;
            
            if (!this.showEditor) {
                setTimeout(() => {this.forceUpdate += 1;}, 10);
            }
        },
        propertyToEditChanged(selectedProperty) {
            this.selectedPropertyToEdit = selectedProperty;
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
                    v-if="enableEditing"
                    :style="showEditor? $styleStore[styleSection].activeButton : $styleStore[styleSection].button"
                    class="btn col-5 p-0"
                    @click="onEdit"
                >
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button
                    v-if="showGraph"
                    :style="showConfiguration? $styleStore[styleSection].activeButton : $styleStore[styleSection].button"
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
                <div class="row">
                    <ElementFromList
                        v-if="Object.keys(propertyLabels).length > 1"
                        class="offset-1 col-10 mb-1 text-start"
                        :dataTestLabel="dataTestLabel + '-PropertySelector'"
                        :name="'propertyToEdit'"
                        :titleSameRow="true"
                        :justifyContent="false"
                        :modelValue="localData"
                        @update:modelValue="localData = $event"
                        :options="propertyLabels"
                        :labelWidthProportionClass="'col-6'"
                        :selectStyleClass="'col-6'"
                        :valueFontSize="labelFontSize"
                        :labelFontSize="scalarFontSize"
                        :labelBgColor="labelBgColor"
                        :valueBgColor="valueBgColor"
                        :textColor="textColor"
                        @update="propertyToEditChanged"
                    />
                </div>
                <div class="row"  v-for="row, index in properties[selectedPropertyToEdit]">
                    <PairOfDimensions
                        :class="index < properties[selectedPropertyToEdit].length - 1? 'border-bottom' : '' "
                        class="pt-1 pb-0 pe-4 mb-0 col-10"
                        :names="[propertiesConfiguration.xAxisLabel, propertiesConfiguration.yAxisLabel]"
                        :replaceTitle="[propertiesConfiguration.xAxisReplaceLabel, propertiesConfiguration.yAxisReplaceLabel[selectedPropertyToEdit]]"
                        :units="[propertiesConfiguration.xAxisUnit, propertiesConfiguration.yAxisUnit]"
                        :allowNegatives="[propertiesConfiguration.xAxisAllowNegative, propertiesConfiguration.yAxisAllowNegative]"
                        :allowZeros="[propertiesConfiguration.xAxisAllowNegative, propertiesConfiguration.yAxisAllowNegative]"
                        :mins="[propertiesConfiguration.xAxisMin, propertiesConfiguration.yAxisMin]"
                        :maxs="[propertiesConfiguration.xAxisMax, propertiesConfiguration.yAxisMax]"
                        :dataTestLabel="dataTestLabel + '-Property-' + index"
                        v-model="properties[selectedPropertyToEdit][index]"
                        :labelWidthProportionClass="'col-4'"
                        :valueWidthProportionClass="'col-8'"
                        :valueFontSize='valueFontSize'
                        :labelFontSize='valueFontSize'
                        :labelBgColor='labelBgColor'
                        :valueBgColor='valueBgColor'
                        :textColor='textColor'
                        @update="$emit('onDimensionUpdate', $event, selectedPropertyToEdit, index)"
                    />
                    <div
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
                    <label :data-cy="dataTestLabel + '-' + index + '-error-text'" class="text-danger text-center col-12 pt-1" style="font-size: 0.9em; white-space: pre-wrap;">{{errorMessages[index]}}</label>
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
                v-if="data.length > 0 && data[selectedPropertyToEdit].data.x.length == 0"
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
                v-if="!showEditor"
                :class="showEditor || showConfiguration? 'col-9' : 'col-12'"
                class="pe-3"
            >
                <LineVisualizer 
                    v-if="showGraph"
                    v-show="!loading"
                    :data="data"
                    :points="[]"
                    :xAxisOptions="xAxisOptions"
                    :title="''"
                    :forceUpdate="forceUpdate"
                    :chartStyle="chartStyle"
                    :showPoints="showPoints"
                    :toolbox="false"
                    :bgColor="visualizerBgColor"
                    :lineColor="visualizerLineColor"
                    :textColor="visualizerTextColor"
                    :chartPaddings="chartPaddings"
                    :linePaddings="{top: 1.1, left: 1.1, right: 1.1, bottom: 1.1}"
                />
                <DimensionReadOnly 
                    v-else
                    v-if="data.length > 0 && data[selectedPropertyToEdit].data.x.length > 0"
                    class="col-12 mt-2 px-0 mx-0"
                    :name="'Value'"
                    :replaceTitle="''"
                    :unit="propertiesConfiguration.yAxisUnit"
                    :dataTestLabel="dataTestLabel + '-ScalarValue'"
                    :numberDecimals="2"
                    :value="scalarValue"
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