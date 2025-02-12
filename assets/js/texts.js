export const tooltipsMagneticSynthesisDesignRequirements = {
    "name": "Reference name for this document",
    "numberWindings": "Number of windings that our magnetic component is going to have",
    "magnetizingInductance": "Magnetizing inductance as seen from the primary",
    "minimumImpedance": "List of minimum impedances that the filter has to reach",
    "turnsRatios": "List of turns ratios, one for each secondary, each one referred to the primary",
    "leakageInductance": "List of leakage inductances, with tolerance, one for each secondary, each one referred to the primary",
    "strayCapacitance": "List of stray capacitances, with tolerance, one for each secondary, each one referred to the primary",
    "operatingTemperature": "Range of operation temperatures that the magnetic will be subjected to",
    "insulation": "Group of inputs used to calculate the insulation coordination",
    "market": "Destination market for the magnetic component",
    "topology": "Topology where our magnetic will be used",
    "maximumWeight": "Maximum weight that the magnetic componenet can weight, including all parts",
    "maximumDimensions": "Maximum dimensions that the magnetic componenet can occupy, including all parts",
    "terminalType": "Termination required for our magnetic, one per winding",
    "changeNameWindings": "Here you can change the reference for this winding",
}

export const tooltipsMagneticSynthesisOperatingPoints = {
    "reflectPrimary": "Reflect waveform from the first secondary",
    "reflectSecondaries": "Reflect waveform from primary",
    "editWindingWaveform": "Edit the current and voltage for this winding ",
}

