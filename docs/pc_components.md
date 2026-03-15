# PC Components - Object Attributes and Types

Source: Java entities in `src/main/java/com/j2ee/buildpcchecker/entity`.

## Cpu

| Attribute | Type |
| --- | --- |
| id | String |
| name | String |
| socket | Socket |
| vrmMin | Integer |
| igpu | Boolean |
| tdp | Integer |
| pcieVersion | PcieVersion |
| score | Integer |
| imageUrl | String |
| description | String |

## Mainboard

| Attribute | Type |
| --- | --- |
| id | String |
| name | String |
| socket | Socket |
| vrmPhase | Integer |
| cpuTdpSupport | Integer |
| ramType | RamType |
| ramBusMax | Integer |
| ramSlot | Integer |
| ramMaxCapacity | Integer |
| size | CaseSize |
| pcieVgaVersion | PcieVersion |
| m2Slot | Integer |
| sataSlot | Integer |
| imageUrl | String |
| description | String |

## Ram

| Attribute | Type |
| --- | --- |
| id | String |
| name | String |
| ramType | RamType |
| ramBus | Integer |
| ramCas | Integer |
| capacityPerStick | Integer |
| quantity | Integer |
| tdp | Integer |
| imageUrl | String |
| description | String |

## Vga

| Attribute | Type |
| --- | --- |
| id | String |
| name | String |
| lengthMm | Integer |
| tdp | Integer |
| pcieVersion | PcieVersion |
| powerConnector | PcieConnector |
| score | Integer |
| imageUrl | String |
| description | String |

## Ssd

| Attribute | Type |
| --- | --- |
| id | String |
| name | String |
| ssdType | SsdType |
| formFactor | FormFactor |
| interfaceType | InterfaceType |
| capacity | Integer |
| tdp | Integer |
| imageUrl | String |
| description | String |

## Hdd

| Attribute | Type |
| --- | --- |
| id | String |
| name | String |
| formFactor | FormFactor |
| interfaceType | InterfaceType |
| capacity | Integer |
| tdp | Integer |
| imageUrl | String |
| description | String |

## Psu

| Attribute | Type |
| --- | --- |
| id | String |
| name | String |
| wattage | Integer |
| efficiency | String |
| pcieConnectors | Set<PcieConnector> |
| sataConnector | Integer |
| imageUrl | String |
| description | String |

## PcCase

| Attribute | Type |
| --- | --- |
| id | String |
| name | String |
| size | CaseSize |
| maxVgaLengthMm | Integer |
| maxCoolerHeightMm | Integer |
| maxRadiatorSize | Integer |
| drive35Slot | Integer |
| drive25Slot | Integer |
| imageUrl | String |
| description | String |

## Cooler

| Attribute | Type |
| --- | --- |
| id | String |
| name | String |
| coolerType | CoolerType |
| radiatorSize | Integer |
| heightMm | Integer |
| tdpSupport | Integer |
| imageUrl | String |
| description | String |