export const tooltipsMagneticBuilder = {
    "notImplementedYet": "Coming soon!",
    "windingSelector": "Allows choosing between properties of different windings",
    "sectionSelector": "Allows choosing between properties of different coil sections",

    "topMargin": "Top margin, to comply with clearance and creepage distance",
    "bottomMargin": "Bottom margin, to comply with clearance and creepage distance",
    "leftMargin": "Left margin, to comply with clearance and creepage distance",
    "rightMargin": "Right margin, to comply with clearance and creepage distance",
    "turnsAlignment": "How the turns are aligned inside the layer",
    "sectionsAlignment": "How the sections are aligned inside the winding window",
    "windingsOrientation": "How the sections are oriented inside the winding window, either contiguous side by side along the column, or overlapping each other",
    "proportions": "Percentarge of the winding window dedicated to each winding",
    "sectionsInterleaving": "Order in which the sections will be placed, with the number of each winding (E.g.: 1 for primary, 2 for secondary, etc.). They can be repeated to create interleaving. E.g.: '121', '2121'",
    
    "windingLosses": "Total copper loss in all windings",
    "windingLossesPerWinding": "Total copper loss in the selected winding",
    "totalLosses": "Total loss in the full magnetic, including windings and core",
    "ohmicLossesPerWinding": "Ohmic loss in the selected winding due to the DC component of the current through it",
    "ohmicLosses": "Ohmic loss in all the windings due to the DC component of the current through it",
    "acLosses": "Copper loss in all the windings due to the AC components of the current through the magnetic",
    "skinLossesPerWinding": "Skin loss in the selected winding due to the AC components of the current through it",
    "proximityLossesPerWinding": "Proximity loss in the selected winding due to the fringing flux from the core and the AC components of the turns",
    "dcResistancePerWinding": "Resistance of the winding at DC",
    "effectiveResistancePerWinding": "Resistance of the winding at AC + DC, defined as the total losses of the winding divided by the square of its current RMS",
    "leakageInductanceReflectedToPrimary": "How much energy from the primary is stored in the interstices of the magnetic and is not coupled to this winding, reflected on the primary side",
    
    "wireNumberTurns": "Number of turns in thi winding. An extra turn produces more magnetic flux and keeps current density constant",
    "wireNumberParallels": "Number of parallels wires in each turn. An extra parallel keeps magnetic flux constant and decreases current density",
    "wireType": "Type of the wire. It can be round, litz, rectangular, or foil",
    "wireStandard": "Standard of the wire",
    "wireRoundConductingDiameter": "Diameter of the conducting cross-section of a round wire",
    "wireLitzStrandConductingDiameter": "Diameter of the conducting cross-section of a strand in a Litz wire",
    "wireLitzNumberConductors": "Number of conducting strands in a Litz wire",
    "wireRectangularConductingHeight": "Dimension parallel to the surface of the core where the rectangular wire is wound",
    "wireRectangularConductingWidth": "Dimension perpendicular to the surface of the core where the rectangular wire is wound",
    "wireFoilConductingHeight": "Dimension parallel to the surface of the core where the foil wire is wound",
    "wireFoilConductingWidth": "Dimension perpendicular to the surface of the core where the foil wire is wound",
    "wireCoating": "Label representing the coaating of the wire. It can be bare, enamel, or insulated. SIW, DIW, TIW, FIW: single, double, triple, fully insulated wire; TR: temperature rating; BV: breakdown voltage",

    "dcResistancePerMeter": "Resistance per meter of the wire",
    "ohmicLossesPerMeter": "Ohmic loss per meter in the selected wire due to the DC component of the current through it",
    "skinResistancePerMeter": "Resistance per meter of the wire due to the AC components of the current through it",
    "skinLossesPermeter": "Skin loss per meter in the selected wire due to the AC components of the current through it",
    "effectiveSkinDepth": "Weighted mean of the skin depth of the wire due to each of the harmonics in the current",
    "effectiveCurrentDensity": "Weighted mean of the current densities for each of the harmonics in the current using their individual skin depths. Higher harmonics use less copper area due to their reduced skin depth, this value reflecs how the wire section will be used by all harmonics, not just DC",
    "skinFactor": "Proportion value that reflecs how much extra losses we have due to skin effect",
    "wireWidth": "Horizontal dimension of the wire, equal to diameter in round wires",
    "wireHeight": "Vectical dimension of the wire, equal to diameter in round wires",
    "turnsRatio": "Turns ratio between the primary and this secondary",

    "coreShape": "Shape of the core",
    "coreShapeFamily": "Family of the shape of the core",
    "coreMaterial": "Material of the core",
    "coreMaterialManufacturer": "Manufacturer of the material of the core",
    "coreNumberStacks": "Number of stacked cores",
    "coreGapping": "Gapping system of the core. It can be residual, ground, spacer, or distributed",
    "coreGappingType": "Type of the gapping system. It can be residual, ground, spacer, or distributed",
    "coreGappingLength": "Length of the non-residual gaps in the system",
    "coreGappingNumberGaps": "Number of distributed gaps in the core column",

    "effectiveLength": "Equivalent length that the magnetic flux travels through the core",
    "effectiveArea": "Equivalent section that the magnetic flux traverses, because the shape of the core is not uniform and its section changes along the path",
    "minimumArea": "Minimum area seen by the magnetic flux along its path",
    "effectiveVolume": "Product of the effective length by the effective area, and represents the equivalent volume that is magnetized by the field",
    "initialPermeability": "Initial permeability. Value of the slope of the BH loop when first magnetized",
    "effectivePermeability": "Effective permeability. Weighted valueof the permeability of all the elements in the magnetic circuit, core pieces and gaps",
    "permeance": "AL value, AL factor, inductance factor or permeance. The increment of inductance in this core produced by one extra turn",
    "saturatingMagneticFluxDensity": "Magnetic flux density at which this material saturates at given temperature",
    "saturationProportion": "How close the core is to full saturation (100%)",
    "magneticFluxDensityPeak": "Peak reached by the magnetic flux density in current core with given excitation",
    "magneticFluxDensityAcPeak": "Peak reached by the AC componenent of the magnetic flux density in current core with given excitation",
    "magnetizingInductance": "Magnetizing inductance of this core with the selected number of turns of primary",
    "coreLosses": "Losses due to hysteresis and eddy currents in the core",
}
